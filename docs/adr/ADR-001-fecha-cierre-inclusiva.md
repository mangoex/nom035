# ADR-001 — Fecha de cierre inclusiva y presentación veraz

- Estado: vigente para CHG-001.
- Fecha: 2026-09-02.
- Autoridad: PROJECT-PR-002, PROJECT-PR-003 y solicitud aprobada de implementación.

## Contexto

`fecha_fin` ya existe como fecha de vigencia, pero la API pública sólo considera `is_active`. El PDF no recibe contexto de sesión. Llamar “cierre” a una fecha futura o a un reporte que combina sesiones produciría una afirmación no demostrada.

## Decisión

1. `fecha_fin` es el último día calendario inclusivo en el que la sesión acepta respuestas.
2. El backend aplica la misma política en GET y POST públicos.
3. El PDF de sesión muestra inicio y `fecha_fin`.
4. Antes o durante el día final usa “Fecha programada de cierre”; después usa “Fecha de cierre del levantamiento”.
5. El PDF agregado usa el rango min/max de respuestas y nunca declara un cierre único.
6. Las fechas date-only se formatean sin construir una fecha local susceptible a desplazamiento de zona horaria.

## Alternativas consideradas

- Mostrar siempre `fecha_fin` como cierre: rechazada porque puede ser futura.
- Calcular el cierre con la última respuesta: rechazada porque no prueba que el canal haya cerrado.
- Añadir `closed_at` y cierre manual ahora: diferida; amplía modelo, UI, permisos y migración más allá de la historia solicitada.

## Consecuencias

- Positivas: coherencia entre vigencia, recepción y documento; no requiere migración.
- Negativas: no captura el instante de un cierre manual anticipado.
- Revisión futura: proponer un ADR sucesor si se incorpora `closed_at`.

## Aprobación

La petición explícita de implementar la historia autoriza esta decisión dentro del incremento local. No autoriza commit, push, despliegue ni aceptación de riesgo productivo.
