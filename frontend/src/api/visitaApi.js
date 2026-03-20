import { supabase } from '../utils/supabase';

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

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Inicia una visita: establece fecha_inicio = now() y cambia el estado a EN_PROCESO.
 * Resuelve el estado_id desde el catálogo internamente.
 *
 * RLS: el técnico autenticado debe estar en visita_tecnico para esta visita,
 * o ser Admin/Coordinador/Director (cubiertas por las políticas existentes).
 *
 * @param {string} visitaId - UUID de la visita a iniciar
 * @returns {Promise<void>}
 * @throws {Error} Si el catálogo no contiene EN_PROCESO o la actualización falla
 */
export async function iniciarVisita(visitaId) {
  const estadoId = await getCatalogoId('ESTADO_VISITA', 'EN_PROGRESO');

  const { error } = await supabase
    .from('visita')
    .update({
      fecha_inicio: new Date().toISOString(),
      estado_id: estadoId,
    })
    .eq('id', visitaId);

  if (error) {
    throw new Error(`No se pudo iniciar la visita: ${error.message}`);
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

  const { data: { publicUrl } } = supabase.storage
    .from('inmotika')
    .getPublicUrl(storagePath);

  // Para fotos etiqueta: eliminar registro previo antes de insertar el nuevo
  if (esEtiqueta) {
    await supabase
      .from('evidencia_intervencion')
      .delete()
      .eq('intervencion_id', intervencionId)
      .eq('es_etiqueta', true);
  }

  const { error: dbError } = await supabase
    .from('evidencia_intervencion')
    .insert({
      intervencion_id: intervencionId,
      url: publicUrl,
      numero_foto: esEtiqueta ? null : fotoNumber,
      es_etiqueta: esEtiqueta,
    });

  if (dbError) {
    throw new Error(`Error al registrar evidencia en BD: ${dbError.message}`);
  }

  return publicUrl;
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
 * @param {Array<{ id: string, descripcion: string, orden: number, actividades: Array<{ id: string, esObligatorio: boolean }> }>} allPasos
 *   Lista completa de pasos del protocolo para este dispositivo
 * @param {{ [pasoId: string]: { comentarios?: string } }} pasoData
 *   Mapa de paso_protocolo.id → datos del paso ejecutado (puede estar vacío si no hay comentarios)
 * @param {{ [actividadId: string]: { completada: boolean } }} actividadData
 *   Mapa de actividad_protocolo.id → estado de completitud
 * @param {{ etiqueta: { file: File, preview: string }|null, fotos: Array<{ file: File, preview: string }> }} [evidencias]
 *   Evidencias fotográficas capturadas a nivel de dispositivo
 * @returns {Promise<void>}
 * @throws {Error} Si alguna operación de BD falla
 */
export async function guardarAvanceDispositivo(visitaId, dispositivoId, allPasos, pasoData, actividadData, evidencias = { etiqueta: null, fotos: [] }) {
  // 1. Buscar intervención existente para este dispositivo en la visita
  const { data: existingIntervencion, error: fetchIntErr } = await supabase
    .from('intervencion')
    .select('id')
    .eq('visita_id', visitaId)
    .eq('dispositivo_id', dispositivoId)
    .maybeSingle();

  if (fetchIntErr) {
    throw new Error(`Error al buscar intervención: ${fetchIntErr.message}`);
  }

  let intervencionId;

  if (existingIntervencion) {
    intervencionId = existingIntervencion.id;
  } else {
    // Crear nueva intervención — estado_id null (sin catálogo de estado de intervención definido aún)
    const { data: newIntervencion, error: insertIntErr } = await supabase
      .from('intervencion')
      .insert({
        visita_id: visitaId,
        dispositivo_id: dispositivoId,
        estado_id: null,
      })
      .select('id')
      .single();

    if (insertIntErr) {
      throw new Error(`No se pudo crear la intervención: ${insertIntErr.message}`);
    }
    intervencionId = newIntervencion.id;
  }

  // 2. Guardar todos los pasos del protocolo (ejecucion_paso) — comentarios + fecha_fin según actividades
  const now = new Date().toISOString();
  for (const paso of allPasos) {
    const pasoProtocoloId = paso.id;
    const { comentarios } = pasoData[pasoProtocoloId] || {};

    const { data: existingPaso, error: fetchPasoErr } = await supabase
      .from('ejecucion_paso')
      .select('id, fecha_fin')
      .eq('intervencion_id', intervencionId)
      .eq('paso_protocolo_id', pasoProtocoloId)
      .maybeSingle();

    if (fetchPasoErr) {
      throw new Error(`Error al buscar ejecucion_paso: ${fetchPasoErr.message}`);
    }

    // Determinar si todas las actividades obligatorias de este paso están completadas
    const obligatorias = (paso.actividades || []).filter(a => a.esObligatorio);
    const pasoDone = obligatorias.length === 0 ||
      obligatorias.every(a => actividadData[a.id]?.completada);

    if (existingPaso) {
      const updatePayload = {
        comentarios: comentarios ?? null,
        // Preservar fecha_fin si ya estaba seteada; solo setear si recién se completó
        fecha_fin: existingPaso.fecha_fin || (pasoDone ? now : null),
        updated_at: now,
      };
      const { error: updatePasoErr } = await supabase
        .from('ejecucion_paso')
        .update(updatePayload)
        .eq('id', existingPaso.id);

      if (updatePasoErr) {
        throw new Error(`No se pudo actualizar ejecucion_paso: ${updatePasoErr.message}`);
      }
    } else {
      const { error: insertPasoErr } = await supabase
        .from('ejecucion_paso')
        .insert({
          intervencion_id: intervencionId,
          paso_protocolo_id: pasoProtocoloId,
          fecha_inicio: now,
          fecha_fin: pasoDone ? now : null,
          estado_id: null,
          comentarios: comentarios ?? null,
        });

      if (insertPasoErr) {
        throw new Error(`No se pudo crear ejecucion_paso: ${insertPasoErr.message}`);
      }
    }
  }

  // 3. Guardar estado de cada actividad (ejecucion_actividad)
  // Usa upsert con onConflict en el índice único (intervencion_id, actividad_id)
  const actividadIds = Object.keys(actividadData);
  if (actividadIds.length > 0) {
    const actividadRows = actividadIds.map(actividadId => ({
      intervencion_id: intervencionId,
      actividad_id: actividadId,
      completada: actividadData[actividadId].completada ?? false,
    }));

    const { error: upsertActErr } = await supabase
      .from('ejecucion_actividad')
      .upsert(actividadRows, {
        onConflict: 'intervencion_id,actividad_id',
        ignoreDuplicates: false,
      });

    if (upsertActErr) {
      throw new Error(`No se pudo guardar el avance de actividades: ${upsertActErr.message}`);
    }
  }

  // 4. Subir evidencias del dispositivo (etiqueta + fotos adicionales)
  const { etiqueta, fotos = [] } = evidencias;

  if (etiqueta?.file instanceof File) {
    try {
      await uploadEvidencia(visitaId, dispositivoId, intervencionId, etiqueta.file, true, 0);
    } catch (uploadErr) {
      console.error('[visitaApi] uploadEvidencia (etiqueta) falló:', uploadErr);
    }
  }

  let fotoNumber = 1;
  for (const foto of fotos) {
    if (foto?.file instanceof File) {
      try {
        await uploadEvidencia(visitaId, dispositivoId, intervencionId, foto.file, false, fotoNumber);
        fotoNumber += 1;
      } catch (uploadErr) {
        console.error('[visitaApi] uploadEvidencia (foto', fotoNumber, ') falló:', uploadErr);
      }
    }
  }
}

/**
 * Finaliza una visita: establece fecha_fin = now(), guarda las observaciones
 * finales y cambia el estado a FINALIZADO.
 * Resuelve el estado_id desde el catálogo internamente.
 *
 * @param {string} visitaId - UUID de la visita a finalizar
 * @param {string} observaciones - Observaciones finales del técnico
 * @returns {Promise<void>}
 * @throws {Error} Si el catálogo no contiene FINALIZADO o la actualización falla
 */
export async function finalizarVisita(visitaId, observaciones) {
  const estadoId = await getCatalogoId('ESTADO_VISITA', 'COMPLETADA');

  const { error } = await supabase
    .from('visita')
    .update({
      fecha_fin: new Date().toISOString(),
      observaciones: observaciones || null,
      estado_id: estadoId,
    })
    .eq('id', visitaId);

  if (error) {
    throw new Error(`No se pudo finalizar la visita: ${error.message}`);
  }
}
