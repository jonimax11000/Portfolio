/**
 * HeaderController — colapso de cabecera por scroll (R4, R5).
 * Umbral: al llegar al primer proyecto; se expande al volver arriba del todo.
 * Usa ResizeObserver para re-evaluar cuando el DOM cambia (tarjetas renderizadas
 * de forma asíncrona tras la carga de datos).
 */
export class HeaderController {
  #header;
  #fallbackThreshold = 200; // fallback hasta que exista la primera tarjeta
  #onScroll;
  #collapsed = false;
  #observer = null;

  /** @param {HTMLElement} headerElement el <app-header> */
  constructor(headerElement) {
    this.#header = headerElement;
    this.#onScroll = () => this.#evaluate();
  }

  start() {
    window.addEventListener('scroll', this.#onScroll, { passive: true });
    this.#observeContent();
    this.#evaluate();
  }

  stop() {
    window.removeEventListener('scroll', this.#onScroll);
    this.#observer?.disconnect();
  }

  /** Re-evalúa el umbral cuando el contenido cambia (tarjetas cargadas). */
  #observeContent() {
    const main = document.querySelector('main');
    if (!main) return;

    this.#observer = new MutationObserver(() => this.#evaluate());
    this.#observer.observe(main, { childList: true, subtree: true });
  }

  #evaluate() {
    const firstCard = document.querySelector('project-card');
    const threshold = firstCard
      ? firstCard.getBoundingClientRect().top + window.scrollY - 56 // alto barra superior (DESIGN §3)
      : this.#fallbackThreshold;

    const shouldCollapse = window.scrollY >= threshold;
    if (shouldCollapse !== this.#collapsed) {
      this.#collapsed = shouldCollapse;
      if (shouldCollapse) {
        this.#header.setAttribute('collapsed', '');
      } else {
        this.#header.removeAttribute('collapsed');
      }
    }
  }
}
