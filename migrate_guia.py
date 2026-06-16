import sys
import os

# Ensure the app can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.db.session import SessionLocal
from backend.app.db.models import Company, SurveySession

db = SessionLocal()

companies = db.query(Company).filter(Company.active_guide == "GUIA_I").all()
for c in companies:
    print(f"Updating company {c.id} ({c.name}) from GUIA_I to GUIA_II")
    c.active_guide = "GUIA_II"

sessions = db.query(SurveySession).filter(SurveySession.guide_type == "GUIA_I").all()
for s in sessions:
    print(f"Updating session {s.id} from GUIA_I to GUIA_II")
    s.guide_type = "GUIA_II"

db.commit()
db.close()
print("Migration complete.")
