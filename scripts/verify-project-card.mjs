// Verificación del Web Component <project-card> (T7): contenido (R9),
// placeholder (R10), truncado/expansión (R11), expansión exclusiva y bloqueo
// transición+300ms en el controlador (R12, R13), "No disponible" (R14),
// enlace en nueva pestaña con rel="noopener noreferrer" (R15) y
// prefers-reduced-motion (R34).
//
// Sin dependencias: usa un stub mínimo de DOM (custom elements, shadow root,
// dispatch de eventos) suficiente para ejecutar el componente y el controlador
// reales. Ejecutar con: node scripts/verify-project-card.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// Stub mínimo de DOM
// ---------------------------------------------------------------------------
const VOID_TAGS = new Set(['img', 'br', 'hr', 'input', 'meta', 'link']);

function decodeEntities(s) {
  return s
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function parseAttrs(str) {
  const attrs = {};
  const re = /([a-zA-Z_:][-\w:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
  let m;
  while ((m = re.exec(str))) attrs[m[1]] = m[2] ?? m[3] ?? m[4] ?? '';
  return attrs;
}

class ClassListStub {
  #el;
  constructor(el) { this.#el = el; }
  #get() { return (this.#el.attributes.class ?? '').split(/\s+/).filter(Boolean); }
  #set(list) { this.#el.attributes.class = [...new Set(list)].join(' '); }
  add(...cs) { this.#set([...this.#get(), ...cs]); }
  contains(c) { return this.#get().includes(c); }
}

class ElementStub {
  constructor(tagName, doc) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = doc ?? null;
    this.attributes = {};
    this.childNodes = [];
    this.parentNode = null;
    this.textContent = '';
    this.listeners = {};
    this.isConnected = false;
    this.shadowRoot = null;
    this.classList = new ClassListStub(this);
  }

  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return name in this.attributes ? this.attributes[name] : null; }
  hasAttribute(name) { return name in this.attributes; }
  removeAttribute(name) { delete this.attributes[name]; }
  get disabled() { return this.hasAttribute('disabled'); }

  appendChild(child) {
    this.childNodes.push(child);
    child.parentNode = this;
    if (this.isConnected) child.#connect();
    return child;
  }

  replaceWith(node) {
    const parent = this.parentNode;
    if (!parent) return;
    const i = parent.childNodes.indexOf(this);
    if (i >= 0) {
      parent.childNodes.splice(i, 1, node);
      node.parentNode = parent;
      this.parentNode = null;
    }
  }

  #connect() {
    this.isConnected = true;
    if (typeof this.connectedCallback === 'function') this.connectedCallback();
    for (const c of this.childNodes) c.#connect();
    if (this.shadowRoot) this.shadowRoot.#connect();
  }

  set innerHTML(html) {
    this.childNodes = [];
    this.textContent = '';
    parseInto(html, this, this.ownerDocument ?? documentStub);
  }

  querySelector(selector) {
    return this.#all().find((el) => matchSelector(el, selector)) ?? null;
  }
  querySelectorAll(selector) {
    return this.#all().filter((el) => matchSelector(el, selector));
  }
  #all() {
    const out = [];
    const walk = (node) => {
      for (const c of node.childNodes) {
        out.push(c);
        walk(c);
        if (c.shadowRoot) walk(c.shadowRoot);
      }
    };
    walk(this);
    return out;
  }

  addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }

  dispatchEvent(event) {
    event.target ??= this;
    let node = this;
    while (node) {
      if (node === this || event.bubbles) {
        for (const fn of node.listeners[event.type] ?? []) fn.call(node, event);
      }
      // composed: el evento atraviesa el shadow boundary hacia el host
      node = node.parentNode ?? (node.host && event.composed ? node.host : null);
    }
    return true;
  }

  click() {
    if (this.disabled) return; // botón deshabilitado: no emite click (R13)
    this.dispatchEvent({ type: 'click', bubbles: true, composed: true, target: this });
  }
}

// Parser HTML con cierres explícitos (suficiente para las plantillas del componente).
function parseInto(html, rootEl, doc) {
  const re = /<!--[\s\S]*?-->|<style[^>]*>[\s\S]*?<\/style>|<\/([a-zA-Z][-\w]*)\s*>|<([a-zA-Z][-\w]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>|([^<]+)/g;
  const stack = [rootEl];
  let m;
  while ((m = re.exec(html))) {
    if (m[4] !== undefined) {
      const text = decodeEntities(m[4]).trim();
      if (text) {
        const parent = stack[stack.length - 1];
        parent.textContent += (parent.textContent ? ' ' : '') + text;
      }
      continue;
    }
    if (m[1]) {
      const tag = m[1].toLowerCase();
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tagName.toLowerCase() === tag) { stack.length = i; break; }
      }
      continue;
    }
    if (!m[2]) continue; // comentario o bloque <style>
    const tag = m[2].toLowerCase();
    const el = doc.createElement(tag);
    Object.assign(el.attributes, parseAttrs(m[3].replace(/\/\s*$/, '')));
    stack[stack.length - 1].appendChild(el);
    if (!/\/\s*$/.test(m[3]) && !VOID_TAGS.has(tag)) stack.push(el);
  }
}

function matchSelector(el, selector) {
  selector = selector.trim();
  if (selector.startsWith('.')) return el.classList.contains(selector.slice(1));
  if (selector.startsWith('[')) return el.hasAttribute(selector.slice(1, -1).split('=')[0]);
  return el.tagName.toLowerCase() === selector.toLowerCase();
}

class ShadowRootStub extends ElementStub {
  constructor(host) {
    super('#shadow-root', host.ownerDocument);
    this.host = host;
  }
}

class DocumentStub extends ElementStub {
  constructor() {
    super('#document', null);
    this.ownerDocument = this;
    this.registry = {};
    this.isConnected = true;
    this.documentElement = this.createElement('html');
    this.body = this.createElement('body');
    this.documentElement.isConnected = true;
    this.body.isConnected = true;
    this.childNodes.push(this.documentElement);
    this.documentElement.appendChild(this.body);
  }
  createElement(tag) {
    const Klass = this.registry[tag.toLowerCase()];
    const el = Klass ? new Klass() : new ElementStub(tag, this);
    el.ownerDocument = this;
    return el;
  }
}

const documentStub = new DocumentStub();

class HTMLElementStub extends ElementStub {
  constructor() { super('div', documentStub); }
  attachShadow() {
    this.shadowRoot = new ShadowRootStub(this);
    return this.shadowRoot;
  }
  setAttribute(name, value) {
    const old = this.attributes[name] ?? null;
    super.setAttribute(name, value);
    this.#notify(name, old, String(value));
  }
  removeAttribute(name) {
    const old = this.attributes[name] ?? null;
    super.removeAttribute(name);
    this.#notify(name, old, null);
  }
  toggleAttribute(name, force) {
    const next = force === undefined ? !this.hasAttribute(name) : Boolean(force);
    if (next) this.setAttribute(name, '');
    else this.removeAttribute(name);
    return next;
  }
  #notify(name, old, value) {
    if (old === value) return;
    if (this.constructor.observedAttributes?.includes(name) &&
        typeof this.attributeChangedCallback === 'function') {
      this.attributeChangedCallback(name, old, value);
    }
  }
}

// ---------------------------------------------------------------------------
// Entorno global y carga de los módulos reales
// ---------------------------------------------------------------------------
globalThis.document = documentStub;
globalThis.HTMLElement = HTMLElementStub;
globalThis.customElements = {
  define(name, klass) {
    documentStub.registry[name] = class extends klass {
      constructor() {
        super();
        this.tagName = name.toUpperCase();
      }
    };
  }
};
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);

await import(join(root, 'src/views/components/project-card.js'));
const { ProjectsController } = await import(join(root, 'src/controllers/ProjectsController.js'));
const { AppState } = await import(join(root, 'src/models/AppState.js'));

// ---------------------------------------------------------------------------
// Utilidades de test
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;
const check = (name, cond) => {
  if (cond) { passed++; console.log(`  ok  ${name}`); }
  else { failed++; console.log(`  FAIL ${name}`); }
};

const i18nEs = {
  t(key, params = {}) {
    const dict = {
      'tarjeta.destacado': 'Destacado',
      'tarjeta.noDisponible': 'No disponible',
      'tarjeta.verRepositorio': 'Ver repositorio',
      'tarjeta.expandir': 'Expandir tarjeta',
      'tarjeta.colapsar': 'Colapsar tarjeta',
      'tarjeta.expandida': 'Tarjeta {nombre} expandida',
      'tarjeta.colapsada': 'Tarjeta {nombre} colapsada'
    };
    return Object.entries(params).reduce(
      (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
      dict[key] ?? key
    );
  }
};

const PROJECT = {
  id: 'p1',
  nombre: 'Gestor de tareas Android',
  descripcion: 'App de tareas con sincronización offline y recordatorios inteligentes.',
  tecnologia: 'Kotlin',
  fecha: '2025-03',
  imagen: 'assets/project-01.jpg',
  enlace: 'https://github.com/ejemplo/gestor'
};

function makeCard(props = {}) {
  const card = documentStub.createElement('project-card');
  documentStub.body.appendChild(card);
  card.props = { project: PROJECT, i18n: i18nEs, lang: 'es', ...props };
  return card;
}
const sr = (card) => card.shadowRoot;

// ---------------------------------------------------------------------------
console.log('\n[1] R9 — la tarjeta muestra imagen, nombre, descripción, tecnología, fecha y enlace');
{
  const card = makeCard();
  const img = sr(card).querySelector('img');
  check('imagen con src y alt', img?.getAttribute('src') === PROJECT.imagen && img?.getAttribute('alt') === PROJECT.nombre);
  check('imagen con loading="lazy" (R33)', img?.getAttribute('loading') === 'lazy');
  check('nombre visible', sr(card).querySelector('.card-title')?.textContent === PROJECT.nombre);
  check('descripción visible', sr(card).querySelector('.card-desc')?.textContent === PROJECT.descripcion);
  check('tecnología en chip', sr(card).querySelector('.chip')?.textContent === PROJECT.tecnologia);
  const time = sr(card).querySelector('time');
  check('fecha "Marzo 2025" con datetime="2025-03" (R41)',
    time?.textContent === 'Marzo 2025' && time?.getAttribute('datetime') === '2025-03');
  check('enlace presente con href', sr(card).querySelector('.card-link a')?.getAttribute('href') === PROJECT.enlace);
}

console.log('\n[2] R10 — placeholder si falta la imagen o falla');
{
  const sinImagen = makeCard({ project: { ...PROJECT, imagen: undefined } });
  const ph = sr(sinImagen).querySelector('[data-card-placeholder]');
  check('sin imagen → placeholder con role="img" y aria-label',
    ph?.getAttribute('role') === 'img' && ph?.getAttribute('aria-label') === PROJECT.nombre);
  check('sin imagen → no hay <img>', sr(sinImagen).querySelector('img') === null);

  const rota = makeCard();
  const img = sr(rota).querySelector('img');
  img.dispatchEvent({ type: 'error', target: img });
  check('imagen rota → se sustituye por placeholder',
    sr(rota).querySelector('img') === null &&
    sr(rota).querySelector('[data-card-placeholder]')?.getAttribute('aria-label') === PROJECT.nombre);
}

console.log('\n[3] R11 — colapsado truncado / expandido completo, todas miden igual');
{
  const src = readFileSync(join(root, 'src/views/components/project-card.js'), 'utf8');
  const card = makeCard();
  const btn = sr(card).querySelector('.card-toggle');
  check('colapsada: aria-expanded="false"', btn?.getAttribute('aria-expanded') === 'false');
  check('colapsada: sin atributo expanded en el host', !card.hasAttribute('expanded'));
  check('CSS: descripción con -webkit-line-clamp: 3 y overflow hidden (puntos suspensivos)',
    /-webkit-line-clamp:\s*3/.test(src) && /\.card-desc\s*\{[^}]*overflow:\s*hidden/.test(src));
  check('CSS: título con text-overflow: ellipsis en colapsado',
    /\.card-title\s*\{[^}]*text-overflow:\s*ellipsis/.test(src));
  check('CSS: fila meta con altura reservada (min-height) → tarjetas iguales',
    /\.card-meta\s*\{[^}]*min-height/.test(src));
  check('CSS: la tarjeta ocupa el 100% de su celda (:host y .card a height:100%)',
    /:host\s*\{[^}]*height:\s*100%/.test(src) && /\.card\s*\{[^}]*height:\s*100%/.test(src));
  const gridCss = readFileSync(join(root, 'src/styles/components.css'), 'utf8');
  check('components.css: .card-grid > project-card { height: 100% }',
    /\.card-grid\s*>\s*project-card\s*\{[^}]*height:\s*100%/.test(gridCss));

  card.props = { expanded: true };
  check('expandida: aria-expanded="true"', sr(card).querySelector('.card-toggle')?.getAttribute('aria-expanded') === 'true');
  check('expandida: atributo expanded reflejado en el host', card.hasAttribute('expanded'));
  check('CSS: en expandido la descripción no se trunca',
    /:host\(\[expanded\]\)\s*\.card-desc\s*\{[^}]*-webkit-line-clamp:\s*unset/.test(src));
  check('CSS: el enlace solo se muestra en expandido (display none → block)',
    /\.card-link\s*\{[^}]*display:\s*none/.test(src) &&
    /:host\(\[expanded\]\)\s*\.card-link\s*\{[^}]*display:\s*block/.test(src));
}

console.log('\n[4] R12 + R13 — expansión exclusiva y bloqueo transición+300ms (controlador real)');
{
  const section = documentStub.createElement('section');
  documentStub.body.appendChild(section);
  const state = new AppState({ status: 'ready' });
  const controller = new ProjectsController(state, section, i18nEs);
  controller.start();

  const p2 = { ...PROJECT, id: 'p2', nombre: 'Segundo' };
  const cardA = documentStub.createElement('project-card');
  const cardB = documentStub.createElement('project-card');
  section.appendChild(cardA);
  section.appendChild(cardB);
  cardA.props = { project: PROJECT, i18n: i18nEs, lang: 'es' };
  cardB.props = { project: p2, i18n: i18nEs, lang: 'es' };

  const sync = () => {
    const { expandedProjectId } = state.get();
    cardA.props = { expanded: expandedProjectId === 'p1' };
    cardB.props = { expanded: expandedProjectId === 'p2' };
  };

  sr(cardA).querySelector('.card-toggle').click();
  check('click en A → A expandida', state.get().expandedProjectId === 'p1');
  sync();
  check('solo A tiene aria-expanded="true" (R12)',
    sr(cardA).querySelector('.card-toggle').getAttribute('aria-expanded') === 'true' &&
    sr(cardB).querySelector('.card-toggle').getAttribute('aria-expanded') === 'false');

  check('R13: ambas tarjetas disabled durante la ventana de bloqueo',
    sr(cardA).querySelector('.card-toggle').disabled && sr(cardB).querySelector('.card-toggle').disabled);

  let firedDuringBlock = 0;
  section.addEventListener('card-toggle', () => firedDuringBlock++);
  sr(cardB).querySelector('.card-toggle').click();
  sr(cardA).querySelector('.card-toggle').click();
  check('R13: ningún card-toggle durante el bloqueo (click/teclado/AT)', firedDuringBlock === 0);
  check('R13: el estado no cambia durante el bloqueo', state.get().expandedProjectId === 'p1');

  await new Promise((r) => setTimeout(r, 750));
  check('R13: tras 400+300ms los botones vuelven a estar activos',
    !sr(cardA).querySelector('.card-toggle').disabled && !sr(cardB).querySelector('.card-toggle').disabled);

  sr(cardB).querySelector('.card-toggle').click();
  check('R12: click en B → solo B expandida', state.get().expandedProjectId === 'p2');
  sync();
  check('R12: aria-expanded A=false, B=true',
    sr(cardA).querySelector('.card-toggle').getAttribute('aria-expanded') === 'false' &&
    sr(cardB).querySelector('.card-toggle').getAttribute('aria-expanded') === 'true');

  await new Promise((r) => setTimeout(r, 750));
  sr(cardB).querySelector('.card-toggle').click();
  check('R11: segundo click en la misma tarjeta → se colapsa', state.get().expandedProjectId === null);
}

console.log('\n[5] R14 + R15 — enlace');
{
  const sinEnlace = makeCard({ project: { ...PROJECT, enlace: undefined } });
  const link = sr(sinEnlace).querySelector('.card-link');
  check('R14: sin enlace → "No disponible", sin <a>',
    link?.querySelector('a') === null && link?.querySelector('.not-available')?.textContent === 'No disponible');

  const conEnlace = makeCard();
  const a = sr(conEnlace).querySelector('.card-link a');
  check('R15: target="_blank"', a?.getAttribute('target') === '_blank');
  check('R15: rel="noopener noreferrer"', a?.getAttribute('rel') === 'noopener noreferrer');

  const raro = makeCard({ project: { ...PROJECT, enlace: 'javascript:alert(1)' } });
  check('R14: URL no http(s) → degrada a "No disponible"',
    sr(raro).querySelector('.card-link a') === null &&
    sr(raro).querySelector('.not-available') !== null);
}

console.log('\n[6] R34 — prefers-reduced-motion');
{
  const src = readFileSync(join(root, 'src/views/components/project-card.js'), 'utf8');
  check('media query prefers-reduced-motion dentro del componente',
    /@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(src));
  check('con reduced-motion las transiciones de la tarjeta se anulan (transition: none)',
    /prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?transition:\s*none/.test(src));
  const base = readFileSync(join(root, 'src/styles/base.css'), 'utf8');
  check('base.css mantiene la guarda global de reduced-motion',
    /@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(base));
}

console.log('\n[7] Accesibilidad de la activación (R13 cubre click, teclado y lector)');
{
  const card = makeCard();
  const btn = sr(card).querySelector('.card-toggle');
  check('toda la tarjeta es un <button> (teclado: Enter/Espacio nativos)', btn?.tagName === 'BUTTON');
  check('aria-label describe la acción y el proyecto',
    btn?.getAttribute('aria-label') === `Expandir tarjeta: ${PROJECT.nombre}`);
  card.props = { expanded: true };
  check('aria-label cambia a "Colapsar tarjeta" al expandir',
    sr(card).querySelector('.card-toggle')?.getAttribute('aria-label') === `Colapsar tarjeta: ${PROJECT.nombre}`);
}

console.log(`\nResultado: ${passed} ok, ${failed} fallos`);
process.exit(failed ? 1 : 0);
