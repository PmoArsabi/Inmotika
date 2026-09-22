import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';
import { toClientDraft, toBranchDraft, toContactDraft, toDeviceDraft } from '../utils/entityMappers';
import { ROLES } from '../utils/constants';

const MasterDataContext = createContext();

/** Colecciones vacías — técnico no usa configuración/inventario master. */
const EMPTY_MASTER = {
  clientes: [],
  contactos: [],
  dispositivos: [],
  categorias: [],
};

export const MasterDataProvider = ({ children, initialData = {} }) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to update specific collections immutably
  const updateCollection = useCallback((key, updater) => {
    setData(prev => ({
      ...prev,
      [key]: typeof updater === 'function' ? updater(prev[key] || []) : updater
    }));
  }, []);

  /**
   * Obtiene los UUIDs de los estados que representan registros eliminados/inactivos.
   * Se usan para filtrar clientes y contactos tras el soft-delete.
   * @returns {Promise<Set<string>>}
   */
  const loadEstadosInactivos = useCallback(async () => {
    const { data, error } = await supabase
      .from('catalogo')
      .select('id, codigo')
      .eq('tipo', 'ESTADO_ENTIDAD')
      .eq('codigo', 'INACTIVO');
    if (error) throw error;
    return new Set((data || []).map(e => e.id));
  }, []);

  /**
   * Fetches and maps the `contacto` collection.
   * @returns {Promise<Array>} Array of mapped contact drafts.
   */
  const loadContactos = useCallback(async (estadosInactivos) => {
    const [{ data: contactRows, error: contactError }, inactivos] = await Promise.all([
      supabase
        .from('contacto')
        .select('*, contacto_sucursal(sucursal_id, activo), perfil_usuario(id, estado_id, catalogo:estado_id(codigo, activo))'),
      estadosInactivos ?? loadEstadosInactivos(),
    ]);
    if (contactError) throw contactError;
    // Filtrar contactos cuyo estado_id corresponda a INACTIVO o RETIRADO
    return (contactRows || [])
      .filter(row => !row.estado_id || !inactivos.has(row.estado_id))
      .map(row => toContactDraft(row));
  }, [loadEstadosInactivos]);

  /**
   * Fetches and maps the `cliente` collection.
   * Requires a pre-fetched contacts array to embed contacts into each branch.
   * When called in isolation (refreshData('clientes')), it also fetches contacts
   * internally so branch-level contacts remain consistent.
   *
   * @param {Array} [preloadedContactos] - Already-fetched contacts to avoid a
   *   redundant network call when reloading all collections in parallel.
   * @returns {Promise<Array>} Array of mapped client drafts with nested sucursales.
   */
  const loadClientes = useCallback(async (preloadedContactos) => {
    const [clienteResult, contactos, inactivos] = await Promise.all([
      supabase
        .from('cliente')
        .select('*, cliente_documento(id, nombre, url, activo), sucursal(*, contrato(*), sucursal_coordinador(coordinador_id, activo)), cliente_director(*)')
        .order('razon_social'),
      preloadedContactos !== undefined
        ? Promise.resolve(preloadedContactos)
        : loadContactos(),
      loadEstadosInactivos(),
    ]);

    if (clienteResult.error) throw clienteResult.error;

    // Filtrar clientes cuyo estado_id corresponda a INACTIVO o RETIRADO (soft-deleted)
    return (clienteResult.data || [])
      .filter(row => !row.estado_id || !inactivos.has(row.estado_id))
      .map(row => ({
        ...toClientDraft(row),
        sucursales: (row.sucursal || []).map(s => {
          const branchContacts = contactos.filter(ct =>
            (ct.associatedBranchIds || []).includes(String(s.id))
          );
          const coordinadorIds = (s.sucursal_coordinador || [])
            .filter(r => r.activo)
            .map(r => String(r.coordinador_id));
          return { ...toBranchDraft(s), contactos: branchContacts, coordinadorIds };
        }),
      }));
  }, [loadContactos]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Fetches and maps the `dispositivo` collection.
   * @returns {Promise<Array>} Array of mapped device drafts.
   */
  const loadDispositivos = useCallback(async () => {
    const { data: deviceRows, error: deviceError } = await supabase
      .from('dispositivo')
      .select(`
        *,
        categoria:categoria_id(nombre),
        cliente:cliente_id(razon_social),
        sucursal:sucursal_id(nombre),
        proveedor:proveedor_id(nombre),
        marca:marca_id(nombre),
        estado_gestion:estado_gestion_id(nombre)
      `)
      .order('created_at', { ascending: false });
    if (deviceError) throw deviceError;
    return (deviceRows || []).map(row => toDeviceDraft(row));
  }, []);

  /**
   * Fetches and maps the `categoria_dispositivo` collection.
   * @returns {Promise<Array>} Array of category objects with a `numPasos` count.
   */
  const loadCategorias = useCallback(async () => {
    const { data: catRows, error: catError } = await supabase
      .from('categoria_dispositivo')
      .select('*, numPasos:paso_protocolo(count)')
      .or('activo.eq.true,activo.is.null')
      .order('nombre');
    if (catError) throw catError;
    return (catRows || []).map(cat => ({
      ...cat,
      numPasos: cat.numPasos?.[0]?.count || 0,
    }));
  }, []);

  const { user } = useAuth();
  const isTecnico = user?.role === ROLES.TECNICO;

  /**
   * Reloads master data from Supabase.
   *
   * @param {('clientes'|'contactos'|'dispositivos'|'categorias')} [key] - When
   *   provided, only the matching collection is re-fetched and state-patched.
   *   When omitted, all four collections are loaded in parallel via Promise.all.
   *
   * @example
   * refreshData()               // reload everything (initial load, full refresh)
   * refreshData('categorias')   // reload only categories after a create/update
   * refreshData('dispositivos') // reload only devices after a status change
   */
  const refreshData = useCallback(async (key) => {
    // Técnico no consume master data; evita cargas accidentales desde realtime/UI.
    if (user?.role === ROLES.TECNICO) {
      setData(prev => ({ ...prev, ...EMPTY_MASTER }));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      setError(null);

      if (key === undefined) {
        // Cargar estados inactivos una sola vez y reutilizar en contactos y clientes
        const [inactivos, dispositivos, categorias] = await Promise.all([
          loadEstadosInactivos(),
          loadDispositivos(),
          loadCategorias(),
        ]);
        const contactos = await loadContactos(inactivos);
        const clientes = await loadClientes(contactos);

        setData(prev => ({
          ...prev,
          clientes,
          contactos,
          dispositivos,
          categorias,
        }));
        return;
      }

      /** @type {Record<string, () => Promise<Array>>} */
      const loaders = {
        clientes: () => loadClientes(),
        contactos: loadContactos,
        dispositivos: loadDispositivos,
        categorias: loadCategorias,
      };

      const loader = loaders[key];
      if (!loader) {
        throw new Error(`refreshData: clave desconocida "${key}". Valores válidos: clientes, contactos, dispositivos, categorias.`);
      }

      const result = await loader();
      updateCollection(key, result);
    } catch (err) {
      setError(err?.message ?? 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [loadClientes, loadContactos, loadDispositivos, loadCategorias, loadEstadosInactivos, updateCollection, user?.role]);

  // Carga inicial al autenticarse.
  // TECNICO solo usa Tablero / Gestión Visitas / Mensajes → no necesita master data
  // (clientes, contactos, inventario completo). Evita el SELECT pesado de dispositivo (~5s).
  useEffect(() => {
    if (!user) return;
    if (isTecnico) {
      setData(prev => ({ ...prev, ...EMPTY_MASTER }));
      setLoading(false);
      setError(null);
      return;
    }
    refreshData();
  }, [refreshData, user, isTecnico]);

  // Realtime: invalida colecciones cuando otro usuario hace cambios en BD.
  // Se usa debounce de 1.5s para evitar condiciones de carrera con operaciones
  // de guardado locales que también modifican las mismas tablas.
  // Técnico no suscribe: no consume esas colecciones.
  useEffect(() => {
    if (!user || isTecnico) return;

    const timers = {};
    const debounced = (key, fn) => () => {
      clearTimeout(timers[key]);
      timers[key] = setTimeout(fn, 1500);
    };

    const channel = supabase
      .channel('master-data-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cliente' },
        debounced('clientes', () => refreshData('clientes'))
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sucursal' },
        debounced('clientes', () => refreshData('clientes'))
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacto' },
        debounced('contactos', () => refreshData('contactos'))
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacto_sucursal' },
        debounced('contactos', () => refreshData('contactos'))
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispositivo' },
        debounced('dispositivos', () => refreshData('dispositivos'))
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categoria_dispositivo' },
        debounced('categorias', () => refreshData('categorias'))
      )
      .subscribe();

    return () => {
      Object.values(timers).forEach(clearTimeout);
      supabase.removeChannel(channel);
    };
  }, [user, isTecnico, refreshData]);

  const value = useMemo(() => ({
    data,
    setData,
    updateCollection,
    loading,
    error,
    refreshData
  }), [data, loading, error, refreshData, updateCollection]);

  return (
    <MasterDataContext.Provider value={value}>
      {children}
    </MasterDataContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMasterData = () => {
  const context = useContext(MasterDataContext);
  if (!context) {
    throw new Error('useMasterData must be used within a MasterDataProvider');
  }
  return context;
};
