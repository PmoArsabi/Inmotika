import { supabase } from '../utils/supabase';

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
export async function fetchInformeData(visitaId) {
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

  const intervencionIds = (intervenciones || []).map(i => i.id);

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
      estado,
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
    const list = actividadesByIntervencion.get(ea.intervencion_id) || [];
    list.push(ea);
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

  for (const interv of (intervenciones || [])) {
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
    total_dispositivos: (intervenciones || []).length,
    categorias,
  };
}
