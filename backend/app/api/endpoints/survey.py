# backend/app/api/endpoints/survey.py
import secrets
import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.db.models import User, Company, SurveySession, SurveyResponse, ActionPlan
from backend.app.schemas.survey import SurveySessionOut, SurveyResponseCreate
from backend.app.core.auth import get_current_user, get_current_admin
from backend.app.core.nom035_engine import calculate_survey_scores, evaluate_guia_i

router = APIRouter()

# --- ADMIN ENDPOINTS ---

@router.post("/session", response_model=SurveySessionOut)
def create_survey_session(
    guide_type: str, # 'GUIA_I', 'GUIA_II', 'GUIA_III'
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    if guide_type not in ("GUIA_I", "GUIA_II", "GUIA_III"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de guía inválido. Debe ser GUIA_I, GUIA_II, o GUIA_III."
        )

    # Deactivate any previous session of the same type for this company
    previous_sessions = db.query(SurveySession).filter(
        SurveySession.company_id == current_user.company_id,
        SurveySession.guide_type == guide_type,
        SurveySession.is_active == True
    ).all()
    for s in previous_sessions:
        s.is_active = False
    
    # Generate new link hash
    link_hash = secrets.token_hex(16)
    
    session = SurveySession(
        company_id=current_user.company_id,
        guide_type=guide_type,
        link_hash=link_hash,
        is_active=True
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/sessions", response_model=list[SurveySessionOut])
def get_survey_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return db.query(SurveySession).filter(SurveySession.company_id == current_user.company_id).all()

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
def get_public_session_details(link_hash: str, db: Session = Depends(get_db)):
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
        "guide_type": session.guide_type,
        "session_id": session.id
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
        
        # Removed automatic action plan task generation to prevent dummy duplicates.
        # Suggestions are now exclusively shown in the frontend.

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

def filter_responses(responses, age_range, gender, department, position):
    filtered = []
    for r in responses:
        d = r.demographics
        if age_range and d.get("age_range") != age_range: continue
        if gender and d.get("gender") != gender: continue
        if department and d.get("department") != department: continue
        if position and d.get("position") != position: continue
        filtered.append(r)
    return filtered

@router.get("/stats")
def get_survey_statistics(
    age_range: Optional[str] = None,
    gender: Optional[str] = None,
    department: Optional[str] = None,
    position: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    all_responses = db.query(SurveyResponse).filter(
        SurveyResponse.company_id == current_user.company_id
    ).all()
    
    responses = filter_responses(all_responses, age_range, gender, department, position)
    
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
            "dimension_risks": {}
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
        if "category_risks" in scores:
            # We track the highest risk seen, or we recalculate the average risk?
            # It's better to calculate the average score and then use nom035_engine to get the risk level of that average?
            # Or just provide the raw averages and let the frontend determine the risk based on the tables. 
            # Actually, the user asked to identify those with the highest risk. The frontend can just use the score.
            pass
                
        if "domain_scores" in scores:
            for dom, val in scores["domain_scores"].items():
                domain_scores_sum[dom] = domain_scores_sum.get(dom, 0.0) + val
                domain_counts[dom] = domain_counts.get(dom, 0) + 1

        if "dimension_scores" in scores:
            for dim, val in scores["dimension_scores"].items():
                dimension_scores_sum[dim] = dimension_scores_sum.get(dim, 0.0) + val
                dimension_counts[dim] = dimension_counts.get(dim, 0) + 1

    from backend.app.core.nom035_engine import get_risk_level, GUIA_II_THRESHOLDS, GUIA_III_THRESHOLDS
    
    # We need to know which guide to apply the thresholds. 
    # Since a company can only have one active_guide, we use the company's active guide.
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
    
    # Calculate global average score and its risk
    total_score = sum(r.calculated_scores.get("final_score", 0) for r in responses if "final_score" in r.calculated_scores)
    total_scored_responses = sum(1 for r in responses if "final_score" in r.calculated_scores)
    global_score_average = round(total_score / total_scored_responses, 2) if total_scored_responses > 0 else 0
    global_score_risk = get_risk_level(global_score_average, thresholds["final"])
    
    # Extract unique filter options from ALL responses (unfiltered) to populate dropdowns
    available_filters = {
        "age_ranges": sorted(list(set(r.demographics.get("age_range", "") for r in all_responses if r.demographics.get("age_range")))),
        "genders": sorted(list(set(r.demographics.get("gender", "") for r in all_responses if r.demographics.get("gender")))),
        "departments": sorted(list(set(r.demographics.get("department", "") for r in all_responses if r.demographics.get("department")))),
        "positions": sorted(list(set(r.demographics.get("position", "") for r in all_responses if r.demographics.get("position"))))
    }
    
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
        "available_filters": available_filters
    }

@router.get("/responses")
def get_survey_responses_list(
    age_range: Optional[str] = None,
    gender: Optional[str] = None,
    department: Optional[str] = None,
    position: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    all_responses = db.query(SurveyResponse).filter(
        SurveyResponse.company_id == current_user.company_id
    ).order_by(SurveyResponse.created_at.desc()).all()
    
    responses = filter_responses(all_responses, age_range, gender, department, position)
    
    data = []
    for r in responses:
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
