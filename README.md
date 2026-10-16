# portfolio-lab

Punto de partida de la formación **Construir productos con IA** (2 días).

El proyecto vehículo es un **portfolio personal de desarrollador**. El objetivo no es el
portfolio: es el proceso — agentes + specs + desarrollo + QA + cambios.

## Qué hay aquí

| Archivo / carpeta | Qué es |
|---|---|
| `requirements.md` | El encargo de la empresa. Es lo único que sabes del producto. |
| `data/projects.json` | Los proyectos del perfil de ejemplo. |
| `data/profile.json` | Los datos personales del perfil de ejemplo: quién es, foto, contacto. |
| `data/profile.en.json` / `data/projects.en.json` | Versiones en inglés. Las crea y mantiene el desarrollador traduciendo las ES. |
| `assets/` | Las imágenes de los proyectos y la foto del perfil (`profile.jpg`). |
| `design/DESIGN-001.md` | Sistema de diseño. **Ya está hecho y no se toca.** |
| `specs/SPEC-001.md` | Vacía. La rellenas tú en el LAB 1. |
| `tasks.md` | Vacía. La rellenas tú en el LAB 1. |
| `agents/pm.md` | PM Agent, ya montado. Lo usas en el LAB 2. |
| `agents/dev.md` | DEV Agent, ya montado. Lo usas en el LAB 3. |
| `agents/qa.md` | QA Agent, ya montado. Lo usas en el LAB 4. |
| `DEPLOY.md` | Cómo publicar tu portfolio en una URL. Al final del día 2. |

**El producto va en la raíz del repositorio**: `index.html` y lo que necesite a su lado. No lo
metas en una subcarpeta — así las rutas a `data/` y `assets/` funcionan tal cual, y publicarlo
después es cuestión de dos clics.

## Cómo se trabaja

No editas este repo mientras trabajas: **trabajas dentro de Teros.ai**. Este repo es el punto de
partida y el sitio donde queda el resultado.

1. Te descargas el repo al empezar el día 1.
2. En cada lab, pegas en Teros.ai el contenido del archivo que toque.
3. Trabajas allí: spec, agentes, implementación.
4. Al cerrar el lab, vuelcas el resultado al archivo correspondiente de este repo.

Un único volcado al cerrar cada lab. No subas nada a mitad: el ida y vuelta cuesta más tiempo del
que ahorra.

## Versiones de la spec

Guarda **todas** las versiones de la spec, no solo la última:

```
specs/
├── SPEC-001-v0.md    ← LAB 1 · tu primera spec, antes del PM Agent
├── SPEC-001-v1.md    ← LAB 2 · después de que el PM Agent la revise
└── SPEC-001-v2.md    ← Día 2 · después del change request
```

El repo con las tres versiones es el **entregable final**.

## Reglas de oro

- El agente propone; el humano decide.
- La SPEC es la referencia del desarrollo.
- Si falta una decisión importante, se pregunta.
- DEV no inventa requisitos.
- QA no redefine el producto.
- Cuando cambia el requisito, se actualiza primero la SPEC.

## Datos e idiomas (SPEC-001, Anexo A)

- Los JSON en español (`data/profile.json`, `data/projects.json`) los mantiene el alumno y son
  **inmutables para el desarrollador**.
- Las versiones en inglés (`data/profile.en.json`, `data/projects.en.json`) las crea y mantiene el
  desarrollador: **toda actualización de un JSON en español implica actualizar su versión en inglés**
  (misma estructura, mismos `id` y `fecha`; se traducen `claim`, `presentacion`, `sobreMi`, `ahora`
  y `nombre`, `descripcion` y `tecnologia` de los proyectos).
- `public/data/` y `public/assets/` se generan con `npm run prebuild` (script
  `scripts/sync-assets.mjs`): la raíz es la única fuente de verdad, no se edita nada en `public/`.
- `node scripts/verify-data-layer.mjs` valida los 4 JSON contra el Anexo A y el comportamiento de
  la capa de carga (errores controlados y degradación por campos).
- `node scripts/verify-i18n.mjs` valida el sistema i18n: paridad de literales ES/EN, idioma por
  defecto ES, persistencia en localStorage (R47), mantenimiento de filtros y tarjeta al cambiar
  idioma (R43), atributo `<html lang>` y traducción de contenidos (R40).
- `npm run verify` ejecuta todas las verificaciones (`scripts/verify-all.mjs`).
