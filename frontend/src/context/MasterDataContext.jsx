import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { toClientDraft, toBranchDraft } from '../utils/entityMappers';

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

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const { data: rows, error: fetchError } = await supabase
        .from('cliente')
        .select('*, cliente_documento(id, nombre, url, activo), sucursal(*, contrato(*))')
        .order('razon_social');
      if (fetchError) throw fetchError;
      const clientes = (rows || []).map(row => ({
        ...toClientDraft(row),
        sucursales: (row.sucursal || []).map(s => toBranchDraft(s)),
      }));
      setData(prev => ({ ...prev, clientes }));
    } catch (err) {
      setError(err?.message ?? 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

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
