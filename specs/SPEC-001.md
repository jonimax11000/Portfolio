# SPEC-001 — Portfolio personal de desarrollador

|          |              |
| -------- | ------------ |
| Estado   | **Aprobado** |
| Versión  | v1.2         |
| Fecha    | 2026-10-16   |

**Cambios v1.1 → v1.2:** cerradas las 13 OQ restantes (OQ6, 7, 9, 10, 11, 12, 15, 19, 20, 21, 22, 23, 25) según propuestas aprobadas; añadidos R42–R48 y sus AC; accesibilidad formalizada como WCAG 2.1 AA con checks verificables; stack fijado (Vanilla + Vite, Web Components nativos). **No quedan Open Questions abiertas: el desarrollador puede arrancar.**

**Cambios v1.0 → v1.1:** resueltos conflictos C1–C6; cerradas OQ1–5, 8, 13, 14, 16, 17, 18, 24; nuevo modelo i18n con `*.en.json`; definidos destacados (3 primeros del JSON), expansión (contenido completo truncado con puntos suspensivos), navegación SPA (cabecera + footer), colapso por scroll, degradación por campos, temas persistentes, normalización de filtros y reset de paginación al filtrar.

## 1. Context

Arema Software recibe cada curso CVs y enlaces a GitHub de alumnos de prácticas. Un repositorio sin contexto no permite valorar bien: no se sabe qué hacía el proyecto, con qué se hizo ni si llegó a usarlo alguien.

Marta Ibáñez (Arema Software) pide una página web por alumno que funcione como portfolio, se abra bien desde el móvil y muestre quién es el alumno, sus proyectos y cómo contactarle. De cada proyecto quiere ver la imagen, el nombre, de qué va, con qué está hecho y el enlace al repositorio.

No hay backend ni validación de correo corporativo: el contacto se resuelve con `mailto:` estándar. Limitación conocida y aceptada: cualquier correo (corporativo o no) puede contactar igualmente.

Este spec es el vehículo para practicar SDD. El producto importa, pero el objetivo principal es el proceso: agentes + specs + desarrollo + QA + cambios.

## 2. Goal

Una página web que sirva de portfolio personal de un alumno, responsive, multiidioma (ES/EN), accesible conforme a WCAG 2.1 AA, con filtros, paginación y una forma de contactarle, pensada para que una empresa de prácticas valore al alumno desde el móvil.

## 3. Users

- **Empresas que buscan contratar alumnos de prácticas.** Usuario primario. Revisan el portfolio desde móvil o escritorio, filtran proyectos y contactan.
- **Alumno autor.** Mantiene `profile.json`, `projects.json` (en español) y los assets a mano. No toca código.
- **Agente desarrollador.** Implementa a partir de este spec. Crea y mantiene los JSON en inglés. Propone la estructura de carpetas (Anexo B) antes de empezar.
- **Agente QA.** Verifica los Acceptance Criteria. Tiene su propio spec.
- **Agente PM.** Gestiona alcance y cambios. Tiene su propio spec.

El visitante es un usuario no autenticado y solo lectura.

## 4. Scope

### In scope

- Aplicación web responsive, mobile-first, funcional en pantallas muy pequeñas, con **vistas SPA** (Portfolio, Sobre mí, Ahora).
- Navegación mediante botones destacados en la cabecera y enlaces en el footer.
- Multiidioma ES/EN con botón en la cabecera: literales de UI en ficheros i18n; contenidos en JSON ES con versiones EN (`*.en.json`) creadas por el desarrollador. Idioma persistente en localStorage.
- Cabecera sticky que colapsa al hacer scroll.
- Cabecera con foto, nombre, titular, claim, ubicación, disponibilidad, stack, correo, GitHub y LinkedIn.
- Listado dinámico de proyectos desde `projects.json`.
- Tarjetas de proyecto con imagen, nombre, descripción, tecnología, fecha y enlace; contenido truncado con puntos suspensivos en estado colapsado (todas miden igual); al expandir se muestra el contenido completo.
- Placeholder cuando no hay imagen o falla.
- Expansión de tarjetas una a la vez, con animación y bloqueo durante la transición + 300 ms.
- "No disponible" cuando un proyecto no tiene enlace.
- Paginación de 5 proyectos (fija).
- Filtros por tecnología y año, combinables, insensibles a mayúsculas y tildes; colapsables en móvil.
- Contador de resultados del listado general.
- Sección de destacados: los 3 primeros proyectos del JSON, sin paginación, no afectada por filtros; los destacados aparecen también en el listado general.
- Orden ascendente y descendente por fecha, en listado y destacados; proyectos sin fecha siempre al final.
- Contacto vía `mailto:` estándar con asunto predefinido traducido.
- Modo claro/oscuro y modo alto contraste como modificador independiente (4 combinaciones), persistentes en localStorage.
- Accesibilidad WCAG 2.1 AA.
- Carga inicial <1s en 3G: lazy load de imágenes; JSON de datos al arranque.
- Degradación elegante: los elementos sin dato se ocultan; el contenido se muestra igualmente.
- Stack: Vanilla JS + Vite. Web Components nativos para las tarjetas. Arquitectura MVC. SOLID.
- Datos en `data/profile.json` y `data/projects.json` (+ versiones `.en.json`).
- Diseño según `design/DESIGN.md`. Assets en `assets/`.
- Estado vacío global y estado vacío por filtros, con mensajes distintos; el de filtros incluye botón "Limpiar filtros".

### Out of scope

Guardarraíles obligatorios: el agente **no debe** hacer nada de esto.

- No cambiar requisitos ni inventar funcionalidades.
- No modificar decisiones de producto ni ignorar criterios de aceptación.
- No añadir backend, validación de correo corporativo, buscador de texto, edición online, CMS, autenticación, demo en vivo, analítica, CI, SemVer/CHANGELOG, persistencia de filtros en URL, scroll infinito.
- No añadir SEO ni metadatos sociales (Open Graph, etc.).
- No restringir navegador ni sistema operativo (baseline asumido: navegadores evergreen con soporte de Web Components nativos).
- No añadir librerías de componentes: Web Components nativos únicamente.
- No cambiar el esquema de los JSON una vez aprobado en este spec (Anexo A).

## 5. Requirements

- **R1.** La cabecera muestra foto, nombre, titular, claim, ubicación, disponibilidad, stack, correo, GitHub y LinkedIn.
- **R2.** La cabecera incluye un botón de cambio de idioma ES/EN.
- **R3.** La cabecera incluye un botón de contacto.
- **R4.** La cabecera es sticky y colapsa al hacer scroll hacia abajo (umbral: al llegar al primer proyecto); se expande al volver arriba del todo.
- **R5.** Al colapsar, la cabecera solo muestra imagen, nombre y botón de contacto.
- **R6.** La vista "Sobre mí" muestra `presentacion` y `sobreMi[]`.
- **R7.** La vista "Ahora" muestra `ahora[]`.
- **R8.** La web carga `projects.json` y renderiza una tarjeta por proyecto.
- **R9.** Cada tarjeta muestra imagen, nombre, descripción, tecnología, fecha y enlace.
- **R10.** Si falta la imagen o falla, se muestra un placeholder.
- **R11.** En estado colapsado, el contenido que no cabe se trunca con puntos suspensivos (todas las tarjetas miden igual). Al pulsar una tarjeta se expande mostrando el contenido completo; al volver a pulsarla, se colapsa.
- **R12.** Solo puede haber una tarjeta expandida a la vez.
- **R13.** Durante la transición de expansión/colapso y 300 ms después, toda activación de tarjetas (click, teclado, lector de pantalla) queda bloqueada.
- **R14.** Si un proyecto no tiene enlace, se muestra "No disponible".
- **R15.** El enlace del proyecto abre en nueva pestaña con `rel="noopener noreferrer"`.
- **R16.** Hay paginación de 5 proyectos (fija).
- **R17.** Hay filtros por tecnología y año.
- **R18.** Los filtros son combinables entre sí.
- **R19.** Hay un contador de resultados del listado general (tras filtros; no incluye destacados). Formato según `design/DESIGN.md`.
- **R20.** Sección de destacados: los 3 primeros proyectos de `projects.json` por orden del JSON (sin campo adicional). No pagina y no se ve afectada por los filtros. Los destacados aparecen también en el listado general.
- **R21.** Listado general y destacados se ordenan por fecha, con opción ascendente y descendente.
- **R22.** El badge de destacado lleva texto: "Destacado" (ES) / "Featured" (EN).
- **R23.** El botón de contacto abre el cliente de correo con `mailto:` estándar.
- **R24.** Los datos de perfil y proyectos se cargan dinámicamente desde JSON, sin hardcodear en el código. Los literales de UI viven en ficheros i18n.
- **R25.** La web es responsive de 320px a 1920px sin scroll horizontal.
- **R26.** La información es solo lectura; no hay formularios de edición.
- **R27.** Si `profile.json` o `projects.json` (o sus versiones EN) fallan, se muestra un estado de error controlado.
- **R28.** Si no hay proyectos, se muestra un mensaje de estado vacío global.
- **R29.** Si los filtros no devuelven resultados, se muestra un mensaje de estado vacío por filtros, distinto al global.
- **R30.** Hay modo claro/oscuro.
- **R31.** Hay modo alto contraste como modificador independiente (4 combinaciones: claro, oscuro, claro+HC, oscuro+HC).
- **R32.** La web cumple WCAG 2.1 AA (ver AC de accesibilidad).
- **R33.** La carga inicial es <1s en 3G (AC formal): lazy load de imágenes; los JSON de datos se cargan al arranque.
- **R34.** Se respeta `prefers-reduced-motion`: si está activo, no se animan las tarjetas.
- **R35.** La navegación entre vistas (Portfolio / Sobre mí / Ahora) se realiza con botones destacados en la cabecera y enlaces en el footer. Con la cabecera colapsada, la navegación queda disponible en el footer.
- **R36.** Degradación por campos: si falta un dato opcional (`github`, `linkedin`, `tecnologia`, `fecha`, categorías de `stack`, `sobreMi`, `ahora`…), el elemento o sección correspondiente se oculta y el contenido se muestra igualmente. Imagen y enlace degradan según R10/R14.
- **R37.** El filtrado es insensible a mayúsculas y tildes.
- **R38.** Al aplicar o cambiar filtros, la paginación vuelve a la página 1.
- **R39.** Claro/oscuro y alto contraste persisten en localStorage.
- **R40.** Multiidioma: los literales de UI viven en ficheros i18n ES/EN; los contenidos se cargan de `data/profile.json` y `data/projects.json` (ES) o de `data/profile.en.json` y `data/projects.en.json` (EN), creados por el desarrollador a partir de los originales en español.
- **R41.** La fecha se muestra como "Mes AAAA" (ES: "Septiembre 2026"; EN: "September 2026") a partir de `YYYY-MM`. El JSON no se toca.
- **R42.** En móvil, los filtros se muestran colapsables.
- **R43.** Al cambiar de idioma se mantienen los filtros activos y la tarjeta expandida.
- **R44.** El estado vacío por filtros incluye un botón "Limpiar filtros" que restaura el listado completo (página 1).
- **R45.** Los proyectos sin fecha se muestran siempre al final, tanto en orden ascendente como descendente.
- **R46.** El criterio de orden seleccionado se mantiene al paginar.
- **R47.** El idioma seleccionado persiste en localStorage.
- **R48.** El `mailto:` incluye asunto predefinido traducido según el idioma activo, sin cuerpo. Los textos del asunto viven en los ficheros i18n (por defecto: ES "Contacto desde el portfolio" / EN "Contact from the portfolio").

## 6. Business Rules

- No se permite a los lectores modificar información.
- Cuando se pulsa un proyecto, la tarjeta se expande mostrando el contenido completo.
- El enlace del repositorio abre en otra pestaña.
- Si no hay imagen, sale un placeholder.
- El botón de contacto abre la app o web de correo del usuario mediante `mailto:` estándar. No se puede forzar desde HTML cuál de las dos; lo decide el sistema.
- No hay validación de correo corporativo: cualquier correo puede contactar vía `mailto:`. Limitación conocida y aceptada.
- Los datos se cargan de JSON, de manera dinámica.
- Los JSON en español los mantiene el alumno y son inmutables para el desarrollador. Las versiones en inglés (`*.en.json`) las crea y mantiene el desarrollador: **toda actualización de un JSON en español implica actualizar su versión en inglés**.
- `tecnologia` es un único string por proyecto (no un array).
- La fecha se muestra como "Mes AAAA" (R41).
- No hay campo `tipo` en los proyectos ni campo `destacado`: los destacados son los 3 primeros por orden del JSON.
- Los filtros son Must y combinables, insensibles a mayúsculas y tildes.
- Los filtros no se aplican a la sección de destacados.
- Al aplicar o cambiar filtros, la paginación vuelve a la página 1.
- El orden por defecto es fecha descendente y se mantiene al paginar.
- Los proyectos sin fecha van siempre al final, en ambos órdenes.
- El idioma por defecto es español (no se detecta el idioma del navegador) y persiste en localStorage.
- Se traducen todos los contenidos: `claim`, `presentacion`, `sobreMi`, `ahora`, y nombre, descripción y tecnología de los proyectos (vía `*.en.json`). Los literales de UI se traducen vía ficheros i18n.
- Al cambiar de idioma se mantienen filtros y tarjeta expandida.
- El botón de contacto está solo en la cabecera.
- La cabecera colapsa por scroll (R4); al colapsar solo quedan imagen, nombre y botón de contacto.
- Stack fijado: Vanilla JS + Vite, Web Components nativos, MVC, SOLID.
- Antes de empezar, el desarrollador propone la estructura de carpetas exacta y se anexa a este spec (Anexo B). Es la única decisión de implementación pendiente y no bloquea el arranque del resto del trabajo.
- Los guardarraíles de Out of scope son obligatorios.

## 7. User Flow

1. La empresa entra a la web (español por defecto, o el idioma persistido).
2. Ve la cabecera con información personal, botones de navegación, botón de idioma y botón de contacto.
3. Ve la sección de destacados (3 primeros proyectos del JSON).
4. Ve el listado general paginado de 5 en 5, orden descendente por fecha.
5. Aplica filtros por tecnología y/o año → la paginación vuelve a la página 1 y el contador se actualiza. Los destacados no cambian.
6. Pulsa una tarjeta: se expande con animación mostrando el contenido completo.
7. Vuelve a pulsarla (o pulsa otra): se colapsa.
8. Pulsa el enlace del repositorio: se abre en nueva pestaña. Si no hay enlace: ve "No disponible".
9. Cambia el idioma: toda la UI y los contenidos se muestran en el otro idioma; filtros y tarjeta expandida se mantienen.
10. Cambia el orden: ascendente o descendente por fecha (afecta a listado y destacados; se mantiene al paginar).
11. Pulsa el botón de contacto: se abre el cliente de correo con `mailto:` y asunto predefinido en el idioma activo.
12. Navega a "Sobre mí" y "Ahora" con los botones de la cabecera o los enlaces del footer.
13. Al hacer scroll, la cabecera colapsa (imagen, nombre, contacto); la navegación sigue disponible en el footer.

**Flujos alternativos:** error de JSON → estado de error controlado; sin proyectos → estado vacío global; filtros sin resultados → estado vacío por filtros con botón "Limpiar filtros"; `prefers-reduced-motion` → sin animaciones; campos faltantes → elementos ocultos (R36).

## 8. Acceptance Criteria

**Proyectos y tarjetas**

- [ ] Los proyectos tienen imagen, nombre, descripción, tecnología, fecha y enlace.
- [ ] Si no hay imagen, aparece un placeholder. Si no hay enlace, aparece "No disponible".
- [ ] El enlace del repositorio se abre en nueva pestaña con `rel="noopener noreferrer"`.
- [ ] Las tarjetas truncan el contenido con puntos suspensivos y todas miden igual en estado colapsado; al expandir se ve el contenido completo.
- [ ] Al pulsar una tarjeta se expande; al volver a pulsarla se colapsa. Solo hay una expandida a la vez.
- [ ] Durante la transición y 300 ms después, toda activación queda bloqueada.

**Listado, filtros y paginación**

- [ ] Hay paginación de 5 proyectos. Al filtrar, vuelve a la página 1.
- [ ] Hay filtros por tecnología y año, combinables e insensibles a mayúsculas y tildes; en móvil son colapsables.
- [ ] Hay contador de resultados del listado general.
- [ ] Los destacados son los 3 primeros del JSON, sin paginación, sin filtros, con badge de texto ("Destacado"/"Featured"), y aparecen también en el listado general.
- [ ] Hay orden ascendente y descendente por fecha en listado y destacados; el orden por defecto es descendente y se mantiene al paginar.
- [ ] Los proyectos sin fecha aparecen al final en ambos órdenes.
- [ ] La fecha se muestra como "Septiembre 2026" / "September 2026".

**Cabecera, navegación y contacto**

- [ ] La cabecera muestra todos los elementos de R1; es sticky; colapsa por scroll y al colapsar solo quedan imagen, nombre y contacto.
- [ ] Hay navegación por botones en cabecera y enlaces en footer; con cabecera colapsada, la navegación funciona desde el footer.
- [ ] Las vistas "Sobre mí" y "Ahora" muestran sus contenidos.
- [ ] El botón de contacto abre el cliente de correo con `mailto:` y asunto predefinido en el idioma activo.

**Idioma y temas**

- [ ] Hay cambio de idioma ES/EN: la UI se traduce (ficheros i18n) y los contenidos se cargan de los JSON del idioma activo.
- [ ] El idioma persiste en localStorage; al cambiar de idioma se mantienen filtros y tarjeta expandida.
- [ ] Hay modo claro/oscuro y alto contraste como modificador (4 combinaciones), persistentes en localStorage.

**Accesibilidad (WCAG 2.1 AA — checks verificables)**

- [ ] Contraste mínimo 4.5:1 (texto normal) y 3:1 (texto grande) en las 4 combinaciones de tema.
- [ ] Toda funcionalidad operable por teclado: navegación, filtros, paginación, tarjetas y orden.
- [ ] Foco visible en todo elemento interactivo.
- [ ] Imágenes con `alt` (incluido el placeholder).
- [ ] Estructura semántica con landmarks (`header`, `nav`, `main`, `footer`).
- [ ] Tarjetas expandibles con `aria-expanded` y cambio de estado anunciado al lector de pantalla.
- [ ] Ninguna información se transmite solo por color (badge con texto, estados con mensaje).
- [ ] Zoom 200% sin pérdida de contenido ni scroll horizontal.
- [ ] Atributo `lang` del documento actualizado al cambiar de idioma.
- [ ] Se respeta `prefers-reduced-motion`.

**Estados y robustez**

- [ ] Estados: vacío global, vacío por filtros (mensaje distinto + botón "Limpiar filtros") y error controlado de JSON.
- [ ] Si falta un dato opcional, su elemento se oculta y el contenido se muestra igualmente.
- [ ] No hay scroll horizontal de 320px a 1920px.
- [ ] La carga inicial es <1s en 3G (lazy load de imágenes; JSON al arranque).

**Técnicos**

- [ ] La información es solo lectura; los datos se cargan desde JSON sin hardcodeos.
- [ ] Stack: Vanilla JS + Vite. Tarjetas como Web Components nativos. Arquitectura MVC. Se sigue SOLID.

## 9. Edge Cases

Todos los edge cases de v1.0 tienen comportamiento definido:

- Click rápido/doble o durante transición → bloqueo (R13).
- Imagen ausente/rota → placeholder (R10). Sin enlace → "No disponible" (R14).
- Proyecto sin `tecnologia`/`fecha`, `github`/`linkedin` ausentes, `sobreMi`/`ahora` vacíos, `stack` con categorías vacías → elemento/sección oculto (R36).
- Filtro (combinado) sin resultados → estado vacío por filtros + "Limpiar filtros" (R29, R44).
- Filtro + paginación fuera de rango → reset a página 1 (R38).
- Filtro con mayúsculas o tildes → normalizado (R37).
- Proyectos sin fecha en orden asc/desc y paginación → siempre al final (R45).
- Cambio de idioma con tarjeta expandida o filtros activos → se mantienen (R43).
- Email no corporativo → limitación aceptada. `correo` con formato raro → se muestra tal cual (solo lectura).
- `projects.json` vacío → R28; malformado → R27.
- Muchos proyectos (>50), zoom 200%, viewport 320px, lector de pantalla, navegación por teclado → R16, R25, R32.
- Cabecera colapsada con tarjeta expandida o contacto abierto → estados independientes, sin interacción entre ellos.

## 10. Open Questions

**No quedan OQ abiertas.** Tabla de resoluciones (trazabilidad):

| OQ  | Resolución                                                                                  |
| --- | ------------------------------------------------------------------------------------------- |
| 1–3, 5 | Destacados: 3 primeros del JSON por orden, sin campo adicional, sin paginación, orden por fecha (R20, R21) |
| 4   | Badge con texto "Destacado"/"Featured" (R22)                                                 |
| 6   | Filtros colapsables en móvil (R42)                                                           |
| 7   | Filtros y tarjeta expandida se mantienen al cambiar de idioma (R43)                          |
| 8   | Los filtros se mantienen al paginar (implícito en R16–R18)                                   |
| 9   | Estado vacío por filtros con botón "Limpiar filtros" (R44)                                   |
| 10  | Proyectos sin fecha siempre al final (R45)                                                   |
| 11  | El orden se mantiene al paginar (R46)                                                        |
| 12  | Idioma en localStorage (R47)                                                                 |
| 13  | Siempre español por defecto (BR)                                                             |
| 14  | Paginación de 5 fija (R16)                                                                   |
| 15  | `mailto:` con asunto predefinido traducido, sin cuerpo (R48)                                 |
| 16  | Correo visible en cabecera (R1)                                                              |
| 17  | Al colapsar: solo imagen, nombre y contacto (R5)                                             |
| 18  | <1s en 3G es AC formal (R33)                                                                 |
| 19  | Lazy load de imágenes; JSON al arranque (R33)                                                |
| 20  | Vanilla JS + Vite (Scope/BR)                                                                 |
| 21  | Web Components nativos (Scope/BR)                                                            |
| 22  | El dev propone la estructura y se anexa (Anexo B, BR)                                        |
| 23  | WCAG 2.1 AA formal con checks (R32, AC)                                                      |
| 24  | Temas son AC formales (R30, R31, R39)                                                        |
| 25  | Resuelta: todo está cerrado; el dev arranca directamente                                     |

**Preguntas de revisión v1.0 (Q1–Q12):** resueltas en v1.1 — i18n con `*.en.json` (R40), expansión = contenido completo (R11), vistas SPA con nav en cabecera+footer (R35), reset a página 1 (R38), fecha "Mes AAAA" (R41), degradación por campos (R36), temas como modificador persistente (R31, R39), colapso por scroll (R4), datos de proyecto traducidos (R40), filtrado normalizado (R37).

## 11. Assumptions

- El visitante es un reclutador de una empresa.
- El alumno mantiene los JSON en español y los assets a mano; son inmutables para el desarrollador.
- El desarrollador crea y mantiene los JSON en inglés a partir de los originales.
- `tecnologia` es un único string por proyecto. No hay campo `tipo` ni campo `destacado`.
- No hay backend ni validación de correo corporativo.
- Hosting: GitHub Pages. Deploy manual.
- Baseline de navegadores: evergreen (Web Components nativos).
- El diseño está en `design/DESIGN.md`. Las imágenes están en `assets/`.
- El objetivo principal es el proceso SDD, no solo el portfolio.
- QA y PM tienen sus propios specs; este es el spec del proyecto.
- Los guardarraíles de Out of scope son obligatorios.

## 12. Dependencies

**Artefactos:** `data/profile.json`, `data/projects.json`, `design/DESIGN.md`, `assets/`.

**Restricciones técnicas:** Vanilla JS + Vite, Web Components nativos, arquitectura MVC, SOLID.

## Anexo A — Esquema de datos (borrador: validar contra los JSON reales antes de implementar)

- `profile.json`: `foto`, `nombre`, `titular`, `claim`, `ubicacion`, `disponibilidad`, `stack` (categorías con arrays), `correo`, `github`, `linkedin`, `presentacion`, `sobreMi[]`, `ahora[]`.
- `projects.json`: array de `{ imagen, nombre, descripcion, tecnologia (string), fecha ("YYYY-MM"), enlace }`.
- Obligatoriedad: todos los campos pueden faltar; el comportamiento es degradación (R10, R14, R36). JSON malformado → R27.
- Versiones EN: `profile.en.json`, `projects.en.json`, misma estructura.

## Anexo B — Estructura de carpetas

**Propuesta del desarrollador (Camila Kingsley) · 2026-10-16 · Pendiente de validación por PM.**

Stack: Vanilla JS (ES Modules) + Vite · Web Components nativos · MVC · SOLID.

### B.1 Árbol completo

```
portfolio-lab/
├── index.html                  # Punto de entrada Vite. Shell: <app-header>, <main> (vistas), <app-footer>. Landmarks y skip-link.
├── package.json                # Única dependencia de desarrollo: vite.
├── vite.config.js              # base: './' (rutas relativas para GitHub Pages, ver DEPLOY.md).
├── .gitignore                  # Ya existe (node_modules/, dist/, …).
│
├── public/                     # Vite copia tal cual a dist/. Rutas relativas desde el código.
│   ├── data/                   # JSON de datos (fuera de src/: el alumno los edita sin tocar código).
│   │   ├── profile.json        # ES — mantenido por el alumno (inmutable para dev).
│   │   ├── profile.en.json     # EN — creado y mantenido por el dev (BR).
│   │   ├── projects.json       # ES — alumno.
│   │   └── projects.en.json    # EN — dev.
│   └── assets/                 # Imágenes del alumno: profile.jpg, project-*.jpg…
│
├── src/
│   ├── main.js                 # Bootstrap: instancia servicios, modelo, controladores y vistas; arranca el router.
│   │
│   ├── models/                 # M de MVC. Estado + lógica de dominio pura (sin DOM, sin fetch).
│   │   ├── AppState.js         # Estado global: idioma, tema (claro/oscuro/HC), vista activa, filtros, página, orden, tarjeta expandida. Observable (suscripción de vistas).
│   │   ├── ProjectModel.js     # Filtrado (R17–R19, R37), ordenación con sin-fecha al final (R21, R45), paginación de 5 (R16, R38, R46), destacados = 3 primeros del JSON (R20).
│   │   └── formatters.js       # Funciones puras: fecha "YYYY-MM" → "Mes AAAA" ES/EN (R41), normalización sin tildes ni mayúsculas (R37).
│   │
│   ├── services/               # Infraestructura. Interfaces pequeñas (SOLID: I/D). Sin estado de dominio.
│   │   ├── DataService.js      # fetch de los 4 JSON según idioma activo; errores controlados (R27). Carga al arranque (R33).
│   │   ├── I18nService.js      # Literales de UI desde i18n/{es,en}.json; idioma activo; atributo <html lang>.
│   │   ├── StorageService.js   # localStorage: idioma (R47), tema claro/oscuro y HC (R39). Claves con prefijo `portfolio:`.
│   │   └── RouterService.js    # Vistas SPA Portfolio / Sobre mí / Ahora (R35): hash routing (#/, #/sobre-mi, #/ahora) sin recarga.
│   │
│   ├── controllers/            # C de MVC. Conectan eventos de vista → modelo/servicios. Sin renderizado directo.
│   │   ├── AppController.js    # Orquestación global: cambio de idioma (R43), tema, navegación, contacto mailto con asunto i18n (R48).
│   │   ├── HeaderController.js # Colapso de cabecera por scroll con umbral en el primer proyecto (R4, R5).
│   │   └── ProjectsController.js # Expansión exclusiva con bloqueo transición+300ms (R11–R13), filtros, paginación, orden, limpiar filtros (R44).
│   │
│   ├── views/                  # V de MVC. Renderizan desde el modelo; no contienen lógica de dominio.
│   │   ├── components/         # Web Components nativos (custom elements, shadow DOM donde aplique).
│   │   │   ├── project-card.js # <project-card>: tarjeta expandible (único Web Component exigido por spec). aria-expanded, placeholder (R10), "No disponible" (R14), badge "Destacado"/"Featured" (R22).
│   │   │   ├── app-header.js   # <app-header>: cabecera sticky colapsable (R1–R5), botones de nav, idioma, temas y contacto.
│   │   │   ├── app-footer.js   # <app-footer>: enlaces de navegación (R35).
│   │   │   └── pagination-controls.js # <pagination-controls>: paginación accesible por teclado.
│   │   ├── PortfolioView.js    # Destacados + filtros (colapsables en móvil, R42) + contador (R19) + listado paginado + orden + estados vacío/error (R27–R29, R44).
│   │   ├── AboutView.js        # "Sobre mí": presentacion + sobreMi[] (R6).
│   │   └── NowView.js          # "Ahora": ahora[] (R7).
│   │
│   ├── styles/
│   │   ├── tokens.css          # Custom properties: paleta, tipografía, espaciado, radios y acento configurable según DESIGN-001; variantes dark y HC como modificadores independientes (R30, R31).
│   │   ├── base.css            # Reset suave, landmarks, foco visible 2px acento (DESIGN §6), skip-link, reduced-motion (R34).
│   │   └── components.css      # Estilos de las partes no encapsuladas en shadow DOM.
│   │
│   └── i18n/
│       ├── es.json             # Literales de UI ES (incluye asunto mailto, R48).
│       └── en.json             # Literales de UI EN.
│
├── data/  assets/  design/  specs/  agents/   # Artefactos del lab ya existentes (fuentes).
│   # NOTA: data/ y assets/ de la raíz son las fuentes mantenidas por el alumno.
│   # public/data y public/assets son las copias servidas por la app (ver B.3).
│
├── README.md  DEPLOY.md  requirements.md  tasks.md   # Documentación del lab (existente).
└── dist/                     # Build de Vite (gitignored). Se publica en GitHub Pages.
```

### B.2 Decisiones y su justificación

1. **MVC por capas en `src/`** (`models/`, `views/`, `controllers/`, `services/`): separación exigida por la spec. Los modelos son JS puro sin DOM ni fetch → testeables y SOLID (S). Las vistas solo renderizan; los controladores solo traducen eventos.
2. **Web Components solo donde aportan**: `project-card` es el exigido por la spec; `app-header`, `app-footer` y `pagination-controls` se añaden por cohesión (encapsulan markup + comportamiento propio). Las vistas (`PortfolioView`, …) son clases que componen elementos, no custom elements: evita sobre-ingeniería.
3. **`data/` y `assets/` en `public/`**: Vite los sirve y copia a `dist/` sin procesar, con rutas relativas estables — requisito de GitHub Pages (DEPLOY.md: rutas relativas, `index.html` en raíz del deploy). El alumno edita JSON/imágenes sin entrar en `src/`.
4. **Duplicado controlado raíz ↔ `public/`**: la raíz conserva `data/` y `assets/` como fuentes del lab (ya existen y son referenciadas por la spec). Antes de cada build se sincronizan a `public/` (script `prebuild` en `package.json`: `node scripts/sync-assets.mjs`, copia plana). Una sola fuente de verdad (raíz), cero edición manual doble.
5. **i18n en `src/i18n/` (no en `public/`)**: son literales de UI del desarrollador, no contenido del alumno; Vite los bundla (`import es from './i18n/es.json'`) y así no requieren fetch extra — ayuda al AC de <1s en 3G (R33). Los JSON de **contenido** sí van por fetch en `public/data/` porque cambian con el idioma activo (R40).
6. **`AppState` como único store observable**: idioma, tema, filtros, página, orden, tarjeta expandida y vista activa en un solo objeto con suscriptores. Cumple R43 (mantener filtros/tarjeta al cambiar idioma) sin lógica repartida.
7. **Sin framework, sin librerías de componentes, sin dependencias runtime**: solo `vite` como devDependency. Respeta Out of scope y el AC de carga.
8. **Temas por atributo**: `<html data-theme="light|dark" data-hc="true|false">` + custom properties en `tokens.css` → las 4 combinaciones (R31) sin duplicar hojas de estilo. Persistencia vía `StorageService` (R39).
9. **Nombres de fichero**: componentes en kebab-case (coinciden con su tag), el resto en PascalCase (clases) o camelCase (utilidades), convención habitual en Vanilla JS.

### B.3 Scripts de `package.json` (previstos)

- `dev` → `vite` (sirve `public/` tal cual).
- `prebuild` → sincroniza `data/` y `assets/` de la raíz a `public/`.
- `build` → `vite build` (genera `dist/` con `base: './'`).
- `preview` → `vite preview` (verifica el build antes de publicar).

### B.4 Qué NO incluye (guardarraíles)

Sin backend, sin framework CSS/JS, sin tests E2E framework, sin CI, sin TypeScript, sin router de terceros, sin librería de componentes. Todo lo excluido en "Out of scope" se mantiene excluido aquí.
