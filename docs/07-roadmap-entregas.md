# Plan y tareas de entrega

## Incremento 1 — CHG-001

- Objetivo: OBJ-001.
- Requisitos: PRD-FR-001 a PRD-FR-005; PRD-NFR-001 a PRD-NFR-003.
- Escenarios: BDD-SC-001 a BDD-SC-007.
- Pruebas: TDD-TC-001 a TDD-TC-007.
- Dependencias: FastAPI/SQLAlchemy existentes, React/Vite, pdfMake y metadatos persistidos actuales.
- Gate de salida local: Gate 4.
- Gate de producción: Gate 5 fuera de alcance y sin aprobación.

## Tareas

| Orden | Tarea | IDs | Evidencia esperada | Estado |
|---|---|---|---|---|
| 1 | Formalizar autoridad, riesgo, requisitos y ADR | CHG-001, ADR-001, RSK-001 a RSK-004 | Validación documental | completed |
| 2 | Definir BDD, TDD y matriz antes del código | BDD-SC-001 a BDD-SC-007, TDD-TC-001 a TDD-TC-007 | Matriz sin huérfanos | completed |
| 3 | Añadir pruebas backend y frontend | TDD-TC-001 a TDD-TC-005 | RED observado antes de implementación | completed |
| 4 | Centralizar vigencia y exponer sesión propia | SDD-CMP-001, SDD-CMP-002 | Pruebas backend GREEN | completed |
| 5 | Propagar contexto y metadatos al PDF | SDD-CMP-003, SDD-CMP-004 | Pruebas JS, lint y build GREEN | completed |
| 6 | Ejecutar regresión y validador estricto | TDD-TC-006, TDD-TC-007 | Comandos, fecha y resultados | completed |
| 7 | Actualizar trazabilidad, riesgos y decisión | CHG-001, EVD-001+ | Gate 4 local documentado | completed |

## Incremento 2 — CHG-002

- Objetivo: OBJ-002.
- Requisitos: PRD-FR-006 a PRD-FR-008; PRD-NFR-004 a PRD-NFR-005.
- Escenarios: BDD-SC-008 a BDD-SC-012.
- Pruebas: TDD-TC-008 a TDD-TC-011.
- Dependencias: endpoints de encuesta existentes (`survey.py`), cálculo NOM-035 (`nom035_engine.py`), React/Vite (`Dashboard.jsx`).
- Gate de salida local: Gate 4.
- Gate de producción: Gate 5 sujeto a aprobación humana.

## Tareas (CHG-002)

| Orden | Tarea | IDs | Evidencia esperada | Estado |
|---|---|---|---|---|
| 1 | Formalizar requisitos, BDD, TDD y ADR-002 | CHG-002, ADR-002, PRD-FR-006+, BDD-SC-008+ | Documentación .MD actualizada y trazabilidad validada | completed |
| 2 | Escribir pruebas unitarias e integración backend (Fase Roja) | TDD-TC-008, TDD-TC-009 | RED observado | completed |
| 3 | Escribir pruebas unitarias frontend de dimensiones críticas (Fase Roja) | TDD-TC-010 | RED observado | completed |
| 4 | Implementar agregación departamental de dimensiones en backend (Fase Verde) | SDD-CMP-005, PRD-FR-006 | GREEN backend | completed |
| 5 | Implementar utilidad frontend y controles/paneles en Dashboard.jsx (Fase Verde) | SDD-CMP-006, PRD-FR-007, PRD-FR-008 | GREEN frontend | completed |
| 6 | Ejecutar regresión global y auditoría de calidad | TDD-TC-011, PRD-NFR-004, PRD-NFR-005 | pytest + node test + lint + build con código 0 | completed |
| 7 | Registrar evidencia de ejecución y auditar Quality Gate | EVD-006 a EVD-008 | EVD documentadas en docs/11-evidencia.md | completed |

## Rollback

- Revertir los archivos de código asociados a `CHG-002` (`endpoints/survey.py`, `criticalDimensions.js`, `Dashboard.jsx`).
- No hay alteraciones en modelos de base de datos ni migraciones.
- Verificar que `/api/survey/stats` y el Dashboard continúen funcionando en su versión estándar.
