// Verificación del sistema i18n (T4): paridad de diccionarios ES/EN, idioma
// por defecto ES sin detección de navegador, persistencia en localStorage,
// mantenimiento de filtros y tarjeta expandida al cambiar idioma (R43),
// atributo <html lang> actualizado, y traducción de TODOS los contenidos
// (claim, presentacion, sobreMi, ahora, nombre/descripcion/tecnologia) (R40).
// Uso: node scripts/verify-i18n.mjs
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- Stubs de entorno navegador (mínimos, antes de importar los módulos) ---
const storageMap = new Map();
globalThis.localStorage = {
  getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
  setItem: (k, v) => storageMap.set(k, String(v)),
  removeItem: (k) => storageMap.delete(k),
  clear: () => storageMap.clear()
};
const htmlAttrs = { lang: 'es' };
globalThis.document = {
  documentElement: {
    setAttribute: (name, value) => { htmlAttrs[name] = value; },
    getAttribute: (name) => htmlAttrs[name] ?? null
  },
  addEventListener: () => {}
};
globalThis.window = { scrollTo: () => {} };
// navigator.languages existe pero NO debe consultarse (idioma por defecto ES, BR)
globalThis.navigator = { languages: ['en-US', 'en'] };

// I18nService importa los diccionarios con `import es from '../i18n/es.json'`,
// sintaxis que Vite resuelve pero Node no (sin import attributes). Para poder
// verificar el servicio real en Node, se carga el módulo sustituyendo las
// líneas de import JSON por constantes con el contenido ya parseado.
const esDict = JSON.parse(readFileSync(join(root, 'src/i18n/es.json'), 'utf8'));
const enDict = JSON.parse(readFileSync(join(root, 'src/i18n/en.json'), 'utf8'));

function importWithJson(modulePath, jsonEntries) {
  const lines = readFileSync(modulePath, 'utf8').split('\n');
  const rewritten = lines.map((line) => {
    for (const { name, path, value } of jsonEntries) {
      const isJsonImport =
        line.trimStart().startsWith('import ') &&
        line.includes(path) &&
        line.includes(name);
      if (isJsonImport) return 'const ' + name + ' = ' + JSON.stringify(value) + ';';
    }
    return line;
  });
  const tmp = join(root, 'node_modules', '.tmp-verify-i18n.mjs');
  mkdirSync(dirname(tmp), { recursive: true });
  writeFileSync(tmp, rewritten.join('\n'));
  return import(tmp);
}

const { I18nService, DEFAULT_LANG, SUPPORTED_LANGS } = await importWithJson(
  join(root, 'src/services/I18nService.js'),
  [
    { name: 'es', path: '../i18n/es.json', value: esDict },
    { name: 'en', path: '../i18n/en.json', value: enDict }
  ]
);
const { AppController } = await import(join(root, 'src/controllers/AppController.js'));
const { StorageService, KEYS } = await import(join(root, 'src/services/StorageService.js'));
const { AppState } = await import(join(root, 'src/models/AppState.js'));
const { formatMonthYear } = await import(join(root, 'src/models/formatters.js'));

let passed = 0;
let failed = 0;
const check = (name, cond) => {
  if (cond) { passed++; console.log('  ok  ' + name); }
  else { failed++; console.log('  FAIL ' + name); }
};

// --- 1. Diccionarios de literales de UI (R40) ---
console.log('\n[1] Diccionarios i18n ES/EN');
const es = esDict;
const en = enDict;

const flatKeys = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flatKeys(v, prefix + k + '.') : [prefix + k]
  );
const lookup = (obj, key) => key.split('.').reduce((o, p) => o?.[p], obj);
const esKeys = flatKeys(es);
const enKeys = flatKeys(en);
check('ES y EN tienen las mismas claves', esKeys.join() === enKeys.join());
check('ES tiene claves de UI (>30)', esKeys.length > 30);
check('ningún literal ES está vacío', esKeys.every((k) => String(lookup(es, k)).trim().length > 0));
check('ningún literal EN está vacío', enKeys.every((k) => String(lookup(en, k)).trim().length > 0));
// Placeholders {n}, {nombre}… deben coincidir entre idiomas
const placeholders = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
check(
  'placeholders idénticos en ES y EN',
  esKeys.every((k) => placeholders(lookup(es, k)) === placeholders(lookup(en, k)))
);
// Asunto mailto traducido (R48)
check('asunto mailto ES (R48)', es.contacto.asunto === 'Contacto desde el portfolio');
check('asunto mailto EN (R48)', en.contacto.asunto === 'Contact from the portfolio');
// Badge de destacado (R22)
check('badge ES "Destacado" (R22)', es.tarjeta.destacado === 'Destacado');
check('badge EN "Featured" (R22)', en.tarjeta.destacado === 'Featured');

// --- 2. I18nService: idioma por defecto, lang, t(), fallback ---
console.log('\n[2] I18nService');
check('idioma por defecto ES (BR, sin detección de navegador)', DEFAULT_LANG === 'es');
check('idiomas soportados: es, en', SUPPORTED_LANGS.join() === 'es,en');

const i18n = new I18nService();
check('arranca en ES aunque navigator.languages sea EN', i18n.lang === 'es');
check('t() devuelve literal ES', i18n.t('nav.sobreMi') === 'Sobre mí');
check('t() interpola parámetros', i18n.t('portfolio.contador', { n: 5 }) === '5 proyectos');
check('t() singular', i18n.t('portfolio.contadorSingular', { n: 1 }) === '1 proyecto');

i18n.setLang('en');
check('setLang(en) cambia idioma activo', i18n.lang === 'en');
check('t() devuelve literal EN', i18n.t('nav.sobreMi') === 'About me');
check('<html lang> actualizado a en (AC accesibilidad)', htmlAttrs.lang === 'en');

i18n.setLang('es');
check('<html lang> actualizado a es', htmlAttrs.lang === 'es');

i18n.setLang('fr'); // no soportado
check('setLang con idioma no soportado se ignora', i18n.lang === 'es');
check('t() con clave inexistente devuelve la clave (fallback)', i18n.t('no.existe') === 'no.existe');

// --- 3. Persistencia en localStorage (R47) ---
console.log('\n[3] Persistencia (R47)');
const storage = new StorageService();
storage.set(KEYS.lang, 'en');
check('StorageService guarda idioma', storage.get(KEYS.lang) === 'en');
check('clave con prefijo portfolio:', KEYS.lang === 'portfolio:lang');

// --- 4. AppController: cambio de idioma manteniendo filtros y tarjeta (R43) ---
console.log('\n[4] AppController.toggleLang (R43, R47)');
const state = new AppState();
let reloadedWith = null;
const controller = new AppController({
  state,
  i18n,
  storage,
  router: { navigate: () => {} },
  data: { profile: { correo: 'alex@ejemplo.dev' }, projects: [] },
  onDataReload: async (lang) => { reloadedWith = lang; } // recarga real verificada en [5]
});

// Estado previo: filtros activos, página 2, tarjeta expandida
state.setFilters({ tecnologia: 'Kotlin', anio: '2026' });
state.set({ page: 2, expandedProjectId: 'gestor-tareas' });
const before = state.get();

await controller.toggleLang();
const after = state.get();
check('idioma cambiado a en', after.lang === 'en');
check('filtros mantenidos (R43)', after.filters.tecnologia === 'Kotlin' && after.filters.anio === '2026');
check('tarjeta expandida mantenida (R43)', after.expandedProjectId === 'gestor-tareas');
check('página mantenida (R43)', after.page === before.page);
check('idioma persistido en localStorage (R47)', storage.get(KEYS.lang) === 'en');
check('i18n sincronizado', i18n.lang === 'en');
check('datos recargados con el nuevo idioma (R40)', reloadedWith === 'en');

await controller.toggleLang();
check('segundo toggle vuelve a es', state.get().lang === 'es');
check('persistencia actualizada a es', storage.get(KEYS.lang) === 'es');
check('datos recargados de nuevo (es)', reloadedWith === 'es');

// --- 5. Contenidos traducidos en los JSON de datos (R40) ---
console.log('\n[5] Contenidos ES ↔ EN (R40)');
const profileEs = JSON.parse(readFileSync(join(root, 'public/data/profile.json'), 'utf8')).perfil;
const profileEn = JSON.parse(readFileSync(join(root, 'public/data/profile.en.json'), 'utf8')).perfil;
const projectsEs = JSON.parse(readFileSync(join(root, 'public/data/projects.json'), 'utf8')).proyectos;
const projectsEn = JSON.parse(readFileSync(join(root, 'public/data/projects.en.json'), 'utf8')).proyectos;

// Campos de perfil que deben estar traducidos (distintos entre ES y EN)
for (const field of ['claim', 'presentacion', 'titular', 'disponibilidad']) {
  check('perfil.' + field + ' traducido (ES ≠ EN)', profileEs[field] !== profileEn[field]);
}
check('perfil.sobreMi traducido', profileEs.sobreMi.join('|') !== profileEn.sobreMi.join('|'));
check('perfil.ahora traducido', profileEs.ahora.join('|') !== profileEn.ahora.join('|'));
check('sobreMi: misma longitud ES/EN', profileEs.sobreMi.length === profileEn.sobreMi.length);
check('ahora: misma longitud ES/EN', profileEs.ahora.length === profileEn.ahora.length);
// Campos que NO deben cambiar (identidad, enlaces)
for (const field of ['nombre', 'correo', 'github', 'linkedin', 'foto', 'ubicacion']) {
  check('perfil.' + field + ' idéntico ES/EN', profileEs[field] === profileEn[field]);
}
// Categorías del stack traducidas, valores (nombres de tecnologías) intactos
check('categorías stack traducidas', Object.keys(profileEs.stack).join() !== Object.keys(profileEn.stack).join());
check(
  'valores del stack intactos (tecnologías no se traducen)',
  JSON.stringify(Object.values(profileEs.stack)) === JSON.stringify(Object.values(profileEn.stack))
);

// Proyectos: mismo id/fecha/imagen/enlace; nombre y descripcion traducidos
check('mismo número de proyectos ES/EN', projectsEs.length === projectsEn.length);
for (let i = 0; i < projectsEs.length; i++) {
  const a = projectsEs[i];
  const b = projectsEn[i];
  check('proyecto "' + a.id + '": nombre traducido', a.nombre !== b.nombre);
  check('proyecto "' + a.id + '": descripcion traducida', a.descripcion !== b.descripcion);
  check('proyecto "' + a.id + '": id/fecha/imagen/enlace intactos',
    a.id === b.id && a.fecha === b.fecha && a.imagen === b.imagen && a.enlace === b.enlace);
}
// tecnologia: nombres propios (Kotlin, Java…) — se admite igualdad; lo exigible
// es que el campo exista en ambos idiomas y sea string (R40 + Anexo A).
check('tecnologia presente como string en ES y EN',
  projectsEs.every((p, i) => typeof p.tecnologia === 'string' && typeof projectsEn[i].tecnologia === 'string'));

// --- 6. Formato de fecha por idioma (R41) ---
console.log('\n[6] Fecha "Mes AAAA" por idioma (R41)');
check('ES: "Septiembre 2026"', formatMonthYear('2026-09', 'es') === 'Septiembre 2026');
check('EN: "September 2026"', formatMonthYear('2026-09', 'en') === 'September 2026');
check('idioma desconocido → fallback ES', formatMonthYear('2026-09', 'fr') === 'Septiembre 2026');

console.log('\nResultado: ' + passed + ' ok, ' + failed + ' fallos');
process.exit(failed ? 1 : 0);
