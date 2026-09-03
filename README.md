# NOM035

Plataforma web para administrar evaluaciones, resultados y documentación de apoyo para la NOM-035-STPS-2018.

## Gobierno

- Framework: Humanio CEO Engineering Framework 1.1.0.
- Perfil: software.
- Riesgo: R3 por datos laborales sensibles e impacto regulatorio de los informes.
- Autoridad: `docs/01-constitution.md` → ADR vigentes → PRD → SDD → BDD/TDD → plan → código.

## Incremento activo

`CHG-001`: incorporar al PDF el periodo y cierre verificable del levantamiento y hacer efectiva la vigencia pública de las sesiones.

## Documentación

Leer `AGENTS.md`, `docs/00-contexto-producto.md` y `docs/09-registro-cambios.md` antes de modificar comportamiento.

## Ejecución técnica

- Backend: FastAPI y SQLAlchemy bajo `backend/`.
- Frontend: React/Vite bajo `frontend/`.
- Las instrucciones técnicas existentes del frontend permanecen en `frontend/README.md`.
