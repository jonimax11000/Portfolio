/**
 * <app-header> — cabecera sticky colapsable (R1–R5).
 * Web Component nativo. Renderiza desde las props; emite eventos
 * (no contiene lógica de dominio: eso es del AppController).
 *
 * Eventos emitidos (CustomEvent, bubbles, composed):
 *  - 'navigate'        { view }
 *  - 'toggle-lang'
 *  - 'toggle-theme'
 *  - 'toggle-hc'
 *  - 'contact'
 */
export class AppHeader extends HTMLElement {
  #profile = null;
  #i18n = null;
  #state = { lang: 'es', theme: 'light', hc: false, view: 'portfolio', collapsed: false };

  static get observedAttributes() {
    return ['collapsed'];
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback(name, _old, value) {
    if (name === 'collapsed') {
      this.#state.collapsed = value !== null;
      this.#render();
    }
  }

  /** @param {{profile: object, i18n: {t: Function}, state: object}} props */
  set props({ profile, i18n, state }) {
    this.#profile = profile;
    this.#i18n = i18n;
    this.#state = { ...this.#state, ...state };
    if (this.isConnected) this.#render();
  }

  #emit(type, detail = {}) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  #render() {
    const t = this.#i18n?.t?.bind(this.#i18n) ?? ((k) => k);
    const p = this.#profile ?? {};
    const { collapsed, view, theme, hc } = this.#state;

    const navButton = (v, label) => `
      <button type="button" class="nav-btn" data-nav="${v}" ${view === v ? 'aria-current="page"' : ''}>
        ${label}
      </button>`;

    this.innerHTML = `
      <header class="site-header ${collapsed ? 'is-collapsed' : ''}">
        <div class="header-inner">
          <div class="header-identity">
            ${p.foto ? `<img class="header-photo" src="${p.foto}" alt="${p.nombre ?? ''}" width="48" height="48" fetchpriority="high" decoding="async" />` : ''}
            ${p.nombre ? `<span class="header-name">${p.nombre}</span>` : ''}
          </div>

          <div class="header-full">
            ${p.titular ? `<p class="header-titular">${p.titular}</p>` : ''}
            ${p.claim ? `<p class="header-claim">${p.claim}</p>` : ''}
            <ul class="header-meta">
              ${p.ubicacion ? `<li>${p.ubicacion}</li>` : ''}
              ${p.disponibilidad ? `<li><span class="pill"><span class="pill-dot" aria-hidden="true"></span>${p.disponibilidad}</span></li>` : ''}
            </ul>
            ${this.#renderStack(p.stack)}
            <ul class="header-links">
              ${p.correo ? `<li><a href="mailto:${p.correo}">${p.correo}</a></li>` : ''}
              ${p.github ? `<li><a href="${p.github}" target="_blank" rel="noopener noreferrer">GitHub</a></li>` : ''}
              ${p.linkedin ? `<li><a href="${p.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>` : ''}
            </ul>
          </div>

          <nav class="header-nav" aria-label="${t('footer.navegacion')}">
            ${navButton('portfolio', t('nav.portfolio'))}
            ${navButton('sobre-mi', t('nav.sobreMi'))}
            ${navButton('ahora', t('nav.ahora'))}
          </nav>

          <div class="header-actions">
            <button type="button" class="btn-secondary" data-action="toggle-lang">${t('header.cambiarIdioma')}</button>
            <button type="button" class="btn-secondary" data-action="toggle-theme" aria-pressed="${theme === 'dark'}">
              ${theme === 'dark' ? t('header.temaClaro') : t('header.temaOscuro')}
            </button>
            <button type="button" class="btn-secondary" data-action="toggle-hc" aria-pressed="${hc}">
              ${t('header.altoContraste')}
            </button>
            ${p.correo ? `<button type="button" class="btn-primary" data-action="contact">${t('header.contactar')}</button>` : ''}
          </div>
        </div>
      </header>
    `;

    this.querySelectorAll('[data-nav]').forEach((btn) =>
      btn.addEventListener('click', () => this.#emit('navigate', { view: btn.dataset.nav }))
    );
    this.querySelector('[data-action="toggle-lang"]')?.addEventListener('click', () => this.#emit('toggle-lang'));
    this.querySelector('[data-action="toggle-theme"]')?.addEventListener('click', () => this.#emit('toggle-theme'));
    this.querySelector('[data-action="toggle-hc"]')?.addEventListener('click', () => this.#emit('toggle-hc'));
    this.querySelector('[data-action="contact"]')?.addEventListener('click', () => this.#emit('contact'));
  }

  /** Degradación por campos: categorías de stack vacías se ocultan (R36). */
  #renderStack(stack) {
    if (!stack || typeof stack !== 'object') return '';
    const categories = Object.entries(stack).filter(([, items]) => Array.isArray(items) && items.length > 0);
    if (categories.length === 0) return '';
    return `
      <ul class="header-stack">
        ${categories
          .map(
            ([category, items]) => `
          <li>
            <span class="stack-category">${category}</span>
            ${items.map((item) => `<span class="chip">${item}</span>`).join(' ')}
          </li>`
          )
          .join('')}
      </ul>`;
  }
}

customElements.define('app-header', AppHeader);
