import os
import sys
from datetime import date

# Add the project root to the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.db.session import SessionLocal
from backend.app.db.models import SurveySession

def reactivate_surveys():
    db = SessionLocal()
    try:
        today = date.today()
        # Find all deactivated surveys with a fecha_fin >= today
        surveys = db.query(SurveySession).filter(
            SurveySession.is_active == False,
            SurveySession.fecha_fin >= today
        ).all()
        
        count = 0
        for s in surveys:
            s.is_active = True
            count += 1
            
        db.commit()
        print(f"Successfully reactivated {count} surveys.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reactivate_surveys()
