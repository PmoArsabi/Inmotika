import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';
import { toClientDraft, toBranchDraft, toContactDraft, toDeviceDraft } from '../utils/entityMappers';

const MasterDataContext = createContext();

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
   * Fetches and maps the `contacto` collection.
   * @returns {Promise<Array>} Array of mapped contact drafts.
   */
  const loadContactos = useCallback(async () => {
    const { data: contactRows, error: contactError } = await supabase
      .from('contacto')
      .select('*, contacto_sucursal(sucursal_id)');
    if (contactError) throw contactError;
    return (contactRows || []).map(row => toContactDraft(row));
  }, []);

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
    const [clienteResult, contactos] = await Promise.all([
      supabase
        .from('cliente')
        .select('*, cliente_documento(id, nombre, url, activo), sucursal(*, contrato(*)), cliente_director(*)')
        .order('razon_social'),
      preloadedContactos !== undefined
        ? Promise.resolve(preloadedContactos)
        : loadContactos(),
    ]);

    if (clienteResult.error) throw clienteResult.error;

    const clientesBase = (clienteResult.data || []).map(row => ({
      ...toClientDraft(row),
      sucursales: (row.sucursal || []).map(s => toBranchDraft(s)),
    }));

    return clientesBase.map(c => ({
      ...c,
      sucursales: (c.sucursales || []).map(s => {
        const branchContacts = contactos.filter(ct =>
          (ct.associatedBranchIds || []).includes(String(s.id))
        );
        return { ...s, contactos: branchContacts };
      }),
    }));
  }, [loadContactos]);

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
    setLoading(true);
    try {
      setError(null);

      if (key === undefined) {
        // Load contactos first so loadClientes can reuse the result without a
        // second network round-trip, while dispositivos and categorias run in
        // parallel at the same time.
        const [contactos, dispositivos, categorias] = await Promise.all([
          loadContactos(),
          loadDispositivos(),
          loadCategorias(),
        ]);
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
  }, [loadClientes, loadContactos, loadDispositivos, loadCategorias, updateCollection]);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [refreshData, user]);

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

export const useMasterData = () => {
  const context = useContext(MasterDataContext);
  if (!context) {
    throw new Error('useMasterData must be used within a MasterDataProvider');
  }
  return context;
};
