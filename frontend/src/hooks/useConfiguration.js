import { useState } from 'react';

export const useConfiguration = (data, setData) => {
  const [activeSubTab, setActiveSubTab] = useState('clientes');
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

  const removeItem = (id, type) => {
    if (window.confirm('¿Está seguro de eliminar este registro?')) {
      setData({ ...data, [type]: data[type].filter(i => i.id !== id) });
    }
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
