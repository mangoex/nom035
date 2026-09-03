# Registro de riesgos

## Clasificación

- Nivel: R3.
- Justificación: informe regulatorio y resultados laborales sensibles.
- Responsable: product owner para aceptación; responsable técnico para mitigación y liberación.

## Riesgos

| ID | Riesgo | Probabilidad | Impacto | Mitigación | Dueño | Estado |
|---|---|---|---|---|---|---|
| RSK-001 | El PDF afirma un cierre futuro como ocurrido | Media | Alto | Etiqueta dinámica “programada” hasta que transcurra la fecha | Producto | mitigated |
| RSK-002 | Se aceptan respuestas fuera de vigencia | Alta en línea base | Alto | Política backend central y verificación en GET/POST | Backend | mitigated local |
| RSK-003 | Conversión de zona horaria cambia el día impreso | Media | Alto | Formato date-only determinista y pruebas de borde | Frontend | mitigated local |
| RSK-004 | Se filtra contexto de una sesión ajena | Baja | Crítico | Autenticación backend, filtro por empresa y prueba negativa | Backend | mitigated local |
| RSK-005 | Un reporte agregado sugiere un cierre único inexistente | Media | Alto | Mostrar min/max de respuestas y omitir cierre único | Producto | mitigated local |
| RSK-006 | La liberación se confunde con validación local | Media | Alto | Gate 5 y aprobación humana permanecen explícitamente pendientes | Responsable técnico | open |

## Riesgo residual

- Riesgos aceptados: no se registra cierre manual anticipado; una desactivación extraordinaria anterior a `fecha_fin` no tiene `closed_at` auditable.
- Aprobador: product owner, pendiente para cualquier liberación.
- Condiciones: no declarar producción READY hasta contar con revisión del PDF renderizado, CI, despliegue, rollback y aprobación humana.

### RSK-001 — Cierre futuro presentado como ocurrido

Definido y mitigado mediante etiqueta de cierre programado.

### RSK-002 — Respuestas posteriores a la vigencia

Definido y mitigado localmente mediante política backend en GET y POST.

### RSK-003 — Desplazamiento del día por zona horaria

Definido y mitigado localmente mediante formato determinista de fecha calendario.

### RSK-004 — Lectura de sesión ajena

Definido y mitigado localmente mediante pertenencia backend y 404 uniforme.

### RSK-005 — Cierre falso en reporte agregado

Definido y mitigado mediante rango min/max de respuestas.

### RSK-006 — Confusión entre validación local y producción

Definido y abierto hasta contar con Gate 5 y aprobación humana.
