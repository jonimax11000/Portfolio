import { normalizeText } from './formatters.js';

export const PAGE_SIZE = 5; // Paginación fija de 5 (R16)
export const FEATURED_COUNT = 3; // Destacados: 3 primeros del JSON por orden (R20)

/**
 * ProjectModel — lógica de dominio pura sobre la lista de proyectos.
 * Sin DOM, sin fetch. Filtrado (R17–R19, R37), ordenación (R21, R45),
 * paginación (R16, R38, R46) y destacados (R20).
 */
export class ProjectModel {
  /** @param {Array} projects lista cruda del JSON del idioma activo */
  constructor(projects = []) {
    this.projects = Array.isArray(projects) ? projects : [];
  }

  /** Destacados: los 3 primeros por orden del JSON (R20). No filtran ni paginan. */
  getFeatured() {
    return this.projects.slice(0, FEATURED_COUNT);
  }

  /** IDs de destacados, para marcar el badge en el listado general (R22). */
  getFeaturedIds() {
    return new Set(this.getFeatured().map((p) => p.id));
  }

  /**
   * Ordena por fecha. Los proyectos sin fecha van siempre al final (R45).
   * @param {Array} list
   * @param {'asc'|'desc'} order
   */
  sortByDate(list, order = 'desc') {
    const withDate = list.filter((p) => p.fecha);
    const withoutDate = list.filter((p) => !p.fecha);
    withDate.sort((a, b) =>
      order === 'asc' ? a.fecha.localeCompare(b.fecha) : b.fecha.localeCompare(a.fecha)
    );
    return [...withDate, ...withoutDate];
  }

  /**
   * Filtra por tecnología y año, combinables e insensibles a mayúsculas y tildes (R17, R18, R37).
   * @param {{tecnologia?: string|null, anio?: string|null}} filters
   */
  filter(list, { tecnologia = null, anio = null } = {}) {
    const tech = tecnologia ? normalizeText(tecnologia) : null;
    return list.filter((p) => {
      if (tech && normalizeText(p.tecnologia ?? '') !== tech) return false;
      if (anio && !(p.fecha ?? '').startsWith(String(anio))) return false;
      return true;
    });
  }

  /**
   * Listado general: filtrado + ordenado + paginado.
   * @returns {{items: Array, total: number, totalPages: number, page: number}}
   */
  query({ filters = {}, order = 'desc', page = 1 } = {}) {
    const filtered = this.filter(this.projects, filters);
    const sorted = this.sortByDate(filtered, order);
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const items = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    return { items, total, totalPages, page: safePage };
  }

  /** Valores únicos para los selectores de filtro. */
  getFilterOptions() {
    const tecnologias = [...new Set(this.projects.map((p) => p.tecnologia).filter(Boolean))];
    const anios = [
      ...new Set(this.projects.map((p) => (p.fecha ? p.fecha.slice(0, 4) : null)).filter(Boolean))
    ].sort((a, b) => b.localeCompare(a));
    return { tecnologias, anios };
  }
}
