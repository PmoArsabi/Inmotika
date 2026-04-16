import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

/**
 * Obtiene las visitas asociadas a un conjunto de sucursales del cliente.
 * Diseñado para el rol CLIENTE — respeta RLS.
 *
 * Usa 2 pasos para evitar ambigüedad PostgREST en joins anidados:
 *   Paso 1: visitas con visita_tecnico (solo tecnico_id)
 *   Paso 2: perfil completo de cada técnico por separado
 *
 * No carga protocolos ni intervenciones — el cliente no tiene acceso RLS a esas tablas.
 *
 * @param {string[]} sucursalIds - IDs de las sucursales del contacto autenticado
 * @returns {{ visitas: Array, loading: boolean }}
 */
export function useVisitasCliente(sucursalIds) {
  const [state, setState] = useState({ visitas: [], loading: true });

  useEffect(() => {
    if (!sucursalIds || sucursalIds.length === 0) {
      setState({ visitas: [], loading: false });
      return;
    }

    let cancelled = false;

    async function load() {
      setState(prev => ({ ...prev, loading: true }));
      try {
        // Paso 1: visitas con tecnico_ids (sin subembeds anidados)
        const { data: rows, error } = await supabase
          .from('visita')
          .select(`
            id,
            solicitud_id,
            sucursal_id,
            fecha_programada,
            fecha_inicio,
            fecha_fin,
            sucursal:sucursal_id(nombre),
            tipo_visita:tipo_visita_id(nombre),
            estado:estado_id(codigo, nombre),
            visita_tecnico(tecnico_id)
          `)
          .in('sucursal_id', sucursalIds)
          .order('fecha_programada', { ascending: false, nullsFirst: false });

        if (error) throw error;
        if (cancelled) return;

        // Paso 2: perfil de técnicos (id + usuario_id + perfil_usuario)
        const allTecnicoIds = [
          ...new Set(
            (rows || []).flatMap(r =>
              (r.visita_tecnico || []).map(vt => vt.tecnico_id).filter(Boolean)
            )
          ),
        ];

        /** @type {Map<string, {tecnicoId:string, usuarioId:string, nombres:string, apellidos:string, telefono:string|null, avatarUrl:string|null}>} */
        const tecnicoMap = new Map();
        if (allTecnicoIds.length > 0) {
          const { data: tecnicos } = await supabase
            .from('tecnico')
            .select('id, usuario_id, perfil:usuario_id(nombres, apellidos, telefono, avatar_url)')
            .in('id', allTecnicoIds);

          (tecnicos || []).forEach(t => {
            const p = t.perfil;
            tecnicoMap.set(t.id, {
              tecnicoId: t.id,
              usuarioId: t.usuario_id || null,
              nombres: p?.nombres || '',
              apellidos: p?.apellidos || '',
              telefono: p?.telefono || null,
              avatarUrl: p?.avatar_url || null,
            });
          });
        }

        const visitas = (rows || []).map(row => {
          const tecnicoIds = (row.visita_tecnico || [])
            .map(vt => vt.tecnico_id)
            .filter(Boolean);

          const tecnicos = tecnicoIds
            .map(id => tecnicoMap.get(id))
            .filter(Boolean);

          return {
            id: row.id,
            solicitudId: row.solicitud_id || null,
            sucursalId: row.sucursal_id,
            sucursalNombre: row.sucursal?.nombre || '',
            tipoVisitaLabel: row.tipo_visita?.nombre || '',
            fechaProgramada: row.fecha_programada || null,
            fechaInicio: row.fecha_inicio || null,
            fechaFin: row.fecha_fin || null,
            estadoCodigo: row.estado?.codigo || '',
            estadoLabel: row.estado?.nombre || '',
            tecnicosNombres: tecnicos.map(t => `${t.nombres} ${t.apellidos}`.trim()),
            tecnicos,
          };
        });

        if (!cancelled) setState({ visitas, loading: false });
      } catch (e) {
        console.error('[useVisitasCliente]', e);
        if (!cancelled) setState({ visitas: [], loading: false });
      }
    }

    load();
    return () => { cancelled = true; };
  }, [sucursalIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
