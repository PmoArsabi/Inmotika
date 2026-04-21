import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import { sendEmail, getSolicitudVisitaEmailRecipients, buildRecipients } from './useEmail';
import { syncSolicitudDispositivos } from '../api/solicitudDispositivoApi';

/**
 * @typedef {Object} SolicitudVisita
 * @property {string} id
 * @property {string} clienteId
 * @property {string} clienteNombre
 * @property {string} sucursalId
 * @property {string} sucursalNombre
 * @property {string} tipoVisitaId
 * @property {string} tipoVisitaCodigo
 * @property {string} tipoVisitaLabel
 * @property {string} fechaSolicitud
 * @property {string|null} fechaSugerida
 * @property {string} motivo
 * @property {string} prioridad
 * @property {string} estadoId
 * @property {string} estadoCodigo
 * @property {string} estadoLabel
 * @property {string[]} dispositivoIds
 * @property {string[]} dispositivosNombres
 */

/**
 * @typedef {Object} UpdateSolicitudPayload
 * @property {string} [tipoVisitaCodigo]
 * @property {string} [fechaSugerida]
 * @property {string} [motivo]
 * @property {string[]} [dispositivoIds] - lista completa actualizada de IDs
 */

// ─── Mapper ───────────────────────────────────────────────────────────────────
/**
 * Convierte una fila de Supabase en el shape del frontend.
 * Los nombres de dispositivos se inyectan después via mergeDeviceNames().
 * @param {Object} row
 * @param {Map<string,string>} deviceNameMap - dispositivo_id → nombre
 * @returns {SolicitudVisita}
 */
const mapRow = (row, deviceInfoMap = new Map()) => {
  const deviceIds = (row.solicitud_dispositivo || [])
    .filter(sd => sd.activo !== false)
    .map(sd => sd.dispositivo_id);
  return {
    id: row.id,
    clienteId: row.cliente_id || '',
    clienteNombre: row.cliente?.razon_social || '',
    sucursalId: row.sucursal_id || '',
    sucursalNombre: row.sucursal?.nombre || '',
    tipoVisitaId: row.tipo_visita_id || '',
    tipoVisitaCodigo: row.tipo_visita?.codigo || '',
    tipoVisitaLabel: row.tipo_visita?.nombre || '',
    fechaSolicitud: row.fecha_solicitud || '',
    fechaSugerida: row.fecha_sugerida || null,
    motivo: row.motivo || '',
    prioridad: row.prioridad || 'MEDIA',
    estadoId: row.estado_id || '',
    estadoCodigo: row.estado?.codigo || '',
    estadoLabel: row.estado?.nombre || '',
    dispositivoIds: deviceIds,
    dispositivosNombres: deviceIds.map(id => deviceInfoMap.get(id) || id),
  };
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * Gestión completa de solicitudes de visita.
 * Admin/coordinador ve todas; cliente ve sólo las propias (via RLS).
 */
export const useSolicitudesVisita = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const notify = useNotify();

  // ── Fetch (2 pasos para evitar ambigüedad PostgREST en joins anidados) ───────
  // ── Fetch (2 pasos para evitar ambigüedad PostgREST en joins anidados) ───────
  // PostgREST no puede resolver joins anidados con ambigüedad en claves foráneas
  // cuando una junction table participa en el embed. El workaround estándar es:
  //   Paso 1: query principal con los joins directos (sin subembeds en junction)
  //   Paso 2: batch fetch manual de las relaciones del junction, cruzando por ID.
  const fetchSolicitudes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Paso 1: solicitudes con sus relaciones directas (sin subembeds en junction)
      const { data: rows, error } = await supabase
        .from('solicitud_visita')
        .select(`
          id,
          cliente_id,
          sucursal_id,
          tipo_visita_id,
          fecha_solicitud,
          fecha_sugerida,
          motivo,
          prioridad,
          estado_id,
          cliente:cliente_id(razon_social),
          sucursal:sucursal_id(nombre),
          tipo_visita:tipo_visita_id(codigo,nombre),
          estado:estado_id(codigo,nombre),
          solicitud_dispositivo(dispositivo_id,activo)
        `)
        .order('fecha_solicitud', { ascending: false });

      if (error) throw error;

      // Paso 2: obtener nombres e idInmotika de dispositivos involucrados
      const allDeviceIds = [
        ...new Set(
          (rows || []).flatMap(r =>
            (r.solicitud_dispositivo || [])
              .filter(sd => sd.activo !== false)
              .map(sd => sd.dispositivo_id)
          )
        ),
      ];

      let deviceInfoMap = new Map();
      if (allDeviceIds.length > 0) {
        const { data: devices } = await supabase
          .from('dispositivo')
          .select('id,serial,id_inmotika,codigo_unico,modelo')
          .in('id', allDeviceIds);
        (devices || []).forEach(d => {
          const label = d.serial || d.id_inmotika || d.codigo_unico || d.modelo || d.id;
          deviceInfoMap.set(d.id, label);
        });
      }

      setSolicitudes((rows || []).map(r => mapRow(r, deviceInfoMap)));
    } catch (err) {
      console.error('[useSolicitudesVisita] fetch error:', err);
      notify('error', 'No se pudieron cargar las solicitudes de visita.');
    } finally {
      setLoading(false);
    }
  }, [user, notify]);

  useEffect(() => {
    fetchSolicitudes();
  }, [fetchSolicitudes]);

  // Refrescar cuando otro usuario cambia el estado de una solicitud (ej: técnico finaliza visita)
  useEffect(() => {
    const channel = supabase
      .channel('solicitud_visita_estado')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'solicitud_visita' },
        () => { fetchSolicitudes(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchSolicitudes]);

  // ── Create ─────────────────────────────────────────────────────────────────
  /**
   * @param {Object} payload
   * @param {Array<{value:string,codigo:string}>} tipoVisitaOptions
   * @param {Array<{value:string,codigo:string}>} estadoOptions
   * @returns {Promise<string|null>} - id de la solicitud creada o null
   */
  const createSolicitud = useCallback(async (payload, tipoVisitaOptions, estadoOptions) => {
    setSaving(true);
    try {
      const tipoVisitaId = tipoVisitaOptions.find(o => o.codigo === payload.tipoVisitaCodigo)?.value;
      const estadoInicialId = estadoOptions.find(o => o.codigo === 'PENDIENTE')?.value;

      if (!tipoVisitaId) {
        notify('error', 'Tipo de mantenimiento no válido.');
        return null;
      }

      const { data: inserted, error: insertError } = await supabase
        .from('solicitud_visita')
        .insert({
          cliente_id: payload.clienteId || null,
          sucursal_id: payload.sucursalId,
          creado_por: user.id,
          tipo_visita_id: tipoVisitaId,
          fecha_sugerida: payload.fechaSugerida ? new Date(payload.fechaSugerida).toISOString() : null,
          motivo: payload.motivo || 'Sin observaciones',
          prioridad: 'MEDIA',
          estado_id: estadoInicialId || null,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      if (payload.dispositivoIds?.length > 0) {
        const { error: devError } = await supabase
          .from('solicitud_dispositivo')
          .insert(payload.dispositivoIds.map(dId => ({
            solicitud_id: inserted.id,
            dispositivo_id: dId,
            activo: true,
          })));
        if (devError) throw devError;
      }

      // Email fire-and-forget — no bloquea el retorno
      const newId = inserted.id;
      const emailPayload = { ...payload };
      const emailUser = { id: user?.id, role: user?.role };
      supabase
        .from('solicitud_visita')
        .select(`
          motivo,
          fecha_sugerida,
          cliente:cliente_id(razon_social),
          sucursal:sucursal_id(nombre),
          tipo_visita:tipo_visita_id(nombre),
          creador:creado_por(nombres, apellidos, email)
        `)
        .eq('id', newId)
        .maybeSingle()
        .then(async ({ data: sol }) => {
          if (!sol) return;
          const allEmails = await getSolicitudVisitaEmailRecipients({
            actorId: emailUser.id,
            actorRole: emailUser.role,
            clienteId: emailPayload.clienteId,
          });
          if (!allEmails.length) return;
          const solicitante = sol.creador
            ? `${sol.creador.nombres || ''} ${sol.creador.apellidos || ''}`.trim() || sol.creador.email
            : '—';
          const { destinatario, cc } = buildRecipients(allEmails[0], allEmails.slice(1));
          sendEmail('solicitud_visita', {
            destinatario,
            clienteNombre: sol.cliente?.razon_social || '',
            sucursalNombre: sol.sucursal?.nombre || '',
            tipoVisita: sol.tipo_visita?.nombre || '',
            fechaSugerida: sol.fecha_sugerida
              ? new Date(sol.fecha_sugerida).toLocaleDateString('es-ES')
              : '—',
            motivo: sol.motivo || '',
            solicitante,
            appUrl: import.meta.env.VITE_APP_URL || window.location.origin,
          }, cc);
        })
        .catch(emailErr => console.warn('[useSolicitudesVisita] email failed:', emailErr));

      await fetchSolicitudes();
      return newId;
    } catch (err) {
      console.error('[useSolicitudesVisita] create error:', err);
      notify('error', `No se pudo crear la solicitud: ${err.message}`);
      return null;
    } finally {
      setSaving(false);
    }
  }, [user, notify, fetchSolicitudes]);

  // ── Update ─────────────────────────────────────────────────────────────────
  /**
   * Actualiza datos de la solicitud y sincroniza dispositivos (activo flag).
   * Solo editable si estado es PENDIENTE.
   *
   * @param {string} solicitudId
   * @param {UpdateSolicitudPayload} payload
   * @param {Array<{value:string,codigo:string}>} tipoVisitaOptions
   * @returns {Promise<boolean>}
   */
  const updateSolicitud = useCallback(async (solicitudId, payload, tipoVisitaOptions) => {
    setSaving(true);
    try {
      const updates = {};
      if (payload.tipoVisitaCodigo) {
        const tipoVisitaId = tipoVisitaOptions.find(o => o.codigo === payload.tipoVisitaCodigo)?.value;
        if (tipoVisitaId) updates.tipo_visita_id = tipoVisitaId;
      }
      if (payload.fechaSugerida !== undefined) {
        updates.fecha_sugerida = payload.fechaSugerida
          ? new Date(payload.fechaSugerida).toISOString()
          : null;
      }
      if (payload.motivo !== undefined) updates.motivo = payload.motivo;

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('solicitud_visita')
          .update(updates)
          .eq('id', solicitudId);
        if (updateError) throw updateError;
      }

      // Sincronizar dispositivos vía API dedicada
      if (payload.dispositivoIds !== undefined) {
        await syncSolicitudDispositivos(solicitudId, payload.dispositivoIds);
      }

      await fetchSolicitudes();
      return true;
    } catch (err) {
      console.error('[useSolicitudesVisita] update error:', err);
      notify('error', `No se pudo actualizar la solicitud: ${err.message}`);
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchSolicitudes, notify]);

  // ── Cancel ─────────────────────────────────────────────────────────────────
  /**
   * Cancela una solicitud cambiando su estado a CANCELADA.
   * @param {string} solicitudId
   * @param {Array<{value:string,codigo:string}>} estadoOptions
   * @returns {Promise<boolean>}
   */
  const cancelSolicitud = useCallback(async (solicitudId, estadoOptions) => {
    setSaving(true);
    try {
      const estadoCanceladaId = estadoOptions.find(o => o.codigo === 'CANCELADA')?.value;
      if (!estadoCanceladaId) throw new Error('Estado CANCELADA no encontrado en catálogo.');

      const { error } = await supabase
        .from('solicitud_visita')
        .update({ estado_id: estadoCanceladaId })
        .eq('id', solicitudId);

      if (error) throw error;

      await fetchSolicitudes();
      return true;
    } catch (err) {
      console.error('[useSolicitudesVisita] cancel error:', err);
      notify('error', `No se pudo cancelar la solicitud: ${err.message}`);
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchSolicitudes, notify]);

  return {
    solicitudes,
    loading,
    saving,
    fetchSolicitudes,
    createSolicitud,
    updateSolicitud,
    cancelSolicitud,
  };
};
