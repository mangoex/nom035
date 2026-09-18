# Product Requirements Document

## Historia CHG-001

Como responsable de una evaluación NOM-035, quiero que el informe PDF identifique cuándo se aplicaron y cerraron las encuestas, para poder relacionar los resultados con un levantamiento concreto y distinguirlo de la fecha de emisión.

## Personas

- Administrador de empresa que consulta y emite resultados.
- Consultor autorizado que consulta una sesión específica.
- Responsable de evaluación que revisa y firma el informe.
- Trabajador que responde mediante la liga pública durante su vigencia.

## Alcance y exclusiones

- Incluye: metadatos temporales del reporte, consulta autorizada de sesión y aplicación efectiva de `fecha_fin`.
- Excluye: cierre manual anticipado, nueva migración, firma electrónica y cambios de cálculo.

## Requisitos funcionales

### PRD-FR-001 — Periodo de sesión en PDF

El PDF generado para una sesión debe mostrar en su encabezado la fecha de inicio y la fecha de cierre almacenada en esa sesión.

Criterios de aceptación:

- El periodo usa `SurveySession.created_at` y `SurveySession.fecha_fin`.
- Si el cierre todavía no ocurre, el documento dice “Fecha programada de cierre”.
- Si el cierre ya ocurrió, el documento dice “Fecha de cierre del levantamiento”.
- La fecha de emisión permanece separada junto a la firma.

### PRD-FR-002 — Periodo de reporte agregado

Cuando no exista una sesión seleccionada, el PDF debe mostrar el periodo de las respuestas incluidas y no debe atribuirles una fecha única de cierre.

Criterio de aceptación: usar la menor y mayor fecha `SurveyResponse.created_at`; si no existen respuestas, indicar que el periodo no está disponible.

### PRD-FR-003 — Vigencia efectiva

La liga pública debe permitir consulta y envío únicamente si `is_active` es verdadero y `fecha_fin` no es anterior a la fecha calendario actual.

Criterios de aceptación:

- La fecha `fecha_fin` es inclusiva.
- Al día siguiente, GET y POST públicos responden como liga inválida o expirada.
- Un POST rechazado no persiste una respuesta.
- Las sesiones legadas con `fecha_fin` nula conservan el comportamiento actual y dependen de `is_active`.

### PRD-FR-004 — Contexto autorizado

El administrador sólo puede obtener metadatos de sesiones pertenecientes a su empresa; el consultor conserva el contrato de autorización existente.

Criterio de aceptación: una sesión inexistente o ajena responde 404 sin filtrar sus metadatos.

### PRD-FR-005 — Contenido existente

El informe debe conservar título, resultados, datos del responsable, espacio de firma y fecha de emisión.

Criterio de aceptación: el build conserva la generación del documento y las pruebas verifican las líneas temporales nuevas.

## Requisitos no funcionales

### PRD-NFR-001 — Fidelidad de fechas

Las fechas de calendario `YYYY-MM-DD` deben mostrarse en español sin desplazamiento por conversión de zona horaria.

Métrica: los casos de fechas límite conservan día, mes y año exactos.

### PRD-NFR-002 — Seguridad y privacidad

Los metadatos temporales deben obtenerse mediante rutas autenticadas y no incluir `clave_secreta` ni datos personales de respuestas.

Métrica: prueba negativa de pertenencia y revisión del contrato devuelto.

### PRD-NFR-003 — Compatibilidad

Las sesiones legadas con fecha nula y los reportes agregados deben degradar de forma explícita sin impedir la descarga.

Métrica: prueba de unidad para periodo no disponible y regresión backend existente aprobada.

## Historia CHG-002

Como responsable de evaluación NOM-035, administrador de empresa o consultor autorizado, quiero filtrar en el Dashboard las dimensiones psicosociales que obtuvieron un nivel de riesgo de Medio para arriba e identificar en qué departamento se originaron, para focalizar oportunamente las medidas de mitigación y planes de acción en las áreas prioritarias.

## Requisitos funcionales (CHG-002)

### PRD-FR-006 — Agregación departamental de dimensiones en backend

El cálculo de estadísticas de encuestas (`/api/survey/stats` y endpoint de consultor) debe calcular el puntaje promedio y nivel de riesgo de cada dimensión por departamento según los umbrales de la guía activa (Guía II o Guía III), retornando la lista de dimensiones críticas (`critical_dimensions_by_department`) que alcanzaron nivel de riesgo `Medio`, `Alto` o `Muy Alto`.

Criterios de aceptación:
- Los baremos aplicados corresponden a la guía de la sesión evaluada (o guía activa de la empresa).
- Se excluyen de esta lista las dimensiones con nivel `Nulo` o `Bajo`.
- Cada elemento devuelto incluye: `department`, `dimension`, `score`, `risk` y `responses_count`.

### PRD-FR-007 — Control de filtro prioritario en Dashboard

La barra de filtros del Dashboard debe contar con una opción (toggle/checkbox) para activar o desactivar la visualización de dimensiones de riesgo prioritario (≥ Medio).

Criterios de aceptación:
- Por defecto, el filtro se encuentra inactivo mostrando la vista habitual.
- Al activarse, destaca o filtra los resultados críticos departamentales.
- Al pulsar "Limpiar Filtros", se desactiva junto con el resto de filtros.

### PRD-FR-008 — Desglose visual Dimensión-Departamento

El Dashboard debe presentar un panel o tarjeta que liste claramente las dimensiones críticas correlacionadas con el departamento donde se originaron.

Criterios de aceptación:
- Muestra el nombre de la dimensión, departamento, puntaje promedio y nivel de riesgo con el color normativo correspondiente.
- Permite la interacción conjunta con el selector de departamentos (si se selecciona un departamento específico, la vista se acota a este).
- En caso de no existir dimensiones con riesgo Medio o superior, presenta un mensaje de estado vacío claro y tranquilizador.

## Requisitos no funcionales (CHG-002)

### PRD-NFR-004 — Confidencialidad y protección de anonimato

Para cumplir con `PROJECT-PR-004`, las agregaciones departamentales deben mostrar el número de respuestas evaluadas por departamento. Si un departamento tiene menos de 3 respuestas, la interfaz debe mostrar un indicador de representatividad estadística para evitar deducciones sobre individuos.

Métrica: presencia del conteo de respuestas por departamento y ausencia de datos personales identificables.

### PRD-NFR-005 — Fidelidad normativa de baremos

La categorización de riesgo (`Medio`, `Alto`, `Muy Alto`) debe realizarse con exactitud contra los umbrales oficiales de la NOM-035 para cada dimensión evaluada.

Métrica: pruebas unitarias que validen casos en límites inferiores y superiores de cada rango normativo.

## Criterios de éxito

- Cada PDF emitido comunica claramente el alcance temporal de los resultados (CHG-001).
- La API impide respuestas posteriores al cierre programado (CHG-001).
- El Dashboard identifica de forma inmediata qué dimensiones y departamentos se encuentran en riesgo Medio o superior (CHG-002).
- No se altera la persistencia ni se introducen migraciones de base de datos.
- Gates de calidad y pruebas locales completadas con evidencia documentada.
