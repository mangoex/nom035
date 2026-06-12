import sys
from sqlalchemy.orm import Session
from backend.app.db.session import SessionLocal
from backend.app.models import SurveyResponse
from backend.app.core.nom035_engine import calculate_survey_scores, evaluate_guia_i

def recalculate_all_scores():
    db: Session = SessionLocal()
    responses = db.query(SurveyResponse).all()
    count = 0
    errors = 0

    print(f"Iniciando recálculo para {len(responses)} encuestas...")
    
    for r in responses:
        try:
            # Determine guide type based on number of answers
            ans_count = len(r.answers)
            if ans_count <= 20:
                guide = "GUIA_I"
                new_scores = evaluate_guia_i(r.answers)
            elif ans_count <= 46:
                guide = "GUIA_II"
                new_scores = calculate_survey_scores("GUIA_II", r.answers)
            else:
                guide = "GUIA_III"
                new_scores = calculate_survey_scores("GUIA_III", r.answers)
            
            # Update scores in DB
            r.calculated_scores = new_scores
            count += 1
            
        except Exception as e:
            print(f"Error recalculando ID {r.id}: {str(e)}")
            errors += 1
            
    db.commit()
    db.close()
    print(f"Recálculo terminado. {count} exitosos, {errors} con error.")

if __name__ == "__main__":
    recalculate_all_scores()
