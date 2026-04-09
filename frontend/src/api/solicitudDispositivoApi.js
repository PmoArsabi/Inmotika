/**
 * API para la tabla solicitud_dispositivo.
 * Gestiona la sincronización del conjunto de dispositivos asociados
 * a una solicitud de visita (activar, desactivar, insertar).
 */
import { supabase } from '../utils/supabase';

/**
 * Sincroniza los dispositivos de una solicitud de visita.
 *
 * Algoritmo:
 *   - Dispositivos en `newIds` que no existen → INSERT activo=true
 *   - Dispositivos en `newIds` que estaban inactivos → UPDATE activo=true
 *   - Dispositivos que ya no están en `newIds` pero estaban activos → UPDATE activo=false
 *
 * @param {string}   solicitudId - UUID de la solicitud_visita
 * @param {string[]} newIds      - Lista completa de dispositivo_id que deben quedar activos
 * @returns {Promise<void>}
 * @throws {Error} Si alguna operación de BD falla
 */
export async function syncSolicitudDispositivos(solicitudId, newIds) {
  const { data: existing, error: fetchErr } = await supabase
    .from('solicitud_dispositivo')
    .select('id, dispositivo_id, activo')
    .eq('solicitud_id', solicitudId);

  if (fetchErr) throw new Error(`Error al leer dispositivos de solicitud: ${fetchErr.message}`);

  const existingMap = new Map((existing || []).map(e => [e.dispositivo_id, e]));
  const newSet = new Set(newIds);

  const toInsert = [];
  const toActivate = [];
  const toDeactivate = [];

  newSet.forEach(dId => {
    const ex = existingMap.get(dId);
    if (!ex) toInsert.push(dId);
    else if (!ex.activo) toActivate.push(ex.id);
  });

  existingMap.forEach((ex, dId) => {
    if (!newSet.has(dId) && ex.activo) toDeactivate.push(ex.id);
  });

  const ops = [];
  if (toDeactivate.length > 0) {
    ops.push(supabase.from('solicitud_dispositivo').update({ activo: false }).in('id', toDeactivate));
  }
  if (toActivate.length > 0) {
    ops.push(supabase.from('solicitud_dispositivo').update({ activo: true }).in('id', toActivate));
  }
  if (toInsert.length > 0) {
    ops.push(supabase.from('solicitud_dispositivo').insert(
      toInsert.map(dId => ({ solicitud_id: solicitudId, dispositivo_id: dId, activo: true }))
    ));
  }

  if (!ops.length) return;

  const results = await Promise.all(ops);
  const firstErr = results.find(r => r.error)?.error;
  if (firstErr) throw new Error(`Error sincronizando dispositivos: ${firstErr.message}`);
}
