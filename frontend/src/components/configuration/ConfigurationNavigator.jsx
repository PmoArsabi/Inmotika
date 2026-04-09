import React, { useState, useEffect } from 'react';
import { Users, Building2, MapPin, User, Monitor, Phone, CheckCircle2, Layers, Tag } from 'lucide-react';
import Button from '../ui/Button';
import { H3, TextSmall } from '../ui/Typography';
import Breadcrumbs from './Breadcrumbs';
import AssociationModals from './AssociationModals';

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
  const [associateDevicesCatFilter, setAssociateDevicesCatFilter] = useState([]);
  const [associateDirectorsModal, setAssociateDirectorsModal] = useState(null);
  const [associateDirectorsSearch, setAssociateDirectorsSearch] = useState('');
  const [associateDirectorsSelected, setAssociateDirectorsSelected] = useState([]);
  // Client-level contacts & devices modals
  const [clientContactsModal, setClientContactsModal] = useState(null);
  const [clientContactsSearch, setClientContactsSearch] = useState('');
  const [clientContactsSedeFilter, setClientContactsSedeFilter] = useState([]);
  const [clientDevicesModal, setClientDevicesModal] = useState(null);
  const [clientDevicesSearch, setClientDevicesSearch] = useState('');
  const [clientDevicesCatFilter, setClientDevicesCatFilter] = useState([]);
  const [clientDevicesSedeFilter, setClientDevicesSedeFilter] = useState([]);

  const [associateSuccess, setAssociateSuccess] = useState(false);

  useEffect(() => {
    if (associateSuccess) {
      const timer = setTimeout(() => setAssociateSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [associateSuccess]);

  // --- Association modal handlers ---

  /** Confirma asociación de contactos a una sucursal y cierra el modal. */
  const handleConfirmContacts = (branchKey, selected) => {
    updateDraft(branchKey, { associatedContactIds: selected });
    setAssociateContactsModal(null);
    setAssociateSuccess(true);
  };

  /** Cierra el modal de asociar contactos sin confirmar. */
  const handleCloseContactsModal = () => setAssociateContactsModal(null);

  /** Confirma asociación de dispositivos a una sucursal y cierra el modal. */
  const handleConfirmDevices = (branchKey, selected) => {
    updateDraft(branchKey, { associatedDeviceIds: selected });
    setAssociateDevicesModal(null);
    setAssociateSuccess(true);
    setAssociateDevicesCatFilter([]);
  };

  /** Cierra el modal de asociar dispositivos sin confirmar. */
  const handleCloseDevicesModal = () => {
    setAssociateDevicesModal(null);
    setAssociateDevicesCatFilter([]);
  };

  /** Confirma asociación de directores a un cliente y cierra el modal. */
  const handleConfirmDirectors = (key, selected) => {
    updateDraft(key, { associatedDirectorIds: selected });
    setAssociateDirectorsModal(null);
  };

  /** Cierra el modal de asociar directores sin confirmar. */
  const handleCloseDirectorsModal = () => setAssociateDirectorsModal(null);

  /** Cierra el modal de contactos del cliente y limpia filtros. */
  const handleCloseClientContactsModal = () => {
    setClientContactsModal(null);
    setClientContactsSearch('');
    setClientContactsSedeFilter([]);
  };

  /** Abre formulario de nuevo contacto desde el modal de contactos del cliente. */
  const handleCreateContact = (clientId) => {
    setStack(prev => [...prev, { type: 'contact', clientId, branchId: null, contactId: `NEW-CON-${Date.now()}`, mode: 'edit' }]);
    setClientContactsModal(null);
  };

  /** Cierra el modal de dispositivos del cliente y limpia filtros. */
  const handleCloseClientDevicesModal = () => {
    setClientDevicesModal(null);
    setClientDevicesSearch('');
    setClientDevicesCatFilter([]);
    setClientDevicesSedeFilter([]);
  };

  /** Abre formulario de nuevo dispositivo desde el modal de dispositivos del cliente. */
  const handleCreateDevice = (clientId) => {
    setStack(prev => [...prev, { type: 'dispositivo', deviceId: `new-${Date.now()}`, mode: 'edit', clientId }]);
    setClientDevicesModal(null);
  };

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
            setClientContactsModal={setClientContactsModal}
            setClientDevicesModal={setClientDevicesModal}
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

      <AssociationModals
        associateContactsModal={associateContactsModal}
        associateContactsSearch={associateContactsSearch}
        setAssociateContactsSearch={setAssociateContactsSearch}
        associateContactsSelected={associateContactsSelected}
        setAssociateContactsSelected={setAssociateContactsSelected}
        onConfirmContacts={handleConfirmContacts}
        onCloseContactsModal={handleCloseContactsModal}
        associateDevicesModal={associateDevicesModal}
        associateDevicesSearch={associateDevicesSearch}
        setAssociateDevicesSearch={setAssociateDevicesSearch}
        associateDevicesSelected={associateDevicesSelected}
        setAssociateDevicesSelected={setAssociateDevicesSelected}
        associateDevicesCatFilter={associateDevicesCatFilter}
        setAssociateDevicesCatFilter={setAssociateDevicesCatFilter}
        onConfirmDevices={handleConfirmDevices}
        onCloseDevicesModal={handleCloseDevicesModal}
        associateDirectorsModal={associateDirectorsModal}
        associateDirectorsSearch={associateDirectorsSearch}
        setAssociateDirectorsSearch={setAssociateDirectorsSearch}
        associateDirectorsSelected={associateDirectorsSelected}
        setAssociateDirectorsSelected={setAssociateDirectorsSelected}
        onConfirmDirectors={handleConfirmDirectors}
        onCloseDirectorsModal={handleCloseDirectorsModal}
        clientContactsModal={clientContactsModal}
        clientContactsSearch={clientContactsSearch}
        setClientContactsSearch={setClientContactsSearch}
        clientContactsSedeFilter={clientContactsSedeFilter}
        setClientContactsSedeFilter={setClientContactsSedeFilter}
        onCloseClientContactsModal={handleCloseClientContactsModal}
        onCreateContact={handleCreateContact}
        clientDevicesModal={clientDevicesModal}
        clientDevicesSearch={clientDevicesSearch}
        setClientDevicesSearch={setClientDevicesSearch}
        clientDevicesCatFilter={clientDevicesCatFilter}
        setClientDevicesCatFilter={setClientDevicesCatFilter}
        clientDevicesSedeFilter={clientDevicesSedeFilter}
        setClientDevicesSedeFilter={setClientDevicesSedeFilter}
        onCloseClientDevicesModal={handleCloseClientDevicesModal}
        onCreateDevice={handleCreateDevice}
        data={data}
        associateSuccess={associateSuccess}
      />
    </>
  );
};

export default ConfigurationNavigator;
