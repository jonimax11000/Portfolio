// Verificación de rendimiento (T15, R33): presupuesto de carga inicial <1s en 3G.
//
// Modelo de red 3G (Fast 3G, referencia Lighthouse): 1.6 Mbps de bajada,
// 150 ms de RTT. Con compresión gzip/brotli en el servidor (GitHub Pages
// sirve gzip/brotli para texto), estimamos el tiempo de la carga inicial:
//
//   T = RTT_handshake + N_peticiones_paralelas * RTT + bytes_críticos / velocidad
//
// La carga inicial crítica es: index.html + bundle JS + CSS + profile.json +
// projects.json + foto de perfil. Las imágenes de proyectos NO cuentan:
// llevan loading="lazy" y se cargan bajo demanda (R33).
//
// El script verifica además, sobre el código fuente, que se cumplen las
// técnicas exigidas por R33: lazy load, JSON al arranque, CSS/JS minimizados.
// Uso: node scripts/verify-performance.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

let passed = 0;
let failed = 0;
const check = (name, cond) => {
  if (cond) { passed++; console.log(`  ok  ${name}`); }
  else { failed++; console.log(`  FAIL ${name}`); }
};

// --- 1. Técnicas de R33 presentes en el código ---
console.log('\n[1] Técnicas R33 en el código fuente');

const cardSrc = readFileSync(join(root, 'src/views/components/project-card.js'), 'utf8');
check('tarjetas: loading="lazy" en imágenes', /loading="lazy"/.test(cardSrc));
check('tarjetas: decoding="async"', /decoding="async"/.test(cardSrc));
check('tarjetas: width/height reservados (sin CLS)', /width="480" height="300"/.test(cardSrc));

const headerSrc = readFileSync(join(root, 'src/views/components/app-header.js'), 'utf8');
check('cabecera: foto con fetchpriority="high" (LCP)', /fetchpriority="high"/.test(headerSrc));
check('cabecera: foto con dimensiones reservadas', /width="48" height="48"/.test(headerSrc));

const indexSrc = readFileSync(join(root, 'index.html'), 'utf8');
check('index.html: preload de los JSON del idioma activo', /rel = 'preload'/.test(indexSrc) && /as = 'fetch'/.test(indexSrc));
check('index.html: tema aplicado antes del primer paint (script inline)', /localStorage\.getItem\('portfolio:theme'\)/.test(indexSrc));

const mainSrc = readFileSync(join(root, 'src/main.js'), 'utf8');
check('main.js: datos cargados al arranque (await loadData)', /await loadData\(/.test(mainSrc));

const dataSrc = readFileSync(join(root, 'src/services/DataService.js'), 'utf8');
check('DataService: profile y projects en paralelo (Promise.all)', /Promise\.all/.test(dataSrc));

const i18nSrc = readFileSync(join(root, 'src/services/I18nService.js'), 'utf8');
check('i18n: literales bundlados, sin fetch extra', /import es from/.test(i18nSrc) && !/fetch\(/.test(i18nSrc));

const viteSrc = readFileSync(join(root, 'vite.config.js'), 'utf8');
check('build: minificación activada (esbuild)', /minify: 'esbuild'/.test(viteSrc));

// --- 2. Presupuesto de peso de la carga inicial ---
console.log('\n[2] Presupuesto de carga inicial (3G Fast: 1.6 Mbps, RTT 150 ms)');

const KBPS = (1.6 * 1000 * 1000) / 8 / 1000; // KB por segundo
const RTT_S = 0.15;

// Tamaño "en el cable": el texto viaja comprimido (gzip ≈ brotli a este nivel).
const gzipSize = (path) => gzipSync(readFileSync(join(root, path))).length;

// JS: suma de todo src/ (Vite lo empaqueta y minifica; el bundle minificado
// pesa menos que la suma en crudo, así que esto es una cota superior).
const walk = (dir, ext) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name), ext) : e.name.endsWith(ext) ? [join(dir, e.name)] : []
  );
const jsBytes = walk(join(root, 'src'), '.js').reduce((n, f) => n + gzipSync(readFileSync(f)).length, 0);
const cssBytes = walk(join(root, 'src'), '.css').reduce((n, f) => n + gzipSync(readFileSync(f)).length, 0);

const critical = [
  ['index.html', gzipSize('index.html')],
  ['JS bundle (cota superior: src/ completo gzip)', jsBytes],
  ['CSS (cota superior: src/ completo gzip)', cssBytes],
  ['data/profile.json', gzipSize('public/data/profile.json')],
  ['data/projects.json', gzipSize('public/data/projects.json')],
  ['assets/profile.jpg (binario: no comprime)', statSync(join(root, 'public/assets/profile.jpg')).size]
];

let totalBytes = 0;
for (const [label, bytes] of critical) {
  totalBytes += bytes;
  console.log(`  ${(bytes / 1024).toFixed(1).padStart(6)} KB  ${label}`);
}
const totalKB = totalBytes / 1024;
console.log(`  ------`);
console.log(`  ${totalKB.toFixed(1).padStart(6)} KB  TOTAL carga inicial`);

// Recursos diferidos (NO cuentan en la carga inicial, lazy): se listan para
// dejar constancia de que quedan fuera del presupuesto.
const lazyImages = readdirSync(join(root, 'public/assets'))
  .filter((f) => f.startsWith('project-'))
  .map((f) => [f, statSync(join(root, 'public/assets', f)).size]);
for (const [f, bytes] of lazyImages) {
  console.log(`  ${(bytes / 1024).toFixed(1).padStart(6)} KB  (lazy, fuera del presupuesto) ${f}`);
}

// Estimación de tiempo: 1 RTT de conexión + 2 rondas de peticiones paralelas
// (HTML → JS+CSS+JSON+foto en paralelo) + transferencia.
const transferS = totalKB / KBPS;
const estimatedS = RTT_S * 3 + transferS;
console.log(`\n  Estimación 3G: 3×RTT (${(RTT_S * 3).toFixed(2)}s) + transferencia (${transferS.toFixed(2)}s) ≈ ${estimatedS.toFixed(2)}s`);

// Presupuesto 3G Fast (1.6 Mbps): <1s exige < ~200 KB en el cable (RTT aparte).
check('carga inicial < 200 KB en el cable (presupuesto <1s en 3G)', totalKB < 200);
check('estimación de carga inicial < 1s en 3G', estimatedS < 1);

// --- 3. Optimización de assets ---
console.log('\n[3] Assets');
// Las imágenes de proyectos son las que más pesan; con lazy load su coste se
// difiere, pero se vigila que ninguna sea desproporcionada (>150 KB).
for (const [f, bytes] of lazyImages) {
  check(`${f} < 150 KB (lazy, pero razonable)`, bytes / 1024 < 150);
}
check('profile.jpg < 30 KB (crítica, LCP)', statSync(join(root, 'public/assets/profile.jpg')).size / 1024 < 30);

console.log(`\nResultado: ${passed} ok, ${failed} fallos`);
process.exit(failed ? 1 : 0);
