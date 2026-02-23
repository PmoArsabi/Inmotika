import { useState } from 'react';

export const useConfiguration = (data, setData) => {
  const [activeSubTab, setActiveSubTab] = useState('clientes');
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Form specific states
  const [deviceCodes, setDeviceCodes] = useState([]);
  const [currentDeviceCode, setCurrentDeviceCode] = useState('');
  const [maintenanceSteps, setMaintenanceSteps] = useState([]);
  const [currentStepText, setCurrentStepText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState({ carnet: false, arl: false, matriz: false, manual: false, mantenimiento: false });
  const [sucursales, setSucursales] = useState([]);
  
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

    if (type === 'cliente' || type === 'clientes') {
      setSucursales(item.sucursales ? JSON.parse(JSON.stringify(item.sucursales)) : []);
    } else if (type === 'sucursal') {
      setSucursales([JSON.parse(JSON.stringify(item))]);
    } else if (type === 'contacto') {
      setSucursales([]);
    }

    if (item.dispositivos && type === 'dispositivo') {
      setDeviceCodes([...item.dispositivos]);
    } else {
      setDeviceCodes([]);
    }

    if (item.pasoAPaso) {
      setMaintenanceSteps([...item.pasoAPaso]);
    } else {
      setMaintenanceSteps([]);
    }

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
    setSucursales([]);
    setDeviceCodes([]);
    setMaintenanceSteps([]);
    setShowForm(true);
  };

  const addDeviceCode = () => { 
    if (currentDeviceCode && !deviceCodes.includes(currentDeviceCode)) { 
      setDeviceCodes([...deviceCodes, currentDeviceCode]); 
      setCurrentDeviceCode(''); 
    } 
  };
  
  const addStep = () => { 
    if (currentStepText) { 
      setMaintenanceSteps([...maintenanceSteps, currentStepText]); 
      setCurrentStepText(''); 
    } 
  };

  const addSucursal = () => {
    setSucursales([...sucursales, {
      id: Date.now(),
      nombre: '',
      ciudad: '',
      direccion: '',
      telefono: '',
      email: '',
      contactos: []
    }]);
  };

  const removeSucursal = (id) => {
    if (window.confirm('¿Está seguro de eliminar esta sucursal?')) {
      const updatedClients = data.clientes.map(client => {
        if (client.id === selectedClient.id) {
          const updatedBranches = (client.sucursales || []).filter(s => s.id !== id);
          const updatedClient = { ...client, sucursales: updatedBranches };
          setSelectedClient(updatedClient);
          return updatedClient;
        }
        return client;
      });
      setData({ ...data, clientes: updatedClients });
    }
  };

  const handleSucursalChange = (id, field, value) => {
    setSucursales(sucursales.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addContacto = (sucursalId) => {
    setSucursales(sucursales.map(s => {
      if (s.id === sucursalId) {
        return {
          ...s,
          contactos: [...(s.contactos || []), { id: Date.now(), nombre: '', celular: '', email: '', cargo: '' }]
        };
      }
      return s;
    }));
  };

  const removeContacto = (sucursalId, contactoId) => {
    setSucursales(sucursales.map(s => {
      if (s.id === sucursalId) {
        return {
          ...s,
          contactos: (s.contactos || []).filter(c => c.id !== contactoId)
        };
      }
      return s;
    }));
  };

  const handleContactoChange = (sucursalId, contactoId, field, value) => {
    setSucursales(sucursales.map(s => {
      if (s.id === sucursalId) {
        return {
          ...s,
          contactos: (s.contactos || []).map(c => c.id === contactoId ? { ...c, [field]: value } : c)
        };
      }
      return s;
    }));
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
    setDeviceCodes([]);
    setMaintenanceSteps([]);
    setSucursales([]);
    setEditingParentId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewMode) return;

    const formData = new FormData(e.target);
    const newItem = Object.fromEntries(formData.entries());

    if (editingType === 'contacto') {
       const updatedContact = { 
         ...editingItem, 
         ...newItem,
         id: editingItem ? editingItem.id : Date.now() 
       };
       const updatedClients = data.clientes.map(client => {
         if (client.id === selectedClient.id) {
           const updatedBranches = (client.sucursales || []).map(s => {
             if (s.id === editingParentId) {
               let updatedContacts;
               if (editingItem) {
                 updatedContacts = (s.contactos || []).map(c => 
                   c.id === editingItem.id ? updatedContact : c
                 );
               } else {
                 updatedContacts = [...(s.contactos || []), updatedContact];
               }
               const updatedBranch = { ...s, contactos: updatedContacts };
               if (selectedBranch?.id === s.id) setSelectedBranch(updatedBranch);
               return updatedBranch;
             }
             return s;
           });
           const updatedClient = { ...client, sucursales: updatedBranches };
           setSelectedClient(updatedClient);
           return updatedClient;
         }
         return client;
       });
       setData({ ...data, clientes: updatedClients });
     } else if (editingType === 'sucursal') {
      const sucursalData = sucursales[0];
      const updatedSucursal = {
        ...sucursalData,
        id: editingItem ? editingItem.id : (sucursalData.id || Date.now())
      };

      const updatedClients = data.clientes.map(client => {
        if (client.id === selectedClient.id) {
          let updatedBranches;
          if (editingItem) {
            updatedBranches = (client.sucursales || []).map(s =>
              s.id === editingItem.id ? updatedSucursal : s
            );
          } else {
            updatedBranches = [...(client.sucursales || []), updatedSucursal];
          }

          const updatedClient = { ...client, sucursales: updatedBranches };
          setSelectedClient(updatedClient);
          if (selectedBranch?.id === updatedSucursal.id) {
            setSelectedBranch(updatedSucursal);
          }
          return updatedClient;
        }
        return client;
      });

      setData({ ...data, clientes: updatedClients });
    } else if (editingItem) {
      const updatedList = data[activeSubTab].map(item => {
        if (item.id === editingItem.id) {
          const updated = { ...item, ...newItem };
          if (activeSubTab === 'clientes') updated.sucursales = sucursales;
          if (activeSubTab === 'dispositivos') updated.pasoAPaso = maintenanceSteps;

          if (activeSubTab === 'clientes' && selectedClient?.id === item.id) {
            setSelectedClient(updated);
          }
          return updated;
        }
        return item;
      });
      setData({ ...data, [activeSubTab]: updatedList });
    } else {
      const createdItem = {
        ...newItem,
        id: Date.now()
      };

      if (activeSubTab === 'clientes') {
        createdItem.sucursales = sucursales;
      }
      if (activeSubTab === 'dispositivos') {
        createdItem.pasoAPaso = maintenanceSteps;
      }
      setData({ ...data, [activeSubTab]: [createdItem, ...data[activeSubTab]] });
    }

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      handleCloseForm();
    }, 1500);
  };

  return {
    activeSubTab, setActiveSubTab,
    showForm, setShowForm,
    success,
    deviceCodes, setDeviceCodes,
    currentDeviceCode, setCurrentDeviceCode,
    maintenanceSteps, setMaintenanceSteps,
    currentStepText, setCurrentStepText,
    attachedFiles, setAttachedFiles,
    sucursales, setSucursales,
    editingItem, setEditingItem,
    isViewMode, setIsViewMode,
    viewLevel, setViewLevel,
    selectedClient, setSelectedClient,
    selectedBranch, setSelectedBranch,
    editingType, setEditingType,
    editingParentId, setEditingParentId,
    handleEdit, handleView, handleNew,
    addDeviceCode, addStep,
    addSucursal, removeSucursal, handleSucursalChange,
    addContacto, removeContacto, handleContactoChange,
    removeItem,
    handleCloseForm, handleSubmit
  };
};
