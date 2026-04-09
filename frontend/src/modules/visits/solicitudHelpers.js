/**
 * Helpers de solicitud de visita.
 * Separados de los componentes para compatibilidad con React Fast Refresh.
 */

/**
 * Returns a blank solicitud draft object.
 * @returns {{ clienteId: string, clienteNombre: string, sucursalId: string, sucursalNombre: string, tipoVisitaCodigo: string, dispositivoIds: string[], dispositivosNombres: string[], fechaSugerida: string, motivo: string }}
 */
const emptySolicitud = () => ({
  clienteId: '',
  clienteNombre: '',
  sucursalId: '',
  sucursalNombre: '',
  tipoVisitaCodigo: '',
  dispositivoIds: [],
  dispositivosNombres: [],
  fechaSugerida: '',
  motivo: '',
});

/**
 * Convierte una SolicitudVisita del hook en un draft editable.
 * @param {object} sol - Solicitud del hook useSolicitudesVisita
 * @returns {object} Draft editable con los mismos datos
 */
const solicitudToDraft = (sol) => ({
  clienteId:           sol.clienteId,
  clienteNombre:       sol.clienteNombre,
  sucursalId:          sol.sucursalId,
  sucursalNombre:      sol.sucursalNombre,
  tipoVisitaCodigo:    sol.tipoVisitaCodigo,
  dispositivoIds:      sol.dispositivoIds,
  dispositivosNombres: sol.dispositivosNombres,
  fechaSugerida:       sol.fechaSugerida
    ? new Date(sol.fechaSugerida).toISOString().slice(0, 16)
    : '',
  motivo: sol.motivo,
});

export { emptySolicitud, solicitudToDraft };
