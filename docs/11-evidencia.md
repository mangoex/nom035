# Evidencia de CHG-001

La evidencia separa definición, implementación, ejecución, aprobación local y aprobación productiva.

| ID | Fecha | Comando o revisión | Resultado | Estado |
|---|---|---|---|---|
| EVD-001 | 2026-09-02 | Focal RED backend y frontend | Backend: 2 fallos esperados y 1 aprobado; frontend: módulo inexistente | executed |
| EVD-002 | 2026-09-02 | Pytest backend sobre la base de la historia y después de integrar `origin/main` | Base CHG-001: 17 passed. Integrado: 38 passed + 1 passed aislado; 39 casos aprobados | passed con limitación de harness documentada |
| EVD-003 | 2026-09-02 | `npm run test:unit`, `npm run lint`, `npm run build` | 5 pruebas passed; lint 0; build 0 con advertencia de tamaño de bundle | passed |
| EVD-004 | 2026-09-02 | `git diff --check`, validación Humanio estricta y evaluador de readiness del framework | diff check passed; validador 0 errores/0 advertencias; evaluador 5 casos aprobados | passed |
| EVD-005 | Sin ejecutar | Revisión visual del PDF, CI, despliegue y prueba productiva | No existe evidencia | defined |

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

## Decisión de readiness

- Implementación local: Gate 4 satisfecho con evidencia EVD-002 a EVD-004.
- Producción: NOT READY.
- Motivo: EVD-005, aprobación humana y Gate 5 no están ejecutados ni autorizados.
