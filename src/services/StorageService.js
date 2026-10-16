const PREFIX = 'portfolio:';
export const KEYS = {
  lang: `${PREFIX}lang`,   // R47
  theme: `${PREFIX}theme`, // R39
  hc: `${PREFIX}hc`        // R39
};

/**
 * StorageService — persistencia en localStorage de idioma y temas.
 * Interfaz mínima; tolera entornos sin localStorage (modo privado, etc.).
 */
export class StorageService {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* almacenamiento no disponible: la app sigue funcionando sin persistencia */
    }
  }
}
