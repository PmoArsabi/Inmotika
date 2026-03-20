/**
 * API compartida para contacto: tabla contacto y puente contacto_sucursal.
 * Un solo flujo para crear y editar.
 */
import { supabase } from '../utils/supabase';

export function isNewContactId(id) {
  if (id == null || id === '') return true;
  const s = String(id);
  return s.startsWith('C-') || s.length < 20;
}

/**
 * Resuelve estado_id: si viene en draft lo usa; si no, toma un estado activo del catálogo.
 */
async function resolveEstadoId(draft) {
  if (draft.estadoId) return draft.estadoId;
  const { data } = await supabase
    .from('catalogo_estado_general')
    .select('id')
    .eq('activo', true)
    .limit(1)
    .maybeSingle();
  return data?.id || null;
}

/**
 * Arma el payload para insert/update en tabla contacto (snake_case).
 */
export function buildContactoPayload(draft, estadoId, clienteId) {
  return {
    nombres: draft.nombres || null,
    apellidos: draft.apellidos || null,
    tipo_documento: draft.tipoDocumento || null,
    identificacion: draft.identificacion || null,
    genero_id: draft.generoId || null,
    cargo_id: draft.cargoId || null,
    descripcion_cargo: draft.descripcionCargo || null,
    email: draft.email || null,
    telefono_movil: draft.telefonoMovil || null,
    telefono_movil_pais_iso: draft.telefonoMovilPais || 'CO',
    fecha_nacimiento: draft.fechaNacimiento || null,
    fecha_matrimonio: draft.esMarido ? (draft.fechaMatrimonio || null) : null,
    estado_id: estadoId,
    cliente_id: clienteId || null,
  };
}

/**
 * Actualiza el estado_id de perfil_usuario para activar o desactivar el acceso al sistema.
 * Solo tiene efecto si el contacto tiene usuario_id vinculado.
 *
 * @param {string} usuarioId - UUID del perfil_usuario
 * @param {string} estadoId  - UUID del catalogo_estado_general (activo o inactivo)
 */
export async function updatePerfilUsuarioEstado(usuarioId, estadoId) {
  if (!usuarioId || !estadoId) return;
  const { error } = await supabase
    .from('perfil_usuario')
    .update({ estado_id: estadoId })
    .eq('id', usuarioId);
  if (error) throw error;
}

/**
 * Persiste contacto (insert o update) y sincroniza contacto_sucursal.
 * No invoca invite-user; eso queda en el llamador si aplica.
 *
 * @param {Object} params
 * @param {string|null} params.contactId - null o "C-xxx" = crear; UUID = editar
 * @param {string} params.clienteId
 * @param {Object} params.draft - campos del formulario (nombres, apellidos, associatedBranchIds, etc.)
 * @returns {Promise<{ contactId: string }>}
 */
export async function saveContacto({ contactId, clienteId, draft }) {
  const estadoId = await resolveEstadoId(draft);
  const payload = buildContactoPayload(draft, estadoId, clienteId);
  const isNew = isNewContactId(contactId);
  let resolvedId = contactId;

  if (isNew) {
    const { data: inserted, error } = await supabase
      .from('contacto')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw error;
    resolvedId = inserted?.id;
    if (!resolvedId) throw new Error('No se devolvió el id del contacto');
  } else {
    const { error } = await supabase.from('contacto').update(payload).eq('id', contactId);
    if (error) throw error;
  }

  const branchIds = draft.associatedBranchIds || [];
  await supabase.from('contacto_sucursal').delete().eq('contacto_id', resolvedId);
  if (branchIds.length > 0) {
    const bridgeRows = branchIds.map(bId => ({
      contacto_id: resolvedId,
      sucursal_id: bId,
    }));
    const { error: bridgeErr } = await supabase.from('contacto_sucursal').insert(bridgeRows);
    if (bridgeErr) throw bridgeErr;
  }

  return { contactId: resolvedId };
}
