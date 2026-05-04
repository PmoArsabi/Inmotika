import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

/**
 * Carga los catálogos necesarios para el formulario de dispositivo:
 * categorías, proveedores, marcas (dependiente de proveedor) y estados de gestión.
 *
 * @param {string|null} proveedorId - UUID del proveedor seleccionado; dispara carga de marcas.
 * @param {string|null} categoriaId - UUID de la categoría; dispara carga del protocolo.
 * @returns {{
 *   categorias: Array,
 *   proveedores: Array,
 *   marcas: Array,
 *   gestiones: Array,
 *   categoryPasos: Array,
 *   loading: { cats: boolean, provs: boolean, marcas: boolean, gestiones: boolean }
 * }}
 */
export function useDeviceCatalogs(proveedorId, categoriaId) {
  const [categorias,  setCategorias]  = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [marcas,      setMarcas]      = useState([]);
  const [gestiones,   setGestiones]   = useState([]);
  const [categoryPasos, setCategoryPasos] = useState([]);

  const [loadingCats,     setLoadingCats]     = useState(true);
  const [loadingProvs,    setLoadingProvs]     = useState(true);
  const [loadingMarcas,   setLoadingMarcas]   = useState(false);
  const [loadingGestiones,setLoadingGestiones] = useState(true);

  // ── Catálogos estáticos — se cargan una sola vez ─────────────────────────────

  const loadCategorias = useCallback(async () => {
    setLoadingCats(true);
    try {
      const { data, error } = await supabase
        .from('categoria_dispositivo')
        .select('id, nombre')
        .or('activo.eq.true,activo.is.null')
        .order('nombre');
      if (error) throw error;
      setCategorias((data || []).map(c => ({ value: c.id, label: c.nombre })));
    } catch (err) {
      console.error('[useDeviceCatalogs] loadCategorias:', err);
    } finally {
      setLoadingCats(false);
    }
  }, []);

  const loadProveedores = useCallback(async () => {
    setLoadingProvs(true);
    try {
      const { data, error } = await supabase
        .from('proveedor')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      setProveedores((data || []).map(p => ({ value: p.id, label: p.nombre })));
    } catch (err) {
      console.error('[useDeviceCatalogs] loadProveedores:', err);
    } finally {
      setLoadingProvs(false);
    }
  }, []);

  const loadGestiones = useCallback(async () => {
    setLoadingGestiones(true);
    try {
      const { data, error } = await supabase
        .from('catalogo')
        .select('id, nombre')
        .eq('tipo', 'ESTADO_GESTION_DISPOSITIVO')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      setGestiones((data || []).map(g => ({ value: g.id, label: g.nombre })));
    } catch (err) {
      console.error('[useDeviceCatalogs] loadGestiones:', err);
    } finally {
      setLoadingGestiones(false);
    }
  }, []);

  useEffect(() => {
    loadCategorias();
    loadProveedores();
    loadGestiones();
  }, [loadCategorias, loadProveedores, loadGestiones]);

  // ── Marcas — dependiente del proveedor seleccionado ──────────────────────────

  useEffect(() => {
    if (!proveedorId) { setMarcas([]); return; }
    let cancelled = false;
    setLoadingMarcas(true);
    supabase
      .from('marca')
      .select('id, nombre')
      .eq('proveedor_id', proveedorId)
      .eq('activo', true)
      .order('nombre')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { console.error('[useDeviceCatalogs] loadMarcas:', error); return; }
        setMarcas((data || []).map(m => ({ value: m.id, label: m.nombre })));
      })
      .finally(() => { if (!cancelled) setLoadingMarcas(false); });
    return () => { cancelled = true; };
  }, [proveedorId]);

  // ── Pasos del protocolo — dependiente de la categoría seleccionada ────────────

  useEffect(() => {
    if (!categoriaId) { setCategoryPasos([]); return; }
    let cancelled = false;
    supabase
      .from('paso_protocolo')
      .select('*, actividades:actividad_protocolo(*)')
      .eq('categoria_id', categoriaId)
      .or('activo.eq.true,activo.is.null')
      .order('orden')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { console.error('[useDeviceCatalogs] loadProtocol:', error); return; }
        setCategoryPasos((data || []).map(p => ({
          ...p,
          actividades: (p.actividades || [])
            .filter(a => a.activo !== false)
            .sort((a, b) => a.orden - b.orden),
        })));
      });
    return () => { cancelled = true; };
  }, [categoriaId]);

  return {
    categorias,
    proveedores,
    marcas,
    gestiones,
    categoryPasos,
    loading: {
      cats:      loadingCats,
      provs:     loadingProvs,
      marcas:    loadingMarcas,
      gestiones: loadingGestiones,
    },
  };
}
