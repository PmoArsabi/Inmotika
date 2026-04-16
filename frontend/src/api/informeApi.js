import { supabase } from '../utils/supabase';
import { fireAndForgetEmail } from '../hooks/useEmail';

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
      { informe_id: informeId, intervencion_id: intervencionId, coordinador_id: coordinadorId, aprobado, nota },
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
    .in('estado', ['EN_REVISION', 'RECHAZADO'])
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error al obtener informes: ${error.message}`);

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

  return (data || []).map(inf => ({
    id: inf.id,
    visita_id: inf.visita_id,
    estado: inf.estado,
    enviado_director_at: inf.enviado_director_at || null,
    observacion_director: obsMap.get(inf.id) || null,
    cliente_nombre: inf.visita?.cliente?.razon_social || '—',
    sucursal_nombre: inf.visita?.sucursal?.nombre || '—',
    sucursal_ciudad: inf.visita?.sucursal?.ciudad || null,
    tipo_visita: inf.visita?.tipo_visita?.nombre || '—',
    fecha_fin: inf.visita?.fecha_fin || null,
    total_intervenciones: intervByVisita.get(inf.visita_id) || 0,
    revisadas: revByInforme.get(inf.id) || 0,
  }));
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
    .update({ enviado_director_at: new Date().toISOString(), updated_at: new Date().toISOString() })
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
  const { error: insErr } = await supabase
    .from('informe_director')
    .insert({ informe_id: informeId, director_usuario_id: directorUsuarioId, accion, observacion });
  if (insErr) throw new Error(`Error al registrar acción del director: ${insErr.message}`);

  const nuevoEstado = accion === 'APROBADO' ? 'APROBADO' : 'EN_REVISION';
  const patch = {
    estado: nuevoEstado,
    updated_at: new Date().toISOString(),
    ...(accion === 'RECHAZADO' ? { enviado_director_at: null } : {}),
  };

  const { error: updErr } = await supabase
    .from('informe')
    .update(patch)
    .eq('id', informeId);
  if (updErr) throw new Error(`Error al actualizar estado del informe: ${updErr.message}`);
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
  // Buscamos informes cuyo coordinador esté relacionado al director via coordinador_director
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
    .eq('estado', 'EN_REVISION')
    .not('enviado_director_at', 'is', null)
    .order('enviado_director_at', { ascending: true });

  if (error) throw new Error(`Error al obtener informes director: ${error.message}`);

  const informeIds = (data || []).map(inf => inf.id);
  if (!informeIds.length) return [];

  // Filtrar los ya respondidos por este director
  const { data: yaRespondidos } = await supabase
    .from('informe_director')
    .select('informe_id')
    .in('informe_id', informeIds)
    .eq('director_usuario_id', directorUsuarioId);

  const respondidosSet = new Set((yaRespondidos || []).map(r => r.informe_id));

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
 * sube al storage, actualiza el campo storage_path y envía email al cliente.
 * Llama a la Edge Function download-informe internamente para generar el PDF.
 *
 * @param {string} informeId
 * @param {string} visitaId
 * @param {{ clienteEmails: string[], clienteNombre: string, sucursalNombre: string, tipoVisita: string, fechaFin: string|null, appUrl: string }} ctx
 * @returns {Promise<{pdfUrl: string}>}
 */
export async function aprobarYGenerarPDF(informeId, visitaId, ctx) {
  // 1. Obtener IDs de intervenciones aprobadas
  const { data: revisiones, error: revErr } = await supabase
    .from('informe_coordinador')
    .select('intervencion_id')
    .eq('informe_id', informeId)
    .eq('aprobado', true);

  if (revErr) throw new Error(`Error al obtener revisiones aprobadas: ${revErr.message}`);
  const aprobadosIds = (revisiones || []).map(r => r.intervencion_id);

  // 2. Invocar la Edge Function de descarga de informe pasando los IDs aprobados
  const { data: pdfData, error: pdfErr } = await supabase.functions.invoke('download-informe', {
    body: { visitaId, aprobadosIds },
  });

  if (pdfErr || !pdfData?.pdfUrl) {
    throw new Error(`Error al generar PDF: ${pdfErr?.message || 'sin URL'}`);
  }

  // 3. Marcar informe como APROBADO con path del PDF
  const { error: updErr } = await supabase
    .from('informe')
    .update({
      estado: 'APROBADO',
      storage_path: pdfData.storagePath || null,
      generado_at: new Date().toISOString(),
      enviado_cliente_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', informeId);

  if (updErr) throw new Error(`Error al aprobar informe: ${updErr.message}`);

  // 4. Notificar al cliente
  if (ctx.clienteEmails?.length) {
    const [primero, ...resto] = ctx.clienteEmails;
    fireAndForgetEmail('informe_cliente', {
      destinatario: primero,
      clienteNombre: ctx.clienteNombre,
      sucursalNombre: ctx.sucursalNombre,
      tipoVisita: ctx.tipoVisita,
      fechaFin: ctx.fechaFin || '—',
      pdfUrl: pdfData.pdfUrl,
      appUrl: ctx.appUrl || '',
    }, resto);
  }

  return { pdfUrl: pdfData.pdfUrl };
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
      fecha_programada,
      fecha_inicio,
      fecha_fin,
      observaciones,
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
      intervencion_id,
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
    .select('intervencion_id, url, es_etiqueta, numero_foto')
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

  /** @type {Map<string, { etiqueta: string|null, fotos: string[] }>} */
  const evidenciasByIntervencion = new Map();
  for (const ev of (evidencias || [])) {
    const entry = evidenciasByIntervencion.get(ev.intervencion_id) || { etiqueta: null, fotos: [] };
    const signed = signedMap[ev.url] || null;
    if (ev.es_etiqueta) {
      entry.etiqueta = signed;
    } else if (signed) {
      entry.fotos.push(signed);
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
      descripcion: ep.paso?.descripcion || '',
      orden: ep.paso?.orden ?? 0,
      comentarios: ep.comentarios || null,
      fecha_inicio: ep.fecha_inicio || null,
      fecha_fin: ep.fecha_fin || null,
      actividades: (actividadesByPaso.get(ep.paso?.id || '') || [])
        .sort((a, b) => (a.actividad?.orden ?? 0) - (b.actividad?.orden ?? 0))
        .map(ea => ({
          id: ea.actividad?.id || '',
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
      pasos,
      fotos: evidenciaEntry.fotos,
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
    visita_id: visita.id,
    cliente_nombre: visita.cliente?.razon_social || '—',
    cliente_nit: visita.cliente?.nit || null,
    sucursal_nombre: visita.sucursal?.nombre || '—',
    sucursal_ciudad: visita.sucursal?.ciudad || null,
    sucursal_direccion: visita.sucursal?.direccion || null,
    tipo_visita: visita.tipo_visita?.nombre || '—',
    fecha_programada: visita.fecha_programada || null,
    fecha_inicio: visita.fecha_inicio || null,
    fecha_fin: visita.fecha_fin || null,
    tecnicos,
    coordinador,
    instrucciones: visita.observaciones || null,
    observacion_final: (intervenciones || [])[0]?.observacion_final || null,
    total_dispositivos: intervencionesFiltradas.length,
    categorias,
  };
}
