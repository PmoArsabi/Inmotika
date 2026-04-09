/**
 * Hook que carga el historial de intervenciones (visitas) de un dispositivo.
 */
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

/**
 * @param {string} deviceId
 * @returns {{ visitas: Array, loading: boolean }}
 */
export const useDeviceVisitHistory = (deviceId) => {
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deviceId || String(deviceId).startsWith('new-')) return;
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('intervencion')
        .select(`
          id,
          observacion_final,
          estado:estado_id(codigo, nombre),
          visita:visita_id(
            id,
            fecha_programada,
            fecha_inicio,
            fecha_fin,
            tipo_visita:tipo_visita_id(codigo, nombre),
            visita_tecnico(
              tecnico:tecnico_id(
                perfil:usuario_id(nombres, apellidos)
              )
            )
          ),
          evidencias:evidencia_intervencion(id, url, es_etiqueta, activo)
        `)
        .eq('dispositivo_id', deviceId)
        .eq('activo', true)
        .order('created_at', { ascending: false });

      if (!cancelled) {
        if (!error) setVisitas(data || []);
        setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [deviceId]);

  return { visitas, loading };
};
