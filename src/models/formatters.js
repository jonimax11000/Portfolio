/**
 * formatters — funciones puras de presentación de datos.
 */

const MONTHS = {
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
};

/**
 * Normaliza texto para comparaciones insensibles a mayúsculas y tildes (R37).
 * "JavaScript" === "javascript" === "JávaScript".
 */
export function normalizeText(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * "YYYY-MM" → "Mes AAAA" según idioma (R41).
 * ES: "Septiembre 2026" · EN: "September 2026".
 * Devuelve null si la fecha no tiene el formato esperado (degradación, R36).
 */
export function formatMonthYear(fecha, lang = 'es') {
  if (!fecha || !/^\d{4}-\d{2}$/.test(fecha)) return null;
  const [year, month] = fecha.split('-').map(Number);
  const names = MONTHS[lang] ?? MONTHS.es;
  const name = names[month - 1];
  return name ? `${name} ${year}` : null;
}
