/**
 * AppState — store observable único (Anexo B.2.6).
 * Estado global: idioma, tema, vista activa, filtros, página, orden, tarjeta expandida.
 * JS puro: sin DOM, sin fetch. Las vistas se suscriben a cambios.
 */
export class AppState {
  #state;
  #listeners = new Set();

  constructor(initial = {}) {
    this.#state = {
      lang: 'es',
      theme: 'light',      // 'light' | 'dark'
      hc: false,           // alto contraste (modificador independiente, R31)
      view: 'portfolio',   // 'portfolio' | 'sobre-mi' | 'ahora'
      filters: { tecnologia: null, anio: null },
      page: 1,
      order: 'desc',       // 'asc' | 'desc' (por fecha; defecto descendente, BR)
      expandedProjectId: null,
      status: 'loading',   // 'loading' | 'ready' | 'error'
      ...initial
    };
  }

  get() {
    return { ...this.#state, filters: { ...this.#state.filters } };
  }

  /** Actualiza parcialmente el estado y notifica a los suscriptores. */
  set(patch) {
    const prev = this.#state;
    this.#state = { ...prev, ...patch };
    this.#notify(this.#state, prev);
  }

  setFilters(filters) {
    // Al aplicar o cambiar filtros, la paginación vuelve a la página 1 (R38).
    this.set({ filters: { ...this.#state.filters, ...filters }, page: 1 });
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #notify(next, prev) {
    for (const listener of this.#listeners) listener(next, prev);
  }
}
