import React, { useState, useEffect } from 'react';
import { Users, Building2, MapPin, User, Monitor, Phone, CheckCircle2, Search, Layers, Tag } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { TextSmall, H3 } from '../ui/Typography';
import Breadcrumbs from './Breadcrumbs';

import { useConfigurationContext } from '../../context/ConfigurationContext';
import { useMasterData } from '../../context/MasterDataContext';

// Sub-navigators
import ClientNavigator from './navigators/ClientNavigator';
import ContactNavigator from './navigators/ContactNavigator';
import DeviceNavigator from './navigators/DeviceNavigator';
import BranchNavigator from './navigators/BranchNavigator';
import TechnicalNavigator from './navigators/TechnicalNavigator';
import CatalogNavigator from './navigators/CatalogNavigator';

const compareIds = (id1, id2) => String(id1 || '').trim().toUpperCase() === String(id2 || '').trim().toUpperCase();

/** Breadcrumb de navegación — declarado fuera del componente para evitar re-creación en cada render. */
const NavigatorBreadcrumbs = ({ route, stack, data, setStack, onClose }) => {
  const items = [];
  const rootLabel =
    route?.type === 'dispositivo' ? 'Dispositivos'
    : route?.type === 'contact' ? 'Contactos'
    : 'Clientes';
  const rootIcon =
    route?.type === 'dispositivo' ? Monitor
    : route?.type === 'contact' ? Phone
    : Users;

  items.push({ label: rootLabel, icon: rootIcon, isActive: false, onClick: onClose });

  stack.forEach((r, idx) => {
    const isLast = idx === stack.length - 1;
    const leafId = r.type === 'cliente' ? r.clientId : (r.type === 'branch' ? r.branchId : (r.type === 'contact' ? r.contactId : r.deviceId));
    const isNew = String(leafId || '').startsWith('new-') || String(leafId || '').startsWith('NEW-');

    if (r.type === 'cliente') {
      const c = (data?.clientes || []).find(cl => compareIds(cl.id, r.clientId));
      items.push({ label: isNew ? 'Nuevo Cliente' : (c?.nombre || 'Cliente'), icon: Users, isActive: isLast && r.activeTab === 'details', onClick: () => setStack(p => p.slice(0, idx + 1).map((s, i) => i === idx ? { ...s, activeTab: 'details' } : s)) });
    } else if (r.type === 'branch') {
      const cl = (data?.clientes || []).find(cl => compareIds(cl.id, r.clientId));
      const b = (cl?.sucursales || []).find(br => compareIds(br.id, r.branchId));
      items.push({ label: isNew ? 'Nueva Sucursal' : (b?.nombre || 'Sucursal'), icon: MapPin, isActive: isLast && r.activeTab === 'details', onClick: () => setStack(p => p.slice(0, idx + 1).map((s, i) => i === idx ? { ...s, activeTab: 'details' } : s)) });
    } else if (r.type === 'contact') {
      const cl = (data?.clientes || []).find(cl => compareIds(cl.id, r.clientId));
      const b = (cl?.sucursales || []).find(br => compareIds(br.id, r.branchId));
      const ct = (b?.contactos || []).find(cnt => compareIds(cnt.id, r.contactId));
      items.push({ label: isNew ? 'Nuevo Contacto' : (ct?.nombre || 'Contacto'), icon: User, isActive: isLast && r.activeTab === 'details', onClick: () => setStack(p => p.slice(0, idx + 1).map((s, i) => i === idx ? { ...s, activeTab: 'details' } : s)) });
    } else if (r.type === 'dispositivo') {
      const d = (data?.dispositivos || []).find(dev => compareIds(dev.id, r.deviceId));
      items.push({ label: isNew ? 'Nuevo Dispositivo' : (d?.nombre || 'Dispositivo'), icon: Monitor, isActive: isLast && r.activeTab === 'details', onClick: () => setStack(p => p.slice(0, idx + 1).map((s, i) => i === idx ? { ...s, activeTab: 'details' } : s)) });
    } else if (r.type === 'categoria') {
      items.push({ label: isNew ? 'Nueva Categoría' : 'Categoría', icon: Layers, isActive: isLast, onClick: () => {} });
    } else if (r.type === 'marca') {
      items.push({ label: isNew ? 'Nueva Marca' : 'Marca', icon: Tag, isActive: isLast, onClick: () => {} });
    } else if (r.type === 'proveedor') {
      items.push({ label: isNew ? 'Nuevo Proveedor' : 'Proveedor', icon: Building2, isActive: isLast, onClick: () => {} });
    }
  });

  return <div className="mb-4 flex items-center"><Breadcrumbs items={items} /></div>;
};

const ConfigurationNavigator = ({ onClose }) => {
  const {
    route, stack, setStack, updateDraft,
    showSuccessModal, branchSuccessInfo, savedClientId,
    contactSuccessInfo, deviceSuccessInfo,
    stopEditingBranch, startCreatingBranch, stopCreatingBranch,
    closeClientSuccess, closeBranchSuccess, closeContactSuccess, closeDeviceSuccess,
  } = useConfigurationContext();

  const { data } = useMasterData();

  // Association modals
  const [associateContactsModal, setAssociateContactsModal] = useState(null);
  const [associateContactsSearch, setAssociateContactsSearch] = useState('');
  const [associateContactsSelected, setAssociateContactsSelected] = useState([]);
  const [associateDevicesModal, setAssociateDevicesModal] = useState(null);
  const [associateDevicesSearch, setAssociateDevicesSearch] = useState('');
  const [associateDevicesSelected, setAssociateDevicesSelected] = useState([]);
  const [associateDirectorsModal, setAssociateDirectorsModal] = useState(null);
  const [associateDirectorsSearch, setAssociateDirectorsSearch] = useState('');
  const [associateDirectorsSelected, setAssociateDirectorsSelected] = useState([]);
  const [associateSuccess, setAssociateSuccess] = useState(false);

  useEffect(() => {
    if (associateSuccess) {
      const timer = setTimeout(() => setAssociateSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [associateSuccess]);

  const handleClose = () => {
    setStack([]);
    onClose();
  };

  // Handlers for Contact Success Modal
  const handleContactStayView = () => {
    setStack(prev => prev.map((s, idx) =>
      idx === prev.length - 1 ? { ...s, mode: 'view' } : s
    ));
    closeContactSuccess();
  };
  const handleContactBackToList = () => {
    closeContactSuccess();
    handleClose();
  };

  // Handlers for Device Success Modal
  const handleDeviceStayView = () => {
    setStack(prev => prev.map((s, idx) =>
      idx === prev.length - 1 ? { ...s, mode: 'view' } : s
    ));
    closeDeviceSuccess();
  };
  const handleDeviceBackToList = () => {
    closeDeviceSuccess();
    handleClose();
  };

  // Handlers for Client Success Modal
  const handleGoToClients = () => { closeClientSuccess(); handleClose(); };
  const handleGoToStep2 = () => {
    closeClientSuccess();
    if (savedClientId) {
      stopEditingBranch();
      startCreatingBranch();
      setStack(prev => prev.map((s, idx) => {
        if (idx === prev.length - 1 && s.type === 'cliente' && String(s.clientId) === String(savedClientId)) {
          return { ...s, activeTab: 'branches', mode: 'edit' };
        }
        return s;
      }));
    }
  };

  const handleBranchBackToBranches = () => {
    if (branchSuccessInfo) {
      stopCreatingBranch();
      stopEditingBranch();
      closeBranchSuccess();
    }
  };

  const handleBranchGoToStep3Contact = () => {
    if (!branchSuccessInfo) return;
    const { clientId, branchId } = branchSuccessInfo;
    closeBranchSuccess();
    const newId = `NEW-CON-${Date.now()}`;
    setStack(p => [...p, { type: 'contact', clientId, branchId, contactId: newId, mode: 'edit' }]);
  };

  if (!route) return null;

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 -mt-4">
        <NavigatorBreadcrumbs route={route} stack={stack} data={data} setStack={setStack} onClose={handleClose} />
        
        {route?.type === 'cliente' && (
          <ClientNavigator
            setAssociateContactsModal={setAssociateContactsModal}
            setAssociateContactsSelected={setAssociateContactsSelected}
            setAssociateContactsSearch={setAssociateContactsSearch}
            setAssociateDevicesModal={setAssociateDevicesModal}
            setAssociateDevicesSelected={setAssociateDevicesSelected}
            setAssociateDevicesSearch={setAssociateDevicesSearch}
            setAssociateDirectorsModal={setAssociateDirectorsModal}
            setAssociateDirectorsSelected={setAssociateDirectorsSelected}
            setAssociateDirectorsSearch={setAssociateDirectorsSearch}
          />
        )}
        
        {route?.type === 'contact' && <ContactNavigator />}
        {route?.type === 'dispositivo' && <DeviceNavigator />}
        {route?.type === 'tecnico' && <TechnicalNavigator />}
        {route?.type === 'branch' && (
          <BranchNavigator
            setAssociateContactsModal={setAssociateContactsModal}
            setAssociateContactsSelected={setAssociateContactsSelected}
            setAssociateContactsSearch={setAssociateContactsSearch}
            setAssociateDevicesModal={setAssociateDevicesModal}
            setAssociateDevicesSelected={setAssociateDevicesSelected}
            setAssociateDevicesSearch={setAssociateDevicesSearch}
          />
        )}

        {(route?.type === 'categoria' || route?.type === 'marca' || route?.type === 'proveedor') && (
          <CatalogNavigator onClose={onClose} />
        )}
      </div>

      {/* Success Modal - Cliente */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 text-green-600 mb-4">
              <CheckCircle2 size={32} />
              <H3 className="normal-case text-gray-900">Guardado exitoso</H3>
            </div>
            <TextSmall className="text-gray-600 mb-6 leading-relaxed">
              El cliente se ha guardado correctamente. ¿Qué deseas hacer ahora?
            </TextSmall>
            <div className="flex flex-col gap-3">
              <Button onClick={handleGoToStep2} variant="success" className="w-full">Ir a Sucursales</Button>
              <Button onClick={handleGoToClients} variant="outline" className="w-full">Volver a Clientes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal - Sucursal */}
      {branchSuccessInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 text-green-600 mb-4">
              <CheckCircle2 size={32} />
              <H3 className="normal-case text-gray-900">Sucursal guardada</H3>
            </div>
            <TextSmall className="text-gray-600 mb-6 leading-relaxed">La sucursal se ha guardado correctamente. ¿Qué deseas hacer ahora?</TextSmall>
            <div className="flex flex-col gap-3">
              <Button onClick={handleBranchGoToStep3Contact} variant="success" className="w-full">Paso 3 Crear Contacto</Button>
              <Button onClick={handleBranchBackToBranches} variant="outline" className="w-full">Volver a Sucursales</Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal - Contacto */}
      {contactSuccessInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 text-green-600 mb-4">
              <CheckCircle2 size={32} />
              <H3 className="normal-case text-gray-900">
                {contactSuccessInfo.isNew ? 'Contacto creado' : 'Contacto actualizado'}
              </H3>
            </div>
            <TextSmall className="text-gray-600 mb-6 leading-relaxed">
              {contactSuccessInfo.isNew
                ? 'El contacto se ha creado correctamente. ¿Qué deseas hacer ahora?'
                : 'Los cambios del contacto se guardaron correctamente. ¿Qué deseas hacer ahora?'}
            </TextSmall>
            <div className="flex flex-col gap-3">
              <Button onClick={handleContactStayView} variant="success" className="w-full">Ver Contacto</Button>
              <Button onClick={handleContactBackToList} variant="outline" className="w-full">Volver a Contactos</Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal - Dispositivo */}
      {deviceSuccessInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 text-green-600 mb-4">
              <CheckCircle2 size={32} />
              <H3 className="normal-case text-gray-900">
                {deviceSuccessInfo.isNew ? 'Dispositivo creado' : 'Dispositivo actualizado'}
              </H3>
            </div>
            <TextSmall className="text-gray-600 mb-6 leading-relaxed">
              {deviceSuccessInfo.isNew
                ? 'El dispositivo se ha creado correctamente. ¿Qué deseas hacer ahora?'
                : 'Los cambios del dispositivo se guardaron correctamente. ¿Qué deseas hacer ahora?'}
            </TextSmall>
            <div className="flex flex-col gap-3">
              <Button onClick={handleDeviceStayView} variant="success" className="w-full">Ver Dispositivo</Button>
              <Button onClick={handleDeviceBackToList} variant="outline" className="w-full">Volver a Dispositivos</Button>
            </div>
          </div>
        </div>
      )}

      {/* Associate Modals (Mini versions) */}
      {associateContactsModal && (() => {
        // Usar todos los contactos disponibles en master data
        const todosContactos = data?.contactos || [];
        const q = associateContactsSearch.toLowerCase();
        const filtered = todosContactos.filter(ct =>
          !q || (ct.nombres || ct.nombre || '').toLowerCase().includes(q) ||
          (ct.apellidos || ct.apellido || '').toLowerCase().includes(q) ||
          (ct.email || '').toLowerCase().includes(q)
        );
        return (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <Card className="max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-50 rounded-lg"><Users size={20} className="text-[#D32F2F]" /></div>
                <H3 className="normal-case">Asociar Contactos</H3>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D32F2F] text-sm"
                    placeholder="Buscar contacto por nombre o email..."
                    value={associateContactsSearch}
                    onChange={(e) => setAssociateContactsSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
                  {filtered.length === 0 && (
                    <div className="text-center py-8">
                      <Users size={32} className="mx-auto text-gray-300 mb-2" />
                      <TextSmall className="text-gray-400">No hay contactos disponibles</TextSmall>
                    </div>
                  )}
                  {filtered.map(ct => {
                    const isSelected = associateContactsSelected.includes(String(ct.id));
                    const nombre = [ct.nombres || ct.nombre, ct.apellidos || ct.apellido].filter(Boolean).join(' ') || ct.email || 'Contacto';
                    return (
                      <div
                        key={ct.id}
                        onClick={() => setAssociateContactsSelected(prev =>
                          prev.includes(String(ct.id)) ? prev.filter(id => id !== String(ct.id)) : [...prev, String(ct.id)]
                        )}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected ? 'border-[#D32F2F] bg-red-50' : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-[#D32F2F] text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {(nombre[0] || 'C').toUpperCase()}
                          </div>
                          <div>
                            <TextSmall className="font-bold text-gray-900">{nombre}</TextSmall>
                            {ct.email && <TextSmall className="text-gray-500 text-[10px]">{ct.email}</TextSmall>}
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={18} className="text-[#D32F2F]" />}
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button onClick={() => {
                    updateDraft(associateContactsModal.branchKey, { associatedContactIds: associateContactsSelected });
                    setAssociateContactsModal(null);
                    setAssociateSuccess(true);
                  }} className="w-full bg-[#1A1A1A] hover:bg-[#D32F2F] text-white">
                    Confirmar
                  </Button>
                  <Button onClick={() => setAssociateContactsModal(null)} variant="ghost" className="w-full">Cancelar</Button>
                </div>
              </div>
            </Card>
          </div>
        );
      })()}

      {associateDevicesModal && (() => {
        const clienteId = associateDevicesModal.clientId;
        const currentBranchId = associateDevicesModal.branchId;
        const dispositivos = (data?.dispositivos || []).filter(d => {
          if (clienteId && String(d.clientId || d.cliente_id) !== String(clienteId)) return false;
          // Excluir dispositivos ya asignados a OTRA sucursal (no la actual)
          const dBranchId = d.branchId || d.sucursal_id;
          if (dBranchId && currentBranchId && String(dBranchId) !== String(currentBranchId)) return false;
          return true;
        });
        const q = associateDevicesSearch.toLowerCase();
        const filtered = dispositivos.filter(d =>
          !q || (d.descripcion || '').toLowerCase().includes(q) ||
          (d.serial || '').toLowerCase().includes(q) ||
          (d.idInmotika || d.id_inmotika || '').toLowerCase().includes(q)
        );
        return (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <Card className="max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-50 rounded-lg"><Monitor size={20} className="text-[#D32F2F]" /></div>
                <H3 className="normal-case">Asociar Dispositivos</H3>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D32F2F] text-sm"
                    placeholder="Buscar dispositivo por descripción o serial..."
                    value={associateDevicesSearch}
                    onChange={(e) => setAssociateDevicesSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
                  {filtered.length === 0 && (
                    <div className="text-center py-8">
                      <Monitor size={32} className="mx-auto text-gray-300 mb-2" />
                      <TextSmall className="text-gray-400">No hay dispositivos disponibles</TextSmall>
                    </div>
                  )}
                  {filtered.map(d => {
                    const isSelected = associateDevicesSelected.includes(String(d.id));
                    const label = d.descripcion || d.serial || d.idInmotika || 'Dispositivo';
                    return (
                      <div
                        key={d.id}
                        onClick={() => setAssociateDevicesSelected(prev =>
                          prev.includes(String(d.id)) ? prev.filter(id => id !== String(d.id)) : [...prev, String(d.id)]
                        )}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected ? 'border-[#D32F2F] bg-red-50' : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-[#D32F2F] text-white' : 'bg-gray-200 text-gray-500'}`}>
                            <Monitor size={14} />
                          </div>
                          <div>
                            <TextSmall className="font-bold text-gray-900">{label}</TextSmall>
                            {d.serial && <TextSmall className="text-gray-500 text-[10px]">Serial: {d.serial}</TextSmall>}
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={18} className="text-[#D32F2F]" />}
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button onClick={() => {
                    updateDraft(associateDevicesModal.branchKey, { associatedDeviceIds: associateDevicesSelected });
                    setAssociateDevicesModal(null);
                    setAssociateSuccess(true);
                  }} className="w-full bg-[#1A1A1A] hover:bg-[#D32F2F] text-white">
                    Confirmar
                  </Button>
                  <Button onClick={() => setAssociateDevicesModal(null)} variant="ghost" className="w-full">Cancelar</Button>
                </div>
              </div>
            </Card>
          </div>
        );
      })()}
      {associateDirectorsModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <Card className="max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 rounded-lg">
                <Users size={20} className="text-[#D32F2F]" />
              </div>
              <H3 className="normal-case">Asociar Directores</H3>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D32F2F] text-sm" 
                  placeholder="Buscar director por nombre..." 
                  value={associateDirectorsSearch}
                  onChange={(e) => setAssociateDirectorsSearch(e.target.value)}
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {associateDirectorsModal.allDirectors
                  .filter(d => 
                    !associateDirectorsSearch || 
                    (d.nombreCompleto || '').toLowerCase().includes(associateDirectorsSearch.toLowerCase())
                  )
                  .map(dir => {
                    const isSelected = associateDirectorsSelected.includes(dir.id);
                    return (
                      <div 
                        key={dir.id}
                        onClick={() => {
                          setAssociateDirectorsSelected(prev => 
                            prev.includes(dir.id) ? prev.filter(id => id !== dir.id) : [...prev, dir.id]
                          );
                        }}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected ? 'border-[#D32F2F] bg-red-50' : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isSelected ? 'bg-[#D32F2F] text-white' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {(dir.nombres?.[0] || 'D').toUpperCase()}
                          </div>
                          <div>
                            <TextSmall className="font-bold text-gray-900">{dir.nombres} {dir.apellidos}</TextSmall>
                            <TextSmall className="text-gray-500 text-[10px] break-all font-medium">{dir.email}</TextSmall>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={18} className="text-[#D32F2F]" />}
                      </div>
                    );
                  })}
                {associateDirectorsModal.allDirectors.length === 0 && (
                  <div className="text-center py-8">
                    <Users size={32} className="mx-auto text-gray-300 mb-2" />
                    <TextSmall className="text-gray-400">No hay directores disponibles</TextSmall>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button 
                  onClick={() => {
                    updateDraft(associateDirectorsModal.key, { associatedDirectorIds: associateDirectorsSelected });
                    setAssociateDirectorsModal(null);
                  }} 
                  variant="success" 
                  className="w-full bg-[#1A1A1A] hover:bg-[#D32F2F]"
                >
                  Confirmar
                </Button>
                <Button 
                  onClick={() => setAssociateDirectorsModal(null)} 
                  variant="ghost" 
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default ConfigurationNavigator;
