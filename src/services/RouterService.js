/**
 * RouterService — enrutado SPA por hash (R35), sin recarga de página.
 * Rutas: #/ (portfolio), #/sobre-mi, #/ahora.
 * Hash routing: funciona en GitHub Pages sin configuración de servidor
 * (con History API, Pages devolvería 404 al recargar una subruta).
 */
const ROUTES = {
  '/': 'portfolio',
  '/sobre-mi': 'sobre-mi',
  '/ahora': 'ahora'
};

const PATHS = Object.fromEntries(Object.entries(ROUTES).map(([path, view]) => [view, path]));

export class RouterService {
  #onChange;
  #bound;

  /** @param {(view: string) => void} onChange callback con la vista activa */
  constructor(onChange) {
    this.#onChange = onChange;
    this.#bound = () => this.#onChange(this.currentView());
  }

  /** Vista actual a partir del hash; desconocido → portfolio. */
  currentView() {
    const path = location.hash.replace(/^#/, '') || '/';
    return ROUTES[path] ?? 'portfolio';
  }

  /** Navega a una vista cambiando el hash. */
  navigate(view) {
    const path = PATHS[view] ?? '/';
    if (location.hash === `#${path}`) {
      this.#onChange(this.currentView());
    } else {
      location.hash = `#${path}`;
    }
  }

  start() {
    window.addEventListener('hashchange', this.#bound);
    this.#onChange(this.currentView());
  }

  stop() {
    window.removeEventListener('hashchange', this.#bound);
  }
}
