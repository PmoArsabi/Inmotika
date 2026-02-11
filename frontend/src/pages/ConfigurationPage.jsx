import { useState } from 'react';
import {
  Plus, X, Edit2, Trash2, CheckCircle2, Users, MapPin, Building2,
  Phone, Mail, UserCog, Activity, RotateCcw, Timer, ListChecks, Smartphone,
  Eye, Save, User, Briefcase, ChevronRight, Home
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import FileUploader from '../components/ui/FileUploader';
import IconButton from '../components/ui/IconButton';
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import ContactoForm from '../components/forms/ContactoForm';
import SucursalForm from '../components/forms/SucursalForm';
import ClienteForm from '../components/forms/ClienteForm';
import TecnicoForm from '../components/forms/TecnicoForm';
import DispositivoForm from '../components/forms/DispositivoForm';

const ConfigurationPage = ({ data, setData }) => {
  const [activeSubTab, setActiveSubTab] = useState('clientes');
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deviceCodes, setDeviceCodes] = useState([]);
  const [currentDeviceCode, setCurrentDeviceCode] = useState('');
  const [maintenanceSteps, setMaintenanceSteps] = useState([]);
  const [currentStepText, setCurrentStepText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState({ carnet: false, arl: false, matriz: false, manual: false, mantenimiento: false });
  const [sucursales, setSucursales] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [viewLevel, setViewLevel] = useState('list'); // list, client-details, branches-list, branch-details
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [editingType, setEditingType] = useState(null); // 'clientes', 'sucursal', 'tecnicos', 'dispositivos', 'contacto'
  const [editingParentId, setEditingParentId] = useState(null); // Para saber a qué sucursal pertenece un contacto al editarlo solo a él

  const Breadcrumbs = () => {
    if (activeSubTab !== 'clientes' || viewLevel === 'list') return null;

    const items = [
      { label: 'Clientes', level: 'list', icon: Home },
    ];

    if (selectedClient) {
      items.push({ label: selectedClient.nombre, level: 'client-details', icon: Users });
    }

    if (viewLevel === 'branches-list' || viewLevel === 'branch-details') {
      items.push({ label: 'Sucursales', level: 'branches-list', icon: Building2 });
    }

    if (selectedBranch) {
      items.push({ label: selectedBranch.nombre, level: 'branch-details', icon: MapPin });
    }

    return (
      <nav className="flex items-center gap-1.5 text-xs mb-4 bg-white p-2 rounded-md shadow-sm border border-gray-100 w-fit">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            {idx > 0 && <ChevronRight size={12} className="text-gray-300" />}
            <button
              onClick={() => {
                setViewLevel(item.level);
                if (item.level === 'list') { setSelectedClient(null); setSelectedBranch(null); }
                if (item.level === 'client-details') { setSelectedBranch(null); }
                if (item.level === 'branches-list') { setSelectedBranch(null); }
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${viewLevel === item.level
                  ? 'bg-red-50 text-[#D32F2F] font-bold'
                  : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
              <item.icon size={14} />
              <span className="capitalize">{item.label}</span>
            </button>
          </div>
        ))}
      </nav>
    );
  };

  const handleEdit = (item, type = activeSubTab.slice(0, -1), parentId = null) => {
    setEditingItem(item);
    setEditingType(type);
    setIsViewMode(false);
    setEditingParentId(parentId);

    // Cargar datos anidados según el tipo
    if (type === 'cliente' || type === 'clientes') {
      if (item.sucursales) {
        setSucursales(JSON.parse(JSON.stringify(item.sucursales)));
      } else {
        setSucursales([]);
      }
    } else if (type === 'sucursal') {
      setSucursales([JSON.parse(JSON.stringify(item))]);
    } else if (type === 'contacto') {
      // Para contacto individual no necesitamos cargar sucursales completas
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
      setViewLevel('branches-list'); // Ir directamente a la lista de sucursales (que es una tabla)
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

  const addDeviceCode = () => { if (currentDeviceCode && !deviceCodes.includes(currentDeviceCode)) { setDeviceCodes([...deviceCodes, currentDeviceCode]); setCurrentDeviceCode(''); } };
  const addStep = () => { if (currentStepText) { setMaintenanceSteps([...maintenanceSteps, currentStepText]); setCurrentStepText(''); } };

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
      // Estamos editando o creando una sucursal específica de un cliente
      const sucursalData = sucursales[0];
      const updatedSucursal = {
        ...sucursalData,
        id: editingItem ? editingItem.id : (sucursalData.id || Date.now())
      };

      const updatedClients = data.clientes.map(client => {
        if (client.id === selectedClient.id) {
          let updatedBranches;
          if (editingItem) {
            // Editando sucursal existente
            updatedBranches = (client.sucursales || []).map(s =>
              s.id === editingItem.id ? updatedSucursal : s
            );
          } else {
            // Añadiendo nueva sucursal
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
      // Actualización normal de un maestro (Cliente, Técnico o Dispositivo)
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
      // Creación de un nuevo registro
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

  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      <div className="flex bg-gray-100 p-1.5 rounded-xl w-fit">
        {['clientes', 'tecnicos', 'dispositivos'].map(tab => (
          <button key={tab} onClick={() => {
            setActiveSubTab(tab);
            setViewLevel('list');
            setSelectedClient(null);
            setSelectedBranch(null);
            setShowForm(false);
          }} className={`px-6 py-2 rounded-lg text-[9px] font-bold uppercase transition-all ${activeSubTab === tab ? 'bg-white text-[#D32F2F] shadow-sm' : 'text-gray-400'}`}>{tab}</button>
        ))}
      </div>

      <Breadcrumbs />

      <div className="space-y-6">
        {activeSubTab === 'clientes' && viewLevel === 'client-details' && selectedClient && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold uppercase text-gray-900">Información General</h3>
              <Button onClick={() => setViewLevel('branches-list')}>
                <Building2 size={16}/> Ver Sucursales
              </Button>
            </div>
            <Card className="p-0 overflow-hidden rounded-md border-none shadow-xl">
              <Table>
                  <THead>
                    <tr>
                      <Th>Campo</Th>
                      <Th>Información Registrada</Th>
                    </tr>
                  </THead>
                  <TBody>
                    <Tr>
                      <Td className="font-bold text-gray-400 uppercase text-[10px]">Razón Social</Td>
                      <Td className="font-bold text-lg text-[#D32F2F]">{selectedClient.nombre}</Td>
                    </Tr>
                    <Tr>
                      <Td className="font-bold text-gray-400 uppercase text-[10px]">NIT / RUT</Td>
                      <Td className="font-bold text-gray-700">{selectedClient.nit}</Td>
                    </Tr>
                    <Tr>
                      <Td className="font-bold text-gray-400 uppercase text-[10px]">Ubicación</Td>
                      <Td className="font-bold text-gray-700">{selectedClient.ciudad} — {selectedClient.direccion}</Td>
                    </Tr>
                    <Tr>
                      <Td className="font-bold text-gray-400 uppercase text-[10px]">Contacto</Td>
                      <Td className="font-bold text-gray-700">{selectedClient.telefono} — {selectedClient.email}</Td>
                    </Tr>
                  </TBody>
                </Table>
              </Card>
            </div>
          )}

          {activeSubTab === 'clientes' && viewLevel === 'branches-list' && selectedClient && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xl font-bold uppercase text-gray-900">Sucursales de {selectedClient.nombre}</h3>
              <Button onClick={() => { 
                setEditingItem(null); 
                setEditingType('sucursal'); 
                setIsViewMode(false); 
                setSucursales([{ 
                  id: Date.now(), 
                  nombre: '', 
                  ciudad: '', 
                  direccion: '', 
                  telefono: '', 
                  email: '',
                  contactos: [] 
                }]); 
                setShowForm(true); 
              }}>
                <Plus size={16}/> Nueva Sucursal
              </Button>
            </div>
            <Card className="p-0 overflow-hidden rounded-md border-none shadow-xl">
              <Table>
                  <THead>
                    <tr>
                      <Th>Nombre / Razón</Th>
                      <Th>Detalles Técnicos</Th>
                      <Th>Acción</Th>
                    </tr>
                  </THead>
                  <TBody>
                    {(selectedClient.sucursales || []).map((sucursal, idx) => (
                      <Tr key={idx}>
                        <Td>
                          <button 
                            onClick={() => { setSelectedBranch(sucursal); setViewLevel('branch-details'); }}
                            className="font-bold text-lg text-[#D32F2F] hover:underline text-left block leading-tight"
                          >
                            {sucursal.nombre}
                          </button>
                          <p className="text-[11px] text-gray-400 font-bold tracking-tight mt-1">{sucursal.id}</p>
                        </Td>
                        <Td>
                          <p className="text-base font-bold text-gray-700 leading-tight">{sucursal.ciudad} — {sucursal.direccion}</p>
                          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight mt-1">{(sucursal.contactos || []).length} Contactos Registrados</p>
                        </Td>
                        <Td>
                          <div className="flex gap-4">
                            <IconButton icon={Eye} className="text-gray-300 hover:text-[#D32F2F]" onClick={() => { handleView(sucursal, 'sucursal'); }} />
                            <IconButton icon={Edit2} className="text-gray-300 hover:text-[#D32F2F]" onClick={() => { handleEdit(sucursal, 'sucursal'); }} />
                            <IconButton icon={Trash2} className="text-gray-300 hover:text-red-500" onClick={() => removeSucursal(sucursal.id)} />
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              </Card>
            </div>
          )}

          {activeSubTab === 'clientes' && viewLevel === 'branch-details' && selectedBranch && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-xl font-bold uppercase text-gray-900">Contactos — {selectedBranch.nombre}</h3>
                <Button onClick={() => { 
                  setEditingItem(null);
                  setEditingType('contacto');
                  setEditingParentId(selectedBranch.id);
                  setShowForm(true);
                }}>
                  <Plus size={16}/> Nuevo Contacto
                </Button>
              </div>
              <Card className="p-0 overflow-hidden rounded-md border-none shadow-xl">
                <Table>
                    <THead>
                      <tr>
                        <Th>Nombre / Razón</Th>
                        <Th>Detalles Técnicos</Th>
                        <Th>Acción</Th>
                      </tr>
                    </THead>
                    <TBody>
                      {(selectedBranch.contactos || []).map((contacto, idx) => (
                        <Tr key={idx}>
                          <Td>
                            <p className="font-bold text-lg text-[#D32F2F] leading-tight">{contacto.nombre}</p>
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight mt-1">{contacto.cargo}</p>
                          </Td>
                          <Td>
                            <p className="text-base font-bold text-gray-700 leading-tight">{contacto.celular}</p>
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight mt-1">{contacto.email}</p>
                          </Td>
                          <Td>
                            <div className="flex gap-4">
                              <IconButton icon={Eye} className="text-gray-300 hover:text-[#D32F2F]" onClick={() => console.log('View Contacto', contacto)} />
                              <IconButton icon={Edit2} className="text-gray-300 hover:text-[#D32F2F]" onClick={() => handleEdit(contacto, 'contacto', selectedBranch.id)} />
                              <IconButton icon={Trash2} className="text-gray-300 hover:text-red-500" onClick={() => removeContacto(selectedBranch.id, contacto.id)} />
                            </div>
                          </Td>
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                </Card>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="text-xl font-bold uppercase text-gray-900">Dispositivos Vinculados</h3>
                  <Button variant="secondary">
                    <Plus size={16}/> Vincular Dispositivo
                  </Button>
                </div>
                <Card className="p-0 overflow-hidden rounded-md border-none shadow-xl">
                  <Table>
                    <THead>
                      <tr>
                        <Th>Nombre / Razón</Th>
                        <Th>Detalles Técnicos</Th>
                        <Th>Acción</Th>
                      </tr>
                    </THead>
                    <TBody>
                      {data.dispositivos.filter(d => (selectedBranch.dispositivos || []).includes(d.id)).map((device, idx) => (
                        <Tr key={idx}>
                          <Td>
                            <p className="font-bold text-lg text-[#D32F2F] leading-tight">{device.tipo}</p>
                            <p className="text-[11px] text-gray-400 font-bold tracking-tight mt-1">{device.codigoUnico}</p>
                          </Td>
                          <Td>
                            <p className="text-base font-bold text-gray-700 leading-tight">{device.marca} — {device.modelo}</p>
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight mt-1">Operativo</p>
                          </Td>
                          <Td>
                            <div className="flex gap-4">
                              <IconButton icon={Eye} className="text-gray-300 hover:text-[#D32F2F]" onClick={() => handleView(device, 'dispositivo')} />
                              <IconButton icon={Edit2} className="text-gray-300 hover:text-[#D32F2F]" onClick={() => handleEdit(device, 'dispositivo')} />
                              <IconButton icon={Trash2} className="text-gray-300 hover:text-red-500" onClick={() => {
                                const updatedClients = data.clientes.map(client => {
                                  if (client.id === selectedClient.id) {
                                    const updatedBranches = (client.sucursales || []).map(s => {
                                      if (s.id === selectedBranch.id) {
                                        return { ...s, dispositivos: (s.dispositivos || []).filter(id => id !== device.id) };
                                      }
                                      return s;
                                    });
                                    const updatedClient = { ...client, sucursales: updatedBranches };
                                    setSelectedClient(updatedClient);
                                    setSelectedBranch(updatedBranches.find(b => b.id === selectedBranch.id));
                                    return updatedClient;
                                  }
                                  return client;
                                });
                                setData({ ...data, clientes: updatedClients });
                              }} />
                            </div>
                          </Td>
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                </Card>
              </div>
            </div>
          )}

          {((activeSubTab !== 'clientes') || (activeSubTab === 'clientes' && viewLevel === 'list')) && (
            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-xl font-bold uppercase text-gray-900">Maestros de {activeSubTab}</h3>
                <Button onClick={() => { setEditingItem(null); setEditingType(activeSubTab.slice(0, -1)); setIsViewMode(false); setSucursales([]); setShowForm(true); }}>
                  <Plus size={16}/> Nuevo Registro
                </Button>
              </div>
              <Card className="p-0 overflow-hidden rounded-md border-none shadow-xl">
                <Table>
                  <THead>
                    <tr>
                      <Th>Nombre / Razón</Th>
                      <Th>Detalles Técnicos</Th>
                      <Th>Acción</Th>
                    </tr>
                  </THead>
                  <TBody>
                    {data[activeSubTab].map((item, idx) => (
                      <Tr key={idx}>
                        <Td>
                          {activeSubTab === 'clientes' ? (
                            <button 
                              onClick={() => { setSelectedClient(item); setViewLevel('client-details'); }}
                              className="font-bold text-lg text-[#D32F2F] hover:underline text-left block leading-tight"
                            >
                              {item.nombre}
                            </button>
                          ) : (
                            <p className="font-bold text-lg text-[#D32F2F] leading-tight">{item.nombre || item.tipo}</p>
                          )}
                          <p className="text-[11px] text-gray-400 font-bold tracking-tight mt-1">{item.nit || item.identificacion || item.serial || item.codigoUnico}</p>
                        </Td>
                        <Td>
                          <p className="text-base font-bold text-gray-700 leading-tight">
                            {item.ciudad || item.marca} — {activeSubTab === 'clientes' ? `${(item.sucursales || []).length} Sucursales` : (item.sucursal || item.linea || item.zona)}
                          </p>
                          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight mt-1">{item.email || item.correo || item.proveedor || 'SIN EMAIL REGISTRADO'}</p>
                        </Td>
                        <Td>
                          <div className="flex gap-4">
                            <IconButton icon={Eye} className="text-gray-300 hover:text-[#D32F2F]" onClick={() => handleView(item, activeSubTab.slice(0, -1))} />
                            <IconButton icon={Edit2} className="text-gray-300 hover:text-[#D32F2F]" onClick={() => handleEdit(item, activeSubTab.slice(0, -1))} />
                            <IconButton icon={Trash2} className="text-gray-300 hover:text-red-500" onClick={() => {
                              if (window.confirm('¿Está seguro de eliminar este registro?')) {
                                setData({ ...data, [activeSubTab]: data[activeSubTab].filter(i => i.id !== item.id) });
                              }
                            }} />
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              </Card>
            </div>
          )}
        </div>

      <Modal 
        isOpen={showForm} 
        onClose={handleCloseForm}
        title={`${isViewMode ? 'Ver' : editingItem ? 'Editar' : 'Configurar'} ${editingType || activeSubTab.slice(0, -1)}`}
      >
        <form onSubmit={handleSubmit} className="space-y-6 relative">
                {success && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-[2.5rem] animate-in fade-in duration-300">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
                        <CheckCircle2 size={48} />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-gray-900">¡Éxito!</h4>
                        <p className="text-gray-500 font-medium">La información ha sido guardada correctamente</p>
                      </div>
                    </div>
                  </div>
                )}
                <fieldset disabled={isViewMode} className="space-y-6">
                  {editingType === 'contacto' && (
                    <ContactoForm editingItem={editingItem} isViewMode={isViewMode} />
                  )}
                  {editingType === 'sucursal' && (
                    <SucursalForm 
                      sucursales={sucursales} 
                      isViewMode={isViewMode} 
                      handleSucursalChange={handleSucursalChange} 
                    />
                  )}
                  {editingType !== 'sucursal' && activeSubTab === 'clientes' && editingType !== 'contacto' && editingType !== 'dispositivo' && (
                    <ClienteForm editingItem={editingItem} isViewMode={isViewMode} />
                  )}
                  {activeSubTab === 'tecnicos' && (
                    <TecnicoForm 
                      editingItem={editingItem} 
                      isViewMode={isViewMode} 
                      attachedFiles={attachedFiles} 
                      setAttachedFiles={setAttachedFiles} 
                    />
                  )}
                  {activeSubTab === 'dispositivos' && (
                    <DispositivoForm 
                      editingItem={editingItem} 
                      isViewMode={isViewMode} 
                      maintenanceSteps={maintenanceSteps} 
                      setMaintenanceSteps={setMaintenanceSteps} 
                      currentStepText={currentStepText} 
                      setCurrentStepText={setCurrentStepText} 
                      addStep={addStep} 
                    />
                  )}
                </fieldset>
                {!isViewMode && (
                   <div className="flex justify-end pt-4">
                     <Button type="submit">
                       <Save size={18} /> Guardar Cambios
                     </Button>
                   </div>
                 )}
              </form>
      </Modal>
    </div>
    );
  };

export default ConfigurationPage;