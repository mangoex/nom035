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

## Criterios transversales

- PRD-NFR-001: una fecha `2026-08-30` debe permanecer 30 de agosto de 2026 en cualquier zona horaria del navegador.
- PRD-NFR-002: ninguna salida del contexto temporal contiene `clave_secreta` en el PDF.
- PRD-FR-005: el contenido actual del informe continúa generándose.
