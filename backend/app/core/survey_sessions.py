from datetime import date
from typing import Optional

from backend.app.db.models import SurveySession


def survey_session_closing_has_occurred(
    session: SurveySession,
    as_of: Optional[date] = None,
) -> bool:
    current_date = as_of or date.today()
    return bool(session.fecha_fin and session.fecha_fin < current_date)


def is_survey_session_open(
    session: SurveySession,
    as_of: Optional[date] = None,
) -> bool:
    """Return whether a public session can accept responses on a calendar date."""
    return bool(
        session.is_active
        and not survey_session_closing_has_occurred(session, as_of)
    )
