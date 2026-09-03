# Matriz de trazabilidad

| Objetivo | Requisito | Diseño | Escenario | Prueba | Implementación | Evidencia | Estado |
|---|---|---|---|---|---|---|---|
| OBJ-001 | PRD-FR-001 | SDD-CMP-003, SDD-CMP-004, ADR-001 | BDD-SC-001, BDD-SC-002 | TDD-TC-004, TDD-TC-006 | `Dashboard.jsx`, `pdfGenerator.js`, `reportPeriod.js` | EVD-001, EVD-003, EVD-004 | passed local |
| OBJ-001 | PRD-FR-002 | SDD-CMP-003, SDD-CMP-004 | BDD-SC-003, BDD-SC-007 | TDD-TC-005, TDD-TC-006 | `Dashboard.jsx`, `reportPeriod.js` | EVD-001, EVD-003 | passed local |
| OBJ-001 | PRD-FR-003 | SDD-CMP-001, ADR-001 | BDD-SC-004, BDD-SC-005 | TDD-TC-001, TDD-TC-002, TDD-TC-007 | `core/survey_sessions.py`, `endpoints/survey.py` | EVD-001, EVD-002 | passed local |
| OBJ-001 | PRD-FR-004 | SDD-CMP-002, SDD-CMP-003 | BDD-SC-006 | TDD-TC-003, TDD-TC-006, TDD-TC-007 | `schemas/survey.py`, `endpoints/survey.py`, `Dashboard.jsx` | EVD-001, EVD-002, EVD-003 | passed local |
| OBJ-001 | PRD-FR-005 | SDD-CMP-004 | BDD-SC-001 | TDD-TC-006 | `pdfGenerator.js` | EVD-003 | passed local |
| OBJ-001 | PRD-NFR-001 | SDD-CMP-004, ADR-001 | BDD-SC-001, BDD-SC-002 | TDD-TC-004 | `reportPeriod.js` | EVD-001, EVD-003 | passed local |
| OBJ-001 | PRD-NFR-002 | SDD-CMP-002, SDD-CMP-003 | BDD-SC-006 | TDD-TC-003, TDD-TC-007 | `schemas/survey.py`, `endpoints/survey.py` | EVD-002 | passed local |
| OBJ-001 | PRD-NFR-003 | SDD-CMP-001, SDD-CMP-004 | BDD-SC-007 | TDD-TC-002, TDD-TC-005, TDD-TC-007 | `survey_sessions.py`, `reportPeriod.js` | EVD-002, EVD-003 | passed local |

## Auditoría inicial

- IDs duplicados: ninguno.
- Referencias inexistentes: ninguna en los artefactos definidos.
- Cobertura hacia adelante: todos los requisitos tienen diseño, escenario y prueba.
- Cobertura hacia atrás: cada prueba referencia requisito o escenario.
- Evidencia ejecutada: EVD-001 a EVD-004; EVD-005 permanece sin ejecutar.
