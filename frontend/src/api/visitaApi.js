import { supabase } from '../utils/supabase';
import { sendEmail, getVisitaEmailRecipients, getAvanceDispositivoRecipients, buildRecipients } from '../hooks/useEmail';

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
 * Resuelve el nombre del responsable desde la BD:
 *   - Si la visita tiene coordinador_usuario_id → usa ese perfil.
 *   - Si no (p.ej. programó un Director) → consulta el perfil del actor.
 * Fire-and-forget: nunca lanza; los errores se loguean.
 *
 * @param {string} visitaId
 * @param {{ clienteId: string, sucursalId: string, fechaProgramada: string }} payload
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
      visita_tecnico(tecnico:tecnico_id(perfil:usuario_id(nombres, apellidos))),
      coordinador_perfil:coordinador_usuario_id(nombres, apellidos)
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

      // Resolver nombre del responsable: coordinador asignado o, si no hay, el actor
      let responsableNombre = '';
      if (v?.coordinador_perfil) {
        const cp = v.coordinador_perfil;
        responsableNombre = `${cp.nombres || ''} ${cp.apellidos || ''}`.trim();
      } else if (actor?.id) {
        const { data: actorPerfil } = await supabase
          .from('perfil_usuario')
          .select('nombres, apellidos')
          .eq('id', actor.id)
          .maybeSingle();
        if (actorPerfil) {
          responsableNombre = `${actorPerfil.nombres || ''} ${actorPerfil.apellidos || ''}`.trim();
        }
      }

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
        responsable: responsableNombre || '—',
        appUrl: import.meta.env.VITE_APP_URL || window.location.origin,
      }, cc);
    })
    .catch(err => console.error('[visitaApi] notificarVisitaProgramada falló:', err));
}

/**
 * Envía el email `avance_dispositivo` al contacto de la sucursal y al responsable
 * de la visita (quien asignó los técnicos).
 * Fire-and-forget: nunca lanza; los errores se loguean.
 *
 * @param {string} visitaId
 * @param {string} dispositivoId - UUID del dispositivo recién guardado
 * @param {{ completados: number, total: number }} progreso - Progreso general de dispositivos
 * @param {Object} actividadData - actividadId → { estado, observacion } (para armar resumen)
 * @param {Object} device        - Objeto dispositivo con { label, idInmotika, pasos }
 */
export function notificarAvanceDispositivo(visitaId, dispositivoId, progreso, actividadData, device, tecnicoNombre = null) {
  supabase
    .from('visita')
    .select(`
      cliente_id,
      sucursal_id,
      coordinador_usuario_id,
      cliente:cliente_id(razon_social),
      sucursal:sucursal_id(nombre),
      tipo_visita:tipo_visita_id(nombre),
      solicitud:solicitud_id(cliente:cliente_id(razon_social)),
      coordinador_perfil:coordinador_usuario_id(nombres, apellidos, email),
      intervencion(
        id,
        codigo_etiqueta,
        dispositivo_id
      )
    `)
    .eq('id', visitaId)
    .maybeSingle()
    .then(async ({ data: v, error: vErr }) => {
      console.log('[avance] visita query result:', { v, vErr, visitaId, dispositivoId });
      if (!v) {
        console.warn('[avance] visita no encontrada (posiblemente intervencion no existe aún)');
        return;
      }

      // Resolver responsable: coordinador asignado o, si no, buscar director asignado
      let responsableNombre = '';
      let responsableEmail  = null;

      if (v?.coordinador_perfil) {
        const cp = v.coordinador_perfil;
        responsableNombre = `${cp.nombres || ''} ${cp.apellidos || ''}`.trim();
        responsableEmail  = cp.email || null;
        console.log('[avance] responsable (coordinador):', responsableEmail);
      } else if (v?.coordinador_usuario_id === null) {
        // Programado por un Director — buscar director asignado al cliente
        const { data: dirs } = await supabase
          .from('cliente_director')
          .select('director:director_id(perfil:usuario_id(nombres, apellidos, email))')
          .eq('cliente_id', v.cliente_id)
          .eq('activo', true)
          .limit(1)
          .maybeSingle();
        const p = dirs?.director?.perfil;
        if (p) {
          responsableNombre = `${p.nombres || ''} ${p.apellidos || ''}`.trim();
          responsableEmail  = p.email || null;
          console.log('[avance] responsable (director via cliente_director):', responsableEmail);
        } else {
          console.warn('[avance] sin responsable: coordinador_usuario_id=null y sin director en cliente_director');
        }
      } else {
        console.warn('[avance] coordinador_usuario_id existe pero coordinador_perfil es null:', v.coordinador_usuario_id);
      }

      // Resumen de observaciones de actividades del dispositivo
      const allActs = (device?.pasos || []).flatMap(p => p.actividades || []);
      const observacionLines = allActs
        .map(a => {
          const ej = actividadData[a.id];
          const obs = ej?.observacion?.trim();
          if (!obs) return null;
          return `• ${a.nombre || 'Actividad'}: ${obs}`;
        })
        .filter(Boolean);

      const observaciones = observacionLines.length > 0 ? observacionLines.join('\n') : null;

      // Código de etiqueta: buscar la intervención del dispositivo específico
      const intervenciones = Array.isArray(v.intervencion) ? v.intervencion : (v.intervencion ? [v.intervencion] : []);
      const intervencion = intervenciones.find(i => i.dispositivo_id === dispositivoId) || intervenciones[0];
      const dispositivoSerial = intervencion?.codigo_etiqueta || device?.idInmotika || '—';

      const horaFinalizacion = new Date().toLocaleString('es-ES');
      const clienteNombre    = v.cliente?.razon_social || v.solicitud?.cliente?.razon_social || '';
      const sucursalNombre   = v.sucursal?.nombre || '';
      const tipoVisita       = v.tipo_visita?.nombre || '';
      const appUrl           = import.meta.env.VITE_APP_URL || window.location.origin;

      const allEmails = await getAvanceDispositivoRecipients({
        sucursalId: v.sucursal_id,
        responsableEmail,
      });
      console.log('[avance] allEmails para sucursal', v.sucursal_id, ':', allEmails);
      if (!allEmails.length) {
        console.warn('[avance] lista de emails vacía — no se envía correo');
        return;
      }

      const { destinatario, cc } = buildRecipients(allEmails[0], allEmails.slice(1));
      sendEmail('avance_dispositivo', {
        destinatario,
        clienteNombre,
        sucursalNombre,
        tipoVisita,
        dispositivoNombre: device?.label || device?.idInmotika || '—',
        dispositivoSerial,
        dispositivosCompletados: String(progreso.completados),
        dispositivosTotal:       String(progreso.total),
        horaFinalizacion,
        observaciones:   observaciones || '',
        responsable:     responsableNombre || '—',
        tecnico:         tecnicoNombre || '—',
        appUrl,
      }, cc);
    })
    .catch(err => console.error('[visitaApi] notificarAvanceDispositivo falló:', err));
}

/**
 * Notificación fire-and-forget cuando un dispositivo queda fuera de servicio.
 *
 * @param {string} visitaId
 * @param {string} dispositivoId
 * @param {{ completados: number, total: number }} progreso
 * @param {Object} device
 * @param {string|null} motivo
 * @param {string|null} tecnicoNombre
 */
export function notificarDispositivoFueraDeServicio(visitaId, dispositivoId, progreso, device, motivo = null, tecnicoNombre = null) {
  supabase
    .from('visita')
    .select(`
      cliente_id,
      sucursal_id,
      coordinador_usuario_id,
      cliente:cliente_id(razon_social),
      sucursal:sucursal_id(nombre),
      tipo_visita:tipo_visita_id(nombre),
      coordinador_perfil:coordinador_usuario_id(nombres, apellidos, email),
      intervencion(id, codigo_etiqueta, dispositivo_id)
    `)
    .eq('id', visitaId)
    .maybeSingle()
    .then(async ({ data: v }) => {
      if (!v) return;

      let responsableNombre = '';
      let responsableEmail  = null;
      if (v?.coordinador_perfil) {
        const cp = v.coordinador_perfil;
        responsableNombre = `${cp.nombres || ''} ${cp.apellidos || ''}`.trim();
        responsableEmail  = cp.email || null;
      } else if (v?.coordinador_usuario_id === null) {
        const { data: dirs } = await supabase
          .from('cliente_director')
          .select('director:director_id(perfil:usuario_id(nombres, apellidos, email))')
          .eq('cliente_id', v.cliente_id)
          .eq('activo', true)
          .limit(1)
          .maybeSingle();
        const p = dirs?.director?.perfil;
        if (p) {
          responsableNombre = `${p.nombres || ''} ${p.apellidos || ''}`.trim();
          responsableEmail  = p.email || null;
        }
      }

      const intervenciones = Array.isArray(v.intervencion) ? v.intervencion : (v.intervencion ? [v.intervencion] : []);
      const intervencion   = intervenciones.find(i => i.dispositivo_id === dispositivoId) || intervenciones[0];
      const dispositivoSerial = intervencion?.codigo_etiqueta || device?.idInmotika || '—';

      const allEmails = await getAvanceDispositivoRecipients({ sucursalId: v.sucursal_id, responsableEmail });
      if (!allEmails.length) return;

      const { destinatario, cc } = buildRecipients(allEmails[0], allEmails.slice(1));
      sendEmail('dispositivo_fuera_de_servicio', {
        destinatario,
        clienteNombre:           v.cliente?.razon_social || '',
        sucursalNombre:          v.sucursal?.nombre || '',
        tipoVisita:              v.tipo_visita?.nombre || '',
        dispositivoNombre:       device?.label || device?.idInmotika || '—',
        dispositivoSerial,
        horaReporte:             new Date().toLocaleString('es-ES'),
        motivo:                  motivo || '',
        dispositivosCompletados: String(progreso.completados),
        dispositivosTotal:       String(progreso.total),
        tecnico:                 tecnicoNombre || '—',
        responsable:             responsableNombre || '—',
        appUrl:                  import.meta.env.VITE_APP_URL || window.location.origin,
      }, cc);
    })
    .catch(err => console.error('[visitaApi] notificarDispositivoFueraDeServicio falló:', err));
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
        appUrl: import.meta.env.VITE_APP_URL || window.location.origin,
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
  // Para fotos normales: marcar la previa con el mismo numero_foto como inactiva (evita duplicados al re-guardar)
  if (esEtiqueta) {
    await supabase
      .from('evidencia_intervencion')
      .update({ activo: false })
      .eq('intervencion_id', intervencionId)
      .eq('es_etiqueta', true);
  } else {
    await supabase
      .from('evidencia_intervencion')
      .update({ activo: false })
      .eq('intervencion_id', intervencionId)
      .eq('numero_foto', fotoNumber)
      .eq('es_etiqueta', false);
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
 * Marca un dispositivo como EN_MANTENIMIENTO de forma fire-and-forget.
 * Se llama cuando el técnico toca la primera actividad del dispositivo.
 * Nunca lanza; los errores se loguean en consola.
 *
 * @param {string} dispositivoId
 */
export async function marcarDispositivoEnMantenimiento(dispositivoId) {
  try {
    const estadoId = await getCatalogoId('ESTADO_GESTION_DISPOSITIVO', 'EN_MANTENIMIENTO');
    await supabase
      .from('dispositivo')
      .update({ estado_gestion_id: estadoId })
      .eq('id', dispositivoId);
  } catch (err) {
    console.warn('[marcarDispositivoEnMantenimiento] No se pudo actualizar estado:', err.message);
  }
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
 * @param {string|null} [observacionFinalDevice]
 *   Observación final del dispositivo → se guarda en intervencion.observacion_final.
 * @param {'OPERATIVO'|'FUERA_DE_SERVICIO'|null} [estadoGestionCodigo]
 *   Código del nuevo estado_gestion del dispositivo.
 *   Si es null no se actualiza el estado del dispositivo.
 * @param {string|null} [localIntervencionId]
 *   UUID temporal usado como prefijo en keys de ejecucionActividades.
 * @param {string|null} [motivoFueraDeServicio]
 *   Motivo del estado fuera de servicio → se guarda en intervencion.motivo_fuera_de_servicio.
 * @returns {Promise<string>} intervencionId real de BD
 * @throws {Error} Si alguna operación de BD falla
 */
export async function guardarAvanceDispositivo(visitaId, dispositivoId, allPasos, pasoData, actividadData, evidencias = { etiqueta: null, fotos: [] }, codigoEtiqueta = null, observacionFinalDevice = null, estadoGestionCodigo = null, localIntervencionId = null, motivoFueraDeServicio = null) {
  const intervencionId = await resolveIntervencionId(visitaId, dispositivoId, codigoEtiqueta, estadoGestionCodigo === 'FUERA_DE_SERVICIO');
  const now = new Date().toISOString();
  // localIntervencionId es el UUID temporal usado como prefijo en las keys del mapa de estado.
  // Si no se provee, se asume que las keys ya usan el intervencionId real (o son planas).
  const keyPrefix = localIntervencionId || intervencionId;
  await savePasosEjecucion(intervencionId, keyPrefix, allPasos, pasoData, actividadData, now);
  await saveActividadStates(intervencionId, keyPrefix, actividadData);
  await uploadEvidenciasDispositivo(visitaId, dispositivoId, intervencionId, evidencias);

  // Actualizar campos de la intervencion: observacion_final + fuera_de_servicio
  const esFueraDeServicio = estadoGestionCodigo === 'FUERA_DE_SERVICIO';
  const intervencionPatch = {};
  if (observacionFinalDevice !== null) intervencionPatch.observacion_final = observacionFinalDevice || null;
  intervencionPatch.fuera_de_servicio = esFueraDeServicio;
  if (esFueraDeServicio) intervencionPatch.motivo_fuera_de_servicio = motivoFueraDeServicio || null;

  await supabase.from('intervencion').update(intervencionPatch).eq('id', intervencionId);

  // Actualizar estado_gestion del dispositivo si se provee
  if (estadoGestionCodigo) {
    const estadoGestionId = await getCatalogoId('ESTADO_GESTION_DISPOSITIVO', estadoGestionCodigo);
    await supabase
      .from('dispositivo')
      .update({ estado_gestion_id: estadoGestionId })
      .eq('id', dispositivoId);
  }

  return intervencionId;
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

async function resolveIntervencionId(visitaId, dispositivoId, codigoEtiqueta, allowNoEtiqueta = false) {
  const raw = codigoEtiqueta?.trim().toUpperCase() || '';
  const etiqueta = raw && ETIQUETA_RE.test(raw) ? raw : null;

  const { data: existing, error: fetchErr } = await supabase
    .from('intervencion')
    .select('id, codigo_etiqueta')
    .eq('visita_id', visitaId)
    .eq('dispositivo_id', dispositivoId)
    .maybeSingle();

  if (fetchErr) throw new Error(`Error al buscar intervención: ${fetchErr.message}`);

  if (existing) {
    // Solo actualizar etiqueta si se provee una nueva válida
    if (etiqueta && etiqueta !== existing.codigo_etiqueta) {
      await supabase.from('intervencion').update({ codigo_etiqueta: etiqueta }).eq('id', existing.id);
    }
    return existing.id;
  }

  // Nueva intervención: etiqueta obligatoria solo si no existe registro previo y no se indica que es fuera de servicio
  if (!etiqueta && !allowNoEtiqueta) throw new Error('El código de etiqueta es obligatorio para registrar un nuevo dispositivo.');

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
async function savePasosEjecucion(intervencionId, keyPrefix, allPasos, pasoData, actividadData, now) {
  // Busca en el mapa usando el prefijo de la sesión local (temporal o real), con fallback plano
  const getPasoVal = (pasoId) => pasoData[`${keyPrefix}:${pasoId}`]    ?? pasoData[pasoId]    ?? {};
  const getActVal  = (actId)  => actividadData[`${keyPrefix}:${actId}`] ?? actividadData[actId] ?? {};

  for (const paso of allPasos) {
    const { comentarios } = getPasoVal(paso.id);

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
        const est = getActVal(a.id)?.estado;
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
async function saveActividadStates(intervencionId, keyPrefix, actividadData) {
  const allKeys = Object.keys(actividadData);
  if (!allKeys.length) return;

  const estadoMap = await getEstadoIntervencionMap();

  // Las keys pueden ser "prefijo:actividadId" (compound) o solo "actividadId".
  // keyPrefix es el UUID temporal (o real) usado al escribir las keys en esta sesión.
  const rows = [];
  for (const key of allKeys) {
    const colonIdx = key.indexOf(':');
    let actividadId, belongsToThis;
    if (colonIdx !== -1) {
      const keyPrefixInData = key.slice(0, colonIdx);
      actividadId = key.slice(colonIdx + 1);
      belongsToThis = keyPrefixInData === keyPrefix;
    } else {
      actividadId = key;
      belongsToThis = true; // legacy sin prefijo
    }
    if (!belongsToThis) continue;

    const codigo = actividadData[key].estado ?? 'pendiente';
    const estadoId = estadoMap.get(codigo);
    if (!estadoId) throw new Error(`Estado de actividad "${codigo}" no encontrado en catálogo ESTADO_INTERVENCION.`);
    rows.push({
      intervencion_id: intervencionId,
      actividad_id: actividadId,
      estado_id: estadoId,
      observacion: actividadData[key].observacion ?? null,
    });
  }

  if (!rows.length) return;

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
 * sincroniza el estado_id de todas sus intervenciones, guarda la observación final,
 * crea el registro `informe` en estado EN_REVISION y envía email de cierre al cliente.
 * El PDF se genera más adelante, cuando el director apruebe el informe.
 *
 * @param {string} visitaId - UUID de la visita a finalizar
 * @param {string} observacionFinal - Resumen del trabajo realizado por el técnico
 * @param {{ actorId: string, actorRole: string }|null} actor
 * @returns {Promise<void>}
 * @throws {Error} Si el catálogo no contiene COMPLETADA o la actualización falla
 */
export async function finalizarVisita(visitaId, observacionFinal, actor = null) {
  const estadoId = await getCatalogoId('ESTADO_VISITA', 'COMPLETADA');
  const fechaFin = new Date().toISOString();

  // 1. Actualizar visita: fecha_fin + estado + observacion_final del técnico
  const { data: visitaRow, error: visitaError } = await supabase
    .from('visita')
    .update({
      fecha_fin: fechaFin,
      estado_id: estadoId,
      observacion_final: observacionFinal || null,
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

  // 3. Actualizar el estado de la solicitud de origen a COMPLETADA
  if (visitaRow?.solicitud_id) {
    await supabase
      .from('solicitud_visita')
      .update({ estado_id: estadoId })
      .eq('id', visitaRow.solicitud_id);
  }

  // 4. Crear registro informe en EN_REVISION + email de cierre
  // El PDF se genera más adelante cuando el director apruebe.
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
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

    // Crear registro informe — awaited: si falla, el técnico ve el error
    const { error: informeError } = await supabase
      .from('informe')
      .insert({ visita_id: visitaId, estado: 'EN_REVISION' });
    if (informeError) {
      throw new Error(`No se pudo crear el informe de visita: ${informeError.message}`);
    }

    // Enviar email de cierre al cliente: "informe listo en 24h"
    getVisitaEmailRecipients({
      actorId: actor?.actorId,
      actorRole: actor?.actorRole,
      clienteId: visitaRow.cliente_id,
      sucursalId: visitaRow.sucursal_id,
      visitaId,
    }).then(allEmails => {
      if (!allEmails.length) return;
      const { destinatario, cc } = buildRecipients(allEmails[0], allEmails.slice(1));
      sendEmail('visita_finalizada', {
        destinatario,
        clienteNombre,
        sucursalNombre,
        tipoVisita,
        fechaFin: fechaFinStr,
        tecnicos: tecnicos || '—',
        observacionFinal: observacionFinal || '',
        dispositivosCompletados: String(totalDispositivos),
        dispositivosTotal: String(totalDispositivos),
        pdfUrl: '',
        appUrl,
      }, cc);
    }).catch(err => console.error('[finalizarVisita] Error enviando email cierre:', err));
  }
}
