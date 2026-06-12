# backend/tests/test_nom035.py
import pytest
from backend.app.core.nom035_engine import (
    evaluate_guia_i,
    calculate_survey_scores,
    RESPONSE_MAP_DIRECT,
    RESPONSE_MAP_INVERSE
)

def test_guia_i_no_attention():
    # Colaborador answers No to all questions
    answers = {f"q{i}": "No" for i in range(1, 21)}
    result = evaluate_guia_i(answers)
    
    assert result["requires_attention"] is False
    assert result["section_i_triggered"] is False
    assert result["section_ii_count"] == 0
    assert result["section_iii_count"] == 0
    assert result["section_iv_count"] == 0

def test_guia_i_requires_attention():
    # q1 (accident) is Sí, q7 (nightmares) is Sí, others No -> Should trigger referral
    answers = {f"q{i}": "No" for i in range(1, 21)}
    answers["q1"] = "Sí"
    answers["q7"] = "Sí"
    
    result = evaluate_guia_i(answers)
    assert result["section_i_triggered"] is True
    assert result["section_ii_count"] == 1
    assert result["requires_attention"] is True

def test_guia_ii_scoring_extremes():
    # If all items are 'Nunca':
    # Inverse items (18 items) sum to 18 * 4 = 72
    # Total score should be 72 -> Risk 'Alto' (70 <= 72 < 90)
    answers_never = {f"q{i}": "Nunca" for i in range(1, 47)}
    result_never = calculate_survey_scores("GUIA_II", answers_never)
    
    assert result_never["final_score"] == 72
    assert result_never["final_risk"] == "Alto"

    # If all items are 'Siempre':
    # Direct items (28 items) sum to 28 * 4 = 112
    # Total score should be 112 -> Risk 'Muy Alto' (>= 90)
    answers_always = {f"q{i}": "Siempre" for i in range(1, 47)}
    result_always = calculate_survey_scores("GUIA_II", answers_always)
    
    assert result_always["final_score"] == 112
    assert result_always["final_risk"] == "Muy Alto"

def test_guia_iii_scoring():
    # Test a mixed set of answers for Guía III
    # Let's say all answers are 'Algunas veces' (score 2 for both direct and inverse items)
    # Total score should be 72 questions * 2 = 144 -> Risk 'Muy Alto' (>= 140)
    answers_mixed = {f"q{i}": "Algunas veces" for i in range(1, 73)}
    result_mixed = calculate_survey_scores("GUIA_III", answers_mixed)
    
    assert result_mixed["final_score"] == 144
    assert result_mixed["final_risk"] == "Muy Alto"
