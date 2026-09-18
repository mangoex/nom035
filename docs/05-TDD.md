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

### TDD-TC-008 — Cálculo backend de dimensiones críticas por departamento

- Cubre: BDD-SC-008, PRD-FR-006, PRD-NFR-005, SDD-CMP-005.
- Nivel: unidad / integración backend (`backend/tests/test_surveys.py`).
- Fixture: respuestas de Guía II y Guía III distribuidas en dos departamentos con respuestas calibradas que detonen niveles Medio/Alto en ciertas dimensiones y Nulo/Bajo en otras.
- Acción: invocar `build_survey_statistics` (o endpoint `/stats`).
- Aserciones: `critical_dimensions_by_department` contiene únicamente dimensiones con riesgo in `["Medio", "Alto", "Muy Alto"]`; cada elemento tiene `department`, `dimension`, `score`, `risk` y `responses_count`; las dimensiones con riesgo `Nulo` y `Bajo` no aparecen en este listado.
- Estado: defined.

### TDD-TC-009 — Contrato de endpoint `/api/survey/stats` con filtro departamental

- Cubre: BDD-SC-008, BDD-SC-010, PRD-FR-006, SDD-CMP-005.
- Nivel: integración FastAPI/SQLite.
- Fixture: base de datos con respuestas y sesión creada.
- Acción: GET `/api/survey/stats` con y sin parámetro `department`.
- Aserciones: código 200; `critical_dimensions_by_department` presente en payload; al filtrar por departamento, se acotan los resultados críticos a ese departamento.
- Estado: defined.

### TDD-TC-010 — Lógica frontend de dimensiones críticas y estado vacío

- Cubre: BDD-SC-009, BDD-SC-011, BDD-SC-012, PRD-FR-007, PRD-FR-008, SDD-CMP-006.
- Nivel: unidad JavaScript pura (`frontend/src/utils/criticalDimensions.test.js`).
- Fixture: arreglos de dimensiones críticas con y sin elementos, y con muestras de < 3 respuestas.
- Acción: evaluar funciones de ordenamiento, filtrado por departamento y banderas de representatividad.
- Aserciones: ordenamiento por severidad (Muy Alto > Alto > Medio), filtro preciso por departamento, detección de muestra reducida (< 3), manejo seguro de arreglos vacíos o nulos.
- Estado: defined.

### TDD-TC-011 — Regresión global del sistema

- Cubre: PRD-FR-006, PRD-FR-007, PRD-FR-008, PRD-NFR-004, PRD-NFR-005.
- Nivel: suite completa backend y frontend.
- Fixture: repositorio integrado.
- Acción: ejecutar `pytest`, `node --test`, `npm run lint` y `npm run build`.
- Aserciones: todos los comandos terminan con código cero sin regresiones.
- Estado: defined.

## Estrategia

- Unitarias: política de vigencia, transformación de fechas del reporte y agregador departamental de dimensiones críticas.
- Integración: acceso público, pertenencia de sesión y cálculo de estadísticas con desglose departamental.
- Contrato: `SurveySessionOut`, contexto de consultor y extensión de `critical_dimensions_by_department` en `/stats`.
- Seguridad: prueba negativa de empresa ajena, salvaguarda de anonimato en muestras pequeñas y ausencia de persistencia fuera de vigencia.
- Regresión: suite backend completa, lint y build frontend.
- Evidencia: registrar comando, fecha, resultado y alcance en `docs/11-evidencia.md` después de ejecutar.
