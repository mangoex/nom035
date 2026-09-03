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

## Rollback

- Revertir únicamente los archivos de código asociados a `CHG-001`.
- No hay migración ni transformación de datos que revertir.
- Verificar que GET/POST públicos recuperen su contrato anterior y que el PDF continúe generándose.
