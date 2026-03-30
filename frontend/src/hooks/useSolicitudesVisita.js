import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import { sendEmail } from './useEmail';

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
          .select('id,id_inmotika,codigo_unico,modelo')
          .in('id', allDeviceIds);
        (devices || []).forEach(d => {
          const label = d.id_inmotika || d.codigo_unico || d.modelo || d.id;
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

      notify('success', 'Solicitud enviada. El equipo de coordinación la revisará pronto.');

      // Notificar a los coordinadores por correo (fire-and-forget)
      // Obtener emails de coordinadores y datos del cliente/sucursal
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
        .eq('id', inserted.id)
        .maybeSingle()
        .then(async ({ data: sol }) => {
          if (!sol) return;
          // Obtener emails de coordinadores activos
          const { data: coordinadores } = await supabase
            .from('coordinador')
            .select('perfil:usuario_id(email, nombres)')
            .limit(10);
          const emailsCoord = (coordinadores || [])
            .map(c => c.perfil?.email)
            .filter(Boolean);
          if (emailsCoord.length === 0) return;

          const solicitante = sol.creador
            ? `${sol.creador.nombres || ''} ${sol.creador.apellidos || ''}`.trim() || sol.creador.email
            : '—';

          if (!emailsCoord.length) return;
          sendEmail('solicitud_visita', {
            destinatario: emailsCoord[0],
            clienteNombre: sol.cliente?.razon_social || '',
            sucursalNombre: sol.sucursal?.nombre || '',
            tipoVisita: sol.tipo_visita?.nombre || '',
            fechaSugerida: sol.fecha_sugerida
              ? new Date(sol.fecha_sugerida).toLocaleDateString('es-ES')
              : '—',
            motivo: sol.motivo || '',
            solicitante,
            appUrl: window.location.origin,
          }, emailsCoord.slice(1));
        });

      await fetchSolicitudes();
      return inserted.id;
    } catch (err) {
      console.error('[useSolicitudesVisita] create error:', err);
      notify('error', `No se pudo crear la solicitud: ${err.message}`);
      return null;
    } finally {
      setSaving(false);
    }
  }, [user, fetchSolicitudes, notify]);

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

      // Sincronizar dispositivos: desactivar los que no están en la nueva lista
      if (payload.dispositivoIds !== undefined) {
        // Obtener registros actuales
        const { data: existing } = await supabase
          .from('solicitud_dispositivo')
          .select('id,dispositivo_id,activo')
          .eq('solicitud_id', solicitudId);

        const existingMap = new Map((existing || []).map(e => [e.dispositivo_id, e]));
        const newSet = new Set(payload.dispositivoIds);

        const toDeactivate = [];
        const toActivate = [];
        const toInsert = [];

        newSet.forEach(dId => {
          const ex = existingMap.get(dId);
          if (!ex) toInsert.push(dId);
          else if (!ex.activo) toActivate.push(ex.id);
        });

        existingMap.forEach((ex, dId) => {
          if (!newSet.has(dId) && ex.activo) toDeactivate.push(ex.id);
        });

        const ops = [];
        if (toDeactivate.length > 0) {
          ops.push(supabase.from('solicitud_dispositivo').update({ activo: false }).in('id', toDeactivate));
        }
        if (toActivate.length > 0) {
          ops.push(supabase.from('solicitud_dispositivo').update({ activo: true }).in('id', toActivate));
        }
        if (toInsert.length > 0) {
          ops.push(supabase.from('solicitud_dispositivo').insert(
            toInsert.map(dId => ({ solicitud_id: solicitudId, dispositivo_id: dId, activo: true }))
          ));
        }

        const results = await Promise.all(ops);
        const firstErr = results.find(r => r.error)?.error;
        if (firstErr) throw firstErr;
      }

      notify('success', 'Solicitud actualizada correctamente.');
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

      notify('success', 'Solicitud cancelada.');
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
