/**
 * API compartida para técnico: perfil_usuario y registro base tecnico.
 * Documentos se gestionan a través de usuarioDocumentoApi + usuario_documento.
 */
import { supabase } from '../utils/supabase';

/**
 * Actualiza perfil_usuario para el usuario dado.
 * @param {string} usuarioId
 * @param {Object} draft - nombres, apellidos, telefono, avatarUrl?, estadoId?, tipoDocumento, identificacion
 */
export async function updatePerfilForTecnico(usuarioId, draft) {
  const payload = {
    nombres: draft.nombres ?? null,
    apellidos: draft.apellidos ?? null,
    telefono: draft.telefono ?? null,
    tipo_documento: draft.tipoDocumento ?? null,
    identificacion: draft.identificacion ?? null,
  };
  if (draft.avatarUrl !== undefined) payload.avatar_url = draft.avatarUrl ?? null;
  if (draft.estadoId !== undefined) payload.estado_id = draft.estadoId ?? null;

  const { error } = await supabase
    .from('perfil_usuario')
    .update(payload)
    .eq('id', usuarioId);
  if (error) throw error;
}

/**
 * Asegura que exista un registro tecnico para el usuario; devuelve su id.
 * @param {string} usuarioId
 * @param {string|null} existingTechId - id conocido o null
 * @returns {Promise<string>} techId
 */
export async function ensureTecnicoRecord(usuarioId, existingTechId) {
  let techId = existingTechId;
  if (!techId) {
    const { data: existing } = await supabase
      .from('tecnico')
      .select('id')
      .eq('usuario_id', usuarioId)
      .maybeSingle();
    techId = existing?.id;
  }
  if (!techId) {
    const { data: inserted, error } = await supabase
      .from('tecnico')
      .insert({ usuario_id: usuarioId })
      .select('id')
      .single();
    if (error) throw error;
    techId = inserted?.id;
  } else {
    await supabase.from('tecnico').update({ usuario_id: usuarioId }).eq('id', techId);
  }
  return techId;
}
