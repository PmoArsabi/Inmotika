/**
 * API compartida para cliente: tabla cliente, archivos (logo, RUT, cert) y cliente_documento.
 * Un solo flujo para crear y editar.
 */
import { supabase } from '../utils/supabase';
import { uploadAndSyncFile } from '../utils/storageUtils';
import { getSupervisorCCs, buildRecipients, fireAndForgetEmail } from '../hooks/useEmail';

/**
 * Desasocia un contacto de su cliente: limpia cliente_id y marca activo=false
 * en todas sus filas de contacto_sucursal. El contacto queda activo y reasignable.
 * @param {string} contactoId
 */
export async function unlinkContactoFromCliente(contactoId) {
  const { error: csErr } = await supabase
    .from('contacto_sucursal')
    .update({ activo: false })
    .eq('contacto_id', contactoId)
    .eq('activo', true);
  if (csErr) throw csErr;

  const { error } = await supabase
    .from('contacto')
    .update({ cliente_id: null })
    .eq('id', contactoId);
  if (error) throw error;
}

/**
 * Asocia un dispositivo a un cliente (solo cliente_id; sucursal_id se gestiona
 * desde la sucursal).
 * @param {string} dispositivoId
 * @param {string} clienteId
 */
export async function linkDispositivoToCliente(dispositivoId, clienteId) {
  const { error } = await supabase
    .from('dispositivo')
    .update({ cliente_id: clienteId })
    .eq('id', dispositivoId);
  if (error) throw error;
}

/**
 * Desasocia un dispositivo de su cliente y sucursal.
 * El dispositivo queda activo y reasignable.
 * @param {string} dispositivoId
 */
export async function unlinkDispositivoFromCliente(dispositivoId) {
  const { error } = await supabase
    .from('dispositivo')
    .update({ cliente_id: null, sucursal_id: null })
    .eq('id', dispositivoId);
  if (error) throw error;
}

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
    estado_id: (draft.estadoId || '').trim() || null,
    direccion: (draft.direccion || '').trim() || null,
    pais: (draft.pais || '').trim() || null,
    estado_depto: (draft.estado_depto || '').trim() || null,
    ciudad: (draft.ciudad || '').trim() || null,
  };
}

/**
 * Sube un archivo de cliente a Storage y sincroniza la columna en BD.
 * Si el valor ya es string (URL existente), lo devuelve sin tocar.
 *
 * @param {string} clientId
 * @param {File|string} file
 * @param {{ fileName: string, column: string }} config
 * @returns {Promise<string>}
 */
async function uploadClientFile(clientId, file, { fileName, column }) {
  if (!(file instanceof File)) return typeof file === 'string' ? file : '';
  return uploadAndSyncFile({
    file,
    fileName,
    storageFolder: `clientes/${clientId}`,
    dbTarget: { table: 'cliente', id: clientId, column },
  });
}

/**
 * Sube y sincroniza logo, RUT y cert. bancaria. Acepta File o string.
 */
export async function syncClientFiles(clientId, draft) {
  const ext = draft.logoUrl instanceof File
    ? (draft.logoUrl.name.split('.').pop() || 'jpg').toLowerCase()
    : 'jpg';

  const [logoUrl, rutUrl, certBancariaUrl] = await Promise.all([
    uploadClientFile(clientId, draft.logoUrl, { fileName: `logo.${ext}`, column: 'logo_url' }),
    uploadClientFile(clientId, draft.rutUrl, { fileName: 'rut.pdf', column: 'rut_url' }),
    uploadClientFile(clientId, draft.certBancariaUrl, { fileName: 'cert_bancaria.pdf', column: 'cert_bancaria_url' }),
  ]);

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
      .not('id', 'in', `(${ids.join(',')})`);
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

/**
 * Obtiene los directores asignados a un cliente (solo activos).
 */
export async function getClientDirectors(clientId) {
  const { data, error } = await supabase
    .from('cliente_director')
    .select('director_id, director(usuario_id, perfil_usuario(id, nombres, apellidos))')
    .eq('cliente_id', clientId)
    .eq('activo', true);
  if (error) throw error;
  return data.map(d => ({
    id: d.director_id,
    nombres: d.director?.perfil_usuario?.nombres,
    apellidos: d.director?.perfil_usuario?.apellidos,
  }));
}

/**
 * Sincroniza los directores asignados (soft-delete con columna activo).
 */
export async function syncClientDirectors(clientId, directorIds) {
  if (!clientId) throw new Error("ID de cliente requerido para sincronizar directores");

  // 1. Obtener todas las asignaciones existentes (activos e inactivos)
  const { data: existing, error: fetchError } = await supabase
    .from('cliente_director')
    .select('director_id, activo')
    .eq('cliente_id', clientId);

  if (fetchError) throw fetchError;

  const incomingIds = new Set(directorIds);
  const entriesToUpsert = [];

  // 2. Determinar cuáles activar o dejar activos
  directorIds.forEach(dId => {
    entriesToUpsert.push({
      cliente_id: clientId,
      director_id: dId,
      activo: true
    });
  });

  // 3. Determinar cuáles desactivar (estaban activos y ya no vienen)
  existing?.forEach(e => {
    if (e.activo && !incomingIds.has(e.director_id)) {
      entriesToUpsert.push({
        cliente_id: clientId,
        director_id: e.director_id,
        activo: false
      });
    }
  });

  if (entriesToUpsert.length === 0) return;

  const { error: upsertError } = await supabase
    .from('cliente_director')
    .upsert(entriesToUpsert, { onConflict: 'cliente_id, director_id' });

  if (upsertError) throw upsertError;
}

/**
 * Envía el correo de bienvenida al crear un cliente nuevo (fire-and-forget).
 * No bloquea el flujo de guardado; los errores solo se loguean.
 *
 * @param {Object} draft - { nombre, nit, dv, ciudad }
 * @param {{ id: string, role: string, email: string }} actor - usuario que crea el cliente
 */
export function notificarClienteCreado(draft, actor) {
  getSupervisorCCs({ actorId: actor.id, actorRole: actor.role })
    .then(supervisorEmails => {
      const { destinatario, cc } = buildRecipients(actor.email || '', supervisorEmails);
      fireAndForgetEmail('cliente_creado', {
        destinatario,
        nombreCliente: draft.nombre || '',
        ruc: draft.nit ? `${draft.nit}${draft.dv ? `-${draft.dv}` : ''}` : '—',
        ciudad: draft.ciudad || '—',
        responsable: actor.email || '',
        appUrl: import.meta.env.VITE_APP_URL || window.location.origin,
      }, cc);
    })
    .catch(err => console.error('[clienteApi] notificarClienteCreado falló:', err));
}
