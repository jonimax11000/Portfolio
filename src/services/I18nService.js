import es from '../i18n/es.json';
import en from '../i18n/en.json';

const DICTIONARIES = { es, en };
export const SUPPORTED_LANGS = Object.keys(DICTIONARIES);
export const DEFAULT_LANG = 'es'; // Español por defecto; no se detecta idioma del navegador (BR)

/**
 * I18nService — literales de UI y atributo <html lang>.
 * Los literales viven en src/i18n/ y se bundlan (sin fetch extra, R33).
 */
export class I18nService {
  #lang = DEFAULT_LANG;

  get lang() {
    return this.#lang;
  }

  /** Cambia el idioma activo y actualiza <html lang> (AC accesibilidad). */
  setLang(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) return;
    this.#lang = lang;
    document.documentElement.setAttribute('lang', lang);
  }

  /**
   * Traducción por clave con puntos: t('portfolio.contador', { n: 5 }).
   * Interpola {placeholders}. Fallback: idioma por defecto → la propia clave.
   */
  t(key, params = {}) {
    const value =
      this.#lookup(DICTIONARIES[this.#lang], key) ??
      this.#lookup(DICTIONARIES[DEFAULT_LANG], key) ??
      key;
    return Object.entries(params).reduce(
      (text, [name, val]) => text.replaceAll(`{${name}}`, String(val)),
      value
    );
  }

  #lookup(dict, key) {
    return key.split('.').reduce((node, part) => node?.[part], dict);
  }
}
