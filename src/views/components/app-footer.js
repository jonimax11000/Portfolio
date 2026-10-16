/**
 * <app-footer> — pie con enlaces de navegación (R35).
 * Con la cabecera colapsada, la navegación sigue disponible aquí.
 *
 * Eventos: 'navigate' { view } (CustomEvent, bubbles, composed).
 */
export class AppFooter extends HTMLElement {
  #i18n = null;
  #view = 'portfolio';

  connectedCallback() {
    this.#render();
  }

  set props({ i18n, state }) {
    this.#i18n = i18n;
    this.#view = state?.view ?? this.#view;
    if (this.isConnected) this.#render();
  }

  #render() {
    const t = this.#i18n?.t?.bind(this.#i18n) ?? ((k) => k);
    const link = (view, label) =>
      `<a href="#${view === 'portfolio' ? '/' : `/${view}`}" data-nav="${view}" ${
        this.#view === view ? 'aria-current="page"' : ''
      }>${label}</a>`;

    this.innerHTML = `
      <footer class="site-footer">
        <nav aria-label="${t('footer.navegacion')}">
          <ul class="footer-nav">
            <li>${link('portfolio', t('nav.portfolio'))}</li>
            <li>${link('sobre-mi', t('nav.sobreMi'))}</li>
            <li>${link('ahora', t('nav.ahora'))}</li>
          </ul>
        </nav>
      </footer>
    `;

    this.querySelectorAll('[data-nav]').forEach((a) =>
      a.addEventListener('click', (event) => {
        event.preventDefault();
        this.dispatchEvent(
          new CustomEvent('navigate', { detail: { view: a.dataset.nav }, bubbles: true, composed: true })
        );
      })
    );
  }
}

customElements.define('app-footer', AppFooter);
