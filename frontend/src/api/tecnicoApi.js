/**
 * API compartida para técnico: perfil_usuario, tecnico, documentos y certificados.
 * Usada por TechnicalNavigator (Configuración) y useUsers (Usuarios).
 */
import { supabase } from '../utils/supabase';
import { uploadAndSyncFile } from '../utils/storageUtils';

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

/**
 * Sube y sincroniza cédula y planilla en tecnico. Acepta File o string (existente).
 * @param {string} techId
 * @param {{ documentoCedulaUrl?: File|string, planillaSegSocialUrl?: File|string }} files
 * @returns {Promise<{ documentoCedulaUrl: string, planillaSegSocialUrl: string }>}
 */
export async function syncTecnicoFiles(techId, files) {
  const base = { documentoCedulaUrl: '', planillaSegSocialUrl: '' };
  const cedula = files.documentoCedulaUrl ?? files.cedula;
  const planilla = files.planillaSegSocialUrl ?? files.planillaSS;

  if (cedula instanceof File) {
    base.documentoCedulaUrl = await uploadAndSyncFile({
      file: cedula,
      fileName: 'cedula.pdf',
      storageFolder: `tecnicos/${techId}`,
      dbTarget: { table: 'tecnico', id: techId, column: 'documento_cedula_url' },
    });
  } else if (typeof cedula === 'string') {
    base.documentoCedulaUrl = cedula;
  }

  if (planilla instanceof File) {
    base.planillaSegSocialUrl = await uploadAndSyncFile({
      file: planilla,
      fileName: 'planilla_seg_social.pdf',
      storageFolder: `tecnicos/${techId}`,
      dbTarget: { table: 'tecnico', id: techId, column: 'planilla_seg_social_url' },
    });
  } else if (typeof planilla === 'string') {
    base.planillaSegSocialUrl = planilla;
  }

  return base;
}

/**
 * Sincroniza tecnico_certificado: upsert, subida de PDF, desactivar el resto.
 * @param {string} techId
 * @param {Array<{ id?: string, nombre: string, url: File|string }>} certificados
 * @returns {Promise<Array<{ id: string, nombre: string, url: string }>>}
 */
export async function syncTecnicoCertificados(techId, certificados) {
  const updated = [];
  for (const cert of certificados || []) {
    const isNewId = !cert.id || String(cert.id).length < 20;
    const { data: row, error } = await supabase
      .from('tecnico_certificado')
      .upsert({
        id: isNewId ? undefined : cert.id,
        tecnico_id: techId,
        nombre: (cert.nombre || '').trim() || 'Certificado',
        activo: true,
      })
      .select()
      .single();
    if (error) throw error;

    let finalUrl = typeof cert.url === 'string' ? cert.url : '';
    if (cert.url instanceof File) {
      finalUrl = await uploadAndSyncFile({
        file: cert.url,
        fileName: `${row.id}.pdf`,
        storageFolder: `tecnicos/${techId}/certificados`,
        dbTarget: { table: 'tecnico_certificado', id: row.id, column: 'url' },
      });
    }

    updated.push({ id: row.id, nombre: row.nombre, url: finalUrl });
  }

  const ids = updated.map(c => c.id);
  if (ids.length > 0) {
    await supabase
      .from('tecnico_certificado')
      .update({ activo: false })
      .eq('tecnico_id', techId)
      .not('id', 'in', `(${ids.map(id => `'${id}'`).join(',')})`);
  } else {
    await supabase
      .from('tecnico_certificado')
      .update({ activo: false })
      .eq('tecnico_id', techId);
  }

  return updated;
}

/**
 * Persiste técnico completo: perfil, registro tecnico, archivos y certificados.
 * @param {Object} params
 * @param {string} params.usuarioId
 * @param {string|null} params.techId - id existente o null
 * @param {Object} params.draft - nombres, apellidos, telefono, tipoDocumento, identificacion, avatarUrl?, estadoId?, documentoCedulaUrl, planillaSegSocialUrl, certificados
 *   También puede recibir cedula/planillaSS (alias para uso desde useUsers).
 * @returns {Promise<{ techId: string, documentoCedulaUrl: string, planillaSegSocialUrl: string, certificados: Array }>}
 */
export async function saveTecnico({ usuarioId, techId, draft }) {
  if (!usuarioId) throw new Error('usuarioId es requerido');

  await updatePerfilForTecnico(usuarioId, draft);
  const resolvedTechId = await ensureTecnicoRecord(usuarioId, techId || draft.id);

  const files = await syncTecnicoFiles(resolvedTechId, {
    documentoCedulaUrl: draft.documentoCedulaUrl,
    planillaSegSocialUrl: draft.planillaSegSocialUrl,
    cedula: draft.cedula,
    planillaSS: draft.planillaSS,
  });

  const certificados = await syncTecnicoCertificados(resolvedTechId, draft.certificados || []);

  return {
    techId: resolvedTechId,
    documentoCedulaUrl: files.documentoCedulaUrl,
    planillaSegSocialUrl: files.planillaSegSocialUrl,
    certificados,
  };
}
