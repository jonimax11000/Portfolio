// Verificación del listado de proyectos (T8): paginación fija de 5 (R16),
// contador de resultados tras filtros sin destacados (R19), destacados = 3
// primeros del JSON sin paginación ni filtros y presentes también en el
// listado general (R20), badge con texto (R22), orden asc/desc por fecha en
// listado y destacados (R21), proyectos sin fecha siempre al final (R45) y
// orden mantenido al paginar (R46). Orden por defecto: fecha descendente (BR).
//
// Sin dependencias: ejerce el ProjectModel real y la vista/controlador reales
// con un stub mínimo de DOM. Uso: node scripts/verify-list.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { ProjectModel, PAGE_SIZE, FEATURED_COUNT } = await import(
  join(root, 'src/models/ProjectModel.js')
);
const { AppState } = await import(join(root, 'src/models/AppState.js'));

let passed = 0;
let failed = 0;
const check = (name, cond) => {
  if (cond) { passed++; console.log(`  ok  ${name}`); }
  else { failed++; console.log(`  FAIL ${name}`); }
};

// ---------------------------------------------------------------------------
// Datos de prueba: 12 proyectos con fechas variadas + 1 sin fecha.
// Los 3 primeros por orden del JSON son los destacados (R20).
// ---------------------------------------------------------------------------
const mk = (id, fecha, tecnologia = 'JavaScript') => ({
  id,
  nombre: `Proyecto ${id}`,
  descripcion: `Descripción ${id}`,
  tecnologia,
  imagen: `assets/${id}.jpg`,
  enlace: `https://github.com/ejemplo/${id}`,
  fecha
});

const PROJECTS = [
  mk('p01', '2024-01'),              // destacado 1 (el más antiguo)
  mk('p02', '2026-09', 'Kotlin'),    // destacado 2 (el más reciente)
  mk('p03', '2025-06'),              // destacado 3
  mk('p04', '2026-02'),
  mk('p05', '2025-11', 'Kotlin'),
  mk('p06', '2024-08'),
  mk('p07', '2026-05'),
  mk('p08', '2025-03'),
  mk('p09', '2024-12'),
  mk('p10', '2026-07'),
  mk('p11', '2025-09'),
  mk('p12', '2023-04'),
  mk('p13', null)                    // sin fecha → siempre al final (R45)
];

const model = new ProjectModel(PROJECTS);

// ---------------------------------------------------------------------------
console.log('\n[1] R16 — paginación fija de 5 proyectos');
{
  check('PAGE_SIZE es 5', PAGE_SIZE === 5);

  const p1 = model.query({ page: 1 });
  const p2 = model.query({ page: 2 });
  const p3 = model.query({ page: 3 });

  check('página 1 tiene 5 ítems', p1.items.length === 5);
  check('página 2 tiene 5 ítems', p2.items.length === 5);
  check('página 3 tiene el resto (3)', p3.items.length === 3);
  check('total = 13 (incluye destacados: también están en el listado, R20)', p1.total === 13);
  check('totalPages = ceil(13/5) = 3', p1.totalPages === 3);
  check('las páginas no se solapan ni pierden ítems',
    new Set([...p1.items, ...p2.items, ...p3.items].map((p) => p.id)).size === 13);

  const outOfRange = model.query({ page: 99 });
  check('página fuera de rango se acota a la última', outOfRange.page === 3);
  const zero = model.query({ page: 0 });
  check('página 0 se acota a la primera', zero.page === 1);
}

// ---------------------------------------------------------------------------
console.log('\n[2] R19 — contador del listado general tras filtros, sin destacados extra');
{
  // El contador es `total` de query(): proyectos tras filtros. Los destacados
  // no se suman aparte: ya forman parte del listado general (R20).
  const all = model.query({});
  check('sin filtros: contador = total de proyectos (13)', all.total === 13);

  const kotlin = model.query({ filters: { tecnologia: 'Kotlin' } });
  check('filtro tecnología=Kotlin: contador = 2 (p02, p05)', kotlin.total === 2);
  check('filtro tecnología: los destacados no se añaden al contador',
    kotlin.items.every((p) => p.tecnologia === 'Kotlin'));

  const y2026 = model.query({ filters: { anio: '2026' } });
  check('filtro año=2026: contador = 4 (p02, p04, p07, p10)', y2026.total === 4);

  const combo = model.query({ filters: { tecnologia: 'Kotlin', anio: '2025' } });
  check('filtros combinados Kotlin+2025: contador = 1 (p05)', combo.total === 1);

  const none = model.query({ filters: { tecnologia: 'NoExiste' } });
  check('filtro sin resultados: contador = 0', none.total === 0);
}

// ---------------------------------------------------------------------------
console.log('\n[3] R20 — destacados: 3 primeros del JSON, sin paginar ni filtrar');
{
  check('FEATURED_COUNT es 3', FEATURED_COUNT === 3);

  const featured = model.getFeatured();
  check('son los 3 primeros por orden del JSON',
    featured.map((p) => p.id).join() === 'p01,p02,p03');
  check('sin campo adicional en el JSON (no existe "destacado")',
    PROJECTS.every((p) => !('destacado' in p)));

  // No paginan: aunque hubiera más de 5, siempre son 3.
  check('no paginan: siempre 3 con independencia de PAGE_SIZE',
    featured.length === 3 && featured.length < PAGE_SIZE + 1);

  // No les afectan los filtros: getFeatured() no recibe filtros.
  check('getFeatured() no admite filtros (firma sin parámetros)',
    model.getFeatured.length === 0);

  // Aparecen también en el listado general.
  const allIds = [];
  for (let page = 1; page <= model.query({}).totalPages; page++) {
    allIds.push(...model.query({ page }).items.map((p) => p.id));
  }
  check('los 3 destacados aparecen también en el listado general',
    ['p01', 'p02', 'p03'].every((id) => allIds.includes(id)));

  const featuredIds = model.getFeaturedIds();
  check('getFeaturedIds() marca p01, p02 y p03 (para el badge R22)',
    featuredIds.has('p01') && featuredIds.has('p02') && featuredIds.has('p03') &&
    !featuredIds.has('p04'));
}

// ---------------------------------------------------------------------------
console.log('\n[4] R21 — orden asc/desc por fecha en listado y destacados');
{
  const desc = model.query({ order: 'desc' });
  const asc = model.query({ order: 'asc' });

  const datedDesc = desc.items.filter((p) => p.fecha).map((p) => p.fecha);
  check('listado desc: fechas no crecientes',
    datedDesc.every((f, i) => i === 0 || datedDesc[i - 1] >= f));

  const ascAll = [];
  for (let page = 1; page <= asc.totalPages; page++) {
    ascAll.push(...model.query({ order: 'asc', page }).items.map((p) => p.fecha));
  }
  const datedAsc = ascAll.filter(Boolean);
  check('listado asc: fechas no decrecientes a través de las páginas',
    datedAsc.every((f, i) => i === 0 || datedAsc[i - 1] <= f));

  const descAll = [];
  for (let page = 1; page <= desc.totalPages; page++) {
    descAll.push(...model.query({ order: 'desc', page }).items.map((p) => p.fecha));
  }
  check('desc y asc son inversos en los ítems con fecha',
    JSON.stringify(descAll.filter(Boolean)) === JSON.stringify([...datedAsc].reverse()));

  // Destacados ordenados por fecha con el mismo criterio (R21):
  const featDesc = model.sortByDate(model.getFeatured(), 'desc').map((p) => p.id);
  const featAsc = model.sortByDate(model.getFeatured(), 'asc').map((p) => p.id);
  check('destacados desc: p02 (2026-09) → p03 (2025-06) → p01 (2024-01)',
    featDesc.join() === 'p02,p03,p01');
  check('destacados asc: p01 → p03 → p02', featAsc.join() === 'p01,p03,p02');
}

// ---------------------------------------------------------------------------
console.log('\n[5] R45 — proyectos sin fecha siempre al final, en ambos órdenes');
{
  const lastOf = (order) => {
    const q = model.query({ order });
    const last = model.query({ order, page: q.totalPages });
    return last.items.at(-1);
  };
  check('orden desc: el último ítem global es el proyecto sin fecha',
    lastOf('desc')?.id === 'p13');
  check('orden asc: el último ítem global es el proyecto sin fecha',
    lastOf('asc')?.id === 'p13');

  const sorted = model.sortByDate(PROJECTS, 'asc');
  check('sortByDate asc: sin fecha al final', sorted.at(-1).id === 'p13');
  const sortedDesc = model.sortByDate(PROJECTS, 'desc');
  check('sortByDate desc: sin fecha al final', sortedDesc.at(-1).id === 'p13');

  // Varios sin fecha conservan su orden relativo del JSON (estable).
  const multi = new ProjectModel([mk('a', null), mk('b', '2025-01'), mk('c', null), mk('d', '2026-01')]);
  check('varios sin fecha: orden relativo conservado tras los fechados (asc)',
    multi.sortByDate(multi.projects, 'asc').map((p) => p.id).join() === 'b,d,a,c');
  check('varios sin fecha: orden relativo conservado tras los fechados (desc)',
    multi.sortByDate(multi.projects, 'desc').map((p) => p.id).join() === 'd,b,a,c');

  // Destacados sin fecha también van al final dentro de la sección (R45 + R21).
  const featModel = new ProjectModel([mk('f1', null), mk('f2', '2026-01'), mk('f3', '2025-01'), mk('f4', '2024-01')]);
  check('destacados con un sin fecha: asc → fechados asc, sin fecha el último',
    featModel.sortByDate(featModel.getFeatured(), 'asc').map((p) => p.id).join() === 'f3,f2,f1');
  check('destacados con un sin fecha: desc → fechados desc, sin fecha el último',
    featModel.sortByDate(featModel.getFeatured(), 'desc').map((p) => p.id).join() === 'f2,f3,f1');
}

// ---------------------------------------------------------------------------
console.log('\n[6] R46 — el criterio de orden se mantiene al paginar');
{
  // El orden vive en AppState y no lo toca la paginación: page-change solo
  // cambia `page`. Se verifica con el estado real + modelo real.
  const state = new AppState({ status: 'ready' });
  check('orden por defecto: fecha descendente (BR)', state.get().order === 'desc');

  state.set({ order: 'asc' });
  state.set({ page: 2 });
  const s = state.get();
  check('tras paginar, el orden sigue siendo asc', s.order === 'asc' && s.page === 2);

  // Y el modelo produce páginas coherentes con ese orden sostenido:
  const page2 = model.query({ order: s.order, page: s.page });
  const page1 = model.query({ order: s.order, page: 1 });
  check('página 2 asc continúa donde terminó la página 1 asc',
    page1.items.at(-1).fecha <= page2.items.find((p) => p.fecha)?.fecha);

  // Cambiar de orden vuelve a página 1 (coherente con R38) y persiste al paginar.
  state.set({ order: 'desc', page: 1 });
  state.set({ page: 3 });
  check('cambio a desc + paginar a 3: orden desc mantenido',
    state.get().order === 'desc' && state.get().page === 3);
}

// ---------------------------------------------------------------------------
console.log('\n[7] R22 — badge con texto "Destacado"/"Featured"');
{
  const es = JSON.parse(readFileSync(join(root, 'src/i18n/es.json'), 'utf8'));
  const en = JSON.parse(readFileSync(join(root, 'src/i18n/en.json'), 'utf8'));
  check('literal ES: "Destacado"', es.tarjeta.destacado === 'Destacado');
  check('literal EN: "Featured"', en.tarjeta.destacado === 'Featured');

  const cardSrc = readFileSync(join(root, 'src/views/components/project-card.js'), 'utf8');
  check('la tarjeta renderiza el badge con texto (no solo color)',
    /featured\s*\?\s*`<span class="badge">\$\{t\('tarjeta\.destacado'\)\}<\/span>`/.test(cardSrc));

  const viewSrc = readFileSync(join(root, 'src/views/PortfolioView.js'), 'utf8');
  check('la vista pasa featured a las tarjetas del listado general (badge también allí)',
    /featured:\s*featuredIds\.has\(project\.id\)/.test(viewSrc));
}

// ---------------------------------------------------------------------------
console.log('\n[8] Integración vista-controlador: contador, orden y paginación en el DOM');
{
  // Stub mínimo de DOM suficiente para PortfolioView + ProjectsController.
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v))
  };

  const listeners = {};
  const makeEl = () => {
    const el = {
      innerHTML: '',
      children: [],
      addEventListener: (type, fn) => { (listeners[type] ??= []).push(fn); },
      querySelector: () => null,
      querySelectorAll: () => []
    };
    return el;
  };
  const section = makeEl();
  globalThis.document = {
    createElement: () => makeEl(),
    body: { appendChild: () => {} },
    documentElement: { setAttribute: () => {} },
    addEventListener: () => {}
  };
  globalThis.window = {
    matchMedia: () => ({ matches: true, addEventListener: () => {} }),
    addEventListener: () => {}
  };
  globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);

  const { ProjectsController } = await import(join(root, 'src/controllers/ProjectsController.js'));
  const state = new AppState({ status: 'ready' });
  const controller = new ProjectsController(state, section, null);
  controller.start();

  // Simula el cambio del select de orden (R21) vía evento change delegado.
  const fireChange = (target) => listeners.change?.forEach((fn) => fn({ target }));
  fireChange({ dataset: {}, hasAttribute: (a) => a === 'data-order', value: 'asc' });
  check('select de orden → estado order=asc y página 1',
    state.get().order === 'asc' && state.get().page === 1);

  fireChange({ dataset: {}, hasAttribute: (a) => a === 'data-order', value: 'desc' });
  check('select de orden → estado order=desc', state.get().order === 'desc');

  // Simula paginación (R46): el evento page-change no toca el orden.
  const firePage = (page) => listeners['page-change']?.forEach((fn) => fn({ detail: { page } }));
  firePage(2);
  check('page-change → página 2, orden desc mantenido (R46)',
    state.get().page === 2 && state.get().order === 'desc');

  // Filtros: resetean a página 1 (R38) y el contador se calcula tras ellos (R19).
  fireChange({ dataset: { filter: 'tecnologia' }, hasAttribute: () => false, value: 'Kotlin' });
  check('filtro tecnología → página 1 (R38), filtro activo',
    state.get().page === 1 && state.get().filters.tecnologia === 'Kotlin');
  const filtered = model.query({ filters: state.get().filters, order: state.get().order, page: 1 });
  check('contador tras filtro Kotlin = 2 (R19)', filtered.total === 2);

  controller.clearFilters();
  check('limpiar filtros (R44) → sin filtros, página 1',
    state.get().filters.tecnologia === null && state.get().page === 1);

  // Literales del contador (R19) y de la paginación.
  const es = JSON.parse(readFileSync(join(root, 'src/i18n/es.json'), 'utf8'));
  const en = JSON.parse(readFileSync(join(root, 'src/i18n/en.json'), 'utf8'));
  check('contador ES plural/singular existen',
    es.portfolio.contador.includes('{n}') && es.portfolio.contadorSingular.includes('{n}'));
  check('contador EN plural/singular existen',
    en.portfolio.contador.includes('{n}') && en.portfolio.contadorSingular.includes('{n}'));
  check('literales de orden ES/EN existen',
    Boolean(es.portfolio.ordenDesc && es.portfolio.ordenAsc && en.portfolio.ordenDesc && en.portfolio.ordenAsc));
}

// ---------------------------------------------------------------------------
console.log('\n[9] JSON reales: destacados y orden con los datos del lab');
{
  const real = JSON.parse(readFileSync(join(root, 'public/data/projects.json'), 'utf8')).proyectos;
  const m = new ProjectModel(real);
  check('destacados = 3 primeros del JSON real',
    m.getFeatured().map((p) => p.id).join() === real.slice(0, 3).map((p) => p.id).join());
  const desc = m.query({ order: 'desc' });
  check('listado real desc: más reciente primero (gestor-tareas 2026-05)',
    desc.items[0].id === 'gestor-tareas');
  const asc = m.query({ order: 'asc' });
  check('listado real asc: más antiguo primero (recetas 2025-06)',
    asc.items[0].id === 'recetas');
  check('con 4 proyectos hay 1 sola página (paginación oculta pero lista para >5)',
    desc.totalPages === 1 && desc.items.length === 4);

  // R21 en destacados con datos reales: gestor-tareas (2026-05) → api-reservas
  // (2026-03) → tienda-discos (2026-01) en desc; inverso en asc.
  const fDesc = m.sortByDate(m.getFeatured(), 'desc').map((p) => p.id);
  const fAsc = m.sortByDate(m.getFeatured(), 'asc').map((p) => p.id);
  check('destacados reales desc: gestor-tareas → api-reservas → tienda-discos',
    fDesc.join() === 'gestor-tareas,api-reservas,tienda-discos');
  check('destacados reales asc: tienda-discos → api-reservas → gestor-tareas',
    fAsc.join() === 'tienda-discos,api-reservas,gestor-tareas');
}

// ---------------------------------------------------------------------------
console.log('\n[10] Cableado de main.js: destacados ordenados con el criterio activo (R21)');
{
  const mainSrc = readFileSync(join(root, 'src/main.js'), 'utf8');
  check('main.js ordena los destacados con sortByDate y el orden del estado',
    /featured:\s*projectModel\.sortByDate\(projectModel\.getFeatured\(\),\s*s\.order\)/.test(mainSrc));
  check('main.js pasa el orden activo al listado general',
    /projectModel\.query\(\{\s*filters:\s*s\.filters,\s*order:\s*s\.order,\s*page:\s*s\.page\s*\}\)/.test(mainSrc));

  const viewSrc = readFileSync(join(root, 'src/views/PortfolioView.js'), 'utf8');
  check('la vista renderiza la sección de destacados antes que el listado',
    viewSrc.indexOf('#renderFeatured(vm, t)') < viewSrc.indexOf('#renderList(vm, t)'));
  check('el contador usa list.total (tras filtros, sin sumar destacados)',
    /t\(counterKey,\s*\{\s*n:\s*list\.total\s*\}\)/.test(viewSrc));
  check('el contador se anuncia con aria-live (R32)',
    /class="results-counter"[^>]*aria-live="polite"/.test(viewSrc));
  check('la paginación se monta con la página y total del modelo',
    /pagination\.props\s*=\s*\{\s*page:\s*vm\.list\.page,\s*totalPages:\s*vm\.list\.totalPages/.test(viewSrc));
}

console.log(`\nResultado: ${passed} ok, ${failed} fallos`);
process.exit(failed ? 1 : 0);
