import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

/**
 * Carga liviana de la visita vinculada a una solicitud (solo lo que usa el detalle).
 * Evita montar useVisitas() completo (protocolos/evidencias) al abrir la lista.
 *
 * @param {string|null|undefined} solicitudId
 * @returns {{ visita: object|null, loading: boolean }}
 */
export function useVisitaBySolicitud(solicitudId) {
  const [visita, setVisita] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!solicitudId) {
      setVisita(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { data: row, error } = await supabase
          .from('visita')
          .select(`
            id,
            solicitud_id,
            fecha_programada,
            fecha_inicio,
            fecha_fin,
            estado_id,
            estado:estado_id(codigo, nombre),
            visita_tecnico(tecnico_id)
          `)
          .eq('solicitud_id', solicitudId)
          .maybeSingle();

        if (error) throw error;
        if (!row) {
          if (!cancelled) {
            setVisita(null);
            setLoading(false);
          }
          return;
        }

        const tecnicoIds = (row.visita_tecnico || []).map(vt => vt.tecnico_id).filter(Boolean);
        let tecnicos = [];
        let tecnicosNombres = [];

        if (tecnicoIds.length > 0) {
          const { data: tecnicosRows } = await supabase
            .from('tecnico')
            .select('id, usuario_id')
            .in('id', tecnicoIds);

          const usuarioIds = (tecnicosRows || []).map(t => t.usuario_id).filter(Boolean);
          const tecnicoToUsuario = new Map((tecnicosRows || []).map(t => [t.id, t.usuario_id]));

          let perfilMap = new Map();
          if (usuarioIds.length > 0) {
            const { data: perfiles } = await supabase
              .from('perfil_usuario')
              .select('id, nombres, apellidos, telefono, avatar_url')
              .in('id', usuarioIds);
            (perfiles || []).forEach(p => perfilMap.set(p.id, p));
          }

          tecnicos = tecnicoIds.map(tecnicoId => {
            const usuarioId = tecnicoToUsuario.get(tecnicoId);
            const p = usuarioId ? perfilMap.get(usuarioId) : null;
            return {
              tecnicoId,
              usuarioId: usuarioId || null,
              nombres: p?.nombres || '',
              apellidos: p?.apellidos || '',
              telefono: p?.telefono || null,
              avatarUrl: p?.avatar_url || null,
            };
          });
          tecnicosNombres = tecnicos.map(t =>
            `${t.nombres || ''} ${t.apellidos || ''}`.trim() || 'Técnico'
          );
        }

        if (cancelled) return;
        setVisita({
          id: row.id,
          solicitudId: row.solicitud_id,
          fechaProgramada: row.fecha_programada,
          fechaInicio: row.fecha_inicio,
          fechaFin: row.fecha_fin,
          estadoCodigo: row.estado?.codigo || '',
          estadoLabel: row.estado?.nombre || '',
          tecnicos,
          tecnicosNombres,
        });
      } catch (err) {
        console.error('[useVisitaBySolicitud]', err);
        if (!cancelled) setVisita(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [solicitudId]);

  return { visita, loading };
}
