# ADR-002 — Agregación backend de dimensiones de riesgo por departamento

- Estado: propuesto y aprobado para CHG-002.
- Fecha: 2026-09-18.
- Autoridad: PROJECT-PR-003 (Autoridad del backend), PROJECT-PR-004 (Minimización y confidencialidad) y solicitud aprobada de implementación.

## Contexto

Los usuarios necesitan filtrar e identificar rápidamente en el Dashboard las dimensiones psicosociales que obtuvieron un nivel de riesgo de Medio para arriba (es decir: Medio, Alto y Muy Alto), sabiendo en qué departamento se produjo dicho resultado.
Actualmente, el backend calcula promedios y niveles de riesgo de dimensiones de forma global para las respuestas filtradas.

Surgieron dos opciones de diseño:
1. Calcular el desglose por departamento en el cliente (frontend) a partir del arreglo de respuestas crudas.
2. Calcular la agregación canónica `dimensión x departamento` en el backend (`build_survey_statistics`) aplicando los baremos normativos de la Guía II o III y devolver las dimensiones críticas estructuradas.

## Decisión

1. La agregación y clasificación de riesgo por dimensión y departamento reside en el backend dentro de `build_survey_statistics`.
2. El endpoint `/api/survey/stats` (y su equivalente de consultor) devolverá la clave `critical_dimensions_by_department` como un arreglo ordenado por severidad de riesgo (`Muy Alto` -> `Alto` -> `Medio`).
3. El frontend consume esta estructura para renderizar el panel de focos rojos y alimentar el filtro interactivo del Dashboard.
4. Se incluye `responses_count` por departamento para que la interfaz advierta si el departamento tiene una muestra reducida (< 3 respuestas), protegiendo el anonimato del trabajador conforme a `PROJECT-PR-004`.

## Alternativas consideradas

- *Cálculo exclusivo en frontend:* Rechazada porque trasladar las reglas de baremos normativos y agregación de encuestas al navegador vulnera el principio `PROJECT-PR-003` (la autoridad de cálculo es el backend) y es susceptible a fallos si las respuestas están paginadas o anonimizadas parcialmente.
- *Crear un endpoint completamente nuevo:* Descartada para evitar sobrecarga de peticiones HTTP en el Dashboard; incorporar el agregado en `/stats` mantiene la atomicidad de la carga de métricas.

## Consecuencias

- Positivas: Consistencia normativa absoluta, cálculo centralizado y probado con `pytest`, mínimo tráfico de red, soporte automático para filtros de sesión y fecha.
- Negativas: Incremento ligero en el tiempo de procesamiento de `/stats`, mitigado porque las evaluaciones típicas por empresa tienen entre decenas y cientos de respuestas ya en memoria durante el cálculo estadístico.

## Aprobación

La petición explícita del usuario autoriza esta decisión para el incremento CHG-002 bajo el marco de gobierno del proyecto.
