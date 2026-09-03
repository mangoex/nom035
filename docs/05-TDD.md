# Test-Driven Development

## Casos

### TDD-TC-001 — Fecha vencida bloquea GET y POST

- Cubre: BDD-SC-004, PRD-FR-003.
- Nivel: integración FastAPI/SQLite.
- Fixture: sesión activa con `fecha_fin = ayer` y payload válido.
- Acción: GET y POST públicos.
- Aserciones: ambos 404 y conteo de respuestas sin cambio.
- Estado: defined.

### TDD-TC-002 — Fecha final es inclusiva

- Cubre: BDD-SC-005, PRD-FR-003.
- Nivel: unidad backend.
- Fixture: sesión activa con `fecha_fin = hoy`.
- Acción: evaluar política de vigencia.
- Aserción: devuelve verdadero; mañana devuelve falso.
- Estado: defined.

### TDD-TC-003 — Contexto administrativo propio y ajeno

- Cubre: BDD-SC-006, PRD-FR-004, PRD-NFR-002.
- Nivel: integración FastAPI/SQLite.
- Fixture: sesiones de dos empresas.
- Acción: GET del nuevo endpoint.
- Aserciones: propia 200; ajena 404; contrato esperado.
- Estado: defined.

### TDD-TC-004 — Líneas de sesión cerrada y programada

- Cubre: BDD-SC-001, BDD-SC-002, PRD-FR-001, PRD-NFR-001.
- Nivel: unidad JavaScript pura.
- Fixture: sesión con fechas ISO y fecha actual inyectada.
- Acción: construir líneas del encabezado.
- Aserciones: periodo exacto y etiqueta de cierre correcta.
- Estado: defined.

### TDD-TC-005 — Periodo agregado y datos faltantes

- Cubre: BDD-SC-003, BDD-SC-007, PRD-FR-002, PRD-NFR-003.
- Nivel: unidad JavaScript pura.
- Fixture: respuestas desordenadas y arreglo vacío.
- Acción: construir líneas del encabezado.
- Aserciones: min/max correctos, sin etiqueta de cierre y fallback explícito.
- Estado: defined.

### TDD-TC-006 — Integración de descarga

- Cubre: PRD-FR-001, PRD-FR-004, PRD-FR-005.
- Nivel: build y análisis estático frontend.
- Fixture: aplicación Vite.
- Acción: ejecutar pruebas unitarias, lint y build.
- Aserciones: comandos terminan con código cero y `pdfGenerator` consume el contexto temporal.
- Estado: defined.

### TDD-TC-007 — Regresión backend

- Cubre: PRD-FR-003, PRD-FR-004, PRD-NFR-002, PRD-NFR-003.
- Nivel: suite backend.
- Fixture: suite existente.
- Acción: ejecutar pytest.
- Aserción: sin regresiones.
- Estado: defined.

## Estrategia

- Unitarias: política de vigencia y transformación de fechas del reporte.
- Integración: acceso público y pertenencia de sesión.
- Contrato: `SurveySessionOut` y contexto de consultor existente.
- Seguridad: prueba negativa de empresa ajena y ausencia de persistencia fuera de vigencia.
- Regresión: suite backend completa, lint y build frontend.
- Evidencia: registrar comando, fecha, resultado y alcance en `docs/11-evidencia.md` después de ejecutar.
