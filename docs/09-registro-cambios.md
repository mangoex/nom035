# Registro de cambios

| ID | Fecha | Cambio observable | Autoridad afectada | Pruebas | Estado |
|---|---|---|---|---|---|
| CHG-001 | 2026-09-02 | El PDF distingue periodo, cierre ocurrido/programado y emisión; la API hace efectiva la vigencia | PROJECT-PR-002, ADR-001, PRD-FR-001 a PRD-FR-005 | TDD-TC-001 a TDD-TC-007 | implemented y passed local; no aprobado para producción |
| CHG-002 | 2026-09-18 | Filtro en Dashboard y agregación en stats de dimensiones críticas (≥ Medio) por departamento | PROJECT-PR-003, PROJECT-PR-004, ADR-002, PRD-FR-006 a PRD-FR-008 | TDD-TC-008 a TDD-TC-011 | implemented y passed local; no aprobado para producción |

## CHG-001 — Periodo y cierre verificable del levantamiento

## Propagación CHG-001

1. Constitución y fuente canónica: definidas.
2. ADR-001: propuesto y aprobado para este incremento por la solicitud de implementación.
3. PRD/SDD: definidos.
4. BDD/TDD: definidos antes del código.
5. Implementación: completada localmente.
6. Evidencia: EVD-001 a EVD-004 ejecutadas o en validación final.
7. Publicación: fuera de alcance.

## CHG-002 — Dimensiones de riesgo crítico (≥ Medio) por departamento

## Propagación CHG-002

1. Constitución y fuente canónica: preservadas (`PROJECT-PR-003`, `PROJECT-PR-004`).
2. ADR-002: propuesto y formalizado para agregación departamental backend.
3. PRD/SDD: actualizados con requisitos `PRD-FR-006+` y componentes `SDD-CMP-005`, `SDD-CMP-006`.
4. BDD/TDD: definidos antes del código (`BDD-SC-008+`, `TDD-TC-008+`).
5. Implementación: pruebas en rojo y desarrollo en curso.
6. Evidencia: EVD-006 a EVD-008 en ejecución.
7. Publicación: fuera de alcance.
