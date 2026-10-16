# QA-T11 — Verificación de temas claro/oscuro + alto contraste

**Fecha:** 2026-10-16
**QA:** Lambda Oakridge
**Alcance:** `/workspace/portfolio-lab/` — R30, R31, R39 + AC de accesibilidad (contraste) + checks de la tarea (botones con estado, transición suave).
**Método:** revisión estática del código fuente (tokens.css, base.css, components.css, app-header.js, AppController.js, StorageService.js, index.html) + cálculo manual de ratios de contraste con la fórmula WCAG 2.1 (luminancia relativa) sobre los tokens reales. No se pudo ejecutar `node scripts/verify-contrast.mjs` (bash requiere aprobación y la sesión es headless); se verificó en su lugar que el script es **réplica exacta** de tokens.css (valor a valor, incluidos los fallbacks `--hc-ink`).

---

## Result

**PASS**

## Checks

### R30 — Modo claro/oscuro

Expected: Existe modo claro/oscuro conmutables.
Actual: `tokens.css` define la paleta clara en `:root` y la oscura en `:root[data-theme='dark']` (bg, ink, surface, borders, btn, accent, bad…). `AppController.toggleTheme()` alterna `light`/`dark`, persiste y aplica `data-theme` en `<html>`. Botón `data-action="toggle-theme"` en la cabecera con etiqueta dinámica ("Modo oscuro"/"Modo claro").
Result: **PASS**

### R31 — Alto contraste como modificador independiente (4 combinaciones)

Expected: HC es un modificador independiente del tema: claro, oscuro, claro+HC, oscuro+HC.
Actual: `:root[data-hc='true']` redefine ink/ink-2/muted/borders/accent sin tocar bg → claro+HC. `:root[data-theme='dark'][data-hc='true']` redefine `--hc-ink: #ffffff` y ajusta muted/borders/accent/bad → oscuro+HC. `AppController.toggleHc()` es independiente de `toggleTheme()` (estado `hc` separado de `theme` en AppState). Las 4 combinaciones son alcanzables y distintas.
Result: **PASS**

### R39 — Persistencia en localStorage

Expected: Tema y HC persisten en localStorage; al recargar se mantienen.
Actual: `StorageService` con claves `portfolio:theme` y `portfolio:hc` (prefijo según Anexo B). `toggleTheme()`/`toggleHc()` escriben en cada cambio. `AppController.init()` lee ambas al arranque, valida valores ('dark'/'light', 'true'/'false') y aplica los atributos. Además, `index.html` incluye un script inline síncrono que aplica los atributos persistidos **antes del primer paint** (evita flash de tema claro) y tolera localStorage no disponible (try/catch). Al recargar, ambos se mantienen.
Result: **PASS**

### Contraste WCAG 2.1 AA en las 4 combinaciones

Expected: ≥4.5:1 texto normal, ≥3:1 texto grande (y ≥3:1 para el outline de foco, WCAG 1.4.11) en las 4 combinaciones.
Actual: ratios calculados con la fórmula oficial sobre los tokens reales (12 pares texto/fondo usados por la UI):

| Par (uso) | Claro | Oscuro | Claro+HC | Oscuro+HC | Mín | Result |
|---|---|---|---|---|---|---|
| ink/bg (texto principal) | 18.36 | 18.10 | 21.00 | 18.36 | 4.5 | PASS |
| ink-2/bg (lead, titular, desc.) | 11.65 | 12.64 | 21.00 | 18.36 | 4.5 | PASS |
| muted/bg (meta, contador, estados) | 8.59 | 7.25 | 16.10 | 15.18 | 4.5 | PASS |
| bad/bg (mensaje de error) | 7.26 | **5.85** | 7.26 | 9.42 | 4.5 | PASS |
| accent/bg (enlace aria-current footer) | 5.93 | 6.79 | 8.59 | 10.27 | 4.5 | PASS |
| ink/bg (claim, h1, h2 — texto grande) | 18.36 | 18.10 | 21.00 | 18.36 | 3.0 | PASS |
| ink/surface (btn-secondary, nav-btn, chips) | 17.16 | 13.53 | 19.66 | 16.55 | 4.5 | PASS |
| ink/surface-2 (hover) | 16.09 | 10.94 | 18.42 | 13.40 | 4.5 | PASS |
| muted/surface (badge destacado) | 8.06 | 6.11 | 15.10 | 13.69 | 4.5 | PASS |
| btn-ink/btn (btn-primary) | 18.10 | 18.10 | 18.10 | 18.10 | 4.5 | PASS |
| ink/accent-soft (guarda marco tarjeta) | 15.89 | 12.04 | 14.47 | 13.00 | 4.5 | PASS |
| accent/bg (outline de foco, no-texto) | 5.93 | 6.79 | 8.59 | 10.27 | 3.0 | PASS |

Mínimo global: 5.85:1 (mensaje de error en oscuro) — por encima de 4.5:1. Todos los pares cumplen en las 4 combinaciones.
Result: **PASS**

### Botones de tema y HC en la cabecera con estado (aria-pressed)

Expected: Los botones de tema y HC están en la cabecera y muestran su estado con `aria-pressed`.
Actual: En `app-header.js`, dentro de `.header-actions` (cabecera): botón `data-action="toggle-theme"` con `aria-pressed="${theme === 'dark'}"` y botón `data-action="toggle-hc"` con `aria-pressed="${hc}"`. El header se re-renderiza en cada `state.set()` (suscripción en main.js → `header.props`), por lo que `aria-pressed` refleja el estado tras cada toggle. Etiquetas traducidas ES/EN.
Result: **PASS**

### Transición de colores suave

Expected: El cambio de tema/HC no es brusco; los colores transicionan suavemente.
Actual: `body { transition: background-color var(--dur-color) var(--ease), color var(--dur-color) var(--ease) }` con `--dur-color: 150ms` y easing `cubic-bezier(0.2,0.8,0.2,1)` (DESIGN §5). Botones (`background-color`, `border-color`), tarjetas (`border-color`) e identidad de cabecera (`opacity`, 200ms) también transicionan. Con `prefers-reduced-motion` las transiciones se anulan (R34), lo cual es el comportamiento correcto y no un fallo.
Result: **PASS**

## Issues

Ninguno. No se han encontrado incumplimientos de la SPEC.

**Observaciones (no bloqueantes):**
1. No se pudo ejecutar `node scripts/verify-contrast.mjs` ni una prueba de recarga en navegador real: la sesión es headless y bash requiere aprobación de usuario. La verificación de contraste se hizo calculando los ratios manualmente con la fórmula WCAG sobre los tokens reales, tras confirmar que el script es réplica exacta de `tokens.css`. La persistencia (R39) se verificó por inspección de las tres rutas de código implicadas (escritura en toggle, restauración en `init()`, aplicación pre-paint en `index.html`). Se recomienda una pasada manual en navegador como confirmación visual final.
2. El botón de tema muestra la etiqueta del estado **destino** ("Modo oscuro" cuando está en claro) mientras que `aria-pressed` refleja el estado **actual**. Es un patrón habitual y no contradice la SPEC, pero conviene mantenerlo coherente si se revisa en el futuro.

## Recommendations

1. Ejecutar `node scripts/verify-contrast.mjs` en CI local o pre-build para detectar regresiones si cambian los tokens (el propio script avisa de que hay que mantenerlo sincronizado).
2. Hacer una verificación manual rápida en navegador (toggle tema/HC → recargar → comprobar que se mantienen y que no hay flash) como cierre visual del AC.
3. Considerar `aria-label` dinámico o texto de estado visible ("Activado"/"Desactivado") en el botón de HC si futuras revisiones de accesibilidad lo piden; hoy `aria-pressed` + etiqueta fija cumple.
