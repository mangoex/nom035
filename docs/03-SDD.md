# Software Design Document

## Arquitectura

El incremento conserva la arquitectura React/Vite → FastAPI → SQLAlchemy. El backend decide vigencia y pertenencia; el Dashboard reúne contexto autorizado; una utilidad pura construye las líneas temporales que consume `pdfMake`.

Decisión vigente: `docs/adr/ADR-001-fecha-cierre-inclusiva.md`.

## Componentes

### SDD-CMP-001 — Política de vigencia backend

- Responsabilidad: determinar de forma centralizada si una sesión acepta respuestas.
- Cubre: PRD-FR-003, PRD-NFR-003.
- Entradas: `is_active`, `fecha_fin`, fecha actual opcional para prueba.
- Salida: booleano; los endpoints públicos traducen falso al error 404 existente.

### SDD-CMP-002 — Contexto de sesión para administrador

- Responsabilidad: devolver `SurveySessionOut` sólo para una sesión de la empresa autenticada.
- Cubre: PRD-FR-004, PRD-NFR-002.
- Entradas: `session_id`, `current_user.company_id`.
- Salidas: metadatos autorizados o 404.

### SDD-CMP-003 — Contexto temporal del Dashboard

- Responsabilidad: mantener sesión seleccionada, respuestas y filtros usados para construir el PDF.
- Cubre: PRD-FR-001, PRD-FR-002, PRD-FR-004.
- Entradas: endpoint administrativo o contexto de consultor existente.
- Salida: `reportContext = { surveySession, responses, filters }`.

### SDD-CMP-004 — Presentación temporal del PDF

- Responsabilidad: formatear fechas de calendario sin desplazamiento y generar líneas veraces para sesión o agregado.
- Cubre: PRD-FR-001, PRD-FR-002, PRD-FR-005, PRD-NFR-001, PRD-NFR-003.
- Entradas: sesión, respuestas, fecha de generación inyectable.
- Salida: líneas de encabezado consumidas por `pdfGenerator.js`.

### SDD-CMP-005 — Agregador departamental de dimensiones (Backend)

- Responsabilidad: agrupar los puntajes de cada dimensión por departamento en las respuestas filtradas, promediarlos, calcular el nivel de riesgo según los baremos normativos (Guía II / Guía III) y filtrar las dimensiones con riesgo `Medio`, `Alto` o `Muy Alto`.
- Cubre: PRD-FR-006, PRD-NFR-004, PRD-NFR-005, ADR-002.
- Entradas: respuestas con `calculated_scores.dimension_scores` y `demographics.department`, guía activa (`GUIA_II` o `GUIA_III`).
- Salida: lista `critical_dimensions_by_department = [{ department, dimension, score, risk, responses_count }]`.

### SDD-CMP-006 — Control de filtro y panel de focos rojos (Frontend)

- Responsabilidad: proveer el control de alternancia en la barra de filtros del Dashboard y renderizar la vista de dimensiones críticas desglosadas por departamento.
- Cubre: PRD-FR-007, PRD-FR-008, PRD-NFR-004.
- Entradas: `stats.critical_dimensions_by_department`, estado del filtro (`only_critical_dimensions`), selector departamental activo (`filters.department`).
- Salida: tarjetas interactivas de focos rojos, filtros sincronizados y señal de representatividad estadística cuando `responses_count < 3`.

## Contratos

### GET `/api/survey/stats` y `/api/consultant/survey-sessions/{session_id}/stats`

- Parámetros: conserva los filtros existentes (`age_range`, `gender`, `department`, `position`, `start_date`, `end_date`, `survey_session_id`, `clave`).
- Extensión del payload:
  ```json
  {
    "critical_dimensions_by_department": [
      {
        "department": "Operaciones",
        "dimension": "Carga de trabajo",
        "score": 14.5,
        "risk": "Alto",
        "responses_count": 8
      }
    ]
  }
  ```

### GET `/api/survey/sessions/{session_id}`

- Autenticación: `company_admin` mediante `get_current_admin`.
- Éxito: `200 SurveySessionOut` sin alterar el contrato existente.
- No encontrada o ajena: `404 {detail: "Encuesta no encontrada."}`.

### Política pública

```text
accepts = is_active AND (fecha_fin IS NULL OR fecha_fin >= today)
```

La política se evalúa tanto al abrir la liga como al enviar la respuesta para cubrir el cambio de día y evitar depender del estado del navegador.

## Datos e invariantes

- Modelo: se reutilizan `SurveySession.created_at`, `SurveySession.fecha_fin` y `SurveyResponse.created_at`; no hay migración.
- Invariante 1: `fecha_fin` representa el último día calendario permitido, no un timestamp.
- Invariante 2: el PDF no recibe ni imprime `clave_secreta`.
- Invariante 3: un reporte agregado muestra rango de respuestas, no “fecha de cierre”.
- Invariante 4: la fecha de emisión se calcula al generar el archivo y no reemplaza las fechas del levantamiento.

## Estados y transiciones

| Actor | Precondición | Evento | Efectos | Auditoría |
|---|---|---|---|---|
| Trabajador | Sesión activa y hoy ≤ `fecha_fin` | Abre o envía encuesta | Acceso permitido; POST persiste | `SurveyResponse.created_at` |
| Trabajador | Sesión inactiva o hoy > `fecha_fin` | Abre o envía encuesta | 404; no persiste | Log HTTP de la plataforma |
| Administrador | Sesión propia seleccionada | Descarga PDF | Incluye periodo y estado del cierre | PDF emitido y revisión humana |
| Consultor | Acceso autorizado | Descarga PDF | Usa contexto autorizado existente | PDF emitido y revisión humana |
| Usuario autorizado | Sin sesión seleccionada | Descarga PDF agregado | Incluye rango de respuestas | PDF emitido y revisión humana |

## Seguridad, privacidad y observabilidad

- Permisos: el nuevo endpoint usa identidad backend y filtro por `company_id`; el contexto de consultor mantiene su guard existente.
- Privacidad: sólo se propagan fechas y metadatos de sesión; no respuestas crudas ni clave.
- Logs: se conserva la telemetría HTTP actual. Añadir métricas de expiración queda como incremento operativo posterior.
- Migraciones: no aplica.
- Rollback: revertir los archivos de código de `CHG-001`; no requiere reversión de datos.
- Modo degradado: si falta contexto temporal, el PDF dice “Periodo ... no disponible” en lugar de inventar fechas.
