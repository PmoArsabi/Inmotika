/**
 * API compartida para cliente: tabla cliente, archivos (logo, RUT, cert) y cliente_documento.
 * Un solo flujo para crear y editar.
 */
import { supabase } from '../utils/supabase';
import { uploadAndSyncFile } from '../utils/storageUtils';

export function isNewClientId(id) {
  if (id == null || id === '') return true;
  const s = String(id);
  return s.startsWith('N-');
}

/**
 * Arma el payload para insert/update en tabla cliente (snake_case).
 */
export function buildClientePayload(draft, tipoPersonaId) {
  return {
    razon_social: (draft.nombre || '').trim() || null,
    tipo_documento: draft.tipoDocumento || null,
    nit: (draft.nit || '').trim() || null,
    dv: (draft.dv || '').trim() || null,
    tipo_persona_id: tipoPersonaId,
    celular: (draft.celular || '').trim() || null,
    celular_pais_iso: draft.celularPaisIso || 'CO',
    email: (draft.email || '').trim() || null,
    fecha_nacimiento: (draft.fechaNacimiento || '').trim() || null,
    estado_id: (draft.estadoId || '').trim() || null,
    direccion: (draft.direccion || '').trim() || null,
    pais: (draft.pais || '').trim() || null,
    estado_depto: (draft.estado_depto || '').trim() || null,
    ciudad: (draft.ciudad || '').trim() || null,
  };
}

/**
 * Sube y sincroniza logo, RUT y cert. bancaria. Acepta File o string.
 */
export async function syncClientFiles(clientId, draft) {
  let logoUrl = typeof draft.logoUrl === 'string' ? draft.logoUrl : '';
  let rutUrl = typeof draft.rutUrl === 'string' ? draft.rutUrl : '';
  let certBancariaUrl = typeof draft.certBancariaUrl === 'string' ? draft.certBancariaUrl : '';

  if (draft.logoUrl instanceof File) {
    const ext = (draft.logoUrl.name.split('.').pop() || 'jpg').toLowerCase();
    logoUrl = await uploadAndSyncFile({
      file: draft.logoUrl,
      fileName: `logo.${ext}`,
      storageFolder: `clientes/${clientId}`,
      dbTarget: { table: 'cliente', id: clientId, column: 'logo_url' },
    });
  }

  if (draft.rutUrl instanceof File) {
    rutUrl = await uploadAndSyncFile({
      file: draft.rutUrl,
      fileName: 'rut.pdf',
      storageFolder: `clientes/${clientId}`,
      dbTarget: { table: 'cliente', id: clientId, column: 'rut_url' },
    });
  }

  if (draft.certBancariaUrl instanceof File) {
    certBancariaUrl = await uploadAndSyncFile({
      file: draft.certBancariaUrl,
      fileName: 'cert_bancaria.pdf',
      storageFolder: `clientes/${clientId}`,
      dbTarget: { table: 'cliente', id: clientId, column: 'cert_bancaria_url' },
    });
  }

  return { logoUrl, rutUrl, certBancariaUrl };
}

/**
 * Sincroniza cliente_documento (otros documentos): upsert + subida, desactivar el resto.
 */
export async function syncClientOtrosDocumentos(clientId, draft) {
  const updated = [];
  for (const doc of draft.otrosDocumentos || []) {
    const isNewId = !doc.id || String(doc.id).length < 20;
    const { data: row, error } = await supabase
      .from('cliente_documento')
      .upsert({
        id: isNewId ? undefined : doc.id,
        cliente_id: clientId,
        nombre: (doc.nombre || '').trim() || 'Documento',
        activo: true,
      })
      .select()
      .single();
    if (error) throw error;
    const finalUrl = await uploadAndSyncFile({
      file: doc.url,
      fileName: `${row.id}.pdf`,
      storageFolder: `clientes/${clientId}/otros`,
      dbTarget: { table: 'cliente_documento', id: row.id, column: 'url' },
    });
    updated.push({ id: row.id, nombre: row.nombre, url: finalUrl });
  }
  const ids = updated.map(d => d.id);
  if (ids.length > 0) {
    await supabase
      .from('cliente_documento')
      .update({ activo: false })
      .eq('cliente_id', clientId)
      .not('id', 'in', `(${ids.map(id => `'${id}'`).join(',')})`);
  } else {
    await supabase.from('cliente_documento').update({ activo: false }).eq('cliente_id', clientId);
  }
  return updated;
}

/**
 * Persiste cliente (insert o update), archivos y otros documentos.
 * @param {Object} params
 * @param {string|null} params.clientId - null o "N-xxx" = crear; UUID = editar
 * @param {Object} params.draft
 * @param {string} params.tipoPersonaId
 * @returns {Promise<{ clientId: string, savedData: Object }>}
 */
export async function saveCliente({ clientId, draft, tipoPersonaId }) {
  const payload = buildClientePayload(draft, tipoPersonaId);
  const isNew = isNewClientId(clientId);
  let resolvedId = clientId;

  if (isNew) {
    const { data: inserted, error } = await supabase
      .from('cliente')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw error;
    resolvedId = inserted?.id;
    if (!resolvedId) throw new Error('No se devolvió el id del cliente');
  } else {
    const { error } = await supabase.from('cliente').update(payload).eq('id', clientId);
    if (error) throw error;
  }

  const filePaths = await syncClientFiles(resolvedId, draft);
  const otrosDocFinal = await syncClientOtrosDocumentos(resolvedId, draft);

  const savedData = {
    ...draft,
    id: resolvedId,
    nit: `${draft.nit || ''}${draft.dv ? `-${draft.dv}` : ''}`,
    ...filePaths,
    otrosDocumentos: otrosDocFinal,
  };

  return { clientId: resolvedId, savedData };
}
