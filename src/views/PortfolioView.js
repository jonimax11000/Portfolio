import './components/project-card.js';
import './components/pagination-controls.js';

/**
 * PortfolioView — vista principal: destacados + filtros + contador +
 * listado paginado + orden + estados vacío/error (R8, R16–R22, R27–R29, R42, R44).
 * Clase que compone elementos (no custom element, Anexo B.2.2).
 * Solo renderiza desde el modelo; la lógica de eventos vive en ProjectsController.
 */
export class PortfolioView {
  #root;
  #i18n;
  #mediaQuery;
  #lastVm = null;
  // Estado de apertura de los filtros en móvil (R42): se conserva entre
  // re-renders para que el panel no se cierre solo al cambiar un filtro.
  #filtersOpen = false;

  /** @param {HTMLElement} root sección contenedora */
  constructor(root, i18n) {
    this.#root = root;
    this.#i18n = i18n;
    // R42: en móvil los filtros se muestran colapsables. Se evalúa por viewport
    // y se re-renderiza al cruzar el umbral (p. ej. al girar el dispositivo o
    // cambiar el zoom, que altera el viewport efectivo en px CSS).
    this.#mediaQuery = window.matchMedia('(min-width: 900px)');
    this.#mediaQuery.addEventListener('change', () => {
      if (this.#lastVm) this.render(this.#lastVm);
    });
  }

  /**
   * @param {object} vm view-model preparado por el controlador:
   * { status, featured, featuredIds, list: {items,total,totalPages,page},
   *   filterOptions: {tecnologias, anios}, state, lang }
   */
  render(vm) {
    const t = this.#i18n.t.bind(this.#i18n);
    const prev = this.#lastVm;
    this.#lastVm = vm;

    if (vm.status === 'error') {
      // R27: estado de error controlado. role="alert" para que el lector de
      // pantalla lo anuncie al aparecer (WCAG 4.1.3). Etiqueta de estado con
      // icono + texto (DESIGN §4: el color nunca va solo).
      this.#root.innerHTML = `
        <div class="state state-error" role="alert">
          <p class="state-label">
            <svg class="state-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
              <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/>
              <path d="M8 4.5v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="8" cy="11" r="0.9" fill="currentColor"/>
            </svg>
            ${t('portfolio.errorTitulo')}
          </p>
          <p class="state-text">${t('portfolio.error')}</p>
        </div>`;
      return;
    }
    if (vm.status === 'loading') {
      this.#root.innerHTML = '';
      return;
    }

    // R11/R13: si solo cambió la tarjeta expandida, actualizamos el atributo
    // `expanded` de cada tarjeta en sitio (transición CSS suave, sin destruir
    // el DOM ni perder el foco). Cualquier otro cambio re-renderiza.
    if (prev && this.#isExpansionOnlyChange(prev, vm)) {
      this.#syncExpansion(vm);
      return;
    }

    this.#root.innerHTML = `
      ${this.#renderFeatured(vm, t)}
      <section class="projects-section" aria-labelledby="projects-heading">
        <h2 id="projects-heading">${t('portfolio.proyectos')}</h2>
        ${this.#renderFilters(vm, t)}
        ${this.#renderList(vm, t)}
      </section>
    `;

    // R42: recuerda si el usuario tiene los filtros abiertos en móvil,
    // para no cerrarle el panel al re-renderizar tras cambiar un filtro.
    const filtersEl = this.#root.querySelector('[data-filters]');
    filtersEl?.addEventListener('toggle', () => {
      this.#filtersOpen = filtersEl.open;
    });

    this.#mountCards(vm);
  }

  #renderFeatured(vm, t) {
    if (!vm.featured.length) return '';
    return `
      <section class="featured-section" aria-labelledby="featured-heading">
        <h2 id="featured-heading">${t('portfolio.destacados')}</h2>
        <div class="card-grid" data-featured-grid></div>
      </section>`;
  }

  #renderFilters(vm, t) {
    const { filters } = vm.state;
    const { tecnologias, anios } = vm.filterOptions;
    const option = (value, label, selected) =>
      `<option value="${value}" ${selected === value ? 'selected' : ''}>${label}</option>`;

    return `
      <details class="filters" data-filters ${this.#isDesktop() || this.#filtersOpen ? 'open' : ''}>
        <summary aria-label="${t('portfolio.filtros')}">${t('portfolio.filtros')}</summary>
        <div class="filters-body">
          <label>
            ${t('portfolio.tecnologia')}
            <select data-filter="tecnologia">
              ${option('', t('portfolio.todas'), filters.tecnologia ?? '')}
              ${tecnologias.map((tech) => option(tech, tech, filters.tecnologia)).join('')}
            </select>
          </label>
          <label>
            ${t('portfolio.anio')}
            <select data-filter="anio">
              ${option('', t('portfolio.todos'), filters.anio ?? '')}
              ${anios.map((y) => option(y, y, filters.anio)).join('')}
            </select>
          </label>
          <label>
            ${t('portfolio.orden')}
            <select data-order>
              ${option('desc', t('portfolio.ordenDesc'), vm.state.order)}
              ${option('asc', t('portfolio.ordenAsc'), vm.state.order)}
            </select>
          </label>
        </div>
      </details>`;
  }

  #renderList(vm, t) {
    const { list } = vm;

    // R28: vacío global — no hay proyectos en absoluto (independiente de filtros).
    if (list.total === 0 && vm.projectsTotal === 0) {
      return `
        <div class="state state-empty">
          <svg class="state-illustration" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
            <rect x="6" y="10" width="36" height="26" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <path d="M6 18h36" stroke="currentColor" stroke-width="1.5"/>
            <path d="M14 26h12M14 30h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <p class="state-title">${t('portfolio.vacioGlobalTitulo')}</p>
          <p class="state-text">${t('portfolio.vacioGlobal')}</p>
        </div>`;
    }
    // R29 + R44: vacío por filtros — mensaje distinto al global y botón
    // "Limpiar filtros" que restaura el listado completo en página 1.
    if (list.total === 0) {
      return `
        <div class="state state-empty state-empty-filters">
          <svg class="state-illustration" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
            <path d="M8 12h32l-12 14v10l-8 4V26L8 12z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M33 33l8 8M41 33l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <p class="state-title">${t('portfolio.vacioFiltrosTitulo')}</p>
          <p class="state-text">${t('portfolio.vacioFiltros')}</p>
          <button type="button" class="btn-secondary" data-clear-filters>${t('portfolio.limpiarFiltros')}</button>
        </div>`;
    }

    const counterKey = list.total === 1 ? 'portfolio.contadorSingular' : 'portfolio.contador';
    return `
      <p class="results-counter" aria-live="polite">${t(counterKey, { n: list.total })}</p>
      <div class="card-grid" data-list-grid></div>
      <pagination-controls></pagination-controls>`;
  }

  #mountCards(vm) {
    const mount = (container, projects, featuredIds) => {
      if (!container) return;
      container.innerHTML = '';
      for (const project of projects) {
        const card = document.createElement('project-card');
        card.props = {
          project,
          i18n: this.#i18n,
          lang: vm.lang,
          expanded: vm.state.expandedProjectId === project.id,
          featured: featuredIds.has(project.id)
        };
        container.appendChild(card);
      }
    };

    mount(this.#root.querySelector('[data-featured-grid]'), vm.featured, vm.featuredIds);
    mount(this.#root.querySelector('[data-list-grid]'), vm.list.items, vm.featuredIds);

    const pagination = this.#root.querySelector('pagination-controls');
    if (pagination) {
      pagination.props = { page: vm.list.page, totalPages: vm.list.totalPages, i18n: this.#i18n };
    }
  }

  /**
   * Detecta que entre dos renders solo cambió `expandedProjectId`
   * (mismo idioma, mismos proyectos en las mismas posiciones, mismos filtros,
   * página y orden). En ese caso no hace falta re-renderizar.
   */
  #isExpansionOnlyChange(prev, next) {
    if (prev.lang !== next.lang || prev.status !== next.status) return false;
    if (prev.state.expandedProjectId === next.state.expandedProjectId) return false;
    const sameIds = (a, b) => a.length === b.length && a.every((p, i) => p.id === b[i]?.id);
    return (
      sameIds(prev.featured, next.featured) &&
      sameIds(prev.list.items, next.list.items) &&
      prev.list.page === next.list.page &&
      prev.list.total === next.list.total &&
      prev.state.order === next.state.order &&
      prev.state.filters.tecnologia === next.state.filters.tecnologia &&
      prev.state.filters.anio === next.state.filters.anio
    );
  }

  /** Actualiza la expansión en sitio: R12 (solo una) sin re-renderizar. */
  #syncExpansion(vm) {
    this.#root.querySelectorAll('project-card').forEach((card) => {
      card.props = { expanded: vm.state.expandedProjectId === card.projectId };
    });
  }

  #isDesktop() {
    return this.#mediaQuery.matches;
  }
}
