/**
 * ProjectsController — eventos de la vista Portfolio → modelo.
 * Expansión exclusiva con bloqueo durante la transición + 300 ms (R11–R13),
 * filtros (R17, R18, R38), paginación (R16, R46), orden (R21) y
 * limpiar filtros (R44). Sin renderizado directo.
 * Anuncia el cambio de estado de las tarjetas a lectores de pantalla (R32).
 */
const TRANSITION_MS = 400; // duración de la animación de tarjeta (tokens.css)
const BLOCK_EXTRA_MS = 300; // bloqueo adicional tras la transición (R13)

export class ProjectsController {
  #state;
  #view;
  #i18n;
  #blockedUntil = 0;
  #announcer = null;
  #unblockTimer = null;

  /**
   * @param {AppState} state
   * @param {HTMLElement} root sección de la vista Portfolio (delegación de eventos)
   * @param {I18nService} i18n para los anuncios traducidos
   */
  constructor(state, root, i18n) {
    this.#state = state;
    this.#view = root;
    this.#i18n = i18n;
  }

  start() {
    // Live region persistente para anunciar expansión/colapso de tarjetas
    // (WCAG 4.1.3). Vive en <body>, fuera de la vista, porque el render
    // reemplaza el innerHTML de la sección y destruiría el nodo.
    this.#announcer = document.createElement('div');
    this.#announcer.className = 'visually-hidden';
    this.#announcer.setAttribute('aria-live', 'polite');
    document.body.appendChild(this.#announcer);

    // Delegación: los componentes se re-renderizan, los listeners viven en el contenedor.
    this.#view.addEventListener('card-toggle', (e) => this.#onCardToggle(e.detail.id, e.detail.nombre));
    this.#view.addEventListener('page-change', (e) => this.#onPageChange(e.detail.page));
    this.#view.addEventListener('change', (e) => this.#onChange(e));
    this.#view.addEventListener('click', (e) => {
      if (e.target.closest('[data-clear-filters]')) this.clearFilters();
    });
  }

  /** R12: solo una expandida. R13: bloqueo durante transición + 300 ms. */
  #onCardToggle(id, nombre) {
    if (this.#isBlocked() || !id) return;

    const { expandedProjectId } = this.#state.get();
    const expanding = expandedProjectId !== id;
    this.#block();
    this.#state.set({ expandedProjectId: expanding ? id : null });
    this.#announce(expanding ? 'tarjeta.expandida' : 'tarjeta.colapsada', nombre);
  }

  /** Anuncio al lector de pantalla del cambio de estado (R32). */
  #announce(key, nombre) {
    if (!this.#announcer || !this.#i18n) return;
    // Limpiar antes de escribir para que el lector repita aunque sea el mismo texto.
    this.#announcer.textContent = '';
    requestAnimationFrame(() => {
      this.#announcer.textContent = this.#i18n.t(key, { nombre: nombre ?? '' });
    });
  }

  /** R46: el orden se mantiene al paginar (solo cambia la página). */
  #onPageChange(page) {
    this.#state.set({ page });
  }

  #onChange(event) {
    const filterKey = event.target?.dataset?.filter;
    if (filterKey) {
      // R38: setFilters resetea a página 1.
      this.#state.setFilters({ [filterKey]: event.target.value || null });
      return;
    }
    if (event.target?.hasAttribute?.('data-order')) {
      this.#state.set({ order: event.target.value === 'asc' ? 'asc' : 'desc', page: 1 });
    }
  }

  /** R44: restaura el listado completo en página 1. */
  clearFilters() {
    this.#state.setFilters({ tecnologia: null, anio: null });
  }

  #isBlocked() {
    return Date.now() < this.#blockedUntil;
  }

  /**
   * R13: bloquea TODA activación de tarjetas (click, teclado, lector de
   * pantalla) durante la transición + 300 ms. Además de ignorar toggles en
   * este controlador, marca cada <project-card> como `disabled` (botón
   * nativo deshabilitado: sin foco, sin click, sin activación por AT).
   */
  #block() {
    this.#blockedUntil = Date.now() + TRANSITION_MS + BLOCK_EXTRA_MS;
    this.#setCardsDisabled(true);
    clearTimeout(this.#unblockTimer);
    this.#unblockTimer = setTimeout(
      () => this.#setCardsDisabled(false),
      TRANSITION_MS + BLOCK_EXTRA_MS
    );
  }

  #setCardsDisabled(disabled) {
    this.#view.querySelectorAll('project-card').forEach((card) => {
      card.props = { disabled };
    });
  }
}
