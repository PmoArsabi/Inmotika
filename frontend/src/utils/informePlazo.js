/** Plazo del director para aprobar/rechazar un informe en EN_APROBACION. */
export const PLAZO_APROBACION_MS = 2 * 60 * 60 * 1000;

/**
 * Calcula el tiempo restante del plazo de aprobación del director.
 * @param {string|null|undefined} enviadoDirectorAt - ISO de enviado_director_at
 * @returns {{ label: string, vencido: boolean }|null}
 */
export function tiempoRestanteDirector(enviadoDirectorAt) {
  if (!enviadoDirectorAt) return null;
  const diff = new Date(enviadoDirectorAt).getTime() + PLAZO_APROBACION_MS - Date.now();
  if (diff <= 0) return { label: 'Vencido', vencido: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return { label: `${h}h ${m}m restantes`, vencido: false };
}

/**
 * @param {string|null|undefined} enviadoDirectorAt
 * @returns {boolean}
 */
export function isPlazoDirectorVencido(enviadoDirectorAt) {
  return tiempoRestanteDirector(enviadoDirectorAt)?.vencido === true;
}
