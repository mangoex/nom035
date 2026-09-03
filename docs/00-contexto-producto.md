# Contexto de producto

## Identidad

- Producto: plataforma NOM035 para administrar levantamientos, respuestas, resultados y documentos de cumplimiento de la NOM-035-STPS-2018.
- Problema: el informe técnico PDF identifica su fecha de emisión, pero no identifica el periodo ni el cierre del levantamiento que respalda sus resultados.
- Usuarios: administradores de empresa, consultores autorizados y responsables que emiten y firman el informe.
- Resultado: cada PDF distingue de forma verificable el periodo evaluado, la fecha de cierre del levantamiento y la fecha de emisión.

## Objetivos

- `OBJ-001`: aumentar la trazabilidad temporal del informe oficial sin atribuir a los datos un cierre que no haya ocurrido.

## Alcance

### Incluye

- Hacer efectiva la vigencia inclusiva de `SurveySession.fecha_fin` en la consulta y envío públicos.
- Exponer a administradores autorizados el contexto de la sesión seleccionada.
- Incorporar periodo, cierre o cierre programado en el encabezado del PDF.
- Mostrar el periodo de respuestas incluidas cuando el reporte agrega varias sesiones.
- Conservar firma y fecha de emisión actuales.

### Excluye

- Firma electrónica, sellado de tiempo o folio fiscal.
- Cambios al método de evaluación, puntajes o interpretación NOM-035.
- Migraciones destructivas, despliegue, uso de datos productivos, commit o push.
- Un flujo nuevo de cierre manual anticipado y un campo `closed_at`.

## Fuentes y decisiones

| Fuente | Autoridad | Estado |
|---|---|---|
| Solicitud del usuario del 2026-09-02 | Necesidad y autorización del incremento | Confirmado |
| `SurveySession.fecha_fin` | Fecha canónica de cierre programado | Confirmado por código existente |
| `SurveySession.created_at` | Inicio técnico de la sesión | Confirmado por código existente |
| `SurveyResponse.created_at` | Fecha de recepción de cada respuesta | Confirmado por código existente |
| NOM-035-STPS-2018 incluida en el repositorio | Contenido regulatorio de referencia | Confirmado; no reinterpretado por este incremento |

## Confirmados, inferencias y pendientes

- Confirmado: el PDF actual sólo muestra fecha de emisión.
- Confirmado: la interfaz denomina `fecha_fin` “Fecha de Fin (Vigencia)”.
- Confirmado: los endpoints públicos actuales no aplican `fecha_fin`.
- Inferido y adoptado para este incremento: `fecha_fin` es inclusiva; la liga admite respuestas durante ese día y vence al comenzar el día siguiente.
- Pendiente no bloqueante: definir en otro cambio si se requiere cierre manual anticipado auditable mediante `closed_at`.
- Contradicciones: la vigencia visual y la aceptación pública eran incompatibles; `CHG-001` las alinea.

## Restricciones

- Negocio: no presentar como ocurrido un cierre que todavía es futuro.
- Técnicas: conservar el modelo de datos; el incremento no requiere migración.
- Seguridad: la consulta de sesión debe respetar empresa o autorización del consultor; nunca exponer `clave_secreta` al PDF.
- Operación: la ejecución local no equivale a aprobación, despliegue ni comportamiento productivo.

## Perfil y riesgo

- Perfil: software.
- Nivel: R3.
- Justificación: el PDF forma parte de evidencia regulatoria y procesa resultados laborales sensibles; una fecha falsa o ambigua puede afectar auditoría y confianza.

## Criterio del primer incremento

- Capacidad: cierre efectivo y metadatos temporales fieles en el PDF.
- Gate: Gate 4 local; Gate 5 queda fuera de alcance hasta aprobación y despliegue.
- Evidencia: pruebas backend, pruebas unitarias de formato, build, lint, regresión y validación Humanio estricta.
