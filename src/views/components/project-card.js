import { formatMonthYear } from '../../models/formatters.js';

/**
 * Escapa texto antes de interpolarlo en el HTML del shadow root.
 * Los datos vienen de JSON mantenidos a mano; defensa en profundidad.
 */
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** URL solo http(s); cualquier otra cosa se trata como ausente (degrada a R14). */
function safeUrl(value) {
  try {
    const url = new URL(String(value), 'https://placeholder.invalid');
    return url.protocol === 'http:' || url.protocol === 'https:' ? escapeHtml(String(value)) : null;
  } catch {
    return null;
  }
}

/**
 * Estilos encapsulados del componente (Shadow DOM). Heredan las custom
 * properties de tokens.css (atraviesan el shadow boundary); el resto del CSS
 * global no entra, y estos estilos no salen.
 *
 * R11 colapsado: imagen fija 16:10 + título truncado a 1 línea + descripción
 * truncada a 3 líneas + fila de meta de altura reservada → todas las tarjetas
 * miden igual. Expandida: contenido completo, incluido el enlace.
 * R34: con prefers-reduced-motion no hay transición (duración 0ms).
 */
const STYLES = `
  :host {
    display: block;
    height: 100%;
  }

  .card {
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid var(--border, #e5e5e5);
    border-radius: var(--radius-md, 12px);
    overflow: hidden;
    background: var(--bg, #fff);
    color: var(--ink, #0a0a0a);
    transition: border-color var(--dur-color, 150ms) var(--ease, ease);
  }

  .card-toggle:hover .card,
  .card-toggle:focus-visible .card {
    border-color: var(--border-strong, #d4d4d4);
  }

  /* El botón envuelve la tarjeta: toda ella es activable (click/teclado/lector). */
  .card-toggle {
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    border: none;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .card-toggle:disabled {
    cursor: default;
  }

  /* Marco de proyecto (DESIGN §4): 12px en accent-soft, imagen 16:10 */
  .card-frame {
    display: block;
    padding: 12px;
    background: var(--accent-soft, #ede9fe);
  }

  .card-frame img,
  .card-placeholder {
    display: block;
    width: 100%;
    /* Los atributos width/height del <img> reservan la caja 16:10 antes de
       que llegue la imagen (sin CLS); height:auto la deja fluir con el ancho. */
    height: auto;
    aspect-ratio: 16 / 10;
    object-fit: cover;
    border-radius: var(--radius-sm, 8px);
    transition: transform var(--dur-color, 150ms) var(--ease, ease);
  }

  .card-toggle:hover .card-frame img {
    transform: scale(1.02);
  }

  /* Placeholder (R10): bloque neutro con el mismo 16:10; el nombre va en aria-label */
  .card-placeholder {
    background: var(--surface-2, #ededed);
  }

  .card-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 16px;
  }

  .card-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  /* R11: título truncado a 1 línea en colapsado → altura de cabecera uniforme */
  .card-title {
    min-width: 0;
    font-size: 18px;
    line-height: 1.3;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :host([expanded]) .card-title {
    overflow: visible;
    text-overflow: unset;
    white-space: normal;
    overflow-wrap: break-word;
  }

  .badge {
    flex-shrink: 0;
    font-family: var(--font-mono, monospace);
    font-size: 12px;
    padding: 2px 8px;
    border-radius: var(--radius-full, 999px);
    border: 1px solid var(--border-strong, #d4d4d4);
    color: var(--muted, #525252);
  }

  /* R11: descripción truncada a 3 líneas con puntos suspensivos en colapsado */
  .card-desc {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: 15px;
    line-height: 24px;
    color: var(--ink-2, #404040);
    margin-top: 8px;
    overflow-wrap: break-word;
  }

  :host([expanded]) .card-desc {
    -webkit-line-clamp: unset;
    overflow: visible;
  }

  /* R11: la fila de meta existe siempre (altura reservada) aunque falten datos */
  .card-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 32px;
    margin-top: auto;
    padding-top: 12px;
    font-family: var(--font-mono, monospace);
    font-size: 13px;
    color: var(--muted, #525252);
  }

  .chip {
    font-family: var(--font-mono, monospace);
    font-size: 13px;
    line-height: 20px;
    background: var(--surface, #f5f5f5);
    border-radius: var(--radius-sm, 8px);
    padding: 2px 8px;
  }

  /* Enlace: solo en expandido (R11: colapsado = contenido truncado) */
  .card-link {
    display: none;
    margin-top: 12px;
    font-size: 15px;
  }

  :host([expanded]) .card-link {
    display: block;
  }

  .card-link a {
    color: inherit;
    text-underline-offset: 3px;
    overflow-wrap: break-word;
  }

  .card-link a:hover {
    text-decoration-color: var(--accent, #6d28d9);
  }

  .not-available {
    color: var(--muted, #525252);
  }

  /* R34: con prefers-reduced-motion no se ejecuta ninguna animación */
  @media (prefers-reduced-motion: reduce) {
    .card,
    .card-frame img {
      transition: none;
    }
    .card-toggle:hover .card-frame img {
      transform: none;
    }
  }
`;

/**
 * <project-card> — tarjeta de proyecto expandible (R9–R15, R22).
 * Web Component nativo con Shadow DOM (único exigido por la spec).
 *
 * Props (setter `props`): { project, i18n, lang, expanded, featured, disabled }
 *  - expanded: reflejado al atributo `expanded` (aria-expanded + estilos).
 *  - disabled: bloquea TODA activación (click, teclado, lector de pantalla)
 *    durante la transición + 300 ms (R13); lo activa ProjectsController.
 * Eventos: 'card-toggle' { id, nombre } — la expansión exclusiva (R12) y la
 * ventana de bloqueo (R13) viven en ProjectsController.
 */
export class ProjectCard extends HTMLElement {
  #props = { project: {}, i18n: null, lang: 'es', expanded: false, featured: false, disabled: false };
  #root;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['expanded'];
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback(name, _old, value) {
    if (name === 'expanded') {
      this.#props.expanded = value !== null;
      if (this.isConnected) this.#render();
    }
  }

  set props(value) {
    this.#props = { ...this.#props, ...value };
    // Refleja el estado al atributo: estilos de expansión y API pública del componente.
    this.toggleAttribute('expanded', Boolean(this.#props.expanded));
    if (this.isConnected) this.#render();
  }

  get projectId() {
    return this.#props.project?.id;
  }

  #render() {
    const { project: p, i18n, lang, expanded, featured, disabled } = this.#props;
    const t = i18n?.t?.bind(i18n) ?? ((k) => k);
    const fecha = formatMonthYear(p.fecha, lang);
    const enlace = safeUrl(p.enlace);
    const nombre = escapeHtml(p.nombre);

    this.#root.innerHTML = `
      <style>${STYLES}</style>
      <article class="card">
        <button
          type="button"
          class="card-toggle"
          aria-expanded="${expanded}"
          aria-label="${expanded ? t('tarjeta.colapsar') : t('tarjeta.expandir')}: ${nombre}"
          ${disabled ? 'disabled' : ''}
        >
          <span class="card-frame">
            ${p.imagen
              ? `<img src="${escapeHtml(p.imagen)}" alt="${nombre}" width="480" height="300" loading="lazy" decoding="async" data-card-image />`
              : `<span class="card-placeholder" role="img" aria-label="${nombre}" data-card-placeholder></span>`}
          </span>
          <span class="card-body">
            <span class="card-title-row">
              <span class="card-title">${nombre}</span>
              ${featured ? `<span class="badge">${t('tarjeta.destacado')}</span>` : ''}
            </span>
            ${p.descripcion ? `<span class="card-desc">${escapeHtml(p.descripcion)}</span>` : ''}
            <span class="card-meta">
              ${p.tecnologia ? `<span class="chip">${escapeHtml(p.tecnologia)}</span>` : ''}
              ${fecha ? `<time datetime="${escapeHtml(p.fecha)}">${fecha}</time>` : ''}
            </span>
            <span class="card-link">
              ${enlace
                ? `<a href="${enlace}" target="_blank" rel="noopener noreferrer">${t('tarjeta.verRepositorio')}</a>`
                : `<span class="not-available">${t('tarjeta.noDisponible')}</span>`}
            </span>
          </span>
        </button>
      </article>
    `;

    // Placeholder si la imagen falla (R10).
    this.#root.querySelector('[data-card-image]')?.addEventListener('error', (event) => {
      const img = event.target;
      const placeholder = document.createElement('span');
      placeholder.className = 'card-placeholder';
      placeholder.setAttribute('role', 'img');
      placeholder.setAttribute('aria-label', img.getAttribute('alt') ?? '');
      placeholder.setAttribute('data-card-placeholder', '');
      img.replaceWith(placeholder);
    }, { once: true });

    // Activa con click, teclado (Enter/Espacio en <button>) y lector de
    // pantalla (evento click sintético). Con `disabled` el botón queda fuera
    // del tab order y no emite nada (R13).
    this.#root.querySelector('.card-toggle')?.addEventListener('click', () => {
      if (this.#props.disabled) return;
      this.dispatchEvent(
        new CustomEvent('card-toggle', {
          detail: { id: this.projectId, nombre: this.#props.project?.nombre },
          bubbles: true,
          composed: true
        })
      );
    });
  }
}

customElements.define('project-card', ProjectCard);
