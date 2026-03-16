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
    latitud: branchDraft.latitud ? Number(branchDraft.latitud) : null,
    longitud: branchDraft.longitud ? Number(branchDraft.longitud) : null,
  };
}

/**
 * Sincroniza contratos de la sucursal: upsert en tabla contrato y subida de PDF a Storage.
 * @param {string} sucursalId - UUID de la sucursal
 * @param {string} clientId - UUID del cliente
 * @param {Object} branchDraft - draft con contratos[]
 * @returns {Promise<Array>} contratos actualizados con id, tema, documentoUrl, fechaInicio, fechaFin
 */
export async function syncSucursalContracts(sucursalId, clientId, branchDraft) {
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

    updated.push({
      ...c,
      id: row.id,
      tema: row.tema,
      documentoUrl: finalUrl || row.documento_url || '',
      fechaInicio: row.fecha_inicio || c.fechaInicio || '',
      fechaFin: row.fecha_fin || c.fechaFin || '',
    });
  }
  return updated;
}

/**
 * Persiste sucursal (insert o update) y sincroniza contratos.
 * Un solo punto de verdad: crear y editar usan la misma función.
 *
 * @param {Object} params
 * @param {string|null} params.sucursalId - id actual (null o "new-xxx" = crear; UUID = editar)
 * @param {string} params.clienteId - UUID del cliente
 * @param {Object} params.draft - draft del formulario
 * @returns {Promise<{ sucursalId: string, contratos: Array }>}
 */
export async function saveSucursal({ sucursalId, clienteId, draft }) {
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

  const contratos = await syncSucursalContracts(resolvedId, clienteId, draft);
  return { sucursalId: resolvedId, contratos };
}
