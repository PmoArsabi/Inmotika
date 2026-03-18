import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

// In-memory cache para evitar re-fetches durante la sesión
const _cache = {};

/**
 * Hook para cargar opciones de la tabla `catalogo` filtradas por tipo.
 * Retorna { options: [{value: id, label: nombre, codigo}], loading }
 */
export const useCatalog = (tipo) => {
  const key = `cat:${tipo}`;
  const [options, setOptions] = useState(_cache[key] || []);
  const [loading, setLoading] = useState(!_cache[key]);

  useEffect(() => {
    if (!tipo) return;
    if (key in _cache) {
      setOptions(_cache[key]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    supabase
      .from('catalogo')
      .select('id, codigo, nombre, orden')
      .eq('tipo', tipo)
      .eq('activo', true)
      .order('orden')
      .then(({ data }) => {
        if (!active) return;
        const opts = (data || []).map(r => ({
          value: r.id,
          label: r.nombre,
          codigo: r.codigo,
        }));
        _cache[key] = opts;
        setOptions(opts);
        setLoading(false);
      });
    return () => { active = false; };
  }, [key, tipo]);

  return { options, loading };
};

/**
 * Hook para cargar todos los estados de `catalogo_estado_general`.
 * Retorna { options: [{value: id, label: nombre, codigo}], loading }
 */
export const useEstados = () => {
  const key = 'estados_general';
  const [options, setOptions] = useState(_cache[key] || []);
  const [loading, setLoading] = useState(!_cache[key]);

  useEffect(() => {
    if (key in _cache) {
      setOptions(_cache[key]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    supabase
      .from('catalogo_estado_general')
      .select('id, codigo, nombre')
      .order('nombre')
      .then(({ data }) => {
        if (!active) return;
        const opts = (data || []).map(r => ({
          value: r.id,
          label: r.nombre,
          codigo: r.codigo,
        }));
        _cache[key] = opts;
        setOptions(opts);
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return { options, loading };
};

/**
 * Devuelve los UUIDs de los estados ACTIVO e INACTIVO de catalogo_estado_general.
 * Úsalo en cualquier formulario que necesite un Switch de Activo/Inactivo
 * para mantener consistencia con la FK de la base de datos.
 */
export const useActivoInactivo = () => {
  const { options, loading } = useEstados();
  return {
    activoId:   options.find(o => o.codigo === 'ACTIVO')?.value   || '',
    inactivoId: options.find(o => o.codigo === 'INACTIVO')?.value || '',
    loading,
  };
};

/** Limpia el caché completo (útil al cerrar sesión) */
export const clearCatalogCache = () => {
  Object.keys(_cache).forEach(k => delete _cache[k]);
};
