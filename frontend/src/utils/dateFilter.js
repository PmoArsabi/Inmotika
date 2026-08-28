/**
 * Normaliza un ISO/timestamp a clave de calendario local `YYYY-MM-DD`.
 * Usa la zona horaria del navegador para coincidir con la columna visible.
 * @param {string|Date|null|undefined} value
 * @returns {string|null}
 */
export function toDateKey(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * ¿La fecha cae dentro del rango inclusivo [desde, hasta]?
 * Si hay filtro de fechas y no hay fecha en el registro → no coincide.
 * @param {string|Date|null|undefined} value
 * @param {string} [desde] - YYYY-MM-DD
 * @param {string} [hasta] - YYYY-MM-DD
 */
export function matchesDateRange(value, desde = '', hasta = '') {
  if (!desde && !hasta) return true;
  const key = toDateKey(value);
  if (!key) return false;
  if (desde && key < desde) return false;
  if (hasta && key > hasta) return false;
  return true;
}
