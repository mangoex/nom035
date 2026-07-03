# backend/app/api/endpoints/survey.py
import secrets
import io
import pandas as pd
from datetime import datetime, timedelta, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, defer
from backend.app.db.session import get_db
from backend.app.db.models import User, Company, SurveySession, SurveyResponse, ActionPlan
from backend.app.schemas.survey import SurveySessionOut, SurveyResponseCreate, SurveySessionCreate
from backend.app.core.auth import get_current_user, get_current_admin
from backend.app.core.nom035_engine import calculate_survey_scores, evaluate_guia_i

router = APIRouter()

# --- MAINTENANCE ENDPOINTS ---

@router.get("/maintenance/reactivate")
def reactivate_surveys_maintenance(db: Session = Depends(get_db)):
    """
    Temporal endpoint to reactivate surveys that were incorrectly deactivated 
    by the old rule, but whose end date is still in the future.
    """
    today = date.today()
    surveys = db.query(SurveySession).filter(
        SurveySession.is_active == False,
        SurveySession.fecha_fin >= today
    ).all()
    
    count = 0
    for s in surveys:
        s.is_active = True
        count += 1
        
    db.commit()
    return {"status": "success", "message": f"Se reactivaron {count} encuestas exitosamente."}

# --- ADMIN ENDPOINTS ---

@router.post("/session", response_model=SurveySessionOut)
def create_survey_session(
    session_in: SurveySessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    if session_in.guide_type not in ("GUIA_I", "GUIA_II", "GUIA_III"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de guía inválido. Debe ser GUIA_I, GUIA_II, o GUIA_III."
        )

    # Validate secret key is present for Guia I
    if session_in.guide_type == "GUIA_I" and not session_in.clave_secreta:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La clave secreta es obligatoria para la encuesta de traumas (Guía I)."
        )

    # Generate new link hash
    link_hash = secrets.token_hex(16)
    
    session = SurveySession(
        company_id=current_user.company_id,
        guide_type=session_in.guide_type,
        link_hash=link_hash,
        is_active=True,
        recopilador=session_in.recopilador,
        creador=session_in.creador,
        cedula_creador=session_in.cedula_creador,
        fecha_fin=session_in.fecha_fin,
        clave_secreta=session_in.clave_secreta
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/sessions", response_model=list[SurveySessionOut])
def get_survey_sessions(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    query = db.query(SurveySession).filter(SurveySession.company_id == current_user.company_id)
    
    if start_date:
        try:
            sd = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(SurveySession.created_at >= sd)
        except ValueError:
            pass
            
    if end_date:
        try:
            ed = datetime.strptime(end_date, "%Y-%m-%d")
            # Include the entire day by querying up to the start of the next day
            ed_limit = ed + timedelta(days=1)
            query = query.filter(SurveySession.created_at < ed_limit)
        except ValueError:
            pass

    return query.order_by(SurveySession.created_at.desc()).all()

@router.get("/sessions/{session_id}/export-excel")
def export_session_results_excel(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    session = db.query(SurveySession).filter(
        SurveySession.id == session_id,
        SurveySession.company_id == current_user.company_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada.")
        
    responses = db.query(SurveyResponse).filter(SurveyResponse.survey_session_id == session_id).all()
    if not responses:
        raise HTTPException(status_code=400, detail="No hay respuestas para exportar.")
        
    data = []
    for r in responses:
        row = {
            "Fecha": r.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
        # Add demographics
        if isinstance(r.demographics, dict):
            for k, v in r.demographics.items():
                row[f"Demografico_{k}"] = v
                
        # Add answers
        if isinstance(r.answers, dict):
            for k, v in r.answers.items():
                row[f"Respuesta_{k}"] = v
                
        # Add calculated scores
        if isinstance(r.calculated_scores, dict):
            if session.guide_type == "GUIA_I":
                row["Requiere_Valoracion_Clinica"] = "Sí" if r.calculated_scores.get("requires_clinical_evaluation") else "No"
            else:
                row["Calificacion_Final"] = r.calculated_scores.get("final_score", "")
                row["Nivel_Riesgo_Final"] = r.calculated_scores.get("final_risk", "")
                
                cat_scores = r.calculated_scores.get("category_scores", {})
                cat_risks = r.calculated_scores.get("category_risks", {})
                for cat in cat_scores:
                    row[f"Categoria_{cat}"] = cat_scores[cat]
                    row[f"Riesgo_{cat}"] = cat_risks.get(cat, "")
                    
                dom_scores = r.calculated_scores.get("domain_scores", {})
                dom_risks = r.calculated_scores.get("domain_risks", {})
                for dom in dom_scores:
                    row[f"Dominio_{dom}"] = dom_scores[dom]
                    row[f"Riesgo_{dom}"] = dom_risks.get(dom, "")
        
        data.append(row)
        
    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Resultados')
        
    output.seek(0)
    
    headers = {
        'Content-Disposition': f'attachment; filename="resultados_{session.guide_type}_{session_id}.xlsx"'
    }
    return StreamingResponse(
        output, 
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers=headers
    )

# --- CSV TEMPLATE & INGESTION ---

@router.get("/csv/template")
def download_csv_template(
    guide_type: str, # 'GUIA_I', 'GUIA_II', 'GUIA_III'
    current_user: User = Depends(get_current_admin)
):
    if guide_type not in ("GUIA_I", "GUIA_II", "GUIA_III"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de guía inválido. Debe ser GUIA_I, GUIA_II, o GUIA_III."
        )

    # Base columns
    cols = ["edad_rango", "genero", "departamento", "puesto"]
    
    if guide_type == "GUIA_I":
        question_count = 20
    elif guide_type == "GUIA_II":
        question_count = 46
    else:
        question_count = 72
        
    for i in range(1, question_count + 1):
        cols.append(f"q{i}")
        
    # Generate a DataFrame with columns and one placeholder row
    placeholder_row = {
        "edad_rango": "26-35",
        "genero": "Masculino",
        "departamento": "Operaciones",
        "puesto": "Supervisor"
    }
    
    for i in range(1, question_count + 1):
        if guide_type == "GUIA_I":
            placeholder_row[f"q{i}"] = "No"  # Binary Sí/No
        else:
            placeholder_row[f"q{i}"] = "Siempre"  # Likert scale
            
    df = pd.DataFrame([placeholder_row], columns=cols)
    
    # Save df to buffer
    stream = io.StringIO()
    df.to_csv(stream, index=False, encoding="utf-8-sig")
    
    response = StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = f"attachment; filename=layout_{guide_type.lower()}.csv"
    return response

@router.post("/csv/upload")
def upload_csv_results(
    guide_type: str, # 'GUIA_I', 'GUIA_II', 'GUIA_III'
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    if guide_type not in ("GUIA_I", "GUIA_II", "GUIA_III"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de guía inválido. Debe ser GUIA_I, GUIA_II, o GUIA_III."
        )
        
    try:
        # Read uploaded file
        contents = file.file.read()
        try:
            df = pd.read_csv(io.BytesIO(contents), encoding="utf-8-sig")
        except UnicodeDecodeError:
            # Fallback for CSVs saved from Excel in Spanish Windows (ANSI/Latin-1)
            df = pd.read_csv(io.BytesIO(contents), encoding="latin1")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al leer el archivo CSV: {str(e)}"
        )

    # Validate columns
    required_cols = ["edad_rango", "genero", "departamento", "puesto"]
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Columnas demográficas faltantes: {', '.join(missing_cols)}"
        )

    if guide_type == "GUIA_I":
        question_count = 20
    elif guide_type == "GUIA_II":
        question_count = 46
    else:
        question_count = 72

    missing_questions = [f"q{i}" for i in range(1, question_count + 1) if f"q{i}" not in df.columns]
    if missing_questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Preguntas faltantes en el layout para {guide_type}: {', '.join(missing_questions)}"
        )

    records_created = 0
    errors = []

    for idx, row in df.iterrows():
        try:
            # Extract demographics
            demographics = {
                "age_range": str(row["edad_rango"]),
                "gender": str(row["genero"]),
                "department": str(row["departamento"]),
                "position": str(row["puesto"])
            }
            
            # Extract answers
            answers = {}
            for i in range(1, question_count + 1):
                col_name = f"q{i}"
                answers[col_name] = row[col_name]
                
            # Perform calculation
            if guide_type == "GUIA_I":
                results = evaluate_guia_i(answers)
                # Create clinical referral task if triggered
                if results["requires_attention"]:
                    referral_task = ActionPlan(
                        company_id=current_user.company_id,
                        category_flagged="Acontecimientos Traumáticos Severos",
                        domain_flagged="Sección I, II, III o IV",
                        intervention_level="third_level",
                        status="pending",
                        description=(
                            "Se identificó un colaborador (Carga Masiva) que requiere atención clínica tras responder a la "
                            "Guía de Referencia I. Es necesario realizar la canalización formal (médica/psicológica) "
                            "y documentar el seguimiento."
                        )
                    )
                    db.add(referral_task)
            else:
                results = calculate_survey_scores(guide_type, answers)
                
            # Removed automatic action plan task generation to prevent dummy duplicates.
            # Suggestions are now exclusively shown in the frontend.

            # Create Response entry
            response_model = SurveyResponse(
                company_id=current_user.company_id,
                survey_session_id=None,  # None for bulk CSV uploads
                demographics=demographics,
                answers=answers,
                calculated_scores=results
            )
            db.add(response_model)
            records_created += 1

        except Exception as ex:
            errors.append(f"Fila {idx + 2}: {str(ex)}")

    db.commit()
    
    return {
        "success": True,
        "records_created": records_created,
        "errors": errors
    }

@router.delete("/responses")
def delete_all_responses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    try:
        deleted_plans = db.query(ActionPlan).filter(ActionPlan.company_id == current_user.company_id).delete()
        deleted = db.query(SurveyResponse).filter(SurveyResponse.company_id == current_user.company_id).delete()
        db.commit()
        return {"success": True, "deleted_responses": deleted, "deleted_plans": deleted_plans}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al borrar las encuestas: {str(e)}"
        )

# --- PUBLIC ENDPOINTS ---

@router.get("/public/{link_hash}")
def get_public_session_details(
    link_hash: str,
    db: Session = Depends(get_db)
):
    session = db.query(SurveySession).filter(
        SurveySession.link_hash == link_hash,
        SurveySession.is_active == True
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Liga de encuesta no válida o expirada."
        )
        
    company = db.query(Company).filter(Company.id == session.company_id).first()

    return {
        "company_name": company.name,
        "departments": company.departments or [],
        "guide_type": session.guide_type,
        "session_id": session.id,
        "requires_clave": False
    }

@router.post("/public/{link_hash}", status_code=status.HTTP_201_CREATED)
def submit_public_response(
    link_hash: str,
    response_in: SurveyResponseCreate,
    db: Session = Depends(get_db)
):
    session = db.query(SurveySession).filter(
        SurveySession.link_hash == link_hash,
        SurveySession.is_active == True
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Liga de encuesta no válida o expirada."
        )

    company_id = session.company_id
    guide_type = session.guide_type

    # Calculate scores
    if guide_type == "GUIA_I":
        results = evaluate_guia_i(response_in.answers)
        if results["requires_attention"]:
            referral_task = ActionPlan(
                company_id=company_id,
                category_flagged="Acontecimientos Traumáticos Severos",
                domain_flagged="Sección I, II, III o IV",
                intervention_level="third_level",
                status="pending",
                description=(
                    "Se identificó un colaborador que requiere atención clínica tras responder a la "
                    "Guía de Referencia I. Es necesario realizar la canalización formal (médica/psicológica) "
                    "y documentar el seguimiento manteniendo la confidencialidad."
                )
            )
            db.add(referral_task)
    else:
        results = calculate_survey_scores(guide_type, response_in.answers)

    # Save response
    response_model = SurveyResponse(
        company_id=company_id,
        survey_session_id=session.id,
        demographics=response_in.demographics.model_dump(),
        answers=response_in.answers,
        calculated_scores=results
    )
    db.add(response_model)
    db.commit()
    return {"message": "Encuesta registrada con éxito."}

from typing import Optional

# --- DASHBOARD & STATISTICS ---

from datetime import datetime
from datetime import time

def get_filtered_responses_query(
    db: Session,
    company_id: int,
    age_range,
    gender,
    department,
    position,
    start_date=None,
    end_date=None,
    survey_session_id=None,
    clave=None
):
    if survey_session_id:
        session = db.query(SurveySession).filter(
            SurveySession.id == survey_session_id,
            SurveySession.company_id == company_id
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="Sesión de encuesta no encontrada.")
            
        if session.guide_type == "GUIA_I" and session.clave_secreta:
            if not clave or clave != session.clave_secreta:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Esta encuesta de traumas está protegida. Ingresa la clave secreta para ver sus resultados."
                )
        query = db.query(SurveyResponse).filter(
            SurveyResponse.company_id == company_id,
            SurveyResponse.survey_session_id == survey_session_id
        )
    else:
        # Global query: Exclude any responses that belong to a session with a secret key
        locked_session_ids = db.query(SurveySession.id).filter(
            SurveySession.company_id == company_id,
            SurveySession.guide_type == "GUIA_I",
            SurveySession.clave_secreta != None
        ).all()
        locked_ids = [s[0] for s in locked_session_ids]
        
        query = db.query(SurveyResponse).filter(SurveyResponse.company_id == company_id)
        if locked_ids:
            from sqlalchemy import or_
            query = query.filter(
                or_(
                    SurveyResponse.survey_session_id.is_(None),
                    ~SurveyResponse.survey_session_id.in_(locked_ids)
                )
            )

    if age_range:
        query = query.filter(SurveyResponse.demographics["age_range"].as_string() == age_range)
    if gender:
        query = query.filter(SurveyResponse.demographics["gender"].as_string() == gender)
    if department:
        query = query.filter(SurveyResponse.demographics["department"].as_string() == department)
    if position:
        query = query.filter(SurveyResponse.demographics["position"].as_string() == position)
        
    if start_date:
        try:
            sd = datetime.fromisoformat(start_date)
            sd_dt = datetime.combine(sd.date(), time(0, 0, 0))
            query = query.filter(SurveyResponse.created_at >= sd_dt)
        except ValueError:
            pass
            
    if end_date:
        try:
            ed = datetime.fromisoformat(end_date)
            ed_dt = datetime.combine(ed.date(), time(23, 59, 59))
            query = query.filter(SurveyResponse.created_at <= ed_dt)
        except ValueError:
            pass
            
    return query

def filter_responses(responses, age_range, gender, department, position, start_date=None, end_date=None):
    # Backward compatible fallback for other places if any (e.g. tests)
    filtered = []
    for r in responses:
        d = r.demographics
        if age_range and d.get("age_range") != age_range: continue
        if gender and d.get("gender") != gender: continue
        if department and d.get("department") != department: continue
        if position and d.get("position") != position: continue
        
        if start_date:
            try:
                sd = datetime.fromisoformat(start_date)
                if r.created_at.date() < sd.date(): continue
            except ValueError:
                pass
                
        if end_date:
            try:
                ed = datetime.fromisoformat(end_date)
                if r.created_at.date() > ed.date(): continue
            except ValueError:
                pass
                
        filtered.append(r)
    return filtered

@router.get("/stats")
def get_survey_statistics(
    age_range: Optional[str] = None,
    gender: Optional[str] = None,
    department: Optional[str] = None,
    position: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    survey_session_id: Optional[int] = None,
    clave: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    # Fetch only filtered responses from DB
    query = get_filtered_responses_query(
        db, current_user.company_id, age_range, gender, department, position, start_date, end_date, survey_session_id, clave
    )
    responses = query.all()
    
    # Fetch only demographics column for available filters to avoid overhead
    demographics_query = db.query(SurveyResponse.demographics).filter(SurveyResponse.company_id == current_user.company_id)
    if survey_session_id:
        demographics_query = demographics_query.filter(SurveyResponse.survey_session_id == survey_session_id)
    else:
        # Exclude locked sessions
        locked_session_ids = db.query(SurveySession.id).filter(
            SurveySession.company_id == current_user.company_id,
            SurveySession.guide_type == "GUIA_I",
            SurveySession.clave_secreta != None
        ).all()
        locked_ids = [s[0] for s in locked_session_ids]
        if locked_ids:
            from sqlalchemy import or_
            demographics_query = demographics_query.filter(
                or_(
                    SurveyResponse.survey_session_id.is_(None),
                    ~SurveyResponse.survey_session_id.in_(locked_ids)
                )
            )
            
    all_demographics = demographics_query.all()
    
    available_filters = {
        "age_ranges": sorted(list(set(d[0].get("age_range", "") for d in all_demographics if d[0] and d[0].get("age_range")))),
        "genders": sorted(list(set(d[0].get("gender", "") for d in all_demographics if d[0] and d[0].get("gender")))),
        "departments": sorted(list(set(d[0].get("department", "") for d in all_demographics if d[0] and d[0].get("department")))),
        "positions": sorted(list(set(d[0].get("position", "") for d in all_demographics if d[0] and d[0].get("position"))))
    }
    
    if not responses:
        return {
            "total_responses": 0,
            "requires_clinical_referral_count": 0,
            "final_risk_distribution": {},
            "category_averages": {},
            "category_risks": {},
            "domain_averages": {},
            "domain_risks": {},
            "dimension_averages": {},
            "dimension_risks": {},
            "available_filters": available_filters
        }
        
    total = len(responses)
    clinical_referrals = 0
    final_risks = {}
    
    category_scores_sum = {}
    category_counts = {}
    category_risks_dict = {}
    
    domain_scores_sum = {}
    domain_counts = {}
    domain_risks_dict = {}
    
    dimension_scores_sum = {}
    dimension_counts = {}
    dimension_risks_dict = {}
    
    department_scores_sum = {}
    department_counts = {}

    question_scores_sum = {}
    question_counts = {}
    
    for r in responses:
        scores = r.calculated_scores
        if "requires_attention" in scores:
            if scores["requires_attention"]:
                clinical_referrals += 1
        
        if "final_risk" in scores:
            risk = scores["final_risk"]
            final_risks[risk] = final_risks.get(risk, 0) + 1
            
        if "category_scores" in scores:
            for cat, val in scores["category_scores"].items():
                category_scores_sum[cat] = category_scores_sum.get(cat, 0.0) + val
                category_counts[cat] = category_counts.get(cat, 0) + 1
                
        if "domain_scores" in scores:
            for dom, val in scores["domain_scores"].items():
                domain_scores_sum[dom] = domain_scores_sum.get(dom, 0.0) + val
                domain_counts[dom] = domain_counts.get(dom, 0) + 1

        if "dimension_scores" in scores:
            for dim, val in scores["dimension_scores"].items():
                dimension_scores_sum[dim] = dimension_scores_sum.get(dim, 0.0) + val
                dimension_counts[dim] = dimension_counts.get(dim, 0) + 1
                
        if "final_score" in scores:
            dept = r.demographics.get("department", "Sin Departamento") if r.demographics else "Sin Departamento"
            department_scores_sum[dept] = department_scores_sum.get(dept, 0.0) + scores["final_score"]
            department_counts[dept] = department_counts.get(dept, 0) + 1

        if "calibrated_answers" in scores:
            for q_key, val in scores["calibrated_answers"].items():
                question_scores_sum[q_key] = question_scores_sum.get(q_key, 0.0) + val
                question_counts[q_key] = question_counts.get(q_key, 0) + 1

    from backend.app.core.nom035_engine import get_risk_level, GUIA_II_THRESHOLDS, GUIA_III_THRESHOLDS, GUIA_II_MAPPING, GUIA_III_MAPPING
    
    guide_type = current_user.company.active_guide if hasattr(current_user, "company") and current_user.company else "GUIA_III"
    thresholds = GUIA_II_THRESHOLDS if guide_type == "GUIA_II" else GUIA_III_THRESHOLDS
    
    category_averages = {
        cat: round(category_scores_sum[cat] / category_counts[cat], 2)
        for cat in category_scores_sum
    }
    category_risks_dict = {
        cat: get_risk_level(category_averages[cat], thresholds["categories"][cat]) if cat in thresholds["categories"] else "Nulo"
        for cat in category_averages
    }
    
    domain_averages = {
        dom: round(domain_scores_sum[dom] / domain_counts[dom], 2)
        for dom in domain_scores_sum
    }
    domain_risks_dict = {
        dom: get_risk_level(domain_averages[dom], thresholds["domains"][dom]) if dom in thresholds["domains"] else "Nulo"
        for dom in domain_averages
    }
    
    dimension_averages = {
        dim: round(dimension_scores_sum[dim] / dimension_counts[dim], 2)
        for dim in dimension_scores_sum
    }
    dimension_risks_dict = {
        dim: get_risk_level(dimension_averages[dim], thresholds.get("dimensions", {}).get(dim, [3, 4, 5, 6]))
        for dim in dimension_averages
    }
    
    final_risk_distribution = {
        risk: round((count / total) * 100, 2)
        for risk, count in final_risks.items()
    }
    
    total_score = sum(r.calculated_scores.get("final_score", 0) for r in responses if "final_score" in r.calculated_scores)
    total_scored_responses = sum(1 for r in responses if "final_score" in r.calculated_scores)
    global_score_average = round(total_score / total_scored_responses, 2) if total_scored_responses > 0 else 0
    global_score_risk = get_risk_level(global_score_average, thresholds["final"])
    
    department_averages = {
        dept: round(department_scores_sum[dept] / department_counts[dept], 2)
        for dept in department_scores_sum
    }
    department_risks = {
        dept: get_risk_level(department_averages[dept], thresholds["final"])
        for dept in department_averages
    }
    
    question_averages = {
        q_key: round(question_scores_sum[q_key] / question_counts[q_key], 2)
        for q_key in question_scores_sum
    }

    dimension_mapping = GUIA_II_MAPPING.get("dimensions", {}) if guide_type == "GUIA_II" else GUIA_III_MAPPING.get("dimensions", {})
    
    return {
        "total_responses": total,
        "requires_clinical_referral_count": clinical_referrals,
        "final_risk_distribution": final_risk_distribution,
        "global_score_average": global_score_average,
        "global_score_risk": global_score_risk,
        "category_averages": category_averages,
        "category_risks": category_risks_dict,
        "domain_averages": domain_averages,
        "domain_risks": domain_risks_dict,
        "dimension_averages": dimension_averages,
        "dimension_risks": dimension_risks_dict,
        "department_averages": department_averages,
        "department_risks": department_risks,
        "available_filters": available_filters,
        "question_averages": question_averages,
        "dimension_mapping": dimension_mapping
    }

@router.get("/responses")
def get_survey_responses(
    age_range: Optional[str] = None,
    gender: Optional[str] = None,
    department: Optional[str] = None,
    position: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    survey_session_id: Optional[int] = None,
    clave: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    query = get_filtered_responses_query(
        db, current_user.company_id, age_range, gender, department, position, start_date, end_date, survey_session_id, clave
    )
    # Defer the loading of the massive raw answers column to optimize dashboard load speed
    query = query.options(defer(SurveyResponse.answers))
    filtered_responses = query.all()
    
    data = []
    for r in filtered_responses:
        scores = r.calculated_scores
        final_risk = scores.get("final_risk", "N/A")
        if "requires_attention" in scores and scores["requires_attention"]:
            final_risk = "Requiere Atención (ATS)"
            
        data.append({
            "id": r.id,
            "created_at": r.created_at,
            "demographics": r.demographics,
            "final_risk": final_risk,
            "scores": scores
        })
        
    return {"responses": data}

from pydantic import BaseModel

class DeleteResponsesRequest(BaseModel):
    response_ids: list[int]

@router.delete("/responses/batch")
def delete_survey_responses_batch(
    payload: DeleteResponsesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    responses = db.query(SurveyResponse).filter(
        SurveyResponse.id.in_(payload.response_ids),
        SurveyResponse.company_id == current_user.company_id
    ).all()
    
    if not responses:
        raise HTTPException(status_code=404, detail="No se encontraron respuestas para eliminar.")
        
    deleted_count = len(responses)
    for r in responses:
        db.delete(r)
        
    db.commit()
    return {"message": f"{deleted_count} encuestas eliminadas con éxito."}
