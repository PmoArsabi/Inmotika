/**
 * Capa API para sucursal: un solo lugar para persistencia (Supabase + Storage).
 * Usado por ClientNavigator (pestaña Sucursal) y BranchNavigator (vista dedicada).
 * Crear y editar reutilizan la misma lógica.
 */
import { supabase } from '../utils/supabase';
import { uploadAndSyncFile } from '../utils/storageUtils';
import { syncCoordinadorSucursales } from './coordinadorSucursalApi';

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
    let visitaIdsActualizados = c.visitaIdsPreventivas || [];
    if (fechas.length > 0 && catalogIds.tipoPreventivId && catalogIds.userId) {
      const nuevosIds = await syncVisitasPreventivas({
        contratoId: row.id,
        sucursalId,
        clienteId: clientId,
        fechas,
        visitaIdsExistentes: c.visitaIdsPreventivas || [],
        ...catalogIds,
      });
      // Guardar IDs retornados (pueden incluir nulls si hubo error puntual)
      visitaIdsActualizados = (nuevosIds || []).filter(Boolean);
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
      visitaIdsPreventivas: visitaIdsActualizados,
    });
  }
  return updated;
}

/**
 * Calcula los dispositivos activos de la sucursal elegibles para una visita preventiva
 * dado el rango de fechas del slot.
 *
 * Elegibles:
 *   - fecha_proximo_mantenimiento IS NULL (nunca intervenidos — siempre incluir)
 *   - fecha_proximo_mantenimiento <= fechaFinSlot (vencen dentro o antes del slot)
 *
 * Próximos a vencer (alerta, 30 días después del fin del slot):
 *   - fecha_proximo_mantenimiento BETWEEN fechaFinSlot+1 AND fechaFinSlot+30
 *
 * @param {string} sucursalId
 * @param {string} fechaFinSlot - ISO date string (YYYY-MM-DD) del fin del slot
 * @param {string} [activoEstadoId] - UUID del estado ACTIVO en catalogo_estado_general (opcional, filtro extra)
 * @returns {Promise<{ elegibles: string[], proximosAlerta: string[] }>} arrays de dispositivo UUIDs
 */
async function calcularDispositivosElegibles(sucursalId, fechaFinSlot, activoEstadoId) {
  // Traer todos los dispositivos activos de la sucursal con frecuencia definida
  let query = supabase
    .from('dispositivo')
    .select('id, fecha_proximo_mantenimiento')
    .eq('sucursal_id', sucursalId);

  if (activoEstadoId) {
    query = query.eq('estado_id', activoEstadoId);
  }

  const { data: dispositivos, error } = await query;
  if (error || !dispositivos) return { elegibles: [], proximosAlerta: [] };

  const finSlot = new Date(fechaFinSlot + 'T23:59:59');
  const alertaHasta = new Date(finSlot);
  alertaHasta.setDate(alertaHasta.getDate() + 30);

  const elegibles = [];
  const proximosAlerta = [];

  for (const d of dispositivos) {
    if (!d.fecha_proximo_mantenimiento) {
      // Nunca intervenidos — siempre incluir
      elegibles.push(d.id);
    } else {
      const fpm = new Date(d.fecha_proximo_mantenimiento);
      if (fpm <= finSlot) {
        elegibles.push(d.id);
      } else if (fpm > finSlot && fpm <= alertaHasta) {
        proximosAlerta.push(d.id);
      }
    }
  }

  return { elegibles, proximosAlerta };
}

/**
 * Sincroniza los dispositivos elegibles en solicitud_dispositivo para una solicitud dada.
 * - Inserta los nuevos elegibles (upsert, ignorando duplicados).
 * - Marca como inactivos (activo=false) los que ya no son elegibles y la visita no ha iniciado.
 *
 * @param {string} solicitudId - UUID de la solicitud_visita
 * @param {string[]} elegiblesIds - UUIDs de dispositivos que deben estar activos
 * @param {boolean} visitaIniciada - Si true, no se eliminan dispositivos (la visita ya empezó)
 */
async function syncSolicitudDispositivos(solicitudId, elegiblesIds, visitaIniciada) {
  // Obtener dispositivos actuales activos en la solicitud
  const { data: actuales } = await supabase
    .from('solicitud_dispositivo')
    .select('id, dispositivo_id, activo')
    .eq('solicitud_id', solicitudId);

  const actualesMap = new Map((actuales || []).map(r => [r.dispositivo_id, r]));
  const elegiblesSet = new Set(elegiblesIds);

  // Insertar nuevos elegibles que no existen aún
  const nuevos = elegiblesIds.filter(id => !actualesMap.has(id));
  if (nuevos.length > 0) {
    await supabase
      .from('solicitud_dispositivo')
      .upsert(
        nuevos.map(id => ({ solicitud_id: solicitudId, dispositivo_id: id, activo: true })),
        { onConflict: 'solicitud_id,dispositivo_id', ignoreDuplicates: false }
      );
  }

  // Reactivar dispositivos que estaban inactivos y ahora vuelven a ser elegibles
  const reactivar = (actuales || []).filter(r => !r.activo && elegiblesSet.has(r.dispositivo_id)).map(r => r.id);
  if (reactivar.length > 0) {
    await supabase.from('solicitud_dispositivo').update({ activo: true }).in('id', reactivar);
  }

  // Si la visita no ha iniciado, desactivar los que ya no son elegibles
  if (!visitaIniciada) {
    const desactivar = (actuales || []).filter(r => r.activo && !elegiblesSet.has(r.dispositivo_id)).map(r => r.id);
    if (desactivar.length > 0) {
      await supabase.from('solicitud_dispositivo').update({ activo: false }).in('id', desactivar);
    }
  }
}

/**
 * Crea o actualiza las solicitudes+visitas preventivas de un contrato.
 * Al editar una visita existente (no iniciada), recalcula los dispositivos elegibles
 * según la nueva ventana de fechas.
 *
 * Dispositivos elegibles para cada slot:
 *   - fecha_proximo_mantenimiento IS NULL (nunca intervenidos)
 *   - fecha_proximo_mantenimiento <= fecha_fin del slot (vencen en o antes de la visita)
 *
 * @param {Object} params
 * @param {string} params.contratoId
 * @param {string} params.sucursalId
 * @param {string} params.clienteId
 * @param {Array<{inicio: string, fin: string}>} params.fechas - slots con fecha inicio y fin (YYYY-MM-DD)
 * @param {string[]} params.visitaIdsExistentes - IDs de visitas ya creadas para este contrato (por posición)
 * @param {string} params.tipoPreventivId
 * @param {string} params.estadoPendienteId
 * @param {string} params.estadoProgramadaId
 * @param {string} params.userId
 * @returns {Promise<string[]>} IDs de las visitas (en el mismo orden que fechas)
 */
async function syncVisitasPreventivas({
  contratoId, sucursalId, clienteId, fechas,
  visitaIdsExistentes = [],
  tipoPreventivId, estadoPendienteId, estadoProgramadaId, userId,
}) {
  // Cargar visitas existentes vinculadas a este contrato (por posición)
  const { data: visitasExistentes } = visitaIdsExistentes.length > 0
    ? await supabase.from('visita').select('id, fecha_programada, fecha_inicio, solicitud_id').in('id', visitaIdsExistentes)
    : { data: [] };

  // Indexar por id para acceso rápido
  const existentesById = new Map((visitasExistentes || []).map(v => [v.id, v]));
  const visitaIds = [];

  for (let i = 0; i < fechas.length; i++) {
    const slot = fechas[i];
    const fechaInicioISO = new Date(slot.inicio + 'T08:00:00').toISOString();
    const fechaFinISO    = slot.fin ? new Date(slot.fin + 'T18:00:00').toISOString() : null;
    const fechaFinSlot   = slot.fin || slot.inicio;

    // Calcular dispositivos elegibles para este slot
    const { elegibles } = await calcularDispositivosElegibles(sucursalId, fechaFinSlot);

    const visitaExistente = visitaIdsExistentes[i] ? existentesById.get(visitaIdsExistentes[i]) : null;

    if (visitaExistente) {
      // Actualizar fechas de visita y solicitud existentes
      await supabase
        .from('visita')
        .update({ fecha_programada: fechaInicioISO, fecha_fin: fechaFinISO })
        .eq('id', visitaExistente.id);

      if (visitaExistente.solicitud_id) {
        await supabase
          .from('solicitud_visita')
          .update({ fecha_sugerida: fechaInicioISO })
          .eq('id', visitaExistente.solicitud_id);

        // Resincronizar dispositivos según nueva ventana de fechas
        const visitaIniciada = !!visitaExistente.fecha_inicio;
        await syncSolicitudDispositivos(visitaExistente.solicitud_id, elegibles, visitaIniciada);
      }

      visitaIds.push(visitaExistente.id);
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
        visitaIds.push(null);
        continue;
      }

      // Insertar dispositivos elegibles en la solicitud
      if (elegibles.length > 0) {
        await supabase
          .from('solicitud_dispositivo')
          .insert(elegibles.map(id => ({ solicitud_id: solicitud.id, dispositivo_id: id, activo: true })));
      }

      const { data: nuevaVisita } = await supabase
        .from('visita')
        .insert({
          solicitud_id: solicitud.id,
          coordinador_usuario_id: userId,
          cliente_id: clienteId,
          sucursal_id: sucursalId,
          tipo_visita_id: tipoPreventivId,
          contrato_id: contratoId,
          fecha_programada: fechaInicioISO,
          fecha_fin: fechaFinISO,
          observaciones: `Visita preventiva ${i + 1}`,
          estado_id: estadoProgramadaId || null,
        })
        .select('id')
        .single();

      visitaIds.push(nuevaVisita?.id || null);
    }
  }

  return visitaIds;
}

/**
 * Sincroniza contactos asociados a la sucursal via tabla puente contacto_sucursal.
 * Estrategia declarativa: el estado final debe coincidir exactamente con selectedIds.
 * - Elimina filas de contactos que ya no están en la selección.
 * - Inserta filas de contactos nuevos (upsert ignorando duplicados).
 * @param {string} sucursalId
 * @param {string[]} selectedIds - IDs finales que deben quedar asociados
 */
export async function syncSucursalContactos(sucursalId, clienteId, selectedIds) {
  const ids = (selectedIds || []).map(String).filter(Boolean);

  // Leer asociaciones activas actuales de esta sucursal
  const { data: current, error: fetchError } = await supabase
    .from('contacto_sucursal')
    .select('contacto_id')
    .eq('sucursal_id', sucursalId)
    .eq('activo', true);
  if (fetchError) throw fetchError;

  const currentIds = (current || []).map(r => String(r.contacto_id));
  const selectedSet = new Set(ids);

  // Soft-delete los removidos + limpiar cliente_id si ya no tienen sucursal activa en este cliente
  const toRemove = currentIds.filter(id => !selectedSet.has(id));
  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('contacto_sucursal')
      .update({ activo: false })
      .eq('sucursal_id', sucursalId)
      .in('contacto_id', toRemove);
    if (error) throw error;

    // Para cada removido: si ya no tiene ninguna sucursal activa, limpiar cliente_id
    for (const contactoId of toRemove) {
      const { data: remaining } = await supabase
        .from('contacto_sucursal')
        .select('id')
        .eq('contacto_id', contactoId)
        .eq('activo', true)
        .limit(1);
      if (!remaining || remaining.length === 0) {
        await supabase.from('contacto').update({ cliente_id: null }).eq('id', contactoId);
      }
    }
  }

  // Upsert los seleccionados + asignar cliente_id
  if (ids.length > 0) {
    const { error } = await supabase
      .from('contacto_sucursal')
      .upsert(
        ids.map(cId => ({ contacto_id: cId, sucursal_id: sucursalId, activo: true })),
        { onConflict: 'contacto_id,sucursal_id' }
      );
    if (error) throw error;

    // Asignar cliente_id a los contactos recién asociados
    if (clienteId) {
      await supabase.from('contacto').update({ cliente_id: clienteId }).in('id', ids);
    }
  }
}

/**
 * Sincroniza dispositivos asociados a la sucursal.
 * Al asignar: actualiza sucursal_id Y cliente_id del dispositivo.
 * Al desasignar: deja sucursal_id=null y cliente_id=null (disponible para reasignar).
 * @param {string} sucursalId
 * @param {string} clienteId
 * @param {string[]} selectedIds - IDs finales que deben quedar asociados
 */
export async function syncSucursalDispositivos(sucursalId, clienteId, selectedIds) {
  const selectedSet = new Set((selectedIds || []).map(String).filter(Boolean));

  const { data: current, error: fetchError } = await supabase
    .from('dispositivo')
    .select('id')
    .eq('sucursal_id', sucursalId);
  if (fetchError) throw fetchError;

  const currentIds = (current || []).map(d => String(d.id));

  // Desasociar: quitar sucursal_id y cliente_id (activo disponible para reasignar)
  const toRemove = currentIds.filter(id => !selectedSet.has(id));
  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('dispositivo')
      .update({ sucursal_id: null, cliente_id: null })
      .in('id', toRemove);
    if (error) throw error;
  }

  // Asignar sucursal_id y cliente_id a los seleccionados
  const toAssign = [...selectedSet].filter(id => !currentIds.includes(id));
  if (toAssign.length > 0) {
    const { error } = await supabase
      .from('dispositivo')
      .update({ sucursal_id: sucursalId, cliente_id: clienteId || null })
      .in('id', toAssign);
    if (error) throw error;
  }
}

/**
 * Persiste sucursal (insert o update), sincroniza contratos, contactos y dispositivos asociados.
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

  // Sincronizar contactos: siempre ejecutar para poder eliminar los removidos
  await syncSucursalContactos(resolvedId, clienteId, draft.associatedContactIds || []);

  // Sincronizar dispositivos: estado declarativo, siempre ejecutar
  await syncSucursalDispositivos(resolvedId, clienteId, draft.associatedDeviceIds || []);

  // Sincronizar coordinadores: por cada coordinador asignado, upsert en sucursal_coordinador
  if (draft.associatedCoordinadorIds?.length > 0) {
    for (const coordinadorId of draft.associatedCoordinadorIds) {
      await syncCoordinadorSucursales(coordinadorId, [resolvedId]);
    }
  }

  return { sucursalId: resolvedId, contratos };
}
