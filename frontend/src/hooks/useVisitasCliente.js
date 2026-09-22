import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

/**
 * Lista de visitas de las sucursales del cliente (rol CLIENTE).
 * Solo carga lo necesario para tablas/KPI: fechas, estado, técnicos e informe PDF.
 *
 * @param {string[]} sucursalIds - IDs de sucursales del contacto autenticado
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
        const { data: rows, error } = await supabase
          .from('visita')
          .select(`
            id,
            solicitud_id,
            sucursal_id,
            fecha_programada,
            fecha_inicio,
            fecha_fin,
            observacion_final,
            sucursal:sucursal_id(nombre),
            tipo_visita:tipo_visita_id(nombre),
            estado:estado_id(codigo, nombre),
            visita_tecnico(tecnico_id)
          `)
          .in('sucursal_id', sucursalIds)
          .order('fecha_programada', { ascending: false, nullsFirst: false });

        if (error) throw error;
        if (cancelled) return;

        const visitaIds = (rows || []).map(r => r.id);
        const allTecnicoIds = [
          ...new Set(
            (rows || []).flatMap(r =>
              (r.visita_tecnico || []).map(vt => vt.tecnico_id).filter(Boolean)
            )
          ),
        ];

        const [tecnicosRes, informesRes] = await Promise.all([
          allTecnicoIds.length > 0
            ? supabase
                .from('tecnico')
                .select('id, usuario_id, perfil:usuario_id(nombres, apellidos, telefono, avatar_url)')
                .in('id', allTecnicoIds)
            : Promise.resolve({ data: [] }),
          visitaIds.length > 0
            ? supabase
                .from('informe')
                .select('id, visita_id, storage_path')
                .in('visita_id', visitaIds)
                .eq('estado', 'APROBADO')
            : Promise.resolve({ data: [] }),
        ]);

        if (cancelled) return;

        /** @type {Map<string, object>} */
        const tecnicoMap = new Map();
        (tecnicosRes.data || []).forEach(t => {
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

        /** @type {Map<string, {informeId:string, storagePath:string|null}>} */
        const informeMap = new Map();
        (informesRes.data || []).forEach(inf => {
          informeMap.set(inf.visita_id, { informeId: inf.id, storagePath: inf.storage_path });
        });

        const visitas = (rows || []).map(row => {
          const tecnicos = (row.visita_tecnico || [])
            .map(vt => tecnicoMap.get(vt.tecnico_id))
            .filter(Boolean);
          const inf = informeMap.get(row.id) || null;

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
            informeId: inf?.informeId || null,
            informeStoragePath: inf?.storagePath || null,
            dispositivos: [],
            deviceEvidencias: {},
            ejecucionPasos: {},
            observacionFinal: row.observacion_final || '',
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
