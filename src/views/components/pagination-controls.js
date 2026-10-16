/**
 * <pagination-controls> — paginación accesible por teclado.
 *
 * Props: { page, totalPages, i18n }
 * Eventos: 'page-change' { page } (CustomEvent, bubbles, composed).
 */
export class PaginationControls extends HTMLElement {
  #props = { page: 1, totalPages: 1, i18n: null };

  connectedCallback() {
    this.#render();
  }

  set props(value) {
    this.#props = { ...this.#props, ...value };
    if (this.isConnected) this.#render();
  }

  #render() {
    const { page, totalPages, i18n } = this.#props;
    const t = i18n?.t?.bind(i18n) ?? ((k) => k);

    if (totalPages <= 1) {
      this.innerHTML = '';
      return;
    }

    this.innerHTML = `
      <nav class="pagination" aria-label="${t('portfolio.proyectos')}">
        <button type="button" class="btn-secondary" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>
          ${t('paginacion.anterior')}
        </button>
        <span class="pagination-status" aria-live="polite">
          ${t('paginacion.pagina', { n: page, total: totalPages })}
        </span>
        <button type="button" class="btn-secondary" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>
          ${t('paginacion.siguiente')}
        </button>
      </nav>
    `;

    this.querySelectorAll('[data-page]').forEach((btn) =>
      btn.addEventListener('click', () => {
        this.dispatchEvent(
          new CustomEvent('page-change', {
            detail: { page: Number(btn.dataset.page) },
            bubbles: true,
            composed: true
          })
        );
      })
    );
  }
}

customElements.define('pagination-controls', PaginationControls);
