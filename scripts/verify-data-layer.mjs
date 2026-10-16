// Verificación de la capa de datos (T3): parseo de los 4 JSON reales y
// comportamiento de DataService.load() ante datos válidos, malformados y
// con campos opcionales ausentes (R8, R24, R27, R36, R40).
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { DataService } = await import(join(root, 'src/services/DataService.js'));

let passed = 0;
let failed = 0;
const check = (name, cond) => {
  if (cond) { passed++; console.log(`  ok  ${name}`); }
  else { failed++; console.log(`  FAIL ${name}`); }
};

// --- 1. Los 4 JSON reales parsean y tienen la forma del Anexo A ---
console.log('\n[1] JSON reales (public/data/)');
const files = ['profile.json', 'profile.en.json', 'projects.json', 'projects.en.json'];
const docs = {};
for (const f of files) {
  const raw = readFileSync(join(root, 'public/data', f), 'utf8');
  docs[f] = JSON.parse(raw); // lanza si está malformado
  console.log(`  ok  ${f} parsea (${raw.length} bytes)`);
  passed++;
}
check('profile.json tiene objeto "perfil"', typeof docs['profile.json'].perfil === 'object');
check('profile.en.json tiene objeto "perfil"', typeof docs['profile.en.json'].perfil === 'object');
check('projects.json tiene array "proyectos"', Array.isArray(docs['projects.json'].proyectos));
check('projects.en.json tiene array "proyectos"', Array.isArray(docs['projects.en.json'].proyectos));

// Campos del Anexo A presentes en el perfil real
const perfil = docs['profile.json'].perfil;
for (const field of ['foto','nombre','titular','claim','ubicacion','disponibilidad','stack','correo','github','linkedin','presentacion','sobreMi','ahora']) {
  check(`perfil.${field} presente`, field in perfil);
}
check('stack es objeto de categorías con arrays', Object.values(perfil.stack).every(Array.isArray));

// Proyectos: campos del Anexo A + tecnologia string + fecha YYYY-MM
const proyectos = docs['projects.json'].proyectos;
check('hay 4 proyectos', proyectos.length === 4);
for (const p of proyectos) {
  check(`proyecto "${p.id}": tecnologia es string`, typeof p.tecnologia === 'string');
  check(`proyecto "${p.id}": fecha YYYY-MM`, /^\d{4}-\d{2}$/.test(p.fecha));
}

// Paridad ES ↔ EN (misma estructura, mismos ids y fechas)
const en = docs['projects.en.json'].proyectos;
check('EN tiene los mismos ids que ES', en.map(p=>p.id).join() === proyectos.map(p=>p.id).join());
check('EN tiene las mismas fechas que ES', en.map(p=>p.fecha).join() === proyectos.map(p=>p.fecha).join());
check('perfil EN mantiene correo/github/linkedin del ES',
  docs['profile.en.json'].perfil.correo === perfil.correo &&
  docs['profile.en.json'].perfil.github === perfil.github &&
  docs['profile.en.json'].perfil.linkedin === perfil.linkedin);

// --- 2. DataService con fetch simulado ---
console.log('\n[2] DataService.load()');
const makeFetch = (map) => async (url) => {
  const key = url.replace(/^data\//, '');
  if (!(key in map)) return { ok: false, status: 404, json: async () => null };
  const body = map[key];
  return {
    ok: true, status: 200,
    json: async () => (typeof body === 'string' ? JSON.parse(body) : body)
  };
};

// 2a. Carga ES y EN correctas
let ds = new DataService('data/');
globalThis.fetch = makeFetch(docs);
let r = await ds.load('es');
check('ES: profile.nombre = Alex', r.profile.nombre === 'Alex');
check('ES: 4 proyectos', r.projects.length === 4);
r = await ds.load('en');
check('EN: claim traducido', r.profile.claim.startsWith('I build'));
check('EN: primer proyecto traducido', r.projects[0].nombre === 'Android task manager');

// 2b. HTTP 404 → error controlado (R27)
globalThis.fetch = makeFetch({});
let threw = false;
try { await ds.load('es'); } catch { threw = true; }
check('404 → lanza (R27)', threw);

// 2c. JSON malformado → error controlado (R27)
globalThis.fetch = makeFetch({ 'profile.json': '{ no json', 'projects.json': docs['projects.json'] });
threw = false;
try { await ds.load('es'); } catch { threw = true; }
check('JSON malformado → lanza (R27)', threw);

// 2d. Documento sin la forma esperada → error controlado (R27)
globalThis.fetch = makeFetch({ 'profile.json': { algo: 1 }, 'projects.json': docs['projects.json'] });
threw = false;
try { await ds.load('es'); } catch { threw = true; }
check('profile sin "perfil" → lanza (R27)', threw);
globalThis.fetch = makeFetch({ 'profile.json': docs['profile.json'], 'projects.json': { proyectos: 'no-array' } });
threw = false;
try { await ds.load('es'); } catch { threw = true; }
check('projects sin array "proyectos" → lanza (R27)', threw);

// 2e. Degradación por campos (R36): faltan opcionales, la carga NO falla
const degradedProfile = { perfil: { nombre: 'Alex', correo: 'a@b.c', stack: { Vacía: [], Lenguajes: ['Kotlin'] } } };
const degradedProjects = { proyectos: [
  { id: 'p1', nombre: 'Sin imagen ni enlace ni fecha', tecnologia: 'Kotlin' }, // faltan imagen, enlace, fecha, descripcion
  null, // entrada rota: se descarta
  { id: 'p2', nombre: 'OK', descripcion: 'd', tecnologia: 'Java', imagen: 'x.jpg', enlace: 'https://x', fecha: '2026-01' }
] };
globalThis.fetch = makeFetch({ 'profile.json': degradedProfile, 'projects.json': degradedProjects });
r = await ds.load('es');
check('sin github/linkedin/claim… → NO lanza (R36)', r.profile.nombre === 'Alex');
check('sobreMi/ahora ausentes → [] normalizado', Array.isArray(r.profile.sobreMi) && r.profile.ahora.length === 0);
check('stack ausente → {} normalizado', typeof r.profile.stack === 'object');
check('entrada null descartada, quedan 2 proyectos', r.projects.length === 2);
check('proyecto sin campos opcionales se conserva (degrada en vista)', r.projects[0].id === 'p1');

// 2f. projects.json vacío → NO es error: estado vacío global (R28)
globalThis.fetch = makeFetch({ 'profile.json': docs['profile.json'], 'projects.json': { proyectos: [] } });
r = await ds.load('es');
check('proyectos: [] → carga OK con lista vacía (R28)', r.projects.length === 0);

console.log(`\nResultado: ${passed} ok, ${failed} fallos`);
process.exit(failed ? 1 : 0);
