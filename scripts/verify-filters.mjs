// Verificación de los filtros por tecnología y año (T9): filtros por
// tecnología y año (R17), combinables (R18), insensibles a mayúsculas y
// tildes (R37), reset de paginación a página 1 al aplicar/cambiar filtros
// (R38), colapsables en móvil (R42), estado vacío por filtros con mensaje
// distinto al global + botón "Limpiar filtros" que restaura el listado
// completo en página 1 (R29, R44) y destacados no afectados por los filtros.
//
// Sin dependencias: ejerce el ProjectModel real, AppState real y el
// controlador real con un stub mínimo de DOM. Uso: node scripts/verify-filters.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { ProjectModel } = await import(join(root, 'src/models/ProjectModel.js'));
const { AppState } = await import(join(root, 'src/models/AppState.js'));
const { normalizeText } = await import(join(root, 'src/models/formatters.js'));

let passed = 0;
let failed = 0;
const check = (name, cond) => {
  if (cond) { passed++; console.log(`  ok  ${name}`); }
  else { failed++; console.log(`  FAIL ${name}`); }
};

// ---------------------------------------------------------------------------
// Datos de prueba con tildes y mayúsculas variadas para R37.
// ---------------------------------------------------------------------------
const mk = (id, fecha, tecnologia) => ({
  id,
  nombre: `Proyecto ${id}`,
  descripcion: `Descripción ${id}`,
  tecnologia,
  imagen: `assets/${id}.jpg`,
  enlace: `https://github.com/ejemplo/${id}`,
  fecha
});

const PROJECTS = [
  mk('p01', '2026-05', 'Kotlin'),
  mk('p02', '2026-01', 'JavaScript'),
  mk('p03', '2026-03', 'TypeScript'),
  mk('p04', '2025-06', 'C++'),
  mk('p05', '2025-11', 'C#'),
  mk('p06', '2024-08', 'Elixir'),
  mk('p07', null, 'Go') // sin fecha: no aparece en ningún filtro de año
];

const model = new ProjectModel(PROJECTS);

// ---------------------------------------------------------------------------
console.log('\n[1] R17 — existen filtros por tecnología y por año');
{
  const byTech = model.query({ filters: { tecnologia: 'Kotlin' } });
  check('filtro por tecnología devuelve solo coincidencias',
    byTech.total === 1 && byTech.items[0].id === 'p01');

  const byYear = model.query({ filters: { anio: '2026' } });
  check('filtro por año devuelve solo proyectos de ese año',
    byYear.total === 3 && byYear.items.every((p) => p.fecha.startsWith('2026')));

  const options = model.getFilterOptions();
  check('opciones de tecnología: valores únicos presentes',
    options.tecnologias.length === 7 &&
      ['Kotlin', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Elixir', 'Go']
        .every((t) => options.tecnologias.includes(t)));
  check('opciones de año: derivadas de fecha YYYY-MM, desc y sin duplicados',
    options.anios.join() === '2026,2025,2024');
}

// ---------------------------------------------------------------------------
console.log('\n[2] R18 — los filtros son combinables (AND)');
{
  const combo = model.query({ filters: { tecnologia: 'Kotlin', anio: '2026' } });
  check('Kotlin + 2026 → solo p01', combo.total === 1 && combo.items[0].id === 'p01');

  const impossible = model.query({ filters: { tecnologia: 'Kotlin', anio: '2025' } });
  check('Kotlin + 2025 → 0 resultados (combinación realmente aplicada)',
    impossible.total === 0);

  const csharp2025 = model.query({ filters: { tecnologia: 'C#', anio: '2025' } });
  check('C# + 2025 → p05', csharp2025.total === 1 && csharp2025.items[0].id === 'p05');
}

// ---------------------------------------------------------------------------
console.log('\n[3] R37 — filtrado insensible a mayúsculas y tildes');
{
  // normalizeText: NFD + sin diacríticos + minúsculas.
  check('normalizeText quita tildes', normalizeText('Jávascript') === 'javascript');
  check('normalizeText baja mayúsculas y recorta', normalizeText('  KOTLIN ') === 'kotlin');

  const variants = ['kotlin', 'KOTLIN', 'Kötlín', '  Kotlin  '];
  for (const v of variants) {
    const r = model.query({ filters: { tecnologia: v } });
    check(`tecnología "${v}" → p01`, r.total === 1 && r.items[0].id === 'p01');
  }

  // Proyecto cuya tecnología tiene tilde en el dato, filtro sin tilde.
  const accented = new ProjectModel([mk('x1', '2026-01', 'Programación')]);
  check('dato con tilde ("Programación") coincide con filtro sin tilde ("programacion")',
    accented.query({ filters: { tecnologia: 'programacion' } }).total === 1);

  // Caracteres especiales de tecnologías reales no se rompen.
  check('C++ se filtra literal', model.query({ filters: { tecnologia: 'c++' } }).total === 1);
  check('C# se filtra literal', model.query({ filters: { tecnologia: 'c#' } }).total === 1);
}

// ---------------------------------------------------------------------------
console.log('\n[4] R38 — al aplicar o cambiar filtros, la paginación vuelve a página 1');
{
  const state = new AppState({ status: 'ready' });
  state.set({ page: 3 });
  check('estado previo: página 3', state.get().page === 3);

  state.setFilters({ tecnologia: 'Kotlin' });
  check('setFilters vuelve a página 1', state.get().page === 1);
  check('el filtro queda aplicado', state.get().filters.tecnologia === 'Kotlin');

  // Cambiar el OTRO filtro también resetea (combinados, R18 + R38).
  state.set({ page: 2 });
  state.setFilters({ anio: '2026' });
  check('cambiar otro filtro también vuelve a página 1', state.get().page === 1);
  check('ambos filtros siguen activos (combinables)',
    state.get().filters.tecnologia === 'Kotlin' && state.get().filters.anio === '2026');

  // Quitar un filtro (volver a "Todas") también es un cambio → página 1.
  state.set({ page: 2 });
  state.setFilters({ tecnologia: null });
  check('quitar un filtro también vuelve a página 1', state.get().page === 1);
  check('el filtro quitado queda a null y el otro se conserva',
    state.get().filters.tecnologia === null && state.get().filters.anio === '2026');
}

// ---------------------------------------------------------------------------
console.log('\n[5] R29 + R44 — estado vacío por filtros, distinto al global, con "Limpiar filtros"');
{
  const es = JSON.parse(readFileSync(join(root, 'src/i18n/es.json'), 'utf8'));
  const en = JSON.parse(readFileSync(join(root, 'src/i18n/en.json'), 'utf8'));

  check('existen literales de vacío global y de vacío por filtros (ES)',
    Boolean(es.portfolio.vacioGlobal) && Boolean(es.portfolio.vacioFiltros));
  check('los mensajes ES son distintos (texto y título)',
    es.portfolio.vacioGlobal !== es.portfolio.vacioFiltros &&
    es.portfolio.vacioGlobalTitulo !== es.portfolio.vacioFiltrosTitulo);
  check('los mensajes EN son distintos (texto y título)',
    en.portfolio.vacioGlobal !== en.portfolio.vacioFiltros &&
    en.portfolio.vacioGlobalTitulo !== en.portfolio.vacioFiltrosTitulo);
  check('existe el literal del botón "Limpiar filtros" (ES/EN)',
    es.portfolio.limpiarFiltros === 'Limpiar filtros' && en.portfolio.limpiarFiltros === 'Clear filters');

  const viewSrc = readFileSync(join(root, 'src/views/PortfolioView.js'), 'utf8');
  check('vacío global solo cuando NO hay proyectos en absoluto (projectsTotal === 0)',
    /list\.total === 0 && vm\.projectsTotal === 0/.test(viewSrc));
  check('vacío por filtros cuando hay proyectos pero el filtro los excluye todos',
    /if \(list\.total === 0\)/.test(viewSrc));
  check('el estado vacío por filtros incluye el botón data-clear-filters',
    /data-clear-filters/.test(viewSrc) && viewSrc.includes("t('portfolio.limpiarFiltros')"));
  check('el estado vacío por filtros NO muestra contador ni paginación',
    !/vacioFiltros[\s\S]{0,400}results-counter/.test(viewSrc));
}

// ---------------------------------------------------------------------------
console.log('\n[6] R44 — "Limpiar filtros" restaura el listado completo en página 1');
{
  // Controlador real con stub mínimo de DOM (delegación de eventos).
  const listeners = {};
  const section = {
    addEventListener: (type, fn) => { (listeners[type] ??= []).push(fn); },
    querySelectorAll: () => []
  };
  globalThis.document = {
    createElement: () => ({ className: '', setAttribute: () => {}, textContent: '' }),
    body: { appendChild: () => {} }
  };
  globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);

  const { ProjectsController } = await import(join(root, 'src/controllers/ProjectsController.js'));
  const state = new AppState({ status: 'ready' });
  const controller = new ProjectsController(state, section, null);
  controller.start();

  // Situación: filtros combinados sin resultados, en una página alta.
  state.setFilters({ tecnologia: 'Kotlin', anio: '2025' });
  state.set({ page: 3 });
  const before = model.query({ filters: state.get().filters, page: state.get().page });
  check('antes de limpiar: 0 resultados con los filtros combinados', before.total === 0);

  // Vía método público (lo invoca el click en data-clear-filters).
  controller.clearFilters();
  const s = state.get();
  check('tras limpiar: sin filtros y página 1',
    s.filters.tecnologia === null && s.filters.anio === null && s.page === 1);
  const after = model.query({ filters: s.filters, order: s.order, page: s.page });
  check('tras limpiar: listado completo restaurado (7 proyectos)', after.total === 7);

  // Vía evento de click delegado (camino real del botón).
  state.setFilters({ tecnologia: 'Go' });
  state.set({ page: 2 });
  const click = { target: { closest: (sel) => (sel === '[data-clear-filters]' ? {} : null) } };
  listeners.click?.forEach((fn) => fn(click));
  check('click en [data-clear-filters] → sin filtros y página 1',
    state.get().filters.tecnologia === null && state.get().page === 1);

  // Cambio de filtro vía evento change delegado (camino real de los selects).
  state.set({ page: 2 });
  const change = { target: { dataset: { filter: 'anio' }, hasAttribute: () => false, value: '2026' } };
  listeners.change?.forEach((fn) => fn(change));
  check('change en select de año → filtro aplicado y página 1 (R38)',
    state.get().filters.anio === '2026' && state.get().page === 1);
}

// ---------------------------------------------------------------------------
console.log('\n[7] R42 — filtros colapsables en móvil');
{
  const viewSrc = readFileSync(join(root, 'src/views/PortfolioView.js'), 'utf8');
  check('los filtros usan <details>/<summary> (colapsable nativo y accesible)',
    /<details class="filters"/.test(viewSrc) && /<summary/.test(viewSrc));
  check('en escritorio (≥900px) se abren por defecto; en móvil, cerrados salvo que el usuario los abriera',
    /this\.#isDesktop\(\) \|\| this\.#filtersOpen \? 'open' : ''/.test(viewSrc));
  check('el estado abierto del usuario se conserva entre re-renders (listener toggle)',
    /addEventListener\('toggle'/.test(viewSrc) && /#filtersOpen = filtersEl\.open/.test(viewSrc));
  check('el umbral se evalúa con matchMedia (min-width: 900px)',
    viewSrc.includes("matchMedia('(min-width: 900px)')"));
  check('al cruzar el umbral se re-renderiza (giro de dispositivo, zoom)',
    /addEventListener\('change'/.test(viewSrc));
}

// ---------------------------------------------------------------------------
console.log('\n[8] Los filtros NO se aplican a destacados');
{
  const mainSrc = readFileSync(join(root, 'src/main.js'), 'utf8');
  check('featured se calcula solo con getFeatured() + orden (sin filters)',
    /featured:\s*projectModel\.sortByDate\(projectModel\.getFeatured\(\),\s*s\.order\)/.test(mainSrc));
  check('getFeatured() no recibe filtros (firma sin parámetros)',
    model.getFeatured.length === 0);

  // Con un filtro que excluye a los destacados, estos no cambian.
  const filtered = model.query({ filters: { tecnologia: 'Elixir' } });
  check('filtro Elixir: listado = 1 (p06) y destacados siguen siendo los 3 primeros del JSON',
    filtered.total === 1 && model.getFeatured().map((p) => p.id).join() === 'p01,p02,p03');
}

// ---------------------------------------------------------------------------
console.log('\n[9] JSON reales del lab: opciones y combinaciones');
{
  const real = JSON.parse(readFileSync(join(root, 'public/data/projects.json'), 'utf8')).proyectos;
  const m = new ProjectModel(real);
  const opts = m.getFilterOptions();
  check('tecnologías reales: Kotlin, JavaScript, Java, Flutter',
    ['Kotlin', 'JavaScript', 'Java', 'Flutter'].every((t) => opts.tecnologias.includes(t)));
  check('años reales: 2026, 2025 (desc)', opts.anios.join() === '2026,2025');
  check('Java + 2026 → api-reservas',
    m.query({ filters: { tecnologia: 'java', anio: '2026' } }).items[0]?.id === 'api-reservas');
  check('Java + 2025 → 0 (estado vacío por filtros)',
    m.query({ filters: { tecnologia: 'Java', anio: '2025' } }).total === 0);
}

console.log(`\nResultado: ${passed} ok, ${failed} fallos`);
process.exit(failed ? 1 : 0);
