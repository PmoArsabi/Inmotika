import { supabase } from '../utils/supabase';
import { sendEmail, getVisitaEmailRecipients, buildRecipients } from '../hooks/useEmail';
import { generateInformeVisita } from '../utils/generateInforme';

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Busca el UUID de un estado en el catálogo por su tipo y código.
 * @param {string} tipo - Tipo del catálogo (ej. 'ESTADO_VISITA')
 * @param {string} codigo - Código del estado (ej. 'EN_PROCESO')
 * @returns {Promise<string>} UUID del estado
 * @throws {Error} Si no se encuentra el estado
 */
async function getCatalogoId(tipo, codigo) {
  const { data, error } = await supabase
    .from('catalogo')
    .select('id')
    .eq('tipo', tipo)
    .eq('codigo', codigo)
    .single();

  if (error || !data) {
    throw new Error(`Estado ${codigo} (tipo ${tipo}) no encontrado en el catálogo.`);
  }
  return data.id;
}

/**
 * Cache de UUIDs para ESTADO_INTERVENCION.
 * Evita N+1 queries al guardar múltiples actividades.
 * Mapa: código ('pendiente'|'completada'|'omitida') → UUID en catalogo
 * @type {Map<string, string>|null}
 */
let _estadoIntervencionCache = null;

/**
 * Devuelve el mapa código→UUID de ESTADO_INTERVENCION, cacheado por sesión.
 * @returns {Promise<Map<string, string>>}
 */
async function getEstadoIntervencionMap() {
  if (_estadoIntervencionCache) return _estadoIntervencionCache;
  const { data, error } = await supabase
    .from('catalogo')
    .select('id, codigo')
    .eq('tipo', 'ESTADO_INTERVENCION');
  if (error) throw new Error(`Error cargando ESTADO_INTERVENCION: ${error.message}`);
  // Mapear código de catálogo al texto interno del frontend
  // COMPLETADA → 'completada', INCOMPLETA → 'omitida', PENDIENTE → 'pendiente'
  const map = new Map();
  for (const row of (data || [])) {
    if (row.codigo === 'COMPLETADA') map.set('completada', row.id);
    if (row.codigo === 'INCOMPLETA') map.set('omitida',    row.id);
    if (row.codigo === 'PENDIENTE')  map.set('pendiente',  row.id);
  }
  _estadoIntervencionCache = map;
  return map;
}


// ─── Notificaciones ──────────────────────────────────────────────────────────

/**
 * Envía el email `visita_programada` a los destinatarios de la visita.
 * Fire-and-forget: nunca lanza; los errores se loguean.
 *
 * @param {string} visitaId
 * @param {{ clienteId: string, sucursalId: string, fechaProgramada: string, coordinadorNombre?: string }} payload
 * @param {{ id: string, role: string }} actor - usuario que programa la visita
 */
export function notificarVisitaProgramada(visitaId, payload, actor) {
  supabase
    .from('visita')
    .select(`
      cliente:cliente_id(razon_social),
      sucursal:sucursal_id(nombre),
      tipo_visita:tipo_visita_id(nombre),
      solicitud:solicitud_id(cliente:cliente_id(razon_social)),
      visita_tecnico(tecnico:tecnico_id(perfil:usuario_id(nombres, apellidos)))
    `)
    .eq('id', visitaId)
    .maybeSingle()
    .then(async ({ data: v }) => {
      const tecnicos = (v?.visita_tecnico || [])
        .map(vt => {
          const p = vt.tecnico?.perfil;
          return p ? `${p.nombres || ''} ${p.apellidos || ''}`.trim() : null;
        })
        .filter(Boolean)
        .join(', ');

      const allEmails = await getVisitaEmailRecipients({
        actorId: actor?.id,
        actorRole: actor?.role,
        clienteId: payload.clienteId,
        sucursalId: payload.sucursalId,
        visitaId,
      });
      if (!allEmails.length) return;

      const { destinatario, cc } = buildRecipients(allEmails[0], allEmails.slice(1));
      sendEmail('visita_programada', {
        destinatario,
        clienteNombre: v?.cliente?.razon_social || v?.solicitud?.cliente?.razon_social || '',
        sucursalNombre: v?.sucursal?.nombre || '',
        tipoVisita: v?.tipo_visita?.nombre || '',
        fechaProgramada: payload.fechaProgramada
          ? new Date(payload.fechaProgramada).toLocaleString('es-ES')
          : '—',
        tecnicos: tecnicos || '—',
        coordinador: payload.coordinadorNombre || '',
        appUrl: window.location.origin,
      }, cc);
    })
    .catch(err => console.error('[visitaApi] notificarVisitaProgramada falló:', err));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Inicia una visita: establece fecha_inicio = now() y cambia el estado a EN_PROCESO.
 * Resuelve el estado_id desde el catálogo internamente.
 *
 * RLS: el técnico autenticado debe estar en visita_tecnico para esta visita,
 * o ser Admin/Coordinador/Director (cubiertas por las políticas existentes).
 *
 * @param {string} visitaId - UUID de la visita a iniciar
 * @param {import('../hooks/useEmail').ActorContext} [actor] - contexto del usuario que inicia
 * @returns {Promise<void>}
 * @throws {Error} Si el catálogo no contiene EN_PROCESO o la actualización falla
 */
export async function iniciarVisita(visitaId, actor = null) {
  const estadoId = await getCatalogoId('ESTADO_VISITA', 'EN_PROGRESO');
  const fechaInicio = new Date().toISOString();

  const { data: visitaRow, error } = await supabase
    .from('visita')
    .update({
      fecha_inicio: fechaInicio,
      estado_id: estadoId,
    })
    .eq('id', visitaId)
    .select(`
      sucursal_id,
      cliente_id,
      cliente:cliente_id(razon_social),
      sucursal:sucursal_id(nombre),
      tipo_visita:tipo_visita_id(nombre),
      solicitud:solicitud_id(cliente:cliente_id(razon_social), sucursal:sucursal_id(nombre)),
      visita_tecnico(tecnico:tecnico_id(perfil:usuario_id(nombres, apellidos)))
    `)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo iniciar la visita: ${error.message}`);
  }
  if (!visitaRow) {
    throw new Error('No se pudo iniciar la visita: sin permisos o visita no encontrada.');
  }

  // Sincronizar estado en intervenciones existentes (si las hay)
  await supabase
    .from('intervencion')
    .update({ estado_id: estadoId })
    .eq('visita_id', visitaId);

  // Notificar a contactos, coordinadores, directores y admins (fire-and-forget)
  if (visitaRow?.sucursal_id) {
    const tecnicos = (visitaRow?.visita_tecnico || [])
      .map(vt => {
        const p = vt.tecnico?.perfil;
        return p ? `${p.nombres || ''} ${p.apellidos || ''}`.trim() : null;
      })
      .filter(Boolean)
      .join(', ');

    getVisitaEmailRecipients({
      actorId: actor?.actorId,
      actorRole: actor?.actorRole,
      clienteId: visitaRow.cliente_id,
      sucursalId: visitaRow.sucursal_id,
      visitaId,
    }).then(allEmails => {
      if (!allEmails.length) return;
      const { destinatario, cc } = buildRecipients(allEmails[0], allEmails.slice(1));
      sendEmail('visita_iniciada', {
        destinatario,
        clienteNombre: visitaRow?.cliente?.razon_social || visitaRow?.solicitud?.cliente?.razon_social || '',
        sucursalNombre: visitaRow?.sucursal?.nombre || visitaRow?.solicitud?.sucursal?.nombre || '',
        tipoVisita: visitaRow?.tipo_visita?.nombre || '',
        fechaInicio: new Date(fechaInicio).toLocaleString('es-ES'),
        tecnicos: tecnicos || '—',
        appUrl: window.location.origin,
      }, cc);
    });
  }
}

/**
 * Sube la foto de evidencia a Supabase Storage y registra en evidencia_intervencion.
 *
 * Path de almacenamiento:
 *   evidencias/{visita_id}/{dispositivo_id}/etiqueta.{ext}   ← foto etiqueta
 *   evidencias/{visita_id}/{dispositivo_id}/foto_{n}.{ext}   ← resto de fotos
 *
 * Para fotos etiqueta usa DELETE + INSERT para evitar duplicados (sin restricción
 * unique en BD). Para fotos normales siempre inserta una fila nueva.
 *
 * @param {string}  visitaId       - UUID de la visita
 * @param {string}  dispositivoId  - UUID del dispositivo
 * @param {string}  intervencionId - UUID de la intervencion
 * @param {File}    file           - Objeto File capturado en el uploader
 * @param {boolean} esEtiqueta     - Si es la foto de etiqueta del dispositivo
 * @param {number}  fotoNumber     - Número secuencial para fotos no etiqueta (ignorado si esEtiqueta=true)
 * @returns {Promise<string>} publicUrl de la foto subida
 * @throws {Error} Si el upload a Storage falla
 */
export async function uploadEvidencia(visitaId, dispositivoId, intervencionId, file, esEtiqueta, fotoNumber) {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = esEtiqueta ? `etiqueta.${ext}` : `foto_${fotoNumber}.${ext}`;
  const storagePath = `evidencias/${visitaId}/${dispositivoId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('inmotika')
    .upload(storagePath, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    throw new Error(`Error al subir evidencia a Storage: ${uploadError.message}`);
  }

  // Para fotos etiqueta: marcar previas como inactivas (soft-delete)
  if (esEtiqueta) {
    await supabase
      .from('evidencia_intervencion')
      .update({ activo: false })
      .eq('intervencion_id', intervencionId)
      .eq('es_etiqueta', true);
  }

  // Guardar path relativo — las signed URLs se generan al mostrar con SecureImage
  const { error: dbError } = await supabase
    .from('evidencia_intervencion')
    .insert({
      intervencion_id: intervencionId,
      url: storagePath,
      numero_foto: esEtiqueta ? null : fotoNumber,
      es_etiqueta: esEtiqueta,
      activo: true,
    });

  if (dbError) {
    throw new Error(`Error al registrar evidencia en BD: ${dbError.message}`);
  }

  return storagePath;
}

/**
 * Guarda el avance de un dispositivo dentro de una visita.
 *
 * Flujo:
 * 1. Busca o crea la intervencion (visita_id + dispositivo_id).
 * 2. Para TODOS los pasos del protocolo del dispositivo: busca o crea ejecucion_paso,
 *    actualiza comentarios y calcula fecha_fin según actividades obligatorias completadas.
 * 3. Para cada actividad en actividadData: upsert ejecucion_actividad usando
 *    el índice único (intervencion_id, actividad_id).
 * 4. Sube las evidencias del dispositivo (etiqueta + fotos adicionales) a Storage
 *    y registra cada una en evidencia_intervencion.
 *
 * @param {string} visitaId      - UUID de la visita
 * @param {string} dispositivoId - UUID del dispositivo
 * @param {Array<{ id: string, descripcion: string, orden: number, actividades: Array<{ id: string }> }>} allPasos
 *   Lista completa de pasos del protocolo para este dispositivo
 * @param {{ [pasoId: string]: { comentarios?: string } }} pasoData
 *   Mapa de paso_protocolo.id → datos del paso ejecutado (puede estar vacío si no hay comentarios)
 * @param {{ [actividadId: string]: { estado: 'pendiente'|'completada'|'omitida', observacion?: string } }} actividadData
 *   Mapa de actividad_protocolo.id → estado de ejecución y observación opcional
 * @param {{ etiqueta: { file: File, preview: string }|null, fotos: Array<{ file: File, preview: string }> }} [evidencias]
 *   Evidencias fotográficas capturadas a nivel de dispositivo
 * @returns {Promise<void>}
 * @throws {Error} Si alguna operación de BD falla
 */
export async function guardarAvanceDispositivo(visitaId, dispositivoId, allPasos, pasoData, actividadData, evidencias = { etiqueta: null, fotos: [] }, codigoEtiqueta = null) {
  const intervencionId = await resolveIntervencionId(visitaId, dispositivoId, codigoEtiqueta);
  const now = new Date().toISOString();
  await savePasosEjecucion(intervencionId, allPasos, pasoData, actividadData, now);
  await saveActividadStates(intervencionId, actividadData);
  await uploadEvidenciasDispositivo(visitaId, dispositivoId, intervencionId, evidencias);
}

// ─── Helpers internos de guardarAvanceDispositivo ─────────────────────────────

/**
 * Busca o crea la intervención para este dispositivo en la visita.
 * Si ya existe y se provee codigoEtiqueta, lo actualiza.
 *
 * @param {string} visitaId
 * @param {string} dispositivoId
 * @param {string|null} codigoEtiqueta
 * @returns {Promise<string>} intervencionId
 */
const ETIQUETA_RE = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;

async function resolveIntervencionId(visitaId, dispositivoId, codigoEtiqueta) {
  const raw = codigoEtiqueta?.trim().toUpperCase() || '';
  if (!raw) throw new Error('El código de etiqueta es obligatorio.');
  if (!ETIQUETA_RE.test(raw)) throw new Error(`Formato de etiqueta inválido "${codigoEtiqueta}". Debe ser XXXX-XXXX (letras y números).`);
  const etiqueta = raw;
  const { data: existing, error: fetchErr } = await supabase
    .from('intervencion')
    .select('id')
    .eq('visita_id', visitaId)
    .eq('dispositivo_id', dispositivoId)
    .maybeSingle();

  if (fetchErr) throw new Error(`Error al buscar intervención: ${fetchErr.message}`);

  if (existing) {
    if (etiqueta) {
      await supabase.from('intervencion').update({ codigo_etiqueta: etiqueta }).eq('id', existing.id);
    }
    return existing.id;
  }

  // Heredar estado_id de la visita para mantener consistencia
  const { data: visitaRow } = await supabase.from('visita').select('estado_id').eq('id', visitaId).single();
  const { data: created, error: insertErr } = await supabase
    .from('intervencion')
    .insert({ visita_id: visitaId, dispositivo_id: dispositivoId, estado_id: visitaRow?.estado_id || null, codigo_etiqueta: etiqueta })
    .select('id')
    .single();

  if (insertErr) throw new Error(`No se pudo crear la intervención: ${insertErr.message}`);
  return created.id;
}

/**
 * Upsert de ejecucion_paso para cada paso del protocolo.
 * Calcula fecha_fin cuando todas las actividades del paso están cerradas.
 *
 * @param {string} intervencionId
 * @param {Array} allPasos
 * @param {Object} pasoData      - pasoId → { comentarios }
 * @param {Object} actividadData - actividadId → { estado }
 * @param {string} now           - ISO timestamp de referencia
 */
async function savePasosEjecucion(intervencionId, allPasos, pasoData, actividadData, now) {
  for (const paso of allPasos) {
    const { comentarios } = pasoData[paso.id] || {};

    const { data: existingPaso, error: fetchErr } = await supabase
      .from('ejecucion_paso')
      .select('id, fecha_fin')
      .eq('intervencion_id', intervencionId)
      .eq('paso_protocolo_id', paso.id)
      .maybeSingle();

    if (fetchErr) throw new Error(`Error al buscar ejecucion_paso: ${fetchErr.message}`);

    // Cerrado cuando todas las actividades están completada u omitida
    const pasoDone = (paso.actividades || []).length === 0 ||
      (paso.actividades || []).every(a => {
        const est = actividadData[a.id]?.estado;
        return est === 'completada' || est === 'omitida';
      });

    if (existingPaso) {
      const { error: updateErr } = await supabase
        .from('ejecucion_paso')
        .update({
          comentarios: comentarios ?? null,
          fecha_fin: existingPaso.fecha_fin || (pasoDone ? now : null), // preservar si ya estaba cerrado
          updated_at: now,
        })
        .eq('id', existingPaso.id);
      if (updateErr) throw new Error(`No se pudo actualizar ejecucion_paso: ${updateErr.message}`);
    } else {
      const { error: insertErr } = await supabase
        .from('ejecucion_paso')
        .insert({ intervencion_id: intervencionId, paso_protocolo_id: paso.id, fecha_inicio: now, fecha_fin: pasoDone ? now : null, comentarios: comentarios ?? null });
      if (insertErr) throw new Error(`No se pudo crear ejecucion_paso: ${insertErr.message}`);
    }
  }
}

/**
 * Upsert masivo de ejecucion_actividad usando el índice único (intervencion_id, actividad_id).
 * Convierte el código interno ('completada'|'omitida'|'pendiente') al UUID de ESTADO_INTERVENCION.
 *
 * @param {string} intervencionId
 * @param {Object} actividadData - actividadId → { estado, observacion }
 */
async function saveActividadStates(intervencionId, actividadData) {
  const ids = Object.keys(actividadData);
  if (!ids.length) return;

  const estadoMap = await getEstadoIntervencionMap();

  const rows = ids.map(actividadId => {
    const codigo = actividadData[actividadId].estado ?? 'pendiente';
    const estadoId = estadoMap.get(codigo);
    if (!estadoId) throw new Error(`Estado de actividad "${codigo}" no encontrado en catálogo ESTADO_INTERVENCION.`);
    return {
      intervencion_id: intervencionId,
      actividad_id: actividadId,
      estado_id: estadoId,
      observacion: actividadData[actividadId].observacion ?? null,
    };
  });

  const { error } = await supabase
    .from('ejecucion_actividad')
    .upsert(rows, { onConflict: 'intervencion_id,actividad_id', ignoreDuplicates: false });

  if (error) throw new Error(`No se pudo guardar el avance de actividades: ${error.message}`);
}

/**
 * Sube la foto de etiqueta y las fotos adicionales del dispositivo.
 * Los errores de upload se loguean pero no interrumpen el flujo.
 *
 * @param {string} visitaId
 * @param {string} dispositivoId
 * @param {string} intervencionId
 * @param {{ etiqueta: { file: File }|null, fotos: Array<{ file: File }> }} evidencias
 */
async function uploadEvidenciasDispositivo(visitaId, dispositivoId, intervencionId, evidencias) {
  const { etiqueta, fotos = [] } = evidencias;

  if (etiqueta?.file instanceof File) {
    try {
      await uploadEvidencia(visitaId, dispositivoId, intervencionId, etiqueta.file, true, 0);
    } catch (err) {
      console.error('[visitaApi] uploadEvidencia (etiqueta) falló:', err);
    }
  }

  let fotoNumber = 1;
  for (const foto of fotos) {
    if (foto?.file instanceof File) {
      try {
        await uploadEvidencia(visitaId, dispositivoId, intervencionId, foto.file, false, fotoNumber);
        fotoNumber += 1;
      } catch (err) {
        console.error('[visitaApi] uploadEvidencia (foto', fotoNumber, ') falló:', err);
      }
    }
  }
}

/**
 * Finaliza una visita: establece fecha_fin = now(), cambia el estado a COMPLETADA,
 * sincroniza el estado_id de todas sus intervenciones, y guarda la observación final
 * en cada intervención activa (no en visita.observaciones, que ya se usa para instrucciones).
 *
 * @param {string} visitaId - UUID de la visita a finalizar
 * @param {string} observacionFinal - Resumen del trabajo realizado por el técnico
 * @returns {Promise<void>}
 * @throws {Error} Si el catálogo no contiene COMPLETADA o la actualización falla
 */
export async function finalizarVisita(visitaId, observacionFinal, actor = null) {
  const estadoId = await getCatalogoId('ESTADO_VISITA', 'COMPLETADA');
  const fechaFin = new Date().toISOString();

  // 1. Actualizar visita: fecha_fin + estado (NO tocar observaciones)
  const { data: visitaRow, error: visitaError } = await supabase
    .from('visita')
    .update({
      fecha_fin: fechaFin,
      estado_id: estadoId,
    })
    .eq('id', visitaId)
    .select(`
      solicitud_id,
      sucursal_id,
      cliente_id,
      cliente:cliente_id(razon_social),
      sucursal:sucursal_id(nombre),
      tipo_visita:tipo_visita_id(nombre),
      solicitud:solicitud_id(cliente:cliente_id(razon_social), sucursal:sucursal_id(nombre)),
      visita_tecnico(tecnico:tecnico_id(perfil:usuario_id(nombres, apellidos)))
    `)
    .maybeSingle();

  if (visitaError) {
    throw new Error(`No se pudo finalizar la visita: ${visitaError.message}`);
  }

  // 2. Actualizar estado + observacion_final en todas las intervenciones activas
  const { data: intervencionesActualizadas } = await supabase
    .from('intervencion')
    .update({ estado_id: estadoId, observacion_final: observacionFinal || null })
    .eq('visita_id', visitaId)
    .eq('activo', true)
    .select('id');

  const totalDispositivos = (intervencionesActualizadas || []).length;
  const dispositivosCompletados = totalDispositivos;

  // 3. Actualizar el estado de la solicitud de origen a COMPLETADA
  if (visitaRow?.solicitud_id) {
    await supabase
      .from('solicitud_visita')
      .update({ estado_id: estadoId })
      .eq('id', visitaRow.solicitud_id);
  }

  // 4. Generar informe PDF y notificar (fire-and-forget — no bloquea al técnico)
  if (visitaRow?.sucursal_id) {
    const tecnicos = (visitaRow?.visita_tecnico || [])
      .map(vt => {
        const p = vt.tecnico?.perfil;
        return p ? `${p.nombres || ''} ${p.apellidos || ''}`.trim() : null;
      })
      .filter(Boolean)
      .join(', ');

    const clienteNombre = visitaRow?.cliente?.razon_social || visitaRow?.solicitud?.cliente?.razon_social || '';
    const sucursalNombre = visitaRow?.sucursal?.nombre || visitaRow?.solicitud?.sucursal?.nombre || '';
    const tipoVisita = visitaRow?.tipo_visita?.nombre || '';
    const fechaFinStr = new Date(fechaFin).toLocaleString('es-ES');
    const appUrl = window.location.origin;

    // 1. Obtener destinatarios y enviar correo de finalización inmediatamente
    getVisitaEmailRecipients({
      actorId: actor?.actorId,
      actorRole: actor?.actorRole,
      clienteId: visitaRow.cliente_id,
      sucursalId: visitaRow.sucursal_id,
      visitaId,
    }).then(allEmails => {
      if (!allEmails.length) return;
      const { destinatario, cc } = buildRecipients(allEmails[0], allEmails.slice(1));

      // Correo de finalización — sin esperar el PDF
      sendEmail('visita_finalizada', {
        destinatario,
        clienteNombre,
        sucursalNombre,
        tipoVisita,
        fechaFin: fechaFinStr,
        tecnicos: tecnicos || '—',
        observacionFinal: observacionFinal || '',
        dispositivosCompletados: String(dispositivosCompletados),
        dispositivosTotal: String(totalDispositivos),
        pdfUrl: '',
        appUrl,
      }, cc);

      // 2. Generar PDF y enviar correo de informe por separado cuando esté listo
      generateInformeVisita(visitaId)
        .then(informeResult => {
          if (!informeResult?.pdfUrl) return;
          sendEmail('visita_informe', {
            destinatario,
            clienteNombre,
            sucursalNombre,
            tipoVisita,
            fechaFin: fechaFinStr,
            tecnicos: tecnicos || '—',
            pdfUrl: informeResult.pdfUrl,
            appUrl,
          }, cc);
        })
        .catch(err => console.error('[finalizarVisita] Error generando informe PDF:', err));
    }).catch(err => {
      console.error('[finalizarVisita] Error en pipeline de notificación:', err);
    });
  }
}
