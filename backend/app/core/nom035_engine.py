# backend/app/core/nom035_engine.py

# Mapping responses to integers
RESPONSE_MAP_DIRECT = {
    "Siempre": 4,
    "Casi siempre": 3,
    "Algunas veces": 2,
    "Casi nunca": 1,
    "Nunca": 0
}

RESPONSE_MAP_INVERSE = {
    "Siempre": 0,
    "Casi siempre": 1,
    "Algunas veces": 2,
    "Casi nunca": 3,
    "Nunca": 4
}

# --- GUIA I: Acontecimientos Traumáticos Severos ---
# Questions are binary ("Sí" / "No")
# q1-q6: Acontecimiento (Sección I)
# q7-q8: Recuerdos (Sección II)
# q9-q15: Evitación (Sección III)
# q16-q20: Afectación (Sección IV)
def evaluate_guia_i(answers: dict) -> dict:
    """
    answers: dict where keys are "q1" to "q20" and values are "Sí" or "No" (or boolean True/False)
    """
    # Normalize answers to boolean
    normalized = {}
    for i in range(1, 21):
        key = f"q{i}"
        val = answers.get(key, "No")
        normalized[key] = (val == "Sí" or val is True)

    section_i = any(normalized[f"q{i}"] for i in range(1, 7))
    section_ii = sum(1 for i in range(7, 9) if normalized[f"q{i}"])
    section_iii = sum(1 for i in range(9, 16) if normalized[f"q{i}"])
    section_iv = sum(1 for i in range(16, 21) if normalized[f"q{i}"])

    requires_attention = False
    if section_i:
        if section_ii >= 1 or section_iii >= 3 or section_iv >= 2:
            requires_attention = True

    return {
        "section_i_triggered": section_i,
        "section_ii_count": section_ii,
        "section_iii_count": section_iii,
        "section_iv_count": section_iv,
        "requires_attention": requires_attention,
        "raw_scores": {k: ("Sí" if v else "No") for k, v in normalized.items()}
    }

# --- GUIA II: Factores de Riesgo Psicosocial (16 - 50 colaboradores) ---
GUIA_II_INVERSE_ITEMS = {18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33}

GUIA_II_MAPPING = {
    "categories": {
        "Ambiente de trabajo": [1, 2, 3],
        "Factores propios de la actividad": [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 18, 19, 20, 21, 22, 26, 27, 41, 42, 43],
        "Organización del tiempo de trabajo": [14, 15, 16, 17],
        "Liderazgo y relaciones en el trabajo": [23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 44, 45, 46]
    },
    "domains": {
        "Condiciones en el ambiente de trabajo": [1, 2, 3],
        "Carga de trabajo": [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 41, 42, 43],
        "Falta de control sobre el trabajo": [18, 19, 20, 21, 22, 26, 27],
        "Jornada de trabajo": [14, 15],
        "Interferencia en la relación trabajo-familia": [16, 17],
        "Liderazgo": [23, 24, 25, 28, 29],
        "Relaciones en el trabajo": [30, 31, 32, 33, 44, 45, 46],
        "Violencia": [34, 35, 36, 37, 38, 39, 40]
    },
    "dimensions": {
        "Condiciones peligrosas e inseguras": [2],
        "Condiciones deficientes e insalubres": [1],
        "Trabajos peligrosos": [3],
        "Cargas cuantitativas": [4, 9],
        "Ritmos de trabajo acelerado": [5, 6],
        "Carga mental": [7, 8],
        "Cargas psicológicas emocionales": [41, 42, 43],
        "Cargas de alta responsabilidad": [10, 11],
        "Cargas contradictorias o inconsistentes": [12, 13],
        "Falta de control y autonomía sobre el trabajo": [20, 21, 22],
        "Limitada o nula posibilidad de desarrollo": [18, 19],
        "Limitada o inexistente capacitación": [26, 27],
        "Escasa claridad de funciones": [23, 24, 25],
        "Jornadas de trabajo extensas": [14, 15],
        "Influencia del trabajo fuera del centro laboral": [16, 17],
        "Características del liderazgo": [28, 29],
        "Relaciones sociales en el trabajo": [30, 31, 32, 33],
        "Deficiente relación con los colaboradores que supervisa": [44, 45, 46],
        "Violencia laboral": [34, 35, 36, 37, 38, 39, 40]
    }
}

GUIA_II_THRESHOLDS = {
    "final": [20, 45, 70, 90],  # nulo < 20, bajo < 45, medio < 70, alto < 90, muy alto >= 90
    "categories": {
        "Ambiente de trabajo": [3, 5, 7, 9],
        "Factores propios de la actividad": [10, 20, 30, 40],
        "Organización del tiempo de trabajo": [4, 6, 9, 12],
        "Liderazgo y relaciones en el trabajo": [10, 18, 28, 38]
    },
    "domains": {
        "Condiciones en el ambiente de trabajo": [3, 5, 7, 9],
        "Carga de trabajo": [12, 16, 20, 24],
        "Falta de control sobre el trabajo": [5, 8, 11, 14],
        "Jornada de trabajo": [1, 2, 4, 6],
        "Interferencia en la relación trabajo-familia": [1, 2, 4, 6],
        "Liderazgo": [3, 5, 8, 11],
        "Relaciones en el trabajo": [5, 8, 11, 14],
        "Violencia": [7, 10, 13, 16]
    },
    "dimensions": {
        "Condiciones peligrosas e inseguras": [1, 2, 3, 4],
        "Condiciones deficientes e insalubres": [1, 2, 3, 4],
        "Trabajos peligrosos": [1, 2, 3, 4],
        "Cargas cuantitativas": [3, 4, 5, 6],
        "Ritmos de trabajo acelerado": [3, 4, 5, 6],
        "Carga mental": [3, 4, 5, 6],
        "Cargas psicológicas emocionales": [4, 5, 7, 8],
        "Cargas de alta responsabilidad": [3, 4, 5, 6],
        "Cargas contradictorias o inconsistentes": [3, 4, 5, 6],
        "Falta de control y autonomía sobre el trabajo": [3, 4, 5, 6],
        "Limitada o nula posibilidad de desarrollo": [3, 4, 5, 6],
        "Limitada o inexistente capacitación": [4, 5, 7, 8],
        "Escasa claridad de funciones": [4, 5, 7, 8],
        "Jornadas de trabajo extensas": [3, 4, 5, 6],
        "Influencia del trabajo fuera del centro laboral": [3, 4, 5, 6],
        "Características del liderazgo": [4, 5, 7, 8],
        "Relaciones sociales en el trabajo": [4, 5, 7, 8],
        "Deficiente relación con los colaboradores que supervisa": [4, 5, 7, 8],
        "Violencia laboral": [4, 5, 7, 8]
    }
}

# --- GUIA III: Factores de Riesgo Psicosocial y Entorno Organizacional (> 50 colaboradores) ---
GUIA_III_INVERSE_ITEMS = {1, 4, 23, 24, 25, 26, 27, 28, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 55, 56, 57}

GUIA_III_MAPPING = {
    "categories": {
        "Ambiente de trabajo": [1, 2, 3, 4, 5],
        "Factores propios de la actividad": [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 29, 30, 35, 36, 65, 66, 67, 68],
        "Organización del tiempo de trabajo": [17, 18, 19, 20, 21, 22],
        "Liderazgo y relaciones en el trabajo": [31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 57, 58, 59, 60, 61, 62, 63, 64, 69, 70, 71, 72],
        "Entorno organizacional": [47, 48, 49, 50, 51, 52, 53, 54, 55, 56]
    },
    "domains": {
        "Condiciones en el ambiente de trabajo": [1, 2, 3, 4, 5],
        "Carga de trabajo": [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 65, 66, 67, 68],
        "Falta de control sobre el trabajo": [23, 24, 25, 26, 27, 28, 29, 30, 35, 36],
        "Jornada de trabajo": [17, 18],
        "Interferencia en la relación trabajo-familia": [19, 20, 21, 22],
        "Liderazgo": [31, 32, 33, 34, 37, 38, 39, 40, 41],
        "Relaciones en el trabajo": [42, 43, 44, 45, 46, 69, 70, 71, 72],
        "Violencia": [57, 58, 59, 60, 61, 62, 63, 64],
        "Reconocimiento del desempeño": [47, 48, 49, 50, 51, 52],
        "Insuficiente sentido de pertenencia e inestabilidad": [53, 54, 55, 56]
    },
    "dimensions": {
        "Condiciones peligrosas e inseguras": [1, 3],
        "Condiciones deficientes e insalubres": [2, 4],
        "Trabajos peligrosos": [5],
        "Cargas cuantitativas": [6, 12],
        "Ritmos de trabajo acelerado": [7, 8],
        "Carga mental": [9, 10, 11],
        "Cargas psicológicas emocionales": [65, 66, 67, 68],
        "Cargas de alta responsabilidad": [13, 14],
        "Cargas contradictorias o inconsistentes": [15, 16],
        "Falta de control y autonomía sobre el trabajo": [25, 26, 27, 28],
        "Limitada o nula posibilidad de desarrollo": [23, 24],
        "Insuficiente participación y manejo del cambio": [29, 30],
        "Limitada o inexistente capacitación": [35, 36],
        "Jornadas de trabajo extensas": [17, 18],
        "Influencia del trabajo fuera del centro laboral": [19, 20],
        "Influencia de las responsabilidades familiares": [21, 22],
        "Escasa claridad de funciones": [31, 32, 33, 34],
        "Características del liderazgo": [37, 38, 39, 40, 41],
        "Relaciones sociales en el trabajo": [42, 43, 44, 45, 46],
        "Deficiente relación con los colaboradores que supervisa": [69, 70, 71, 72],
        "Violencia laboral": [57, 58, 59, 60, 61, 62, 63, 64],
        "Escasa o nula retroalimentación del desempeño": [47, 48],
        "Escaso o nulo reconocimiento y compensación": [49, 50, 51, 52],
        "Limitado sentido de pertenencia": [55, 56],
        "Inestabilidad laboral": [53, 54]
    }
}

GUIA_III_THRESHOLDS = {
    "final": [50, 75, 99, 140],  # nulo < 50, bajo < 75, medio < 99, alto < 140, muy alto >= 140
    "categories": {
        "Ambiente de trabajo": [5, 9, 11, 14],
        "Factores propios de la actividad": [15, 30, 45, 60],
        "Organización del tiempo de trabajo": [5, 7, 10, 13],
        "Liderazgo y relaciones en el trabajo": [14, 29, 42, 58],
        "Entorno organizacional": [10, 14, 18, 23]
    },
    "domains": {
        "Condiciones en el ambiente de trabajo": [5, 9, 11, 14],
        "Carga de trabajo": [15, 21, 27, 37],
        "Falta de control sobre el trabajo": [11, 16, 21, 25],
        "Jornada de trabajo": [1, 2, 4, 6],
        "Interferencia en la relación trabajo-familia": [4, 6, 8, 10],
        "Liderazgo": [9, 12, 16, 20],
        "Relaciones en el trabajo": [10, 13, 17, 21],
        "Violencia": [7, 10, 13, 16],
        "Reconocimiento del desempeño": [6, 10, 14, 18],
        "Insuficiente sentido de pertenencia e inestabilidad": [4, 6, 8, 10]
    },
    "dimensions": {
        "Condiciones peligrosas e inseguras": [3, 4, 5, 6],
        "Condiciones deficientes e insalubres": [3, 4, 5, 6],
        "Trabajos peligrosos": [1, 2, 3, 4],
        "Cargas cuantitativas": [3, 4, 5, 6],
        "Ritmos de trabajo acelerado": [3, 4, 5, 6],
        "Carga mental": [4, 5, 7, 8],
        "Cargas psicológicas emocionales": [4, 5, 7, 8],
        "Cargas de alta responsabilidad": [3, 4, 5, 6],
        "Cargas contradictorias o inconsistentes": [3, 4, 5, 6],
        "Falta de control y autonomía sobre el trabajo": [4, 5, 7, 8],
        "Limitada o nula posibilidad de desarrollo": [3, 4, 5, 6],
        "Insuficiente participación y manejo del cambio": [3, 4, 5, 6],
        "Limitada o inexistente capacitación": [4, 5, 7, 8],
        "Jornadas de trabajo extensas": [3, 4, 5, 6],
        "Influencia del trabajo fuera del centro laboral": [3, 4, 5, 6],
        "Influencia de las responsabilidades familiares": [3, 4, 5, 6],
        "Liderazgo": [5, 7, 10, 13],
        "Relaciones sociales en el trabajo": [5, 7, 10, 13],
        "Deficiente relación con los colaboradores que supervisa": [4, 5, 7, 8],
        "Violencia laboral": [7, 10, 13, 16],
        "Escaso o nulo reconocimiento y compensación": [6, 10, 14, 18],
        "Limitado sentido de pertenencia": [3, 4, 5, 6],
        "Inestabilidad laboral": [3, 4, 5, 6]
    }
}

# --- SCORING FUNCTIONS ---
def get_risk_level(score: float, cutoffs: list) -> str:
    """
    Determines risk level based on score and list of 4 cutoffs:
    [nulo_limit, bajo_limit, medio_limit, alto_limit]
    """
    if score < cutoffs[0]:
        return "Nulo"
    elif score < cutoffs[1]:
        return "Bajo"
    elif score < cutoffs[2]:
        return "Medio"
    elif score < cutoffs[3]:
        return "Alto"
    else:
        return "Muy Alto"

def calculate_survey_scores(guide_type: str, raw_answers: dict) -> dict:
    """
    guide_type: 'GUIA_II' or 'GUIA_III'
    raw_answers: dict of {"q1": "Siempre", ...} or {"q1": 4, ...}
    Returns calculated scores for Final, Categories, Domains and their Risk levels.
    """
    if guide_type not in ("GUIA_II", "GUIA_III"):
        raise ValueError(f"Invalid guide type: {guide_type}")

    # Set parameters according to guide
    if guide_type == "GUIA_II":
        inverse_items = GUIA_II_INVERSE_ITEMS
        mapping = GUIA_II_MAPPING
        thresholds = GUIA_II_THRESHOLDS
        total_questions = 46
    else:
        inverse_items = GUIA_III_INVERSE_ITEMS
        mapping = GUIA_III_MAPPING
        thresholds = GUIA_III_THRESHOLDS
        total_questions = 72

    # Step 1: Calibrate all answers to integers 0-4
    calibrated_answers = {}
    for i in range(1, total_questions + 1):
        key = f"q{i}"
        val = raw_answers.get(key, None)
        
        # Handle cases where questions are omitted (conditional questions like 13-16, 29-30, etc.)
        if val is None or val == "" or val == "N/A":
            calibrated_answers[key] = 0
            continue

        # If already an integer, check if we need to invert it.
        # Note: If it's already an integer, we assume it's the raw selection (4 = Siempre, 0 = Nunca).
        # We need to map it accordingly.
        is_inverse = i in inverse_items

        if isinstance(val, str):
            if is_inverse:
                if val not in RESPONSE_MAP_INVERSE:
                    raise ValueError(f"Respuesta inválida para la pregunta {key}: '{val}'")
                calibrated_answers[key] = RESPONSE_MAP_INVERSE[val]
            else:
                if val not in RESPONSE_MAP_DIRECT:
                    raise ValueError(f"Respuesta inválida para la pregunta {key}: '{val}'")
                calibrated_answers[key] = RESPONSE_MAP_DIRECT[val]
        else:
            # Numeric answer (assume 4 = Siempre ... 0 = Nunca)
            # Standard: Siempre=4, Casi siempre=3, Algunas veces=2, Casi nunca=1, Nunca=0
            # Inverse: Siempre=0, Casi siempre=1, Algunas veces=2, Casi nunca=3, Nunca=4
            try:
                num = int(val)
                if num < 0 or num > 4:
                    num = 0
                if is_inverse:
                    # Invert 0->4, 1->3, 2->2, 3->1, 4->0
                    calibrated_answers[key] = 4 - num
                else:
                    calibrated_answers[key] = num
            except ValueError:
                calibrated_answers[key] = 0

    # Step 2: Sum scores for domains
    domain_scores = {}
    domain_risks = {}
    for domain_name, item_list in mapping["domains"].items():
        score = sum(calibrated_answers.get(f"q{item_id}", 0) for item_id in item_list)
        domain_scores[domain_name] = score
        domain_risks[domain_name] = get_risk_level(score, thresholds["domains"][domain_name])

    # Step 3: Sum scores for categories
    category_scores = {}
    category_risks = {}
    for cat_name, item_list in mapping["categories"].items():
        score = sum(calibrated_answers.get(f"q{item_id}", 0) for item_id in item_list)
        category_scores[cat_name] = score
        category_risks[cat_name] = get_risk_level(score, thresholds["categories"][cat_name])

    # Step 3.5: Sum scores for dimensions
    dimension_scores = {}
    dimension_risks = {}
    if "dimensions" in mapping:
        for dim_name, item_list in mapping["dimensions"].items():
            score = sum(calibrated_answers.get(f"q{item_id}", 0) for item_id in item_list)
            dimension_scores[dim_name] = score
            thresholds_dim = thresholds.get("dimensions", {}).get(dim_name, [3, 4, 5, 6])
            dimension_risks[dim_name] = get_risk_level(score, thresholds_dim)

    # Step 4: Final score
    final_score = sum(calibrated_answers.values())
    final_risk = get_risk_level(final_score, thresholds["final"])

    return {
        "final_score": final_score,
        "final_risk": final_risk,
        "category_scores": category_scores,
        "category_risks": category_risks,
        "domain_scores": domain_scores,
        "domain_risks": domain_risks,
        "dimension_scores": dimension_scores,
        "dimension_risks": dimension_risks,
        "calibrated_answers": calibrated_answers
    }
