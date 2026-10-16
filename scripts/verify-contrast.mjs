/**
 * verify-contrast.mjs — calcula ratios de contraste WCAG para las 4
 * combinaciones de tema (claro, oscuro, claro+HC, oscuro+HC).
 * Réplica exacta de src/styles/tokens.css: si cambian los tokens, actualizar aquí.
 * Uso: node scripts/verify-contrast.mjs
 */

const themes = {
  'claro': {
    bg: '#ffffff', ink: '#0a0a0a', 'ink-2': '#404040', muted: '#525252',
    surface: '#f5f5f5', 'surface-2': '#ededed', border: '#e5e5e5',
    'border-strong': '#d4d4d4', btn: '#171717', 'btn-ink': '#fafafa',
    accent: '#6d28d9', 'accent-soft': '#ede9fe',
    ok: '#047857', warn: '#a16207', bad: '#b91c1c'
  },
  'oscuro': {
    bg: '#0a0a0a', ink: '#fafafa', 'ink-2': '#d4d4d4', muted: '#a3a3a3',
    surface: '#1a1a1a', 'surface-2': '#262626', border: '#2e2e2e',
    'border-strong': '#404040', btn: '#fafafa', 'btn-ink': '#171717',
    accent: '#a78bfa', 'accent-soft': '#2e1a5e',
    ok: '#047857', warn: '#a16207', bad: '#f87171'
  },
  'claro+HC': {
    bg: '#ffffff', ink: '#000000', 'ink-2': '#000000', muted: '#1f1f1f',
    surface: '#f5f5f5', 'surface-2': '#ededed', border: '#525252',
    'border-strong': '#404040', btn: '#171717', 'btn-ink': '#fafafa',
    accent: '#3b0a8f', 'accent-soft': '#ddd0fb',
    ok: '#047857', warn: '#a16207', bad: '#b91c1c'
  },
  'oscuro+HC': {
    bg: '#0a0a0a', ink: '#ffffff', 'ink-2': '#ffffff', muted: '#e5e5e5',
    surface: '#1a1a1a', 'surface-2': '#262626', border: '#a3a3a3',
    'border-strong': '#d4d4d4', btn: '#fafafa', 'btn-ink': '#171717',
    accent: '#c4b5fd', 'accent-soft': '#3b2373',
    ok: '#047857', warn: '#a16207', bad: '#fca5a5'
  }
};

// Pares texto/fondo que usa la UI (components.css + DESIGN-001).
// min: 4.5 texto normal · 3.0 texto grande (>=24px o >=18.66px bold) ·
// 3.0 componentes de UI no textuales (WCAG 1.4.11: outline de foco).
const pairs = [
  ['ink', 'bg', 4.5, 'texto principal'],
  ['ink-2', 'bg', 4.5, 'lead / titular / descripción tarjeta'],
  ['muted', 'bg', 4.5, 'meta cabecera, contador, paginación, estados'],
  ['bad', 'bg', 4.5, 'mensaje de error'],
  ['accent', 'bg', 4.5, 'enlace aria-current del footer'],
  ['ink', 'bg', 3.0, 'claim / h1 / h2 (texto grande)'],
  ['ink', 'surface', 4.5, 'btn-secondary, nav-btn, chips'],
  ['ink', 'surface-2', 4.5, 'hover btn-secondary / nav-btn'],
  ['muted', 'surface', 4.5, 'badge de destacado'],
  ['btn-ink', 'btn', 4.5, 'btn-primary'],
  ['ink', 'accent-soft', 4.5, 'texto sobre marco de tarjeta (guarda)'],
  ['accent', 'bg', 3.0, 'outline de foco (1.4.11, no-texto)']
];

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(fg, bg) {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

let failures = 0;
for (const [name, theme] of Object.entries(themes)) {
  console.log(`\n=== ${name} ===`);
  for (const [fg, bg, min, label] of pairs) {
    const r = ratio(theme[fg], theme[bg]);
    const ok = r >= min;
    if (!ok) failures++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'} ${label}: ${fg} (${theme[fg]}) sobre ${bg} (${theme[bg]}): ${r.toFixed(2)}:1 (mín ${min}:1)`);
  }
}

console.log(failures === 0 ? '\n✔ Todas las combinaciones cumplen WCAG 2.1 AA.' : `\n✘ ${failures} pares por debajo del mínimo.`);
process.exit(failures === 0 ? 0 : 1);
