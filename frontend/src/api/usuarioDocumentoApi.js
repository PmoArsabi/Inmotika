/**
 * API para documentos de usuario (tabla `usuario_documento`).
 *
 * Centraliza lectura, alta, baja y acceso seguro a Storage para cualquier rol.
 * Los contactos acceden vía la función RPC `get_documentos_tecnicos_visita`.
 */
import { supabase } from '../utils/supabase';
import { uploadAndSyncFile, deleteFile } from '../utils/storageUtils';

/** @typedef {{ id: string, nombre: string, tipo: string, url: string|null, activo: boolean, created_at: string }} UsuarioDocumento */

/**
 * Ruta canónica en Storage para un documento de usuario.
 * @param {string} usuarioId
 * @param {string} tipo
 * @param {string} nombre  - nombre del documento (sin extensión)
 */
function buildStoragePath(usuarioId, tipo, nombre) {
  const sanitize = (s) =>
    s.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
  return `usuarios/${usuarioId}/documentos/${sanitize(tipo)}_${sanitize(nombre) || 'doc'}.pdf`;
}

/**
 * Lista los documentos activos de un usuario.
 * @param {string} usuarioId
 * @returns {Promise<UsuarioDocumento[]>}
 */
export async function listDocumentos(usuarioId) {
  const { data, error } = await supabase
    .from('usuario_documento')
    .select('id, nombre, tipo, url, activo, created_at')
    .eq('usuario_id', usuarioId)
    .eq('activo', true)
    .order('tipo')
    .order('nombre');
  if (error) throw error;
  return data || [];
}

/**
 * Crea un documento (con subida opcional de archivo).
 * Si `file` es un File, lo sube y guarda la ruta. Si es string, usa la ruta existente.
 * @param {string} usuarioId
 * @param {{ nombre: string, tipo: string, file: File|string|null }} payload
 * @returns {Promise<UsuarioDocumento>}
 */
export async function createDocumento(usuarioId, { nombre, tipo, file }) {
  const { data: row, error: insertError } = await supabase
    .from('usuario_documento')
    .insert({ usuario_id: usuarioId, nombre, tipo })
    .select()
    .single();
  if (insertError) throw insertError;

  if (!file) return row;

  const path = buildStoragePath(usuarioId, tipo, nombre);
  const finalUrl = await uploadAndSyncFile({
    file,
    fileName: path.split('/').pop(),
    storageFolder: path.substring(0, path.lastIndexOf('/')),
    dbTarget: { table: 'usuario_documento', id: row.id, column: 'url' },
  });

  return { ...row, url: finalUrl };
}

/**
 * Actualiza nombre, tipo y/o reemplaza el archivo de un documento existente.
 * @param {string} docId
 * @param {string} usuarioId
 * @param {{ nombre?: string, tipo?: string, file?: File }} patch
 * @returns {Promise<UsuarioDocumento>}
 */
export async function updateDocumento(docId, usuarioId, patch) {
  const updates = {};
  if (patch.nombre !== undefined) updates.nombre = patch.nombre;
  if (patch.tipo   !== undefined) updates.tipo   = patch.tipo;

  let url;
  if (patch.file instanceof File) {
    const nombre = patch.nombre || '';
    const tipo   = patch.tipo   || 'OTRO';
    const path   = buildStoragePath(usuarioId, tipo, nombre);
    url = await uploadAndSyncFile({
      file: patch.file,
      fileName: path.split('/').pop(),
      storageFolder: path.substring(0, path.lastIndexOf('/')),
      dbTarget: { table: 'usuario_documento', id: docId, column: 'url' },
    });
    updates.url = url;
  }

  if (Object.keys(updates).length > 0) {
    const { data, error } = await supabase
      .from('usuario_documento')
      .update(updates)
      .eq('id', docId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('usuario_documento')
    .select()
    .eq('id', docId)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Desactiva (soft-delete) un documento y elimina su archivo de Storage.
 * @param {string} docId
 * @param {string|null} storageUrl - ruta en Storage para eliminar
 */
export async function deleteDocumento(docId, storageUrl) {
  const { error } = await supabase
    .from('usuario_documento')
    .update({ activo: false })
    .eq('id', docId);
  if (error) throw error;
  if (storageUrl) await deleteFile(storageUrl);
}

/**
 * Genera una URL firmada temporal (5 min) para visualizar un documento en el navegador.
 * Nunca descarga directamente: abre en nueva pestaña.
 * @param {string} storagePath
 * @param {number} [expiresIn=300] - segundos
 * @returns {Promise<string>} signedUrl
 */
export async function openDocumentoSignedUrl(storagePath, expiresIn = 300) {
  const { data, error } = await supabase.storage
    .from('inmotika')
    .createSignedUrl(storagePath, expiresIn);
  if (error) throw error;
  if (!data?.signedUrl) throw new Error('No se pudo generar el enlace de acceso');
  return data.signedUrl;
}

/**
 * (Solo contactos) Obtiene los documentos de los técnicos asignados a una visita.
 * Llama a la función RPC `get_documentos_tecnicos_visita` (SECURITY DEFINER).
 * @param {string} visitaId
 * @returns {Promise<Array>}
 */
export async function getDocumentosTecnicosVisita(visitaId) {
  const { data, error } = await supabase
    .rpc('get_documentos_tecnicos_visita', { p_visita_id: visitaId });
  if (error) throw error;
  return data || [];
}
