import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useNotify } from '../context/NotificationContext';
import { useConfirm } from '../context/ConfirmContext';

/**
 * Mapa de tipo de entidad → función de soft-delete en Supabase.
 * cliente/contacto/sucursal usan estado_id (busca el estado inactivo).
 * dispositivo/categoria usan columna activo = false.
 *
 * @param {string} id  - UUID del registro a desactivar
 * @param {string} type - 'clientes' | 'contactos' | 'sucursales' | 'dispositivos' | 'categorias'
 */
/** Obtiene el UUID del estado INACTIVO del catálogo (código fijo). */
async function getEstadoInactivoId() {
  const { data, error } = await supabase
    .from('catalogo_estado_general')
    .select('id')
    .eq('codigo', 'INACTIVO')
    .maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error('Estado INACTIVO no encontrado en catálogo_estado_general');
  return data.id;
}

async function softDeleteInDB(id, type) {
  switch (type) {
    case 'clientes': {
      const estadoId = await getEstadoInactivoId();
      const { error } = await supabase
        .from('cliente')
        .update({ estado_id: estadoId })
        .eq('id', id);
      if (error) throw error;
      break;
    }
    case 'contactos': {
      const estadoId = await getEstadoInactivoId();
      const { error } = await supabase
        .from('contacto')
        .update({ estado_id: estadoId })
        .eq('id', id);
      if (error) throw error;
      break;
    }
    case 'sucursales': {
      const estadoId = await getEstadoInactivoId();
      const { error } = await supabase
        .from('sucursal')
        .update({ estado_id: estadoId })
        .eq('id', id);
      if (error) throw error;
      break;
    }
    case 'dispositivos': {
      const { error } = await supabase
        .from('dispositivo')
        .update({ activo: false })
        .eq('id', id);
      if (error) throw error;
      break;
    }
    case 'categorias': {
      const { error } = await supabase
        .from('categoria_dispositivo')
        .update({ activo: false })
        .eq('id', id);
      if (error) throw error;
      break;
    }
    default:
      throw new Error(`Tipo de entidad desconocido para eliminar: ${type}`);
  }
}

export const useConfiguration = (data, setData, initialSubTab = 'clientes', refreshData) => {
  const notify = useNotify();
  const confirm = useConfirm();
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);

  const removeItem = async (id, type) => {
    const confirmed = await confirm({
      title: '¿Eliminar registro?',
      message: '¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Descartar',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      // Optimistic UI: quitar del estado local inmediatamente.
      // Para contactos, también limpiarlos de las sucursales de cada cliente.
      setData(prev => {
        const next = { ...prev, [type]: (prev[type] || []).filter(i => i.id !== id) };
        if (type === 'contactos') {
          next.clientes = (prev.clientes || []).map(c => ({
            ...c,
            sucursales: (c.sucursales || []).map(s => ({
              ...s,
              contactos: (s.contactos || []).filter(ct => String(ct.id) !== String(id)),
            })),
          }));
        }
        return next;
      });

      // Persistir en Supabase
      await softDeleteInDB(id, type);

      notify('success', 'Registro eliminado correctamente');

      // Refrescar desde BD para mantener consistencia.
      // Contactos viven en dos lugares (data.contactos y data.clientes[].sucursales[].contactos),
      // por lo que un refreshData completo es necesario para sincronizar ambos.
      if (refreshData) {
        if (type === 'contactos') refreshData();
        else refreshData(type);
      }
    } catch (err) {
      // Revertir el optimistic update si falla
      notify('error', err.message || 'Error al eliminar el registro');
      if (refreshData) refreshData();
    }
  };

  // Update activeSubTab when initialSubTab changes
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Edit/View states
  const [editingItem, setEditingItem] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [viewLevel, setViewLevel] = useState('list'); // list, client-details, branches-list, branch-details
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [editingParentId, setEditingParentId] = useState(null);

  const handleEdit = (item, type = activeSubTab.slice(0, -1), parentId = null) => {
    setEditingItem(item);
    setEditingType(type);
    setIsViewMode(false);
    setEditingParentId(parentId);
    setShowForm(true);
  };

  const handleView = (item, type = activeSubTab.slice(0, -1)) => {
    if (type === 'cliente' || type === 'clientes') {
      setSelectedClient(item);
      setViewLevel('branches-list');
      return;
    }
    if (type === 'sucursal') {
      setSelectedBranch(item);
      setViewLevel('branch-details');
      return;
    }

    setEditingItem(item);
    setEditingType(type);
    setIsViewMode(true);
    setShowForm(true);
  };

  const handleNew = (type = activeSubTab.slice(0, -1)) => {
    setEditingItem(null);
    setEditingType(type);
    setIsViewMode(false);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setEditingType(null);
    setIsViewMode(false);
    setEditingParentId(null);
  };

  return {
    activeSubTab, setActiveSubTab,
    showForm, setShowForm,
    success, setSuccess,
    editingItem, setEditingItem,
    isViewMode, setIsViewMode,
    viewLevel, setViewLevel,
    selectedClient, setSelectedClient,
    selectedBranch, setSelectedBranch,
    editingType, setEditingType,
    editingParentId, setEditingParentId,
    handleEdit, handleView, handleNew,
    removeItem,
    handleCloseForm
  };
};
