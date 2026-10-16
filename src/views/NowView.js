/**
 * NowView — vista "Ahora": ahora[] (R7).
 * Degradación: si ahora[] está vacío o falta, la sección se oculta (R36).
 */
export class NowView {
  #root;
  #i18n;

  constructor(root, i18n) {
    this.#root = root;
    this.#i18n = i18n;
  }

  /** @param {{profile: object, status: string}} vm */
  render({ profile, status }) {
    const t = this.#i18n.t.bind(this.#i18n);

    if (status === 'error') {
      // R27: mismo estado de error controlado que la vista Portfolio.
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
    if (status !== 'ready') {
      this.#root.innerHTML = '';
      return;
    }

    const ahora = Array.isArray(profile.ahora) ? profile.ahora.filter(Boolean) : [];
    if (ahora.length === 0) {
      this.#root.innerHTML = '';
      return;
    }

    this.#root.innerHTML = `
      <h1>${t('nav.ahora')}</h1>
      <div class="reading-width">
        <ul class="now-list">
          ${ahora.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    `;
  }
}
