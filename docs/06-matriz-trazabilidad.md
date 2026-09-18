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
| OBJ-002 | PRD-FR-006 | SDD-CMP-005, ADR-002 | BDD-SC-008, BDD-SC-010 | TDD-TC-008, TDD-TC-009, TDD-TC-011 | `endpoints/survey.py` | EVD-006, EVD-007 | passed local |
| OBJ-002 | PRD-FR-007 | SDD-CMP-006 | BDD-SC-009, BDD-SC-012 | TDD-TC-010, TDD-TC-011 | `Dashboard.jsx`, `criticalDimensions.js` | EVD-006, EVD-008 | passed local |
| OBJ-002 | PRD-FR-008 | SDD-CMP-006 | BDD-SC-009, BDD-SC-010, BDD-SC-011 | TDD-TC-010, TDD-TC-011 | `Dashboard.jsx`, `criticalDimensions.js` | EVD-006, EVD-008 | passed local |
| OBJ-002 | PRD-NFR-004 | SDD-CMP-005, SDD-CMP-006 | BDD-SC-009, BDD-SC-010 | TDD-TC-008, TDD-TC-010 | `endpoints/survey.py`, `criticalDimensions.js` | EVD-007, EVD-008 | passed local |
| OBJ-002 | PRD-NFR-005 | SDD-CMP-005, ADR-002 | BDD-SC-008 | TDD-TC-008 | `endpoints/survey.py`, `nom035_engine.py` | EVD-007 | passed local |

## Auditoría CHG-001 y CHG-002

- IDs duplicados: ninguno.
- Referencias inexistentes: ninguna en los artefactos definidos.
- Cobertura hacia adelante: todos los requisitos tienen diseño, escenario y prueba.
- Cobertura hacia atrás: cada prueba referencia requisito o escenario.
- Evidencia ejecutada: EVD-001 a EVD-004 (CHG-001) y EVD-006 a EVD-008 (CHG-002) ejecutadas y aprobadas localmente. EVD-005 permanece abierta para producción.
