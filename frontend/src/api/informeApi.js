import { supabase } from '../utils/supabase';
import { fireAndForgetEmail } from '../hooks/useEmail';
import { syncSolicitudDispositivos } from './solicitudDispositivoApi';

/**
 * @typedef {Object} ActividadEjecucion
 * @property {string} id
 * @property {string} descripcion
 * @property {number} orden
 * @property {'pendiente'|'completada'|'omitida'} estado
 * @property {string|null} observacion
 */

/**
 * @typedef {Object} PasoEjecucion
 * @property {string} id
 * @property {string} paso_protocolo_id     - FK a paso_protocolo.id (mismo valor que id en fetchInformeData)
 * @property {string} descripcion
 * @property {number} orden
 * @property {string|null} comentarios
 * @property {string|null} fecha_inicio
 * @property {string|null} fecha_fin
 * @property {ActividadEjecucion[]} actividades
 */

/**
 * @typedef {Object} DispositivoInforme
 * @property {string} id                    - dispositivo.id
 * @property {string} intervencion_id       - intervencion.id que generó este registro
 * @property {string|null} id_inmotika
 * @property {string|null} codigo_unico
 * @property {string|null} serial
 * @property {string|null} modelo
 * @property {string|null} linea
 * @property {string|null} mac_address
 * @property {string|null} notas_tecnicas
 * @property {string|null} marca_nombre
 * @property {string}      categoria_id
 * @property {string}      categoria_nombre
 * @property {string|null} codigo_etiqueta
 * @property {string|null} observacion_final
 * @property {PasoEjecucion[]} pasos
 * @property {string[]}   fotos              - URLs firmadas de evidencias (no etiqueta)
 * @property {string|null} foto_etiqueta     - URL firmada de la etiqueta
 */

/**
 * @typedef {Object} InformeVisita
 * @property {string}      visita_id
 * @property {string}      cliente_nombre
 * @property {string|null} cliente_nit
 * @property {string}      sucursal_nombre
 * @property {string|null} sucursal_ciudad
 * @property {string|null} sucursal_direccion
 * @property {string}      tipo_visita
 * @property {string|null} fecha_programada
 * @property {string|null} fecha_inicio
 * @property {string|null} fecha_fin
 * @property {string}      tecnicos            - Nombres separados por coma
 * @property {string|null} coordinador         - Nombre del coordinador
 * @property {string|null} instrucciones       - visita.observaciones (instrucciones del asignador)
 * @property {string|null} observacion_final   - Resumen final del técnico
 * @property {number}      total_dispositivos
 * @property {{ categoria_nombre: string, dispositivos: DispositivoInforme[] }[]} categorias
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Genera URLs firmadas (1 hora) para una lista de paths en el bucket inmotika.
 * Devuelve un mapa path → signedUrl. Los que fallen quedan excluidos.
 *
 * @param {string[]} paths
 * @returns {Promise<Record<string, string>>}
 */
async function getSignedUrls(paths) {
  if (!paths.length) return {};

  const { data, error } = await supabase.storage
    .from('inmotika')
    .createSignedUrls(paths, 3600); // 1 hora de validez

  if (error || !data) return {};

  /** @type {Record<string, string>} */
  const map = {};
  for (const item of data) {
    if (item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}

// ─── Query principal ──────────────────────────────────────────────────────────

/**
 * Recopila todos los datos necesarios para generar el informe PDF de una visita.
 * Agrupa los dispositivos por categoría y enriquece cada paso con sus actividades
 * y el estado de ejecución real registrado por el técnico.
 *
 * @param {string} visitaId - UUID de la visita a informar
 * @returns {Promise<InformeVisita>}
 * @throws {Error} Si la visita no existe o alguna query falla
 */
/**
 * Devuelve el informe (con estado) asociado a una visita.
 * Si no existe, retorna null.
 *
 * @param {string} visitaId
 * @returns {Promise<{id:string, estado:string, enviado_director_at:string|null, enviado_cliente_at:string|null, storage_path:string|null}|null>}
 */
export async function getInformeByVisita(visitaId) {
  const { data, error } = await supabase
    .from('informe')
    .select('id, estado, enviado_director_at, enviado_cliente_at, storage_path, created_at, updated_at')
    .eq('visita_id', visitaId)
    .maybeSingle();
  if (error) throw new Error(`Error al obtener informe: ${error.message}`);
  return data || null;
}

/**
 * @typedef {Object} RevisionCoordinador
 * @property {string}      id
 * @property {string}      informe_id
 * @property {string}      intervencion_id
 * @property {string}      coordinador_id
 * @property {boolean}     aprobado
 * @property {string|null} nota
 * @property {string}      created_at
 */

/**
 * Retorna todas las revisiones del coordinador para un informe dado.
 *
 * @param {string} informeId
 * @returns {Promise<RevisionCoordinador[]>}
 */
export async function getRevisionesCoordinador(informeId) {
  const { data, error } = await supabase
    .from('informe_coordinador')
    .select('id, informe_id, intervencion_id, coordinador_id, aprobado, nota, created_at')
    .eq('informe_id', informeId);
  if (error) throw new Error(`Error al obtener revisiones: ${error.message}`);
  return data || [];
}

/**
 * Inserta o actualiza la revisión de un coordinador sobre una intervención concreta.
 * Usa UPSERT con ON CONFLICT sobre (informe_id, intervencion_id).
 *
 * @param {string}  informeId
 * @param {string}  intervencionId
 * @param {string}  coordinadorId    - perfil_usuario.id del coordinador
 * @param {boolean} aprobado
 * @param {string|null} nota
 * @returns {Promise<RevisionCoordinador>}
 */
export async function upsertRevisionCoordinador(informeId, intervencionId, coordinadorId, aprobado, nota = null) {
  const { data, error } = await supabase
    .from('informe_coordinador')
    .upsert(
      {
        informe_id:      informeId,
        intervencion_id: intervencionId,
        coordinador_id:  coordinadorId,
        aprobado,
        nota,
        actualizado_por: coordinadorId,
        updated_at:      new Date().toISOString(),
      },
      { onConflict: 'informe_id,intervencion_id' }
    )
    .select()
    .single();
  if (error) throw new Error(`Error al guardar revisión: ${error.message}`);
  return data;
}

/**
 * @typedef {Object} InformeEnRevision
 * @property {string}      id            - informe.id
 * @property {string}      visita_id
 * @property {string}      estado
 * @property {string|null} enviado_director_at
 * @property {string|null} observacion_director  - última observación del director (si rechazó)
 * @property {string}      cliente_nombre
 * @property {string}      sucursal_nombre
 * @property {string|null} sucursal_ciudad
 * @property {string}      tipo_visita
 * @property {string|null} fecha_fin
 * @property {number}      total_intervenciones
 * @property {number}      revisadas
 */

/**
 * Retorna los informes en estado EN_REVISION o RECHAZADO accesibles al coordinador actual.
 * (El filtrado RLS en Supabase restringe por sucursal automáticamente.)
 *
 * @returns {Promise<InformeEnRevision[]>}
 */
export async function getInformesEnRevision() {
  const { data, error } = await supabase
    .from('informe')
    .select(`
      id,
      visita_id,
      estado,
      enviado_director_at,
      visita:visita_id(
        fecha_fin,
        tipo_visita:tipo_visita_id(nombre),
        cliente:cliente_id(razon_social),
        sucursal:sucursal_id(nombre, ciudad)
      )
    `)
    .in('estado', ['EN_REVISION', 'RECHAZADO', 'EN_APROBACION', 'APROBADO'])
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error al obtener informes: ${error.message}`);

  // Enriquecer con cliente_id y sucursal_id desde la visita usando una segunda query
  const visitaIds = (data || []).map(inf => inf.visita_id);
  const { data: visitasExtra } = visitaIds.length
    ? await supabase.from('visita').select('id, cliente_id, sucursal_id').in('id', visitaIds)
    : { data: [] };

  /** @type {Map<string, { cliente_id: string|null, sucursal_id: string|null }>} */
  const visitaExtraMap = new Map((visitasExtra || []).map(v => [v.id, { cliente_id: v.cliente_id, sucursal_id: v.sucursal_id }]));

  const informeIds = (data || []).map(inf => inf.id);

  // Conteo de intervenciones y revisiones por informe en paralelo
  const [intervenciones, revisiones, ultimaObsRows] = await Promise.all([
    informeIds.length
      ? supabase
          .from('intervencion')
          .select('visita_id')
          .in('visita_id', (data || []).map(inf => inf.visita_id))
          .eq('activo', true)
      : Promise.resolve({ data: [] }),
    informeIds.length
      ? supabase
          .from('informe_coordinador')
          .select('informe_id, aprobado')
          .in('informe_id', informeIds)
      : Promise.resolve({ data: [] }),
    informeIds.length
      ? supabase
          .from('informe_director')
          .select('informe_id, observacion, created_at')
          .in('informe_id', informeIds)
          .eq('accion', 'RECHAZADO')
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  /** @type {Map<string, number>} visita_id → count */
  const intervByVisita = new Map();
  for (const row of (intervenciones.data || [])) {
    intervByVisita.set(row.visita_id, (intervByVisita.get(row.visita_id) || 0) + 1);
  }

  /** @type {Map<string, number>} informe_id → count revisadas */
  const revByInforme = new Map();
  for (const row of (revisiones.data || [])) {
    revByInforme.set(row.informe_id, (revByInforme.get(row.informe_id) || 0) + 1);
  }

  /** @type {Map<string, string|null>} informe_id → última observación rechazo */
  const obsMap = new Map();
  for (const row of (ultimaObsRows.data || [])) {
    if (!obsMap.has(row.informe_id)) obsMap.set(row.informe_id, row.observacion);
  }

  return (data || []).map(inf => {
    const extra = visitaExtraMap.get(inf.visita_id);
    return {
      id: inf.id,
      visita_id: inf.visita_id,
      estado: inf.estado,
      enviado_director_at: inf.enviado_director_at || null,
      observacion_director: obsMap.get(inf.id) || null,
      cliente_id: extra?.cliente_id || null,
      sucursal_id: extra?.sucursal_id || null,
      cliente_nombre: inf.visita?.cliente?.razon_social || '—',
      sucursal_nombre: inf.visita?.sucursal?.nombre || '—',
      sucursal_ciudad: inf.visita?.sucursal?.ciudad || null,
      tipo_visita: inf.visita?.tipo_visita?.nombre || '—',
      fecha_fin: inf.visita?.fecha_fin || null,
      total_intervenciones: intervByVisita.get(inf.visita_id) || 0,
      revisadas: revByInforme.get(inf.id) || 0,
    };
  });
}

/**
 * Marca el informe como enviado al director y notifica por email.
 * Solo puede hacerse cuando todas las intervenciones han sido revisadas.
 *
 * @param {string} informeId
 * @param {{ directorEmails: string[], clienteNombre: string, sucursalNombre: string, tipoVisita: string, coordinadorNombre: string, appUrl: string }} ctx
 * @returns {Promise<void>}
 */
export async function enviarInformeADirector(informeId, ctx) {
  const { error } = await supabase
    .from('informe')
    .update({ estado: 'EN_APROBACION', enviado_director_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', informeId);
  if (error) throw new Error(`Error al enviar informe al director: ${error.message}`);

  if (ctx.directorEmails?.length) {
    const [primero, ...resto] = ctx.directorEmails;
    fireAndForgetEmail('informe_director', {
      destinatario: primero,
      clienteNombre: ctx.clienteNombre,
      sucursalNombre: ctx.sucursalNombre,
      tipoVisita: ctx.tipoVisita,
      coordinadorNombre: ctx.coordinadorNombre,
      appUrl: ctx.appUrl || '',
    }, resto);
  }
}

/**
 * Registra la acción del director (APROBADO | RECHAZADO) sobre un informe.
 * Si aprueba → estado pasa a APROBADO.
 * Si rechaza → estado vuelve a EN_REVISION y se limpia enviado_director_at.
 *
 * @param {string} informeId
 * @param {string} directorUsuarioId  - perfil_usuario.id del director
 * @param {'APROBADO'|'RECHAZADO'} accion
 * @param {string|null} observacion
 * @returns {Promise<void>}
 */
export async function registrarRevisionDirector(informeId, directorUsuarioId, accion, observacion = null) {
  // Leer ciclo_revision actual para registrar en qué ciclo se tomó la decisión
  const { data: informeActual } = await supabase
    .from('informe')
    .select('ciclo_revision')
    .eq('id', informeId)
    .single();

  const cicloActual = informeActual?.ciclo_revision ?? 1;

  const { error: insErr } = await supabase
    .from('informe_director')
    .insert({ informe_id: informeId, director_usuario_id: directorUsuarioId, accion, observacion, ciclo: cicloActual });
  if (insErr) throw new Error(`Error al registrar acción del director: ${insErr.message}`);

  const nuevoEstado = accion === 'APROBADO' ? 'APROBADO' : 'EN_REVISION';
  const patch = {
    estado: nuevoEstado,
    updated_at: new Date().toISOString(),
    ...(accion === 'RECHAZADO' ? {
      enviado_director_at: null,
      ciclo_revision: cicloActual + 1,   // nuevo ciclo: coordinador revisa de nuevo
    } : {}),
  };

  const { error: updErr } = await supabase
    .from('informe')
    .update(patch)
    .eq('id', informeId);
  if (updErr) throw new Error(`Error al actualizar estado del informe: ${updErr.message}`);

  // Notificar en el chat cuando el director rechaza con observación
  if (accion === 'RECHAZADO' && observacion) {
    try {
      await sendChatInforme(informeId, directorUsuarioId, `❌ Informe rechazado\n\nMotivo: ${observacion}`);
    } catch { /* chat no crítico */ }
  }
}

/**
 * @typedef {Object} InformeDirectorPendiente
 * @property {string} id
 * @property {string} visita_id
 * @property {string} enviado_director_at
 * @property {string} cliente_nombre
 * @property {string} sucursal_nombre
 * @property {string} tipo_visita
 * @property {string|null} fecha_fin
 * @property {number} aprobadas
 * @property {number} rechazadas
 * @property {number} total
 */

/**
 * Retorna los informes pendientes de revisión del director autenticado.
 * (enviado_director_at IS NOT NULL, estado EN_REVISION, sin acción del director aún)
 *
 * @param {string} directorUsuarioId - perfil_usuario.id del director
 * @returns {Promise<InformeDirectorPendiente[]>}
 */
export async function getInformesPendientesDirector(directorUsuarioId) {
  const { data, error } = await supabase
    .from('informe')
    .select(`
      id,
      visita_id,
      estado,
      ciclo_revision,
      enviado_director_at,
      visita:visita_id(
        fecha_fin,
        tipo_visita:tipo_visita_id(nombre),
        cliente:cliente_id(razon_social),
        sucursal:sucursal_id(nombre, ciudad)
      )
    `)
    .eq('estado', 'EN_APROBACION')
    .not('enviado_director_at', 'is', null)
    .order('enviado_director_at', { ascending: true });

  if (error) throw new Error(`Error al obtener informes director: ${error.message}`);

  const informeIds = (data || []).map(inf => inf.id);
  if (!informeIds.length) return [];

  // Filtrar los ya respondidos en el ciclo ACTUAL — un rechazo previo no bloquea ciclos nuevos
  const { data: yaRespondidos } = await supabase
    .from('informe_director')
    .select('informe_id, ciclo')
    .in('informe_id', informeIds)
    .eq('director_usuario_id', directorUsuarioId);

  // Construir set de "informe_id respondido en su ciclo actual"
  const cicloActualMap = new Map((data || []).map(inf => [inf.id, inf.ciclo_revision ?? 1]));
  const respondidosSet = new Set(
    (yaRespondidos || [])
      .filter(r => r.ciclo === (cicloActualMap.get(r.informe_id) ?? 1))
      .map(r => r.informe_id)
  );

  const pendientes = (data || []).filter(inf => !respondidosSet.has(inf.id));
  if (!pendientes.length) return [];

  const pendienteIds = pendientes.map(inf => inf.id);

  // Conteo de revisiones del coordinador
  const { data: revRows } = await supabase
    .from('informe_coordinador')
    .select('informe_id, aprobado')
    .in('informe_id', pendienteIds);

  /** @type {Map<string, {aprobadas:number, rechazadas:number, total:number}>} */
  const revMap = new Map();
  for (const r of (revRows || [])) {
    const entry = revMap.get(r.informe_id) || { aprobadas: 0, rechazadas: 0, total: 0 };
    entry.total += 1;
    if (r.aprobado) entry.aprobadas += 1;
    else entry.rechazadas += 1;
    revMap.set(r.informe_id, entry);
  }

  return pendientes.map(inf => {
    const rev = revMap.get(inf.id) || { aprobadas: 0, rechazadas: 0, total: 0 };
    return {
      id: inf.id,
      visita_id: inf.visita_id,
      estado: inf.estado,
      enviado_director_at: inf.enviado_director_at,
      cliente_nombre: inf.visita?.cliente?.razon_social || '—',
      sucursal_nombre: inf.visita?.sucursal?.nombre || '—',
      sucursal_ciudad: inf.visita?.sucursal?.ciudad || null,
      tipo_visita: inf.visita?.tipo_visita?.nombre || '—',
      fecha_fin: inf.visita?.fecha_fin || null,
      aprobadas: rev.aprobadas,
      rechazadas: rev.rechazadas,
      total: rev.total,
    };
  });
}

/**
 * Retorna TODOS los informes visibles para el director (todos los estados) para trazabilidad.
 * @returns {Promise<Array>}
 */
export async function getInformesDirectorTodos() {
  const { data, error } = await supabase
    .from('informe')
    .select(`
      id, visita_id, estado, enviado_director_at,
      visita:visita_id(
        fecha_fin,
        tipo_visita:tipo_visita_id(nombre),
        cliente:cliente_id(razon_social),
        sucursal:sucursal_id(nombre, ciudad)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error al obtener informes director: ${error.message}`);

  const informeIds = (data || []).map(inf => inf.id);
  if (!informeIds.length) return [];

  const { data: revRows } = await supabase
    .from('informe_coordinador')
    .select('informe_id, aprobado')
    .in('informe_id', informeIds);

  const revMap = new Map();
  for (const r of (revRows || [])) {
    const entry = revMap.get(r.informe_id) || { aprobadas: 0, rechazadas: 0, total: 0 };
    entry.total += 1;
    if (r.aprobado) entry.aprobadas += 1;
    else entry.rechazadas += 1;
    revMap.set(r.informe_id, entry);
  }

  return (data || []).map(inf => {
    const rev = revMap.get(inf.id) || { aprobadas: 0, rechazadas: 0, total: 0 };
    return {
      id: inf.id,
      visita_id: inf.visita_id,
      estado: inf.estado,
      enviado_director_at: inf.enviado_director_at,
      cliente_nombre: inf.visita?.cliente?.razon_social || '—',
      sucursal_nombre: inf.visita?.sucursal?.nombre || '—',
      sucursal_ciudad: inf.visita?.sucursal?.ciudad || null,
      tipo_visita: inf.visita?.tipo_visita?.nombre || '—',
      fecha_fin: inf.visita?.fecha_fin || null,
      aprobadas: rev.aprobadas,
      rechazadas: rev.rechazadas,
      total: rev.total,
    };
  });
}

/**
 * Genera el PDF del informe (solo intervenciones aprobadas por el coordinador),
 * sube al storage, actualiza los campos de aprobación y envía email al cliente.
 *
 * @param {string} informeId
 * @param {string} visitaId
 * @param {{ clienteEmails: string[], clienteNombre: string, sucursalNombre: string, tipoVisita: string, fechaFin: string|null, appUrl: string, finalizadoPor: string }} ctx
 * @returns {Promise<{pdfUrl: string}>}
 */
export async function aprobarYGenerarPDF(informeId, visitaId, ctx) {
  // 1. Obtener IDs de intervenciones aprobadas por el coordinador
  const { data: revisiones, error: revErr } = await supabase
    .from('informe_coordinador')
    .select('intervencion_id')
    .eq('informe_id', informeId)
    .eq('aprobado', true);

  if (revErr) throw new Error(`Error al obtener revisiones aprobadas: ${revErr.message}`);
  const aprobadosIds = (revisiones || []).map(r => r.intervencion_id);

  // 2. Generar PDF desde el frontend usando html2canvas + jsPDF
  const { generateInformeVisita } = await import('../utils/generateInforme');
  const { pdfUrl } = await generateInformeVisita(visitaId, aprobadosIds);

  // El storage path es predecible: generateInformeVisita siempre usa este path
  const storagePath = `informes/${visitaId}/informe.pdf`;

  const ahora = new Date().toISOString();

  // 3. Guardar path del PDF y campos de finalización en el informe
  const { error: updErr } = await supabase
    .from('informe')
    .update({
      storage_path:       storagePath,
      generado_at:        ahora,
      enviado_cliente_at: ctx.clienteEmails?.length ? ahora : null,
      finalizado_por:     ctx.finalizadoPor || null,
      finalizado_at:      ahora,
      updated_at:         ahora,
    })
    .eq('id', informeId);

  if (updErr) throw new Error(`Error al guardar PDF del informe: ${updErr.message}`);

  // 4. Notificar al cliente por email
  if (ctx.clienteEmails?.length) {
    const [primero, ...resto] = ctx.clienteEmails;
    fireAndForgetEmail('informe_cliente', {
      destinatario:  primero,
      clienteNombre: ctx.clienteNombre,
      sucursalNombre: ctx.sucursalNombre,
      tipoVisita:    ctx.tipoVisita,
      fechaFin:      ctx.fechaFin || '—',
      pdfUrl,
      appUrl:        ctx.appUrl || '',
    }, resto);
  }

  return { pdfUrl };
}

// ─── Bandeja de conversaciones ───────────────────────────────────────────────

/**
 * @typedef {Object} Conversacion
 * @property {string}      informe_id
 * @property {string}      visita_id
 * @property {string}      cliente_nombre
 * @property {string}      sucursal_nombre
 * @property {string|null} sucursal_ciudad
 * @property {string}      tipo_visita
 * @property {string}      informe_estado      - EN_REVISION | APROBADO | RECHAZADO
 * @property {number}      total_mensajes
 * @property {string|null} ultimo_mensaje
 * @property {string|null} ultimo_mensaje_at
 * @property {string|null} ultimo_autor_nombre
 */

/**
 * Retorna todas las conversaciones (informes con chat) accesibles para el usuario actual.
 * RLS garantiza que cada rol solo ve los informes que le corresponden.
 * Ordena por último mensaje descendente.
 *
 * @returns {Promise<Conversacion[]>}
 */
export async function getConversaciones() {
  // 1. Traer todos los informes accesibles con su visita y al menos 1 mensaje de chat
  const { data: informes, error } = await supabase
    .from('informe')
    .select(`
      id,
      visita_id,
      estado,
      visita:visita_id(
        tipo_visita:tipo_visita_id(nombre),
        cliente:cliente_id(razon_social),
        sucursal:sucursal_id(nombre, ciudad)
      ),
      chat_informe(id, mensaje, created_at, autor:autor_id(nombres, apellidos))
    `)
    .order('created_at', { referencedTable: 'chat_informe', ascending: false });

  if (error) throw new Error(`Error al obtener conversaciones: ${error.message}`);

  // Filtrar informes que tienen al menos un mensaje y construir el shape
  return (informes || [])
    .filter(inf => inf.chat_informe?.length > 0)
    .map(inf => {
      const msgs = [...(inf.chat_informe || [])].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      const ultimo = msgs[0];
      return {
        informe_id:         inf.id,
        visita_id:          inf.visita_id,
        cliente_nombre:     inf.visita?.cliente?.razon_social || '—',
        sucursal_nombre:    inf.visita?.sucursal?.nombre || '—',
        sucursal_ciudad:    inf.visita?.sucursal?.ciudad || null,
        tipo_visita:        inf.visita?.tipo_visita?.nombre || '—',
        informe_estado:     inf.estado,
        total_mensajes:     msgs.length,
        ultimo_mensaje:     ultimo?.mensaje || null,
        ultimo_mensaje_at:  ultimo?.created_at || null,
        ultimo_autor_nombre: ultimo?.autor
          ? `${ultimo.autor.nombres || ''} ${ultimo.autor.apellidos || ''}`.trim()
          : null,
      };
    })
    .sort((a, b) => new Date(b.ultimo_mensaje_at) - new Date(a.ultimo_mensaje_at));
}

// ─── Chat interno del informe ─────────────────────────────────────────────────

/**
 * @typedef {Object} ChatMensaje
 * @property {string}      id
 * @property {string}      informe_id
 * @property {string}      autor_id
 * @property {string}      mensaje
 * @property {string}      created_at
 * @property {string|null} autor_nombre
 * @property {string|null} autor_rol
 */

/**
 * Retorna todos los mensajes del chat interno de un informe, con nombre del autor.
 * @param {string} informeId
 * @returns {Promise<ChatMensaje[]>}
 */
export async function getChatInforme(informeId) {
  const { data, error } = await supabase
    .from('chat_informe')
    .select('id, informe_id, autor_id, mensaje, created_at, autor:autor_id(nombres, apellidos, rol_id(nombre))')
    .eq('informe_id', informeId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Error al obtener chat: ${error.message}`);
  return (data || []).map(m => ({
    id: m.id,
    informe_id: m.informe_id,
    autor_id: m.autor_id,
    mensaje: m.mensaje,
    created_at: m.created_at,
    autor_nombre: m.autor ? `${m.autor.nombres || ''} ${m.autor.apellidos || ''}`.trim() : '—',
    autor_rol: m.autor?.rol_id?.nombre || null,
  }));
}

/**
 * Envía un mensaje al chat interno del informe.
 * @param {string} informeId
 * @param {string} autorId
 * @param {string} mensaje
 * @returns {Promise<void>}
 */
export async function sendChatInforme(informeId, autorId, mensaje) {
  const { error } = await supabase
    .from('chat_informe')
    .insert({ informe_id: informeId, autor_id: autorId, mensaje });
  if (error) throw new Error(`Error al enviar mensaje: ${error.message}`);
}

// ─── Edición de comentarios de paso ──────────────────────────────────────────

/**
 * Crea o actualiza la solicitud de visita correctiva ligada a un informe.
 * Garantiza una sola solicitud por informe (UNIQUE en informe_id).
 *
 * Si ya existe una solicitud para el informe:
 *   - Actualiza motivo, fecha_sugerida y reemplaza los dispositivos.
 * Si no existe:
 *   - Inserta una nueva solicitud con informe_id.
 *
 * @param {{
 *   informeId: string,
 *   clienteId: string,
 *   sucursalId: string,
 *   creadoPor: string,
 *   motivo: string,
 *   dispositivoIds: string[],
 *   fechaSugerida?: string|null,
 * }} params
 * @returns {Promise<{ solicitudId: string, isNew: boolean }>}
 */
export async function upsertSolicitudCorrectiva({ informeId, clienteId, sucursalId, creadoPor, motivo, dispositivoIds, fechaSugerida = null }) {
  // Resolver IDs de catálogo directamente para no depender de opciones pre-cargadas
  const [{ data: tipoVisitaRow }, { data: estadoRow }] = await Promise.all([
    supabase.from('catalogo').select('id').eq('tipo', 'TIPO_VISITA').eq('codigo', 'CORRECTIVO').maybeSingle(),
    supabase.from('catalogo').select('id').eq('tipo', 'ESTADO_VISITA').eq('codigo', 'PENDIENTE').maybeSingle(),
  ]);
  if (!tipoVisitaRow?.id) throw new Error('Tipo de visita CORRECTIVO no encontrado en catálogo.');
  const tipoVisitaId = tipoVisitaRow.id;
  const estadoId     = estadoRow?.id || null;

  const { data: existente } = await supabase
    .from('solicitud_visita').select('id').eq('informe_id', informeId).maybeSingle();

  let solicitudId;

  if (existente?.id) {
    // Si no quedan dispositivos rechazados, cancelar la solicitud
    if (dispositivoIds.length === 0) {
      const { data: estadoCancelada } = await supabase
        .from('catalogo').select('id').eq('tipo', 'ESTADO_VISITA').eq('codigo', 'CANCELADA').maybeSingle();
      await supabase.from('solicitud_visita')
        .update({ estado_id: estadoCancelada?.id || null, updated_at: new Date().toISOString() })
        .eq('id', existente.id);
      await syncSolicitudDispositivos(existente.id, []);
      return { solicitudId: existente.id, isNew: false };
    }

    const { error: updErr } = await supabase
      .from('solicitud_visita')
      .update({
        cliente_id:     clienteId || null,
        sucursal_id:    sucursalId,
        tipo_visita_id: tipoVisitaId,
        estado_id:      estadoId || null,
        motivo,
        fecha_sugerida: fechaSugerida || null,
        updated_at:     new Date().toISOString(),
      })
      .eq('id', existente.id);
    if (updErr) throw new Error(`Error al actualizar solicitud correctiva: ${updErr.message}`);
    solicitudId = existente.id;
  } else {
    if (dispositivoIds.length === 0) return { solicitudId: null, isNew: false };

    const { data: inserted, error: insErr } = await supabase
      .from('solicitud_visita')
      .insert({
        informe_id:     informeId,
        cliente_id:     clienteId || null,
        sucursal_id:    sucursalId,
        creado_por:     creadoPor,
        tipo_visita_id: tipoVisitaId,
        motivo,
        prioridad:      'ALTA',
        estado_id:      estadoId || null,
        fecha_sugerida: fechaSugerida || null,
      })
      .select('id')
      .single();
    if (insErr) throw new Error(`Error al crear solicitud correctiva: ${insErr.message}`);
    solicitudId = inserted.id;
  }

  await syncSolicitudDispositivos(solicitudId, dispositivoIds);

  return { solicitudId, isNew: !existente?.id };
}

/**
 * Actualiza el comentario de un ejecucion_paso identificado por intervencion_id + paso_protocolo_id.
 * @param {string} intervencionId
 * @param {string} pasoProtocoloId
 * @param {string|null} comentarios
 * @returns {Promise<void>}
 */
export async function updateComentarioPaso(intervencionId, pasoProtocoloId, comentarios) {
  const { error } = await supabase
    .from('ejecucion_paso')
    .update({ comentarios })
    .eq('intervencion_id', intervencionId)
    .eq('paso_protocolo_id', pasoProtocoloId);
  if (error) throw new Error(`Error al actualizar comentario: ${error.message}`);
}

/**
 * Actualiza la observación de una actividad específica (ejecucion_actividad).
 * @param {string} ejecucionActividadId - id de ejecucion_actividad
 * @param {string|null} observacion
 * @returns {Promise<void>}
 */
export async function updateObservacionActividad(ejecucionActividadId, observacion) {
  const { error } = await supabase
    .from('ejecucion_actividad')
    .update({ observacion })
    .eq('id', ejecucionActividadId);
  if (error) throw new Error(`Error al actualizar observación de actividad: ${error.message}`);
}

/**
 * Actualiza la observación final de una intervención (comentario a nivel de dispositivo).
 * @param {string} intervencionId
 * @param {string|null} observacionFinal
 * @returns {Promise<void>}
 */
export async function updateObservacionIntervencion(intervencionId, observacionFinal) {
  const { error } = await supabase
    .from('intervencion')
    .update({ observacion_final: observacionFinal })
    .eq('id', intervencionId);
  if (error) throw new Error(`Error al actualizar observación de intervención: ${error.message}`);
}

/**
 * Soft-delete de una evidencia (foto o etiqueta) del informe.
 * @param {string} evidenciaId - id de evidencia_intervencion
 * @returns {Promise<void>}
 */
export async function deleteEvidenciaInforme(evidenciaId) {
  const { error } = await supabase
    .from('evidencia_intervencion')
    .update({ activo: false })
    .eq('id', evidenciaId);
  if (error) throw new Error(`Error al eliminar evidencia: ${error.message}`);
}

/**
 * Sube una nueva foto de evidencia para una intervención del informe.
 * Reutiliza uploadEvidencia de visitaApi pero accesible desde aquí.
 *
 * @param {string} visitaId
 * @param {string} dispositivoId
 * @param {string} intervencionId
 * @param {File} file
 * @param {boolean} esEtiqueta
 * @param {number} fotoNumber - ignorado si esEtiqueta=true
 * @returns {Promise<{ id: string, url: string, signedUrl: string|null }>}
 */
export async function uploadEvidenciaInforme(visitaId, dispositivoId, intervencionId, file, esEtiqueta, fotoNumber) {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = esEtiqueta ? `etiqueta.${ext}` : `foto_${fotoNumber}.${ext}`;
  const storagePath = `evidencias/${visitaId}/${dispositivoId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('inmotika')
    .upload(storagePath, file, { upsert: true, contentType: file.type });

  if (uploadError) throw new Error(`Error al subir foto: ${uploadError.message}`);

  // Si es etiqueta, marcar previas como inactivas
  if (esEtiqueta) {
    await supabase
      .from('evidencia_intervencion')
      .update({ activo: false })
      .eq('intervencion_id', intervencionId)
      .eq('es_etiqueta', true);
  }

  const { data: inserted, error: dbError } = await supabase
    .from('evidencia_intervencion')
    .insert({
      intervencion_id: intervencionId,
      url: storagePath,
      numero_foto: esEtiqueta ? null : fotoNumber,
      es_etiqueta: esEtiqueta,
      activo: true,
    })
    .select('id, url')
    .single();

  if (dbError) throw new Error(`Error al registrar evidencia: ${dbError.message}`);

  const { data: signed } = await supabase.storage
    .from('inmotika')
    .createSignedUrl(storagePath, 3600);

  return { id: inserted.id, url: inserted.url, signedUrl: signed?.signedUrl || null };
}

// ─── Observación coordinador en el informe (va al PDF) ───────────────────────

/**
 * Actualiza la observación del coordinador en el informe (campo que aparece en el PDF).
 * @param {string} informeId
 * @param {string|null} observacion
 * @returns {Promise<void>}
 */
export async function updateObservacionCoordinador(informeId, observacion) {
  const { error } = await supabase
    .from('informe')
    .update({ observacion_coordinador: observacion, updated_at: new Date().toISOString() })
    .eq('id', informeId);
  if (error) throw new Error(`Error al actualizar observación: ${error.message}`);
}

/**
 * Actualiza la observación del director en el informe (aparecerá en el PDF).
 * @param {string} informeId
 * @param {string|null} observacion
 */
export async function updateObservacionDirector(informeId, observacion) {
  const { error } = await supabase
    .from('informe')
    .update({ observacion_director: observacion, updated_at: new Date().toISOString() })
    .eq('id', informeId);
  if (error) throw new Error(`Error al actualizar observación del director: ${error.message}`);
}

/**
 * Retorna el informe completo incluyendo observacion_coordinador.
 * @param {string} informeId
 * @returns {Promise<{id:string, estado:string, observacion_coordinador:string|null}|null>}
 */
export async function getInformeDetalle(informeId) {
  const { data, error } = await supabase
    .from('informe')
    .select('id, estado, observacion_coordinador, observacion_director, visita_id, enviado_director_at')
    .eq('id', informeId)
    .maybeSingle();
  if (error) throw new Error(`Error al obtener informe: ${error.message}`);
  return data || null;
}

/**
 * @param {string} visitaId - UUID de la visita a informar
 * @param {string[]|null} [aprobadosIds] - Si se pasa, solo incluye esas intervenciones en el PDF
 * @returns {Promise<InformeVisita>}
 */
export async function fetchInformeData(visitaId, aprobadosIds = null) {
  // ── 1. Datos generales de la visita ──────────────────────────────────────
  const { data: visita, error: visitaErr } = await supabase
    .from('visita')
    .select(`
      id,
      cliente_id,
      sucursal_id,
      fecha_programada,
      fecha_inicio,
      fecha_fin,
      observaciones,
      observacion_final,
      cliente:cliente_id(razon_social, nit),
      sucursal:sucursal_id(nombre, ciudad, direccion),
      tipo_visita:tipo_visita_id(nombre),
      coordinador_perfil:coordinador_usuario_id(nombres, apellidos),
      visita_tecnico(
        tecnico:tecnico_id(
          perfil:usuario_id(nombres, apellidos)
        )
      )
    `)
    .eq('id', visitaId)
    .single();

  if (visitaErr || !visita) {
    throw new Error(`Visita no encontrada: ${visitaErr?.message ?? visitaId}`);
  }

  const tecnicos = (visita.visita_tecnico || [])
    .map(vt => {
      const p = vt.tecnico?.perfil;
      return p ? `${p.nombres || ''} ${p.apellidos || ''}`.trim() : null;
    })
    .filter(Boolean)
    .join(', ');

  const coord = visita.coordinador_perfil;
  const coordinador = coord
    ? `${coord.nombres || ''} ${coord.apellidos || ''}`.trim()
    : null;

  // ── 2. Intervenciones con dispositivo + categoría ─────────────────────────
  const { data: intervenciones, error: intErr } = await supabase
    .from('intervencion')
    .select(`
      id,
      codigo_etiqueta,
      observacion_final,
      fuera_de_servicio,
      motivo_fuera_de_servicio,
      dispositivo:dispositivo_id(
        id,
        id_inmotika,
        codigo_unico,
        serial,
        modelo,
        linea,
        mac_address,
        notas_tecnicas,
        marca:marca_id(nombre),
        categoria:categoria_id(id, nombre)
      )
    `)
    .eq('visita_id', visitaId)
    .eq('activo', true);

  if (intErr) throw new Error(`Error al cargar intervenciones: ${intErr.message}`);

  // Filtrar por aprobados si se especifica (para PDF final)
  const intervencionesFiltradas = aprobadosIds
    ? (intervenciones || []).filter(i => aprobadosIds.includes(i.id))
    : (intervenciones || []);

  const intervencionIds = intervencionesFiltradas.map(i => i.id);

  // ── 3. Ejecuciones de pasos ───────────────────────────────────────────────
  const { data: ejecPasos, error: epErr } = await supabase
    .from('ejecucion_paso')
    .select(`
      intervencion_id,
      comentarios,
      fecha_inicio,
      fecha_fin,
      paso:paso_protocolo_id(id, descripcion, orden)
    `)
    .in('intervencion_id', intervencionIds)
    .eq('activo', true);

  if (epErr) throw new Error(`Error al cargar ejecucion_paso: ${epErr.message}`);

  // ── 4. Ejecuciones de actividades ─────────────────────────────────────────
  const { data: ejecActividades, error: eaErr } = await supabase
    .from('ejecucion_actividad')
    .select(`
      id,
      intervencion_id,
      actividad_id,
      estado_id,
      catalogo:estado_id(codigo),
      observacion,
      actividad:actividad_id(id, descripcion, orden, paso_id)
    `)
    .in('intervencion_id', intervencionIds);

  if (eaErr) throw new Error(`Error al cargar ejecucion_actividad: ${eaErr.message}`);

  // ── 5. Evidencias ─────────────────────────────────────────────────────────
  const { data: evidencias, error: evErr } = await supabase
    .from('evidencia_intervencion')
    .select('id, intervencion_id, url, es_etiqueta, numero_foto')
    .in('intervencion_id', intervencionIds)
    .eq('activo', true)
    .order('numero_foto', { ascending: true });

  if (evErr) throw new Error(`Error al cargar evidencias: ${evErr.message}`);

  // Generar URLs firmadas para todas las evidencias en batch
  const allPaths = (evidencias || []).map(e => e.url);
  const signedMap = await getSignedUrls(allPaths);

  // ── 6. Construir índices para cruzar datos ────────────────────────────────

  /** @type {Map<string, { intervencion_id: string, estado: string, observacion: string|null, actividad: { id: string, descripcion: string, orden: number, paso_id: string } }[]>} */
  const actividadesByIntervencion = new Map();
  for (const ea of (ejecActividades || [])) {
    const catalogoCodigo = ea.catalogo?.codigo || 'PENDIENTE';
    const estadoInterno =
      catalogoCodigo === 'COMPLETADA' ? 'completada' :
      catalogoCodigo === 'INCOMPLETA' ? 'omitida'    : 'pendiente';
    const list = actividadesByIntervencion.get(ea.intervencion_id) || [];
    list.push({ ...ea, estado: estadoInterno });
    actividadesByIntervencion.set(ea.intervencion_id, list);
  }

  /** @type {Map<string, { intervencion_id: string, comentarios: string|null, fecha_inicio: string|null, fecha_fin: string|null, paso: { id: string, descripcion: string, orden: number } }[]>} */
  const pasosByIntervencion = new Map();
  for (const ep of (ejecPasos || [])) {
    const list = pasosByIntervencion.get(ep.intervencion_id) || [];
    list.push(ep);
    pasosByIntervencion.set(ep.intervencion_id, list);
  }

  /** @type {Map<string, { etiqueta: { id: string, url: string, signedUrl: string|null }|null, fotos: { id: string, url: string, signedUrl: string|null, numero_foto: number }[] }>} */
  const evidenciasByIntervencion = new Map();
  for (const ev of (evidencias || [])) {
    const entry = evidenciasByIntervencion.get(ev.intervencion_id) || { etiqueta: null, fotos: [] };
    const signed = signedMap[ev.url] || null;
    if (ev.es_etiqueta) {
      entry.etiqueta = { id: ev.id, url: ev.url, signedUrl: signed };
    } else {
      entry.fotos.push({ id: ev.id, url: ev.url, signedUrl: signed, numero_foto: ev.numero_foto });
    }
    evidenciasByIntervencion.set(ev.intervencion_id, entry);
  }

  // ── 7. Construir dispositivos agrupados por categoría ─────────────────────

  /** @type {Map<string, { categoria_nombre: string, dispositivos: DispositivoInforme[] }>} */
  const categoriasMap = new Map();

  for (const interv of intervencionesFiltradas) {
    const disp = interv.dispositivo;
    if (!disp) continue;

    const categoriaId = disp.categoria?.id || 'sin_categoria';
    const categoriaNombre = disp.categoria?.nombre || 'Sin Categoría';

    // Pasos de esta intervención, ordenados
    const epList = (pasosByIntervencion.get(interv.id) || [])
      .sort((a, b) => (a.paso?.orden ?? 0) - (b.paso?.orden ?? 0));

    // Actividades de esta intervención, indexadas por paso_id
    const eaList = actividadesByIntervencion.get(interv.id) || [];
    /** @type {Map<string, typeof eaList>} */
    const actividadesByPaso = new Map();
    for (const ea of eaList) {
      const pasoId = ea.actividad?.paso_id;
      if (!pasoId) continue;
      const list = actividadesByPaso.get(pasoId) || [];
      list.push(ea);
      actividadesByPaso.set(pasoId, list);
    }

    /** @type {PasoEjecucion[]} */
    const pasos = epList.map(ep => ({
      id: ep.paso?.id || '',
      paso_protocolo_id: ep.paso?.id || '',
      descripcion: ep.paso?.descripcion || '',
      orden: ep.paso?.orden ?? 0,
      comentarios: ep.comentarios || null,
      fecha_inicio: ep.fecha_inicio || null,
      fecha_fin: ep.fecha_fin || null,
      actividades: (actividadesByPaso.get(ep.paso?.id || '') || [])
        .sort((a, b) => (a.actividad?.orden ?? 0) - (b.actividad?.orden ?? 0))
        .map(ea => ({
          id: ea.actividad?.id || '',
          ejecucion_id: ea.id || null,        // id de ejecucion_actividad para editar observacion
          actividad_id: ea.actividad_id || null,
          intervencion_id: ea.intervencion_id || null,
          descripcion: ea.actividad?.descripcion || '',
          orden: ea.actividad?.orden ?? 0,
          estado: ea.estado,
          observacion: ea.observacion || null,
        })),
    }));

    const evidenciaEntry = evidenciasByIntervencion.get(interv.id) || { etiqueta: null, fotos: [] };

    /** @type {DispositivoInforme} */
    const dispositivoInforme = {
      id: disp.id,
      intervencion_id: interv.id,
      id_inmotika: disp.id_inmotika || null,
      codigo_unico: disp.codigo_unico || null,
      serial: disp.serial || null,
      modelo: disp.modelo || null,
      linea: disp.linea || null,
      mac_address: disp.mac_address || null,
      notas_tecnicas: disp.notas_tecnicas || null,
      marca_nombre: disp.marca?.nombre || null,
      categoria_id: categoriaId,
      categoria_nombre: categoriaNombre,
      codigo_etiqueta: interv.codigo_etiqueta || null,
      observacion_final: interv.observacion_final || null,
      fuera_de_servicio: interv.fuera_de_servicio ?? false,
      motivo_fuera_de_servicio: interv.motivo_fuera_de_servicio || null,
      pasos,
      // fotos: array de objetos { id, url, signedUrl, numero_foto }
      fotos: evidenciaEntry.fotos,
      // foto_etiqueta: objeto { id, url, signedUrl } o null
      foto_etiqueta: evidenciaEntry.etiqueta,
    };

    if (!categoriasMap.has(categoriaId)) {
      categoriasMap.set(categoriaId, { categoria_nombre: categoriaNombre, dispositivos: [] });
    }
    categoriasMap.get(categoriaId).dispositivos.push(dispositivoInforme);
  }

  const categorias = Array.from(categoriasMap.values())
    .sort((a, b) => a.categoria_nombre.localeCompare(b.categoria_nombre));

  /** @type {InformeVisita} */
  return {
    visita_id:         visita.id,
    cliente_id:        visita.cliente_id || null,
    sucursal_id:       visita.sucursal_id || null,
    cliente_nombre:    visita.cliente?.razon_social || '—',
    cliente_nit:       visita.cliente?.nit || null,
    sucursal_nombre:   visita.sucursal?.nombre || '—',
    sucursal_ciudad:   visita.sucursal?.ciudad || null,
    sucursal_direccion: visita.sucursal?.direccion || null,
    tipo_visita:       visita.tipo_visita?.nombre || '—',
    fecha_programada:  visita.fecha_programada || null,
    fecha_inicio:      visita.fecha_inicio || null,
    fecha_fin:         visita.fecha_fin || null,
    tecnicos,
    coordinador,
    instrucciones:     visita.observaciones || null,
    observacion_final: visita.observacion_final || null,
    total_dispositivos: intervencionesFiltradas.length,
    categorias,
  };
}
