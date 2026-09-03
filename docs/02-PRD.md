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

## Criterios de éxito

- Cada PDF emitido comunica claramente el alcance temporal de los resultados.
- La API impide respuestas posteriores al cierre programado.
- No se modifica el esquema ni el cálculo NOM-035.
- Gate 4 cuenta con evidencia local ejecutada; Gate 5 continúa sujeto a aprobación y despliegue.
