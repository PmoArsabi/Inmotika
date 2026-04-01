import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

/**
 * Obtiene las visitas asociadas a un conjunto de sucursales del cliente.
 * Diseñado para el rol CLIENTE — respeta RLS.
 *
 * Solo carga lo necesario para el dashboard: estado, fechas, tipo, técnicos.
 * No carga protocolos ni intervenciones detalladas.
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

    async function fetch() {
      setState(prev => ({ ...prev, loading: true }));
      try {
        const { data: rows, error } = await supabase
          .from('visita')
          .select(`
            id,
            sucursal_id,
            fecha_programada,
            fecha_inicio,
            fecha_fin,
            sucursal:sucursal_id(nombre),
            tipo_visita:tipo_visita_id(nombre),
            estado:estado_id(codigo, nombre),
            visita_tecnico(tecnico:tecnico_id(perfil:usuario_id(nombres, apellidos)))
          `)
          .in('sucursal_id', sucursalIds)
          .order('fecha_programada', { ascending: false, nullsFirst: false });

        if (error) throw error;
        if (cancelled) return;

        const visitas = (rows || []).map(row => ({
          id: row.id,
          sucursalId: row.sucursal_id,
          sucursalNombre: row.sucursal?.nombre || '',
          tipoVisitaLabel: row.tipo_visita?.nombre || '',
          fechaProgramada: row.fecha_programada || null,
          fechaInicio: row.fecha_inicio || null,
          fechaFin: row.fecha_fin || null,
          estadoCodigo: row.estado?.codigo || '',
          estadoLabel: row.estado?.nombre || '',
          tecnicosNombres: (row.visita_tecnico || [])
            .map(vt => {
              const p = vt.tecnico?.perfil;
              return p ? `${p.nombres || ''} ${p.apellidos || ''}`.trim() : null;
            })
            .filter(Boolean),
        }));

        setState({ visitas, loading: false });
      } catch (e) {
        console.error('[useVisitasCliente]', e);
        if (!cancelled) setState({ visitas: [], loading: false });
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [sucursalIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
