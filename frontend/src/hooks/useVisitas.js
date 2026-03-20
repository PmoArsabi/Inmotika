import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';

/**
 * @typedef {Object} Visita
 * @property {string} id - UUID de la visita
 * @property {string|null} solicitudId - UUID de la solicitud origen
 * @property {string} clienteId
 * @property {string} clienteNombre
 * @property {string} sucursalId
 * @property {string} sucursalNombre
 * @property {string} tipoVisitaId
 * @property {string} tipoVisitaCodigo
 * @property {string} tipoVisitaLabel
 * @property {string|null} fechaProgramada - ISO string o null
 * @property {string|null} fechaInicio - ISO string; null significa editable
 * @property {string|null} fechaFin
 * @property {string} observaciones
 * @property {string} estadoId
 * @property {string} estadoCodigo
 * @property {string} estadoLabel
 * @property {string[]} tecnicoIds - array de perfil_usuario.id
 * @property {string[]} tecnicosNombres - array de nombres legibles
 * @property {boolean} esEditable - true cuando fechaInicio es null
 */

/**
 * @typedef {Object} CreateVisitaPayload
 * @property {string} solicitudId
 * @property {string} clienteId
 * @property {string} sucursalId
 * @property {string} tipoVisitaId
 * @property {string} fechaProgramada - ISO string datetime-local compatible
 * @property {string} [observaciones]
 * @property {string[]} tecnicoIds
 * @property {string} coordinadorId - perfil_usuario.id del coordinador
 */

/**
 * @typedef {Object} UpdateVisitaPayload
 * @property {string} [fechaProgramada]
 * @property {string} [observaciones]
 * @property {string[]} [tecnicoIds]
 */

/**
 * @typedef {Object} EstadoOption
 * @property {string} value - UUID del estado en catalogo (tipo ESTADO_VISITA)
 * @property {string} codigo - Código textual (PROGRAMADA, CANCELADO, etc.)
 * @property {string} label - Nombre legible
 */

// ─── Mapper ───────────────────────────────────────────────────────────────────
/**
 * Convierte una fila de Supabase en el shape Visita del frontend.
 * Los nombres de técnicos se inyectan después en el paso 2 del fetch.
 * @param {Object} row - Fila cruda de Supabase con joins anidados
 * @param {Map<string,string>} tecnicoNameMap - tecnico_id (perfil_usuario.id) → nombre completo
 * @returns {Visita}
 */
const mapRow = (row, tecnicoNameMap = new Map(), dispositivosBySolicitud = new Map()) => {
  const tecnicoIds = (row.visita_tecnico || []).map(vt => vt.tecnico_id).filter(Boolean);
  const dispositivos = dispositivosBySolicitud.get(row.solicitud_id) || [];
  return {
    id: row.id,
    solicitudId: row.solicitud_id || null,
    clienteId: row.cliente_id || row.solicitud?.cliente_id || '',
    clienteNombre: row.solicitud?.cliente?.razon_social || '',
    sucursalId: row.sucursal_id || row.solicitud?.sucursal_id || '',
    sucursalNombre: row.solicitud?.sucursal?.nombre || '',
    tipoVisitaId: row.tipo_visita_id || row.solicitud?.tipo_visita_id || '',
    tipoVisitaCodigo: row.solicitud?.tipo_visita?.codigo || '',
    tipoVisitaLabel: row.solicitud?.tipo_visita?.nombre || '',
    fechaProgramada: row.fecha_programada || null,
    fechaInicio: row.fecha_inicio || null,
    fechaFin: row.fecha_fin || null,
    observaciones: row.observaciones || '',
    estadoId: row.estado_id || '',
    estadoCodigo: row.estado?.codigo || '',
    estadoLabel: row.estado?.nombre || '',
    tecnicoIds,
    tecnicosNombres: tecnicoIds.map(id => tecnicoNameMap.get(id) || id),
    dispositivos,
    esEditable: !row.fecha_inicio,
  };
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * Gestión completa de visitas programadas.
 * Solo Admin/Coordinador/Director puede crear, editar y cancelar visitas.
 * Técnicos asignados pueden verlas vía RLS.
 */
export const useVisitas = () => {
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const notify = useNotify();

  // ── Fetch (2 pasos para evitar ambigüedad PostgREST en joins anidados) ───────
  /**
   * Carga todas las visitas con sus relaciones. Paso 1: query principal con joins.
   * Paso 2: batch fetch de nombres de perfil_usuario para técnicos asignados.
   */
  const fetchVisitas = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Paso 1: visitas con relaciones directas
      const { data: rows, error } = await supabase
        .from('visita')
        .select(`
          id,
          solicitud_id,
          coordinador_usuario_id,
          cliente_id,
          sucursal_id,
          tipo_visita_id,
          fecha_programada,
          fecha_inicio,
          fecha_fin,
          observaciones,
          estado_id,
          solicitud:solicitud_id(
            id,
            motivo,
            fecha_sugerida,
            cliente_id,
            sucursal_id,
            tipo_visita_id,
            estado_id,
            cliente:cliente_id(razon_social),
            sucursal:sucursal_id(nombre),
            tipo_visita:tipo_visita_id(codigo,nombre)
          ),
          estado:estado_id(codigo,nombre),
          visita_tecnico(tecnico_id,es_lider)
        `)
        .order('fecha_programada', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Paso 2: obtener nombres de técnicos via tecnico.id → perfil_usuario join
      // visita_tecnico.tecnico_id referencia tecnico.id (no perfil_usuario.id)
      const allTecnicoIds = [
        ...new Set(
          (rows || []).flatMap(r =>
            (r.visita_tecnico || []).map(vt => vt.tecnico_id).filter(Boolean)
          )
        ),
      ];

      let tecnicoNameMap = new Map();
      if (allTecnicoIds.length > 0) {
        const { data: tecnicos } = await supabase
          .from('tecnico')
          .select('id,perfil_usuario:usuario_id(nombres,apellidos,email)')
          .in('id', allTecnicoIds);
        (tecnicos || []).forEach(t => {
          const p = t.perfil_usuario;
          const nombre = p
            ? `${p.nombres || ''} ${p.apellidos || ''}`.trim() || p.email || t.id
            : t.id;
          tecnicoNameMap.set(t.id, nombre);
        });
      }

      // Paso 3: batch fetch de dispositivos por solicitud_id (con categoria_id)
      const allSolicitudIds = [
        ...new Set((rows || []).map(r => r.solicitud_id).filter(Boolean)),
      ];

      /** @type {Array<{solicitud_id:string, dispositivo:{id,id_inmotika,codigo_unico,modelo,serial,categoria_id}}>} */
      let rawDispositivos = [];
      if (allSolicitudIds.length > 0) {
        const { data: sdRows } = await supabase
          .from('solicitud_dispositivo')
          .select('solicitud_id,activo,dispositivo:dispositivo_id(id,id_inmotika,codigo_unico,modelo,serial,categoria_id)')
          .in('solicitud_id', allSolicitudIds)
          .eq('activo', true);
        rawDispositivos = (sdRows || []).filter(sd => sd.dispositivo);
      }

      // Paso 4: cargar pasos de protocolo + actividades para las categorías encontradas
      const allCategoriaIds = [
        ...new Set(rawDispositivos.map(sd => sd.dispositivo.categoria_id).filter(Boolean)),
      ];

      /** @type {Map<string, Array>} categoriaId → pasos ordenados con actividades */
      let pasosByCatId = new Map();
      if (allCategoriaIds.length > 0) {
        const { data: pasos } = await supabase
          .from('paso_protocolo')
          .select(`
            id, descripcion, orden, categoria_id,
            actividades:actividad_protocolo(id, descripcion, orden, es_obligatorio, activo)
          `)
          .in('categoria_id', allCategoriaIds)
          .eq('activo', true)
          .order('orden', { ascending: true });

        (pasos || []).forEach(paso => {
          const list = pasosByCatId.get(paso.categoria_id) || [];
          list.push({
            ...paso,
            actividades: (paso.actividades || [])
              .filter(a => a.activo !== false)
              .sort((a, b) => (a.orden || 0) - (b.orden || 0))
              .map(a => ({ id: a.id, descripcion: a.descripcion, esObligatorio: a.es_obligatorio })),
          });
          pasosByCatId.set(paso.categoria_id, list);
        });
      }

      // Construir mapa solicitud_id → dispositivos con pasos inyectados
      /** @type {Map<string, Array>} */
      let dispositivosBySolicitud = new Map();
      rawDispositivos.forEach(sd => {
        const d = sd.dispositivo;
        const label = d.id_inmotika || d.codigo_unico || d.modelo || d.serial || d.id;
        const pasos = d.categoria_id ? (pasosByCatId.get(d.categoria_id) || []) : [];
        const list = dispositivosBySolicitud.get(sd.solicitud_id) || [];
        list.push({
          id: d.id,
          label,
          idInmotika: d.id_inmotika || null,
          categoriaId: d.categoria_id || null,
          pasos,
        });
        dispositivosBySolicitud.set(sd.solicitud_id, list);
      });

      setVisitas((rows || []).map(r => mapRow(r, tecnicoNameMap, dispositivosBySolicitud)));
    } catch (err) {
      console.error('[useVisitas] fetch error:', err);
      notify('error', 'No se pudieron cargar las visitas programadas.');
    } finally {
      setLoading(false);
    }
  }, [user, notify]);

  useEffect(() => {
    fetchVisitas();
  }, [fetchVisitas]);

  // ── Create ─────────────────────────────────────────────────────────────────
  /**
   * Crea una visita a partir de una solicitud aprobada por el coordinador.
   * Inserta en `visita`, crea los registros `visita_tecnico` y actualiza
   * el estado de la `solicitud_visita` a PROGRAMADA.
   * Tanto `visita.estado_id` como `solicitud_visita.estado_id` referencian
   * la tabla `catalogo` con tipo ESTADO_VISITA.
   *
   * @param {CreateVisitaPayload} payload
   * @param {EstadoOption[]} estadoOptions - opciones de catalogo tipo ESTADO_VISITA
   * @returns {Promise<string|null>} - id de la visita creada o null si falla
   */
  const createVisita = useCallback(async (payload, estadoOptions) => {
    setSaving(true);
    try {
      // Buscar estado PROGRAMADA en catalogo tipo ESTADO_VISITA
      const estadoProgramadaVisitaId = estadoOptions.find(o => o.codigo === 'PROGRAMADA')?.value;
      if (!estadoProgramadaVisitaId) {
        notify('error', 'Estado PROGRAMADA no encontrado en el catálogo de estados. Contacta al administrador.');
        return null;
      }

      // Mismo UUID sirve para ambas tablas (mismo catálogo)
      const estadoProgramadaSolicitudId = estadoProgramadaVisitaId;

      // Insertar la visita principal
      const { data: inserted, error: insertError } = await supabase
        .from('visita')
        .insert({
          solicitud_id: payload.solicitudId || null,
          coordinador_usuario_id: payload.coordinadorId || null,
          cliente_id: payload.clienteId || null,
          sucursal_id: payload.sucursalId || null,
          tipo_visita_id: payload.tipoVisitaId || null,
          fecha_programada: payload.fechaProgramada
            ? new Date(payload.fechaProgramada).toISOString()
            : null,
          observaciones: payload.observaciones || null,
          estado_id: estadoProgramadaVisitaId,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Insertar técnicos asignados
      if (payload.tecnicoIds?.length > 0) {
        const { error: tecError } = await supabase
          .from('visita_tecnico')
          .insert(
            payload.tecnicoIds.map((tid, idx) => ({
              visita_id: inserted.id,
              tecnico_id: tid,
              es_lider: idx === 0, // el primero es líder por defecto
            }))
          );
        if (tecError) throw tecError;
      }

      // Actualizar estado de la solicitud origen a PROGRAMADA
      if (payload.solicitudId && estadoProgramadaSolicitudId) {
        const { error: solError } = await supabase
          .from('solicitud_visita')
          .update({ estado_id: estadoProgramadaSolicitudId })
          .eq('id', payload.solicitudId);
        if (solError) {
          // No lanzamos: la visita ya fue creada; solo notificamos
          console.warn('[useVisitas] No se pudo actualizar estado solicitud:', solError.message);
        }
      }

      await fetchVisitas();
      return inserted.id;
    } catch (err) {
      console.error('[useVisitas] create error:', err);
      notify('error', `No se pudo programar la visita: ${err.message}`);
      return null;
    } finally {
      setSaving(false);
    }
  }, [fetchVisitas, notify]);

  // ── Update ─────────────────────────────────────────────────────────────────
  /**
   * Actualiza una visita existente. Solo permitido si `fecha_inicio` es null.
   * Sincroniza los técnicos: inserta los nuevos, elimina (hard delete) los removidos.
   *
   * @param {string} visitaId
   * @param {UpdateVisitaPayload} payload
   * @returns {Promise<boolean>}
   */
  const updateVisita = useCallback(async (visitaId, payload) => {
    // Verificar editabilidad desde el estado local (evita round-trip innecesario)
    const current = visitas.find(v => v.id === visitaId);
    if (current && !current.esEditable) {
      notify('warning', 'Esta visita ya inició y no puede ser editada.');
      return false;
    }

    setSaving(true);
    try {
      const updates = {};
      if (payload.fechaProgramada !== undefined) {
        updates.fecha_programada = payload.fechaProgramada
          ? new Date(payload.fechaProgramada).toISOString()
          : null;
      }
      if (payload.observaciones !== undefined) {
        updates.observaciones = payload.observaciones;
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('visita')
          .update(updates)
          .eq('id', visitaId);
        if (updateError) throw updateError;
      }

      // Sincronizar técnicos: hard delete de removidos, insert de nuevos
      if (payload.tecnicoIds !== undefined) {
        // Obtener asignaciones actuales
        const { data: existing, error: fetchError } = await supabase
          .from('visita_tecnico')
          .select('id,tecnico_id')
          .eq('visita_id', visitaId);
        if (fetchError) throw fetchError;

        const existingMap = new Map((existing || []).map(e => [e.tecnico_id, e.id]));
        const newSet = new Set(payload.tecnicoIds);

        const toDelete = [];
        const toInsert = [];

        existingMap.forEach((rowId, tecId) => {
          if (!newSet.has(tecId)) toDelete.push(rowId);
        });

        newSet.forEach((tecId, idx) => {
          if (!existingMap.has(tecId)) toInsert.push({ tecnico_id: tecId, idx });
        });

        const ops = [];

        if (toDelete.length > 0) {
          ops.push(
            supabase.from('visita_tecnico').delete().in('id', toDelete)
          );
        }

        if (toInsert.length > 0) {
          ops.push(
            supabase.from('visita_tecnico').insert(
              toInsert.map(({ tecnico_id, idx }) => ({
                visita_id: visitaId,
                tecnico_id,
                es_lider: idx === 0 && existingMap.size === 0,
              }))
            )
          );
        }

        if (ops.length > 0) {
          const results = await Promise.all(ops);
          const firstErr = results.find(r => r.error)?.error;
          if (firstErr) throw firstErr;
        }
      }

      await fetchVisitas();
      return true;
    } catch (err) {
      console.error('[useVisitas] update error:', err);
      notify('error', `No se pudo actualizar la visita: ${err.message}`);
      return false;
    } finally {
      setSaving(false);
    }
  }, [visitas, fetchVisitas, notify]);

  // ── Cancel ─────────────────────────────────────────────────────────────────
  /**
   * Cancela una visita estableciendo su estado a CANCELADO.
   *
   * @param {string} visitaId
   * @param {EstadoOption[]} estadoOptions - opciones de catalogo tipo ESTADO_VISITA
   * @returns {Promise<boolean>}
   */
  const cancelVisita = useCallback(async (visitaId, estadoOptions) => {
    setSaving(true);
    try {
      const estadoCanceladoId = estadoOptions.find(o => o.codigo === 'CANCELADO')?.value;
      if (!estadoCanceladoId) {
        notify('error', 'Estado CANCELADO no encontrado en el catálogo.');
        return false;
      }

      const { error } = await supabase
        .from('visita')
        .update({ estado_id: estadoCanceladoId })
        .eq('id', visitaId);

      if (error) throw error;

      notify('success', 'Visita cancelada.');
      await fetchVisitas();
      return true;
    } catch (err) {
      console.error('[useVisitas] cancel error:', err);
      notify('error', `No se pudo cancelar la visita: ${err.message}`);
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchVisitas, notify]);

  return {
    visitas,
    loading,
    saving,
    fetchVisitas,
    createVisita,
    updateVisita,
    cancelVisita,
  };
};
