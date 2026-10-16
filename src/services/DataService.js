/**
 * DataService — carga de los JSON de datos según el idioma activo (R40).
 * Errores controlados (R27). Los JSON se cargan al arranque (R33).
 * Rutas relativas: requisito de GitHub Pages (DEPLOY.md).
 *
 * Fuentes (Anexo A, validado contra los JSON reales):
 *  - profile.json:  { perfil: { foto, nombre, titular, claim, ubicacion,
 *                     disponibilidad, stack (categorías con arrays), correo,
 *                     github, linkedin, presentacion, sobreMi[], ahora[] } }
 *  - projects.json: { proyectos: [ { id, imagen, nombre, descripcion,
 *                     tecnologia (string), fecha ("YYYY-MM"), enlace } ] }
 *  - Versiones EN: profile.en.json / projects.en.json, misma estructura (R40).
 *
 * Todos los campos pueden faltar: el comportamiento es degradación
 * (R10, R14, R36), nunca error. Solo es error (R27) si la carga HTTP falla
 * o el JSON está malformado / no tiene la forma de documento esperada.
 */
export class DataService {
  #base;

  /** @param {string} base prefijo relativo de datos (por defecto 'data/') */
  constructor(base = 'data/') {
    this.#base = base;
  }

  /**
   * Carga perfil y proyectos del idioma indicado.
   * ES: profile.json / projects.json · EN: profile.en.json / projects.en.json
   * @param {'es'|'en'} lang
   * @returns {Promise<{profile: object, projects: Array}>}
   * @throws {Error} si alguna carga o parseo falla, o el documento no tiene
   *   la forma esperada (lo gestiona el llamador, R27).
   */
  async load(lang = 'es') {
    const suffix = lang === 'en' ? '.en.json' : '.json';
    const [profileData, projectsData] = await Promise.all([
      this.#fetchJson(`${this.#base}profile${suffix}`),
      this.#fetchJson(`${this.#base}projects${suffix}`)
    ]);
    return {
      profile: this.#readProfile(profileData),
      projects: this.#readProjects(projectsData)
    };
  }

  async #fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`DataService: ${url} → HTTP ${response.status}`);
    try {
      return await response.json();
    } catch {
      // JSON malformado → estado de error controlado (R27).
      throw new Error(`DataService: ${url} → JSON malformado`);
    }
  }

  /**
   * Extrae `perfil` validando la forma del documento.
   * Documento sin objeto `perfil` → error (R27). Campos internos ausentes
   * o con tipo inesperado → se normalizan y la vista los oculta (R36).
   */
  #readProfile(data) {
    if (!data || typeof data !== 'object' || data.perfil === null || typeof data.perfil !== 'object') {
      throw new Error('DataService: profile → falta el objeto "perfil"');
    }
    const p = data.perfil;
    return {
      ...p,
      sobreMi: Array.isArray(p.sobreMi) ? p.sobreMi : [],
      ahora: Array.isArray(p.ahora) ? p.ahora : [],
      stack: p.stack && typeof p.stack === 'object' && !Array.isArray(p.stack) ? p.stack : {}
    };
  }

  /**
   * Extrae `proyectos` validando la forma del documento.
   * Documento sin array `proyectos` → error (R27); array vacío → estado
   * vacío global (R28), no error. Entradas que no son objeto se descartan;
   * los campos opcionales ausentes degradan en la vista (R10, R14, R36).
   */
  #readProjects(data) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.proyectos)) {
      throw new Error('DataService: projects → falta el array "proyectos"');
    }
    return data.proyectos.filter((p) => p && typeof p === 'object' && !Array.isArray(p));
  }
}
