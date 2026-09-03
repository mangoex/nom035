# Threat model de CHG-001

## Activos

- Integridad de la fecha y alcance temporal del informe.
- Confidencialidad de sesiones y resultados.
- Integridad de respuestas recibidas dentro de la vigencia.

## Actores y fronteras

- Público no autenticado: sólo puede usar una liga vigente.
- Administrador autenticado: sólo puede consultar sesiones de su empresa.
- Consultor autenticado: sólo sesiones autorizadas por empresa y tipo de guía.
- Generador PDF en navegador: recibe únicamente contexto ya autorizado.

## Amenazas y controles

| Amenaza | Control | Prueba |
|---|---|---|
| Reutilizar liga después del vencimiento | Verificación backend en GET y POST | TDD-TC-001, TDD-TC-002 |
| Mantener una página abierta y enviar después del cierre | Revalidación en POST | TDD-TC-001 |
| Enumerar `session_id` de otra empresa | Filtro por `company_id` y 404 uniforme | TDD-TC-003 |
| Imprimir un día distinto por zona horaria | Parser date-only determinista | TDD-TC-004 |
| Presentar datos agregados como una campaña única | Semántica separada de reporte agregado | TDD-TC-005 |
| Exponer clave de Guía I | No incluir clave en `reportContext` ni PDF | Revisión de contrato y TDD-TC-003 |

## Riesgo no resuelto por este incremento

- No existe `closed_at` para probar un cierre manual anticipado.
- No se añade firma digital ni integridad criptográfica del PDF.
- No se ejecutan pruebas contra infraestructura productiva.
