# Behavior-Driven Development

## Feature: CHG-001 — Trazabilidad temporal del informe

### BDD-SC-001 — PDF de una sesión ya cerrada

```gherkin
Given una sesión seleccionada con fecha de inicio y fecha_fin anterior a hoy
When el usuario autorizado genera el informe PDF
Then el encabezado muestra el periodo de aplicación
And muestra “Fecha de cierre del levantamiento” con fecha_fin
And mantiene por separado la fecha de emisión y la firma
```

### BDD-SC-002 — PDF antes del cierre

```gherkin
Given una sesión seleccionada cuya fecha_fin es hoy o una fecha futura
When el usuario autorizado genera el informe PDF
Then el encabezado muestra “Fecha programada de cierre”
And no afirma que el levantamiento ya cerró
```

### BDD-SC-003 — Reporte agregado

```gherkin
Given un reporte sin sesión seleccionada con respuestas de distintas fechas
When se construyen sus metadatos temporales
Then muestra el periodo entre la primera y la última respuesta incluida
And no muestra una fecha única de cierre del levantamiento
```

### BDD-SC-004 — Sesión pública expirada

```gherkin
Given una sesión activa cuya fecha_fin fue ayer
When una persona abre la liga o intenta enviar una respuesta
Then ambos intentos reciben el error de liga inválida o expirada
And el intento de envío no persiste una respuesta
```

### BDD-SC-005 — Día final inclusivo

```gherkin
Given una sesión activa cuya fecha_fin es hoy
When una persona abre la liga o envía una respuesta válida
Then la operación está permitida
```

### BDD-SC-006 — Consulta de sesión ajena

```gherkin
Given un administrador autenticado de la empresa A
And una sesión perteneciente a la empresa B
When solicita el contexto de esa sesión
Then recibe 404
And no recibe metadatos de la sesión ajena
```

### BDD-SC-007 — Datos temporales faltantes

```gherkin
Given un reporte agregado sin respuestas o una sesión legada sin fecha_fin
When se construyen sus metadatos temporales
Then el documento indica que el periodo o cierre no está disponible
And la generación no falla
```

## Feature: CHG-002 — Dimensiones de riesgo crítico (≥ Medio) por departamento

### BDD-SC-008 — Cálculo backend de dimensiones críticas por departamento

```gherkin
Given un conjunto de respuestas de Guía II o Guía III con información departamental
When el backend procesa las estadísticas del levantamiento
Then calcula el nivel de riesgo promedio de cada dimensión por departamento
And incluye en "critical_dimensions_by_department" únicamente las dimensiones con riesgo "Medio", "Alto" o "Muy Alto"
And omite las dimensiones evaluadas con riesgo "Nulo" o "Bajo"
```

### BDD-SC-009 — Activación de filtro y visualización departamental

```gherkin
Given el usuario visualiza el Dashboard con respuestas cargadas
When activa la casilla "Solo dimensiones en riesgo (≥ Medio)"
Then se despliega la sección de focos rojos mostrando las dimensiones afectadas
And cada tarjeta o fila indica el nombre de la dimensión, departamento, puntaje y nivel de riesgo
```

### BDD-SC-010 — Interacción combinada de filtros

```gherkin
Given el filtro de dimensiones críticas se encuentra activo
When el usuario selecciona un departamento específico (ej. "Operaciones") en la barra de filtros
Then la lista de dimensiones críticas se acota exclusivamente a las dimensiones de "Operaciones"
```

### BDD-SC-011 — Estado vacío ante ausencia de dimensiones críticas

```gherkin
Given un conjunto de respuestas donde ninguna dimensión supera el umbral Bajo en ningún departamento
When el usuario activa el filtro de dimensiones críticas
Then la interfaz presenta un estado informativo: "No se encontraron dimensiones con nivel de riesgo Medio, Alto o Muy Alto"
And no se produce ningún error de renderizado
```

### BDD-SC-012 — Limpieza y restauración de la vista

```gherkin
Given el filtro de dimensiones críticas activo
When el usuario desmarca la opción o hace clic en "Limpiar Filtros"
Then la vista del Dashboard restaura la visualización habitual de todas las dimensiones y departamentos
```

## Criterios transversales

- PRD-NFR-001: una fecha `2026-08-30` debe permanecer 30 de agosto de 2026 en cualquier zona horaria del navegador.
- PRD-NFR-002: ninguna salida del contexto temporal contiene `clave_secreta` en el PDF.
- PRD-FR-005: el contenido actual del informe continúa generándose.
- PRD-NFR-004: los desgloses departamentales incluyen conteo de respuestas y señalan muestras reducidas (< 3) para salvaguardar el anonimato.
- PRD-NFR-005: los niveles de riesgo se determinan exclusivamente contra los umbrales oficiales de la Guía II o Guía III según la encuesta.
