# Constitución del proyecto

## Misión

Producir resultados y documentos NOM-035 trazables, confidenciales y fieles a los datos registrados, manteniendo bajo control humano toda declaración oficial y toda publicación.

## Principios

### PROJECT-PR-001 — Trazabilidad

Toda implementación debe ser trazable a un requisito confirmado.

### PROJECT-PR-002 — Veracidad documental

Un informe no debe afirmar que un levantamiento cerró cuando la fuente canónica sólo demuestra una fecha futura programada o un conjunto agregado de respuestas.

### PROJECT-PR-003 — Autoridad del backend

El backend y la base de datos son autoridad para vigencia, pertenencia de sesión y fechas persistidas; la interfaz no puede sustituir esas decisiones.

### PROJECT-PR-004 — Minimización y confidencialidad

Los documentos agregados no deben incorporar claves secretas, respuestas crudas ni identidad de trabajadores salvo requisito separado y autorizado.

### PROJECT-PR-005 — Aprobación humana

La persona responsable conserva la revisión, aceptación y firma del informe. Generar un PDF no constituye aprobación legal ni liberación a producción.

## Fuentes canónicas

| Fuente | Autoridad | Responsable |
|---|---|---|
| Modelos y persistencia backend | Estado y fechas de sesiones/respuestas | Responsable técnico del repositorio |
| PRD y ADR vigentes | Comportamiento y decisiones del producto | Product owner |
| Informe emitido y firmado | Aceptación del contenido específico | Responsable de la evaluación |
| NOM-035-STPS-2018 oficial | Obligaciones regulatorias | Autoridad competente; revisión humana requerida |

## Límites

- Incluye: generación de informes, control de acceso y trazabilidad de levantamientos NOM-035.
- Excluye: sustituir asesoría jurídica, dictamen de autoridad o aprobación del responsable humano.

## Seguridad y cambios

- Acciones sensibles: recibir respuestas, consultar resultados, generar informes y modificar reglas de vigencia.
- Aprobadores: product owner para comportamiento; responsable técnico para liberación; responsable de evaluación para firma/aceptación del informe.
- Control de cambios: usar `CHG-###`; los cambios R3 requieren BDD/TDD, regresión y evidencia antes de proponerse para producción.
