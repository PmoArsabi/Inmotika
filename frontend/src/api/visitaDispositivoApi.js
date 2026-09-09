/**
 * Sincroniza dispositivos y técnicos de una visita y registra el historial de cambios.
 */
import { supabase } from '../utils/supabase';
import { syncSolicitudDispositivos } from './solicitudDispositivoApi';

/**
 * @typedef {Object} HistorialCambioVisita
 * @property {string} id
 * @property {'AGREGADO'|'REMOVIDO'} accion
 * @property {'DISPOSITIVO'|'TECNICO'} tipoEntidad
 * @property {string|null} motivo
 * @property {string} createdAt
 * @property {string} entidadLabel
 * @property {string} usuarioNombre
 */

const HISTORIAL_SELECT = `
  id,
  accion,
  motivo,
  created_at,
  tipo_entidad,
  dispositivo_id,
  tecnico_id,
  dispositivo:dispositivo_id(id, serial, id_inmotika, codigo_unico, modelo),
  tecnico:tecnico_id(id, perfil_usuario:usuario_id(nombres, apellidos)),
  usuario:usuario_id(nombres, apellidos)
`;

const HISTORIAL_SELECT_LEGACY = `
  id,
  accion,
  motivo,
  created_at,
  dispositivo_id,
  dispositivo:dispositivo_id(id, serial, id_inmotika, codigo_unico, modelo),
  usuario:usuario_id(nombres, apellidos)
`;

function mapHistorialRow(row) {
  const d = row.dispositivo;
  const t = row.tecnico?.perfil_usuario;
  const u = row.usuario;
  const tipoEntidad = row.tipo_entidad === 'TECNICO' ? 'TECNICO' : 'DISPOSITIVO';
  const dispositivoLabel = d?.serial || d?.id_inmotika || d?.codigo_unico || d?.modelo || row.dispositivo_id;
  const tecnicoLabel = `${t?.nombres || ''} ${t?.apellidos || ''}`.trim() || row.tecnico_id;
  return {
    id: row.id,
    accion: row.accion,
    tipoEntidad,
    motivo: row.motivo || null,
    createdAt: row.created_at,
    entidadLabel: tipoEntidad === 'TECNICO' ? tecnicoLabel : dispositivoLabel,
    usuarioNombre: `${u?.nombres || ''} ${u?.apellidos || ''}`.trim() || 'Usuario',
  };
}

/**
 * @param {string} visitaId
 * @returns {Promise<HistorialCambioVisita[]>}
 */
export async function fetchHistorialDispositivoVisita(visitaId) {
  if (!visitaId) return [];

  const query = (select) => supabase
    .from('historial_dispositivo_visita')
    .select(select)
    .eq('visita_id', visitaId)
    .order('created_at', { ascending: false });

  const full = await query(HISTORIAL_SELECT);
  if (!full.error) return (full.data || []).map(mapHistorialRow);

  const legacy = await query(HISTORIAL_SELECT_LEGACY);
  if (legacy.error) throw new Error(`No se pudo cargar el historial: ${legacy.error.message}`);
  return (legacy.data || []).map(mapHistorialRow);
}

async function insertHistorial(rows) {
  if (!rows.length) return;
  const { error } = await supabase
    .from('historial_dispositivo_visita')
    .insert(rows);
  if (!error) return;

  const missingNewCols = /tipo_entidad|tecnico_id/i.test(error.message);
  if (missingNewCols) {
    if (rows.some(r => r.tipo_entidad === 'TECNICO')) {
      throw new Error('Falta actualizar el historial. Ejecuta Database/historial_dispositivo_visita_tecnicos.sql en el SQL Editor de Supabase.');
    }
    const legacyRows = rows.map(({ tipo_entidad, tecnico_id, ...rest }) => rest);
    const retry = await supabase.from('historial_dispositivo_visita').insert(legacyRows);
    if (!retry.error) return;
    throw new Error(`No se pudo registrar el historial de cambios: ${retry.error.message}`);
  }

  const missingTable = error.code === 'PGRST205' || /historial_dispositivo_visita/i.test(error.message);
  throw new Error(
    missingTable
      ? 'Falta crear la tabla de historial. Ejecuta Database/historial_dispositivo_visita.sql en el SQL Editor de Supabase.'
      : `No se pudo registrar el historial de cambios: ${error.message}`
  );
}

/**
 * Actualiza los dispositivos asociados a la solicitud, alinea intervenciones
 * de la visita y deja rastro en historial_dispositivo_visita.
 *
 * @param {{
 *   visitaId: string,
 *   solicitudId: string,
 *   newIds: string[],
 *   usuarioId: string,
 *   motivo?: string|null,
 * }} params
 * @returns {Promise<{ added: string[], removed: string[] }>}
 */
export async function syncDispositivosVisita({
  visitaId,
  solicitudId,
  newIds,
  usuarioId,
  motivo = null,
}) {
  if (!solicitudId) throw new Error('La visita no tiene solicitud origen para actualizar dispositivos.');

  const { data: existing, error: fetchErr } = await supabase
    .from('solicitud_dispositivo')
    .select('dispositivo_id, activo')
    .eq('solicitud_id', solicitudId);

  if (fetchErr) throw new Error(`Error al leer dispositivos de la visita: ${fetchErr.message}`);

  const currentActive = new Set(
    (existing || []).filter(e => e.activo !== false).map(e => e.dispositivo_id)
  );
  const newSet = new Set(newIds);

  const added = [...newSet].filter(id => !currentActive.has(id));
  const removed = [...currentActive].filter(id => !newSet.has(id));

  if (added.length === 0 && removed.length === 0) {
    return { added, removed };
  }

  await syncSolicitudDispositivos(solicitudId, newIds);

  if (visitaId && removed.length > 0) {
    const { error } = await supabase
      .from('intervencion')
      .update({ activo: false })
      .eq('visita_id', visitaId)
      .in('dispositivo_id', removed);
    if (error) throw new Error(`No se pudieron desactivar las intervenciones: ${error.message}`);
  }

  if (visitaId && added.length > 0) {
    const { error } = await supabase
      .from('intervencion')
      .update({ activo: true })
      .eq('visita_id', visitaId)
      .in('dispositivo_id', added);
    if (error) throw new Error(`No se pudieron reactivar las intervenciones: ${error.message}`);
  }

  if (visitaId) {
    await insertHistorial([
      ...added.map(dispositivo_id => ({
        visita_id: visitaId,
        solicitud_id: solicitudId,
        dispositivo_id,
        tecnico_id: null,
        tipo_entidad: 'DISPOSITIVO',
        accion: 'AGREGADO',
        motivo: motivo || null,
        usuario_id: usuarioId || null,
      })),
      ...removed.map(dispositivo_id => ({
        visita_id: visitaId,
        solicitud_id: solicitudId,
        dispositivo_id,
        tecnico_id: null,
        tipo_entidad: 'DISPOSITIVO',
        accion: 'REMOVIDO',
        motivo: motivo || null,
        usuario_id: usuarioId || null,
      })),
    ]);
  }

  return { added, removed };
}

/**
 * Reemplaza técnicos asignados a una visita en curso y deja rastro en el historial.
 *
 * @param {{
 *   visitaId: string,
 *   solicitudId?: string|null,
 *   newIds: string[],
 *   usuarioId: string,
 *   motivo?: string|null,
 * }} params
 * @returns {Promise<{ added: string[], removed: string[] }>}
 */
export async function syncTecnicosVisita({
  visitaId,
  solicitudId = null,
  newIds,
  usuarioId,
  motivo = null,
}) {
  if (!visitaId) throw new Error('Falta la visita para actualizar técnicos.');
  if (!newIds?.length) throw new Error('Debes dejar al menos un técnico asignado.');

  const { data: existing, error: fetchErr } = await supabase
    .from('visita_tecnico')
    .select('id, tecnico_id, es_lider')
    .eq('visita_id', visitaId);

  if (fetchErr) throw new Error(`Error al leer técnicos de la visita: ${fetchErr.message}`);

  const existingMap = new Map((existing || []).map(e => [e.tecnico_id, e]));
  const newSet = new Set(newIds);

  const added = [...newSet].filter(id => !existingMap.has(id));
  const removed = [...existingMap.keys()].filter(id => !newSet.has(id));

  if (added.length === 0 && removed.length === 0) {
    return { added, removed };
  }

  const removedIds = removed.map(id => existingMap.get(id).id);
  const leaderRemoved = removed.some(id => existingMap.get(id)?.es_lider);

  if (removedIds.length > 0) {
    const { error } = await supabase.from('visita_tecnico').delete().in('id', removedIds);
    if (error) throw new Error(`No se pudieron retirar los técnicos: ${error.message}`);
  }

  if (added.length > 0) {
    const remainingCount = existingMap.size - removed.length;
    const { error } = await supabase.from('visita_tecnico').insert(
      added.map((tecnico_id, idx) => ({
        visita_id: visitaId,
        tecnico_id,
        es_lider: remainingCount === 0 && idx === 0,
      }))
    );
    if (error) throw new Error(`No se pudieron asignar los técnicos: ${error.message}`);
  }

  if (leaderRemoved) {
    const { data: remaining } = await supabase
      .from('visita_tecnico')
      .select('id, es_lider')
      .eq('visita_id', visitaId)
      .order('created_at', { ascending: true });
    const hasLeader = (remaining || []).some(r => r.es_lider);
    if (!hasLeader && remaining?.[0]) {
      const { error } = await supabase
        .from('visita_tecnico')
        .update({ es_lider: true })
        .eq('id', remaining[0].id);
      if (error) throw new Error(`No se pudo reasignar el técnico líder: ${error.message}`);
    }
  }

  await insertHistorial([
    ...added.map(tecnico_id => ({
      visita_id: visitaId,
      solicitud_id: solicitudId || null,
      dispositivo_id: null,
      tecnico_id,
      tipo_entidad: 'TECNICO',
      accion: 'AGREGADO',
      motivo: motivo || null,
      usuario_id: usuarioId || null,
    })),
    ...removed.map(tecnico_id => ({
      visita_id: visitaId,
      solicitud_id: solicitudId || null,
      dispositivo_id: null,
      tecnico_id,
      tipo_entidad: 'TECNICO',
      accion: 'REMOVIDO',
      motivo: motivo || null,
      usuario_id: usuarioId || null,
    })),
  ]);

  return { added, removed };
}
