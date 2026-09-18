# Evidencia de CHG-001

La evidencia separa definición, implementación, ejecución, aprobación local y aprobación productiva.

| ID | Fecha | Comando o revisión | Resultado | Estado |
|---|---|---|---|---|
| EVD-001 | 2026-09-02 | Focal RED backend y frontend | Backend: 2 fallos esperados y 1 aprobado; frontend: módulo inexistente | executed |
| EVD-002 | 2026-09-02 | Pytest backend sobre la base de la historia y después de integrar `origin/main` | Base CHG-001: 17 passed. Integrado: 38 passed + 1 passed aislado; 39 casos aprobados | passed con limitación de harness documentada |
| EVD-003 | 2026-09-02 | `npm run test:unit`, `npm run lint`, `npm run build` | 5 pruebas passed; lint 0; build 0 con advertencia de tamaño de bundle | passed |
| EVD-004 | 2026-09-02 | `git diff --check`, validación Humanio estricta y evaluador de readiness del framework | diff check passed; validador 0 errores/0 advertencias; evaluador 5 casos aprobados | passed |
| EVD-005 | Sin ejecutar | Revisión visual del PDF, CI, despliegue y prueba productiva | No existe evidencia | defined |
| EVD-006 | 2026-09-18 | Focal RED backend y frontend para CHG-002 | Backend: AssertionError (clave critical_dimensions_by_department faltante); frontend: ERR_MODULE_NOT_FOUND para criticalDimensions.js | executed |
| EVD-007 | 2026-09-18 | Pytest backend suite test_surveys.py (CHG-002) | 8 pruebas passed (100% de la suite de encuestas); cálculo de dimensiones críticas verificado | passed |
| EVD-008 | 2026-09-18 | Frontend unit tests, linting y build (CHG-002) | 10 pruebas passed en node --test (5 nuevas + 5 existentes); eslint 0 errores; vite build código 0 | passed |

## EVD-001 — RED previo a implementación

- Backend: el endpoint de contexto devolvía 404 y la liga vencida devolvía 200; el límite inclusivo ya era compatible.
- Frontend: `ERR_MODULE_NOT_FOUND` para la utilidad aún no implementada.

## EVD-002 — Backend GREEN

- Antes de integrar cambios remotos concurrentes: 17 pruebas aprobadas.
- Después de integrar `origin/main` en `25fcbbd`: 38 pruebas aprobadas con `-k 'not forgot_password_flow'` y el caso restante `test_forgot_password_flow` aprobado de forma aislada; cobertura total observada: 39 casos.
- La invocación monolítica integrada produjo 38 aprobados y un error de fixture: `backend/tests/test_auth.py` elimina `test_temp.db` entre pruebas mientras el engine persiste, y el siguiente `create_all` recibe `attempt to write a readonly database`. Es un defecto del harness incorporado por el remoto, no un fallo funcional de CHG-001; no se corrigió para evitar ampliar el alcance del release.
- Advertencias: Pydantic `Config` deprecado y orden de `drop_all` SQLite; no fueron introducidas como fallo por CHG-001.

## EVD-003 — Frontend GREEN

- Pruebas unitarias: 5 aprobadas.
- ESLint: código cero.
- Vite build: código cero; mantiene advertencia de chunk mayor a 500 kB.

## EVD-004 — Calidad y gobierno

- `git diff --check`: aprobado.
- El validador directo del checkout encuentra falsos positivos en `node_modules` y reconoce referencias normativas existentes como IDs. En un sustrato aislado que preserva todo el código y excluye `.git`, dependencias, artefactos compilados y fuentes `.txt/.pdf`, `validate_workspace.py --strict` terminó con 0 errores y 0 advertencias.
- El evaluador de readiness del framework aprobó sus 5 casos de política; no sustituye los gates específicos del proyecto.

## EVD-005 — Producción y revisión visual

- No ejecutado: PDF renderizado en navegador con datos representativos, CI remoto, despliegue, rollback real y prueba productiva.

## EVD-006 — RED CHG-002

- Backend: `py -m pytest backend/tests/test_surveys.py -k "test_stats_critical_dimensions_by_department"` arrojó `AssertionError: assert 'critical_dimensions_by_department' in ...` demostrando ausencia inicial de la funcionalidad.
- Frontend: `node --test src/utils/criticalDimensions.test.js` arrojó `ERR_MODULE_NOT_FOUND` previo a la creación del módulo utilitario.

## EVD-007 — Backend GREEN CHG-002

- Comando: `$env:SECRET_KEY="test-secret-key-12345678901234567890"; py -m pytest backend/tests/test_surveys.py`
- Resultado: 8 passed en 4.45s.
- Verificación: agregación de dimensiones críticas (≥ Medio) por departamento confirmada, exclusión de niveles Nulo y Bajo comprobada, y consistencia de baremos evaluada.

## EVD-008 — Frontend GREEN CHG-002

- Pruebas unitarias: `node --test src/utils/*.test.js` -> 10 passed (5 nuevas de criticalDimensions + 5 de reportPeriod).
- ESLint: `npm.cmd run lint` -> código de salida 0 sin errores.
- Vite build: `npm.cmd run build` -> código de salida 0 (éxito en 10.50s).

## Decisión de readiness

- Implementación local CHG-001: Gate 4 satisfecho con evidencia EVD-002 a EVD-004.
- Implementación local CHG-002: Gate 4 satisfecho con evidencia EVD-006 a EVD-008.
- Producción: NOT READY.
- Motivo: EVD-005, aprobación humana y Gate 5 no están ejecutados ni autorizados para despliegue productivo.
