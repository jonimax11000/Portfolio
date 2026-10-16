import { KEYS } from '../services/StorageService.js';
import { DEFAULT_LANG, SUPPORTED_LANGS } from '../services/I18nService.js';

/**
 * AppController — orquestación global: idioma (R43, R47), tema claro/oscuro
 * y alto contraste (R30, R31, R39), navegación SPA (R35) y contacto
 * mailto con asunto traducido (R23, R48).
 * Conecta eventos de vista → modelo/servicios. Sin renderizado directo.
 */
export class AppController {
  #state;
  #i18n;
  #storage;
  #router;
  #data;
  #onDataReload;

  constructor({ state, i18n, storage, router, data, onDataReload }) {
    this.#state = state;
    this.#i18n = i18n;
    this.#storage = storage;
    this.#router = router;
    this.#data = data;
    this.#onDataReload = onDataReload;
  }

  /** Restaura preferencias persistidas y aplica el estado inicial. */
  init() {
    const lang = this.#storage.get(KEYS.lang);
    const theme = this.#storage.get(KEYS.theme);
    const hc = this.#storage.get(KEYS.hc);

    const initial = {};
    if (SUPPORTED_LANGS.includes(lang)) initial.lang = lang;
    if (theme === 'dark' || theme === 'light') initial.theme = theme;
    if (hc === 'true' || hc === 'false') initial.hc = hc === 'true';

    this.#state.set(initial);
    this.#i18n.setLang(this.#state.get().lang ?? DEFAULT_LANG);
    this.#applyThemeAttributes();

    document.addEventListener('navigate', (e) => {
      const previous = this.#state.get().view;
      this.#router.navigate(e.detail.view);
      // Al cambiar de vista se vuelve arriba del todo: la cabecera se expande
      // y la navegación queda visible en el nuevo contexto (R35).
      if (e.detail.view !== previous) window.scrollTo(0, 0);
    });
    document.addEventListener('toggle-lang', () => this.toggleLang());
    document.addEventListener('toggle-theme', () => this.toggleTheme());
    document.addEventListener('toggle-hc', () => this.toggleHc());
    document.addEventListener('contact', () => this.contact());
  }

  /** Cambio de idioma: persiste (R47), recarga contenidos, mantiene filtros y tarjeta (R43). */
  async toggleLang() {
    const next = this.#state.get().lang === 'es' ? 'en' : 'es';
    this.#i18n.setLang(next);
    this.#storage.set(KEYS.lang, next);
    this.#state.set({ lang: next });
    await this.#onDataReload(next);
  }

  toggleTheme() {
    const theme = this.#state.get().theme === 'dark' ? 'light' : 'dark';
    this.#storage.set(KEYS.theme, theme);
    this.#state.set({ theme });
    this.#applyThemeAttributes();
  }

  toggleHc() {
    const hc = !this.#state.get().hc;
    this.#storage.set(KEYS.hc, String(hc));
    this.#state.set({ hc });
    this.#applyThemeAttributes();
  }

  /** mailto: estándar con asunto predefinido traducido, sin cuerpo (R48). */
  contact() {
    const correo = this.#data.profile?.correo;
    if (!correo) return;
    const subject = encodeURIComponent(this.#i18n.t('contacto.asunto'));
    window.location.href = `mailto:${correo}?subject=${subject}`;
  }

  /** Temas por atributo en <html>: 4 combinaciones sin duplicar hojas (Anexo B.2.8). */
  #applyThemeAttributes() {
    const { theme, hc } = this.#state.get();
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-hc', String(hc));
  }
}
