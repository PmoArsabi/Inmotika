/**
 * Capa API para sucursal: un solo lugar para persistencia (Supabase + Storage).
 * Usado por ClientNavigator (pestaña Sucursal) y BranchNavigator (vista dedicada).
 * Crear y editar reutilizan la misma lógica.
 */
import { supabase } from '../utils/supabase';
import { uploadAndSyncFile } from '../utils/storageUtils';

export function isNewSucursalId(id) {
  if (id == null || id === '') return true;
  const s = String(id);
  return s.startsWith('S-') || s.startsWith('NEW-SUC-') || s.startsWith('new-') || s.length < 20;
}

/**
 * Arma el payload para insert/update en tabla sucursal (snake_case).
 * @param {Object} branchDraft - draft del formulario (nombre, direccion, horarioAtencion, etc.)
 * @param {string} clienteId - UUID del cliente
 */
export function buildSucursalPayload(branchDraft, clienteId) {
  return {
    cliente_id: clienteId || null,
    nombre: (branchDraft.nombre || '').trim() || null,
    es_principal: !!branchDraft.esPrincipal,
    direccion: (branchDraft.direccion || '').trim() || null,
    ciudad: (branchDraft.ciudad || '').trim() || null,
    estado_depto: (branchDraft.estado_depto || '').trim() || null,
    pais: (branchDraft.pais || '').trim() || null,
    clasificacion: null,
    horarios_atencion: branchDraft.horarioAtencion || null,
    estado_id: (branchDraft.estadoId || '').trim() || null,
    latitud: (() => { const v = parseFloat(branchDraft.latitud); return (!branchDraft.latitud || isNaN(v)) ? null : parseFloat(v.toFixed(6)); })(),
    longitud: (() => { const v = parseFloat(branchDraft.longitud); return (!branchDraft.longitud || isNaN(v)) ? null : parseFloat(v.toFixed(6)); })(),
  };
}

/**
 * Sincroniza contratos de la sucursal: upsert en tabla contrato y subida de PDF a Storage.
 * @param {string} sucursalId - UUID de la sucursal
 * @param {string} clientId - UUID del cliente
 * @param {Object} branchDraft - draft con contratos[]
 * @param {Object} [catalogIds] - IDs de catálogo para crear visitas preventivas
 * @param {string} [catalogIds.tipoPreventivId] - UUID tipo_visita PREVENTIVO
 * @param {string} [catalogIds.estadoPendienteId] - UUID estado PENDIENTE
 * @param {string} [catalogIds.estadoProgramadaId] - UUID estado PROGRAMADA
 * @param {string} [catalogIds.userId] - UUID del usuario autenticado (coordinador)
 * @returns {Promise<Array>} contratos actualizados
 */
export async function syncSucursalContracts(sucursalId, clientId, branchDraft, catalogIds = {}) {
  const updated = [];
  for (const c of branchDraft.contratos || []) {
    const isNewId = !c.id || String(c.id).length < 20;
    const { data: row, error } = await supabase
      .from('contrato')
      .upsert({
        id: isNewId ? undefined : c.id,
        sucursal_id: sucursalId,
        cliente_id: clientId,
        tema: (c.tema || '').trim() || null,
        fecha_inicio: c.fechaInicio || null,
        fecha_fin: c.fechaFin || null,
        num_visitas_preventivas: c.numVisitasPreventivas ?? 0,
      })
      .select()
      .single();
    if (error) throw error;

    let finalUrl = c.documentoUrl || '';
    if (c.documentoUrl instanceof File) {
      finalUrl = await uploadAndSyncFile({
        file: c.documentoUrl,
        fileName: `${row.id}.pdf`,
        storageFolder: `sucursales/${sucursalId}/contratos`,
        dbTarget: { table: 'contrato', id: row.id, column: 'documento_url' },
      });
    }

    // Sincronizar visitas preventivas si hay slots con fecha inicio definida y catálogo disponible
    const fechas = (c.fechasPreventivas || []).filter(f => f && f.inicio);
    if (fechas.length > 0 && catalogIds.tipoPreventivId && catalogIds.userId) {
      await syncVisitasPreventivas({
        contratoId: row.id,
        sucursalId,
        clienteId: clientId,
        fechas,
        visitaIdsExistentes: c.visitaIdsPreventivas || [],
        ...catalogIds,
      });
    }

    updated.push({
      ...c,
      id: row.id,
      tema: row.tema,
      documentoUrl: finalUrl || row.documento_url || '',
      fechaInicio: row.fecha_inicio || c.fechaInicio || '',
      fechaFin: row.fecha_fin || c.fechaFin || '',
      numVisitasPreventivas: row.num_visitas_preventivas ?? 0,
      fechasPreventivas: c.fechasPreventivas || [],
    });
  }
  return updated;
}

/**
 * Crea o actualiza las solicitudes+visitas preventivas de un contrato.
 * Estrategia: por cada fecha en el array, busca si ya existe visita vinculada al contrato
 * (por contrato_id en observaciones como referencia) y actualiza su fecha; si no existe, crea.
 *
 * @param {Object} params
 * @param {string} params.contratoId
 * @param {string} params.sucursalId
 * @param {string} params.clienteId
 * @param {string[]} params.fechas - array de fechas ISO date (YYYY-MM-DD)
 * @param {string[]} params.visitaIdsExistentes - IDs de visitas ya creadas para este contrato
 * @param {string} params.tipoPreventivId
 * @param {string} params.estadoPendienteId
 * @param {string} params.estadoProgramadaId
 * @param {string} params.userId
 */
async function syncVisitasPreventivas({
  contratoId, sucursalId, clienteId, fechas,
  visitaIdsExistentes = [],
  tipoPreventivId, estadoPendienteId, estadoProgramadaId, userId,
}) {
  // Cargar visitas existentes vinculadas a este contrato
  const { data: visitasExistentes } = visitaIdsExistentes.length > 0
    ? await supabase.from('visita').select('id, fecha_programada, solicitud_id').in('id', visitaIdsExistentes)
    : { data: [] };

  const existentes = visitasExistentes || [];

  for (let i = 0; i < fechas.length; i++) {
    const slot = fechas[i];
    const fechaInicioISO = new Date(slot.inicio + 'T08:00:00').toISOString();
    const fechaFinISO    = slot.fin ? new Date(slot.fin + 'T18:00:00').toISOString() : null;
    const visitaExistente = existentes[i];

    if (visitaExistente) {
      // Actualizar fechas de visita y solicitud existentes
      await supabase
        .from('visita')
        .update({
          fecha_programada: fechaInicioISO,
          fecha_fin: fechaFinISO,
        })
        .eq('id', visitaExistente.id);

      if (visitaExistente.solicitud_id) {
        await supabase
          .from('solicitud_visita')
          .update({ fecha_sugerida: fechaInicioISO })
          .eq('id', visitaExistente.solicitud_id);
      }
    } else {
      // Crear solicitud + visita nuevas
      const { data: solicitud, error: solErr } = await supabase
        .from('solicitud_visita')
        .insert({
          cliente_id: clienteId,
          sucursal_id: sucursalId,
          creado_por: userId,
          tipo_visita_id: tipoPreventivId,
          fecha_sugerida: fechaInicioISO,
          motivo: `Visita preventiva ${i + 1} — Contrato ${contratoId}`,
          prioridad: 'MEDIA',
          estado_id: estadoProgramadaId || estadoPendienteId || null,
        })
        .select('id')
        .single();

      if (solErr) {
        console.error('[syncVisitasPreventivas] error creando solicitud:', solErr.message);
        continue;
      }

      await supabase
        .from('visita')
        .insert({
          solicitud_id: solicitud.id,
          coordinador_usuario_id: userId,
          cliente_id: clienteId,
          sucursal_id: sucursalId,
          tipo_visita_id: tipoPreventivId,
          fecha_programada: fechaInicioISO,
          fecha_fin: fechaFinISO,
          observaciones: `contrato:${contratoId}`,
          estado_id: estadoProgramadaId || null,
        });
    }
  }
}

/**
 * Sincroniza contactos asociados a la sucursal via tabla puente contacto_sucursal.
 * Estrategia: para cada contactId en el draft, asegurar que exista la fila.
 * No elimina filas de contactos no listados (el contacto puede pertenecer a varias sucursales).
 * @param {string} sucursalId
 * @param {string[]} contactIds - IDs de contactos a asociar
 */
export async function syncSucursalContactos(sucursalId, contactIds) {
  if (!contactIds || contactIds.length === 0) return;
  const rows = contactIds.map(cId => ({ contacto_id: cId, sucursal_id: sucursalId }));
  const { error } = await supabase
    .from('contacto_sucursal')
    .upsert(rows, { onConflict: 'contacto_id,sucursal_id', ignoreDuplicates: true });
  if (error) throw error;
}

/**
 * Sincroniza dispositivos asociados a la sucursal: actualiza dispositivo.sucursal_id.
 * Un dispositivo solo puede pertenecer a una sucursal a la vez.
 * @param {string} sucursalId
 * @param {string[]} deviceIds - IDs de dispositivos a asociar
 */
export async function syncSucursalDispositivos(sucursalId, deviceIds) {
  if (!deviceIds || deviceIds.length === 0) return;
  const { error } = await supabase
    .from('dispositivo')
    .update({ sucursal_id: sucursalId })
    .in('id', deviceIds);
  if (error) throw error;
}

/**
 * Persiste sucursal (insert o update), sincroniza contratos y contactos asociados.
 * Un solo punto de verdad: crear y editar usan la misma función.
 *
 * @param {Object} params
 * @param {string|null} params.sucursalId - id actual (null o "new-xxx" = crear; UUID = editar)
 * @param {string} params.clienteId - UUID del cliente
 * @param {Object} params.draft - draft del formulario
 * @returns {Promise<{ sucursalId: string, contratos: Array }>}
 */
export async function saveSucursal({ sucursalId, clienteId, draft, catalogIds = {} }) {
  const payload = buildSucursalPayload(draft, clienteId);
  const isNew = isNewSucursalId(sucursalId);
  let resolvedId = sucursalId;

  if (isNew) {
    const { data: inserted, error } = await supabase
      .from('sucursal')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw error;
    resolvedId = inserted?.id;
    if (!resolvedId) throw new Error('No se devolvió el id de la sucursal');
  } else {
    const { error } = await supabase
      .from('sucursal')
      .update(payload)
      .eq('id', sucursalId);
    if (error) throw error;
  }

  const contratos = await syncSucursalContracts(resolvedId, clienteId, draft, catalogIds);

  // Sincronizar contactos asociados desde el modal de asociar
  if (Array.isArray(draft.associatedContactIds) && draft.associatedContactIds.length > 0) {
    await syncSucursalContactos(resolvedId, draft.associatedContactIds);
  }

  // Sincronizar dispositivos asociados desde el modal de asociar
  if (Array.isArray(draft.associatedDeviceIds) && draft.associatedDeviceIds.length > 0) {
    await syncSucursalDispositivos(resolvedId, draft.associatedDeviceIds);
  }

  return { sucursalId: resolvedId, contratos };
}
