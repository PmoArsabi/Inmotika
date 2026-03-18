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

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const { data: rows, error: fetchError } = await supabase
        .from('cliente')
        .select('*, cliente_documento(id, nombre, url, activo), sucursal(*, contrato(*)), cliente_director(*)')
        .order('razon_social');
      if (fetchError) throw fetchError;

      const clientesBase = (rows || []).map(row => ({
        ...toClientDraft(row),
        sucursales: (row.sucursal || []).map(s => toBranchDraft(s)),
      }));

      const { data: contactRows, error: contactError } = await supabase
        .from('contacto')
        .select('*, contacto_sucursal(sucursal_id)');
      if (contactError) throw contactError;

      const contactos = (contactRows || []).map(row => toContactDraft(row));

      const clientes = clientesBase.map(c => ({
        ...c,
        sucursales: (c.sucursales || []).map(s => {
          const branchContacts = contactos.filter(ct =>
            (ct.associatedBranchIds || []).includes(String(s.id))
          );
          return { ...s, contactos: branchContacts };
        }),
      }));

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

      const dispositivos = (deviceRows || []).map(row => toDeviceDraft(row));

      const { data: catRows, error: catError } = await supabase
        .from('categoria_dispositivo')
        .select('*, numPasos:paso_protocolo(count)')
        .or('activo.eq.true,activo.is.null')
        .order('nombre');
      if (catError) throw catError;

      const categorias = (catRows || []).map(cat => ({
        ...cat,
        numPasos: cat.numPasos?.[0]?.count || 0
      }));

      setData(prev => ({ 
        ...prev, 
        clientes, 
        contactos, 
        dispositivos,
        categorias
      }));
    } catch (err) {
      setError(err?.message ?? 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

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
