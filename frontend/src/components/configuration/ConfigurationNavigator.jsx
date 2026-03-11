import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, Hash, Map, MapPin, Phone, Mail, User, Briefcase, 
  ChevronLeft, ChevronRight, Home, Users, Edit2, Eye, Plus, Save, Trash2, Calendar, Lock,
  FileText, CheckCircle2, AlertCircle, X, Navigation2, Monitor,
  Activity, ClipboardList, Timer, ChevronUp, ChevronDown, ArrowRightLeft
} from 'lucide-react';
import { Country, State, City } from 'country-state-city';

import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import Input from '../ui/Input';
import Select from '../ui/Select';
import SearchableSelect from '../ui/SearchableSelect';
import NitInput from '../ui/NitInput';
import Switch from '../ui/Switch';
import { Table, THead, TBody, Tr, Th, Td } from '../ui/Table';
import { H2, H3, Subtitle, TextSmall, Label } from '../ui/Typography';
import FileUploader from '../ui/FileUploader';
import LoadingInline from './LoadingInline';
import { useLocationData } from '../../hooks/useLocationData';
import Breadcrumbs from './Breadcrumbs';
import Tabs from '../ui/Tabs';

import ClientForm, { BranchSubForm } from './Client/ClientForm';
import ContactForm from '../Contact/ContactForm';
import DeviceForm from '../Device/DeviceForm';
import TechnicianForm from '../forms/TechnicianForm';

import { 
  emptyClientDraft, emptyBranchDraft, emptyContactDraft, emptyDeviceDraft, emptyTecnicoDraft,
  toClientDraft, toBranchDraft, toContactDraft, toDeviceDraft,
  applyClientUpdate, applyBranchUpsert, applyContactUpsert, applyDeviceUpsert, applyTecnicoUpsert, applyContactDelete
} from '../../utils/entityMappers';
import { 
  validateClient, validateBranch, validateContact, validateDevice, validateTecnico 
} from '../../utils/validators';

// --- STYLING HELPERS ---
const ALL_COUNTRIES_LIST = Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name }));
const formatCountryOption = (option) => (
  <div className="flex items-center gap-2">
    <img src={`https://flagcdn.com/w20/${option.value.toLowerCase()}.png`} alt={option.label} className="w-5 h-3.5 object-cover rounded-sm" />
    <span>{option.label}</span>
  </div>
);

const FlagImg = ({ iso }) => (
  <img src={`https://flagcdn.com/w20/${iso.toLowerCase()}.png`} alt={iso} className="w-5 h-3.5 object-cover rounded-sm inline mr-2" />
);

const ViewCell = ({ label, children, icon: Icon }) => (
  <div className="space-y-1">
    <Label className="text-gray-400 ml-1 uppercase text-[10px] tracking-wider">{label}</Label>
    <div className="flex items-center gap-2 h-10 px-3 bg-gray-50/50 rounded-md border border-gray-100">
      {Icon && <Icon size={14} className="text-gray-400 shrink-0" />}
      <TextSmall className="text-gray-900 font-semibold truncate">
        {children || <span className="text-gray-300 italic font-normal">No especificado</span>}
      </TextSmall>
    </div>
  </div>
);


const SectionHeaderTitle = ({ title, subtitle }) => (
  <div className="mb-6">
    <H3 className="text-gray-900 normal-case mb-1">{title}</H3>
    {subtitle && <Subtitle className="text-gray-400 font-normal">{subtitle}</Subtitle>}
  </div>
);

const Pager = ({ page, pageCount, onChange }) => (
  <div className="flex items-center justify-between py-4 px-2">
    <TextSmall className="text-gray-400">Página {page} de {pageCount}</TextSmall>
    <div className="flex gap-2">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </Button>
      <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>
        Siguiente
      </Button>
    </div>
  </div>
);

const ConfirmDialog = ({ isOpen, message, onCancel, onConfirm, isLoading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertCircle size={24} />
          <H3 className="normal-case">Confirmar eliminación</H3>
        </div>
        <TextSmall className="text-gray-600 mb-8 leading-relaxed">{message}</TextSmall>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={onConfirm} isLoading={isLoading}>Eliminar</Button>
        </div>
      </div>
    </div>
  );
};

const LocationPickerRows = ({
  countryValue, stateValue, cityValue, direccion,
  onLocationChange, onDireccionChange,
  viewMode, direccionError, required
}) => {
  const { states, cities, handleCountryChange, handleStateChange, handleCityChange } = useLocationData({
    countryValue, stateValue, onLocationChange
  });
  const countryData = Country.getCountryByCode(countryValue);
  const stateData   = State.getStateByCodeAndCountry(stateValue, countryValue);

  if (viewMode) {
    return (
      <>
        <ViewCell label="País">
          {countryData && (<><FlagImg iso={countryData.isoCode} /> {countryData.name}</>)}
        </ViewCell>
        <ViewCell label="Estado / Depto" icon={Map}>
          {stateData?.name}
        </ViewCell>
        <ViewCell label="Ciudad" icon={MapPin}>
          {cityValue}
        </ViewCell>
        <ViewCell label="Dirección Física" icon={MapPin}>
          {direccion}
        </ViewCell>
      </>
    );
  }

  return (
    <>
      <SearchableSelect
        label="País"
        options={ALL_COUNTRIES_LIST}
        value={countryValue}
        onChange={handleCountryChange}
        placeholder="Buscar país..."
        formatOptionLabel={formatCountryOption}
        required={required}
      />
      <SearchableSelect
        label="Estado / Depto"
        icon={Map}
        options={states}
        value={stateValue}
        onChange={handleStateChange}
        isDisabled={!countryValue}
        placeholder={countryValue ? 'Buscar estado...' : 'Primero elige un país'}
        required={required}
      />
      <SearchableSelect
        label="Ciudad"
        icon={MapPin}
        options={cities}
        value={cityValue}
        onChange={handleCityChange}
        isDisabled={!stateValue}
        placeholder={stateValue ? 'Buscar ciudad...' : 'Primero elige un estado'}
        required={required}
      />
      <Input
        label="Dirección Física"
        icon={MapPin}
        value={direccion}
        onChange={(e) => onDireccionChange(e.target.value)}
        error={direccionError}
        required={required}
      />
    </>
  );
};

// --- CORE COMPONENT ---
const storageKey = 'inmotika.configNavigatorDrafts.v1';
const loadDraftsFromStorage = () => {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};
const saveDraftsToStorage = (dr) => { try { localStorage.setItem(storageKey, JSON.stringify(dr)); } catch {} };

const ConfigurationNavigator = ({ openParams, data, setData, onClose }) => {
  const [stack, setStack] = useState([]);
  const [drafts, setDrafts] = useState(() => loadDraftsFromStorage());
  const [showErrors, setShowErrors] = useState(false);
  const [saveState, setSaveState] = useState({ isSaving: false, savedAt: null });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedClientId, setSavedClientId] = useState(null);
  const [branchSuccessInfo, setBranchSuccessInfo] = useState(null); // { clientId, branchId }
  const [editingBranchId, setEditingBranchId] = useState(null); // ID de la sucursal que se está editando
  const [creatingNewBranch, setCreatingNewBranch] = useState(false); // Indica si se está creando una nueva sucursal
  const [associateContactsModal, setAssociateContactsModal] = useState(null); // { branchKey, clientId }
  const [associateContactsSearch, setAssociateContactsSearch] = useState('');
  const [associateContactsSelected, setAssociateContactsSelected] = useState([]);
  const [associateSuccess, setAssociateSuccess] = useState(false);
  const [associateDevicesModal, setAssociateDevicesModal] = useState(null); // { branchKey, clientId }
  const [associateDevicesSearch, setAssociateDevicesSearch] = useState('');
  const [associateDevicesSelected, setAssociateDevicesSelected] = useState([]);
  const [contactSuccessInfo, setContactSuccessInfo] = useState(null); // { clientId, branchId }
  const [confirmState, setConfirmState] = useState({ isOpen: false, payload: null, isLoading: false });
  const [pagination, setPagination] = useState({});
  const [tabLoading, setTabLoading] = useState({});

  const route = stack[stack.length - 1];
  const isOpen = stack.length > 0;
  const PAGE_SIZE = 8;

  useEffect(() => { saveDraftsToStorage(drafts); }, [drafts]);

  useEffect(() => {
    if (!openParams) return;
    const t = setTimeout(() => {
      if (openParams.type === 'dispositivo' || openParams.type === 'device') {
        const dId = openParams.deviceId || openParams.id;
        ensureDraft(entityKey('dispositivo', dId), () => toDeviceDraft(data.dispositivos?.find(d => String(d.id) === String(dId))));
        setStack([{ type: 'dispositivo', deviceId: dId, mode: openParams.mode || 'view' }]);
      } else if (openParams.type === 'tecnico' || openParams.type === 'tecnicos') {
        const tId = openParams.clientId || openParams.id;
        ensureDraft(entityKey('tecnico', tId), () => {
          const tec = data.tecnicos?.find(t => String(t.id) === String(tId));
          return tec ? { ...emptyTecnicoDraft(), ...tec } : emptyTecnicoDraft();
        });
        setStack([{ type: 'tecnico', clientId: tId, mode: openParams.mode || 'view' }]);
      } else if (openParams.type === 'contact') {
        const contactId = openParams.contactId || openParams.id || `C-${Date.now()}`;
        const clientId = openParams.clientId || null;
        const branchId = openParams.branchId || null;
        ensureDraft(entityKey('contact', contactId), () => {
          if (clientId && branchId) {
            const client = data.clientes?.find(c => String(c.id) === String(clientId));
            const branch = client?.sucursales?.find(s => String(s.id) === String(branchId));
            const contact = branch?.contactos?.find(ct => String(ct.id) === String(contactId));
            if (contact) {
              const draft = toContactDraft(contact);
              // Inicializar sucursales asociadas con la sucursal actual si no existe
              if (!draft.associatedBranchIds || draft.associatedBranchIds.length === 0) {
                draft.associatedBranchIds = [String(branchId)];
              }
              return draft;
            }
            return emptyContactDraft();
          }
          return emptyContactDraft();
        });
        setStack([{ type: 'contact', clientId, branchId, contactId, mode: openParams.mode || 'edit' }]);
      } else {
        const cId = openParams.clientId || openParams.id;
        ensureDraft(entityKey('cliente', cId), () => {
          const existing = data.clientes?.find(c => String(c.id) === String(cId));
          return existing ? toClientDraft(existing) : emptyClientDraft();
        });
        setStack([{ type: 'cliente', clientId: cId, mode: openParams.mode || 'edit', activeTab: 'details' }]);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [openParams]);

  const entityKey = (type, id) => `${type}:${id}`;
  const ensureDraft = (key, factory) => {
    if (!drafts[key]) setDrafts(p => ({ ...p, [key]: factory() }));
  };
  const updateDraft = (key, patch) => {
    setDrafts(p => ({ ...p, [key]: { ...(p[key] || {}), ...patch } }));
  };
  const popModal = () => {
    setStack(prev => prev.slice(0, -1));
    setShowErrors(false);
  };
  const handleClose = () => {
    if (stack.length <= 1) onClose();
    else setStack(prev => prev.slice(0, -1));
  };

  // Reset showErrors when moving between levels
  useEffect(() => {
    setShowErrors(false);
  }, [stack.length]);

  // Sincronizar estado cuando data cambia para asegurar que las sucursales se muestren correctamente
  useEffect(() => {
    // Este efecto fuerza un re-render cuando data cambia
    // Especialmente útil después de guardar una sucursal y hacer clic en "VOLVER A SUCURSAL"
    // No necesitamos hacer nada aquí, solo que React detecte el cambio y re-renderice
  }, [data]);

  const client = (data?.clientes || []).find(c => String(c.id) === String(route?.clientId));
  const branch = (client?.sucursales || []).find(b => String(b.id) === String(route?.branchId));
  const contact = (branch?.contactos || []).find(ct => String(ct.id) === String(route?.contactId));
  const device = (data?.dispositivos || []).find(d => String(d.id) === String(route?.deviceId));

  const paginate = (arr, page, size) => {
    const pageCount = Math.ceil(arr.length / size) || 1;
    const safePage = Math.max(1, Math.min(page, pageCount));
    const slice = arr.slice((safePage - 1) * size, safePage * size);
    return { page: safePage, pageCount, slice };
  };

  const renderClientForm = () => {
    const key = entityKey('cliente', route.clientId);
    const draft = drafts[key] || emptyClientDraft();
    const errors = validateClient(draft);
    const hasErrors = Object.keys(errors).length > 0;
    const isEditing = route.mode === 'edit';

    // Recalcular client y branches en cada render para asegurar datos actualizados
    const currentClient = (data?.clientes || []).find(c => String(c.id) === String(route?.clientId));
    const currentBranches = currentClient?.sucursales || [];

    const handleSave = async () => {
      setShowErrors(true);
      if (hasErrors) return;
      setSaveState({ isSaving: true, savedAt: null });
      await new Promise(r => setTimeout(r, 400));
      
      // Guardar los datos
      const savedData = { ...draft, nit: `${draft.nit}-${draft.dv}`, id: route.clientId };
      setData(prev => applyClientUpdate(prev, route.clientId, savedData));
      
      // Actualizar el draft con los datos guardados para que se reflejen en la vista
      const updatedDraft = toClientDraft(savedData);
      setDrafts(prev => ({ ...prev, [key]: updatedDraft }));
      
      setSaveState({ isSaving: false, savedAt: Date.now() });
      setSavedClientId(route.clientId);
      setShowSuccessModal(true);
    };

    const handleNewBranch = () => {
      // Limpiar cualquier edición en curso
      setEditingBranchId(null);
      // Crear un nuevo draft para la nueva sucursal
      const newBranchKey = entityKey('branch', `new-${route.clientId}`);
      ensureDraft(newBranchKey, () => emptyBranchDraft());
      // Activar el modo de creación
      setCreatingNewBranch(true);
      // Cambiar al tab de branches si no está ya ahí
      if (route.activeTab !== 'branches') {
        setStack(p => p.map((r, i) => i === p.length - 1 ? {...r, activeTab: 'branches'} : r));
      }
    };

    const handleEditBranch = (branch) => {
      // Establecer el estado de edición y crear un draft para editar
      const editBranchKey = entityKey('branch', `edit-${branch.id}`);
      ensureDraft(editBranchKey, () => {
        const branchDraft = toBranchDraft(branch);
        // Incluir los IDs de contactos y dispositivos asociados
        return {
          ...branchDraft,
          associatedContactIds: (branch.contactos || []).map(c => String(c.id)),
          associatedDeviceIds: (data?.dispositivos || []).filter(d => 
            String(d.branchId) === String(branch.id)
          ).map(d => String(d.id))
        };
      });
      setEditingBranchId(branch.id);
      // Cambiar al tab de branches si no está ya ahí
      if (route.activeTab !== 'branches') {
        setStack(p => p.map((r, i) => i === p.length - 1 ? {...r, activeTab: 'branches'} : r));
      }
    };

    const handleViewBranch = (branch) => {
      // Cuando se hace clic en una sucursal desde el formulario de cliente,
      // abrir el formulario de edición en lugar de navegar a una vista separada
      if (isEditing) {
        handleEditBranch(branch);
      } else {
        ensureDraft(entityKey('branch', branch.id), () => toBranchDraft(branch));
        setStack(p => [...p, { type: 'branch', clientId: route.clientId, branchId: branch.id, mode: 'view', activeTab: 'details' }]);
      }
    };

    // Crear un draft temporal para la nueva sucursal
    // Lógica simple: mostrar formulario solo si estamos creando una nueva explícitamente O editando una existente
    // Usar currentBranches en lugar de client?.sucursales para datos actualizados
    const hasBranches = currentBranches.length > 0;
    const newBranchKey = entityKey('branch', `new-${route.clientId}`);
    // Mostrar formulario si:
    // 1. Estamos creando una nueva explícitamente (creatingNewBranch), O
    // 2. No hay sucursales Y estamos en modo edit (para mostrar formulario inicial)
    // Si no hay sucursales, crear el draft automáticamente
    const shouldShowNewBranchForm = creatingNewBranch || (!hasBranches && isEditing && !editingBranchId);
    if (shouldShowNewBranchForm && !drafts[newBranchKey]) {
      ensureDraft(newBranchKey, () => emptyBranchDraft());
    }
    const newBranchDraft = (shouldShowNewBranchForm && !editingBranchId && drafts[newBranchKey]) ? drafts[newBranchKey] : null;
    
    // Si estamos editando una sucursal, usar ese draft
    const editBranchKey = editingBranchId ? entityKey('branch', `edit-${editingBranchId}`) : null;
    const editingBranchDraft = editingBranchId ? (drafts[editBranchKey] || null) : null;
    
    // El draft activo es el de edición si existe, sino el de nueva sucursal
    const activeBranchDraft = editingBranchDraft || newBranchDraft;
    const activeBranchKey = editingBranchId ? editBranchKey : newBranchKey;
    const activeBranchErrors = activeBranchDraft ? validateBranch(activeBranchDraft) : {};
    
    const handleSaveNewBranch = async () => {
      if (!activeBranchDraft) return;
      setShowErrors(true);
      if (Object.keys(activeBranchErrors).length > 0) return;
      setSaveState({ isSaving: true, savedAt: null });
      await new Promise(r => setTimeout(r, 400));
      
      if (editingBranchId) {
        // Guardar cambios de la sucursal editada
        setData(prev => applyBranchUpsert(prev, route.clientId, editingBranchId, activeBranchDraft));
        setDrafts(prev => {
          const updated = { ...prev };
          delete updated[activeBranchKey];
          return updated;
        });
        setEditingBranchId(null);
      } else {
        // Crear nueva sucursal
        const newId = `S-${Date.now()}`;
        setData(prev => applyBranchUpsert(prev, route.clientId, newId, activeBranchDraft));
        setDrafts(prev => {
          const updated = { ...prev };
          delete updated[activeBranchKey];
          return updated;
        });
        setBranchSuccessInfo({ clientId: route.clientId, branchId: newId });
        setCreatingNewBranch(false); // Desactivar el modo de creación
      }
      
      setSaveState({ isSaving: false, savedAt: Date.now() });
    };

    const handleOpenAssociateContacts = () => {
      if (!activeBranchDraft) return;
      // Inicializamos la selección con lo que ya tenga el borrador
      const currentIds = activeBranchDraft.associatedContactIds || [];
      setAssociateContactsSelected(currentIds);
      setAssociateContactsSearch('');
      setAssociateContactsModal({ branchKey: activeBranchKey, clientId: route.clientId });
    };

    const handleOpenAssociateDevices = () => {
      if (!activeBranchDraft) return;
      const currentIds = activeBranchDraft.associatedDeviceIds || [];
      setAssociateDevicesSelected(currentIds);
      setAssociateDevicesSearch('');
      setAssociateDevicesModal({ branchKey: activeBranchKey, clientId: route.clientId });
    };

    // Calcular contadores dinámicamente usando currentBranches
    // Si estamos creando o editando una sucursal, mostrar los valores de esa sucursal
    // Si no, mostrar los valores del cliente completo
    const isEditingBranch = activeBranchDraft !== null;
    const totalSucursales = isEditingBranch && !editingBranchId
      ? currentBranches.length + 1 // +1 porque estamos creando una nueva
      : currentBranches.length;
    const totalContactos = isEditingBranch
      ? (activeBranchDraft?.associatedContactIds || []).length
      : currentBranches.reduce((acc, branch) => {
          return acc + (branch.contactos || []).length;
        }, 0);
    const totalDispositivos = isEditingBranch
      ? (activeBranchDraft?.associatedDeviceIds || []).length
      : (data?.dispositivos || []).filter(d => 
          String(d.clientId) === String(route.clientId)
        ).length;

    return (
      <ClientForm
        draft={draft}
        updateDraft={(patch) => updateDraft(key, patch)}
        errors={errors}
        showErrors={showErrors}
        isEditing={isEditing}
        onSave={handleSave}
        isSaving={saveState.isSaving}
        activeTab={route.activeTab}
        onTabChange={(k) => setStack(p => p.map((r, i) => i === p.length-1 ? {...r, activeTab: k} : r))}
        branches={currentBranches}
        onNewBranch={handleNewBranch}
        onEditBranch={handleEditBranch}
        onViewBranch={handleViewBranch}
        newBranchDraft={activeBranchDraft}
        updateNewBranchDraft={(patch) => updateDraft(activeBranchKey, patch)}
        newBranchErrors={activeBranchErrors}
        onSaveNewBranch={handleSaveNewBranch}
        editingBranchId={editingBranchId}
        onCancelEdit={() => {
          setEditingBranchId(null);
          setCreatingNewBranch(false);
          if (activeBranchKey) {
            setDrafts(prev => {
              const updated = { ...prev };
              delete updated[activeBranchKey];
              return updated;
            });
          }
        }}
        onAssociateContacts={handleOpenAssociateContacts}
        onAssociateDevices={handleOpenAssociateDevices}
        totalSucursales={totalSucursales}
        totalContactos={totalContactos}
        totalDispositivos={totalDispositivos}
      />
    );
  };

  const renderClientBranches = () => {
    const branches = client?.sucursales || [];
    const handleNew = () => {
      const newId = `S-${Date.now()}`;
      ensureDraft(entityKey('branch', newId), () => emptyBranchDraft());
      setStack(p => [...p, { type: 'branch', clientId: route.clientId, branchId: newId, mode: 'edit', activeTab: 'details' }]);
    };
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Tabs tabs={[{key:'details', label:'Detalles generales'}, {key:'branches', label:'Sucursales'}]} active={route.activeTab} onChange={(k) => setStack(p => p.map((r, i) => i === p.length-1 ? {...r, activeTab: k} : r))} />
          <Button onClick={handleNew}><Plus size={18} /> Nueva Sucursal</Button>
        </div>
        <Card className="p-0 overflow-hidden border-none shadow-sm bg-gray-50/50">
          <Table>
            <THead variant="dark">
              <tr><Th>Nombre</Th><Th>Dirección</Th><Th>Ciudad</Th><Th align="right">Acciones</Th></tr>
            </THead>
            <TBody>
              {branches.map(b => (
                <Tr key={b.id}>
                  <Td><TextSmall className="font-bold">{b.nombre}</TextSmall></Td>
                  <Td><TextSmall>{b.direccion}</TextSmall></Td>
                  <Td><TextSmall>{b.ciudad}</TextSmall></Td>
                  <Td align="right">
                    <div className="flex justify-end gap-2">
                      <IconButton icon={Eye} onClick={() => {
                        ensureDraft(entityKey('branch', b.id), () => toBranchDraft(b));
                        setStack(p => [...p, { type: 'branch', clientId: route.clientId, branchId: b.id, mode: 'view', activeTab: 'details' }]);
                      }} />
                      <IconButton icon={Edit2} onClick={() => {
                        ensureDraft(entityKey('branch', b.id), () => toBranchDraft(b));
                        setStack(p => [...p, { type: 'branch', clientId: route.clientId, branchId: b.id, mode: 'edit', activeTab: 'details' }]);
                      }} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>
    );
  };

  const renderBranchDevices = () => {
    const devices = (data?.dispositivos || []).filter(d => 
      String(d.clientId) === String(route.clientId) && 
      String(d.branchId) === String(route.branchId)
    );
    const handleNew = () => {
      const newId = `D-${Date.now()}`;
      ensureDraft(entityKey('device', newId), () => emptyDeviceDraft());
      setStack(p => [...p, { type: 'dispositivo', deviceId: newId, mode: 'edit' }]);
    };
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Tabs tabs={[{key:'details', label:'Detalles'}, {key:'contacts', label:'Contactos'}, {key:'devices', label:'Dispositivos'}]} active={route.activeTab} onChange={(k) => setStack(p => p.map((r, i) => i === p.length-1 ? {...r, activeTab: k} : r))} />
          <Button onClick={handleNew}><Plus size={18} /> Nuevo Dispositivo</Button>
        </div>
        <Card className="p-0 overflow-hidden border-none shadow-sm bg-gray-50/50">
          <Table>
            <THead variant="dark">
              <tr><Th>Nombre / ID</Th><Th>Marca / Modelo</Th><Th>Serial</Th><Th align="right">Acciones</Th></tr>
            </THead>
            <TBody>
              {devices.map(d => (
                <Tr key={d.id}>
                  <Td><TextSmall className="font-bold">{d.idInmotika || d.codigoUnico}</TextSmall></Td>
                  <Td><TextSmall>{d.marca} {d.linea} {d.modelo}</TextSmall></Td>
                  <Td><TextSmall>{d.serial}</TextSmall></Td>
                  <Td align="right">
                    <div className="flex justify-end gap-2">
                       <IconButton icon={Eye} onClick={() => setStack(p => [...p, { type: 'dispositivo', deviceId: d.id, mode: 'view' }])} />
                       <IconButton icon={Edit2} onClick={() => setStack(p => [...p, { type: 'dispositivo', deviceId: d.id, mode: 'edit' }])} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>
    );
  };

  const renderBranchContacts = () => {
    const contacts = branch?.contactos || [];
    const handleNew = () => {
      const newId = `C-${Date.now()}`;
      ensureDraft(entityKey('contact', newId), () => emptyContactDraft());
      setStack(p => [...p, { type: 'contact', clientId: route.clientId, branchId: route.branchId, contactId: newId, mode: 'edit' }]);
    };
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Tabs tabs={[{key:'details', label:'Detalles'}, {key:'contacts', label:'Contactos'}, {key:'devices', label:'Dispositivos'}]} active={route.activeTab} onChange={(k) => setStack(p => p.map((r, i) => i === p.length-1 ? {...r, activeTab: k} : r))} />
          <Button onClick={handleNew}><Plus size={18} /> Nuevo Contacto</Button>
        </div>
        <Card className="p-0 overflow-hidden border-none shadow-sm bg-gray-50/50">
          <Table>
            <THead variant="dark">
              <tr><Th>Nombre</Th><Th>Cargo</Th><Th>Teléfono</Th><Th align="right">Acciones</Th></tr>
            </THead>
            <TBody>
              {contacts.map(ct => (
                <Tr key={ct.id}>
                  <Td><TextSmall className="font-bold">{ct.nombre}</TextSmall></Td>
                  <Td><TextSmall>{ct.puesto || ct.cargo}</TextSmall></Td>
                  <Td><TextSmall>{ct.telefonoMovil || ct.celular}</TextSmall></Td>
                  <Td align="right">
                    <div className="flex justify-end gap-2">
                      <IconButton icon={Eye} onClick={() => {
                        ensureDraft(entityKey('contact', ct.id), () => toContactDraft(ct));
                        setStack(p => [...p, { type: 'contact', clientId: route.clientId, branchId: route.branchId, contactId: ct.id, mode: 'view' }]);
                      }} />
                      <IconButton icon={Edit2} onClick={() => {
                        ensureDraft(entityKey('contact', ct.id), () => toContactDraft(ct));
                        setStack(p => [...p, { type: 'contact', clientId: route.clientId, branchId: route.branchId, contactId: ct.id, mode: 'edit' }]);
                      }} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>
    );
  };

  const renderContactForm = () => {
    const key = entityKey('contact', route.contactId);
    const draft = drafts[key] || emptyContactDraft();
    const errors = validateContact(draft);
    const hasErrors = Object.keys(errors).length > 0;
    const isEditing = route.mode === 'edit';
    const selectedClient = route.clientId ? client : null;
    const availableBranches = selectedClient?.sucursales || [];
    
    // Obtener las sucursales seleccionadas del draft o del route
    const selectedBranchIds = draft.associatedBranchIds || (route.branchId ? [route.branchId] : []);
    const selectedBranches = availableBranches.filter(b => selectedBranchIds.includes(String(b.id)));

    const handleClientChange = (option) => {
      const clientId = option ? option.value : null;
      // Limpiar sucursales seleccionadas cuando cambia el cliente
      updateDraft(key, { associatedBranchIds: [] });
      setStack(prev => prev.map((s, idx) => 
        idx === prev.length - 1 
          ? { ...s, clientId, branchId: null } 
          : s
      ));
    };

    const handleBranchesChange = (selectedOptions) => {
      const branchIds = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
      updateDraft(key, { associatedBranchIds: branchIds });
      // Si hay al menos una sucursal, usar la primera como branchId principal para compatibilidad
      if (branchIds.length > 0) {
        setStack(prev => prev.map((s, idx) => 
          idx === prev.length - 1 
            ? { ...s, branchId: branchIds[0] } 
            : s
        ));
      }
    };

    // Detectar si es un contacto nuevo (sin datos guardados en data)
    const isNewContact = !data.clientes?.some(c =>
      c.sucursales?.some(s => s.contactos?.some(co => String(co.id) === String(route.contactId)))
    );

    const handleSave = async () => {
      if (!route.clientId || !draft.associatedBranchIds || draft.associatedBranchIds.length === 0) {
        setShowErrors(true);
        return;
      }
      setShowErrors(true);
      if (hasErrors) return;
      setSaveState({ isSaving: true, savedAt: null });
      await new Promise(r => setTimeout(r, 400));
      
      const primaryBranchId = draft.associatedBranchIds[0];
      setData(prev => applyContactUpsert(prev, route.clientId, primaryBranchId, route.contactId, draft));
      
      setSaveState({ isSaving: false, savedAt: Date.now() });
      setStack(prev => prev.map((s, idx) => idx === prev.length - 1 ? { ...s, mode: 'view' } : s));
      setContactSuccessInfo({ clientId: route.clientId, branchId: primaryBranchId });
    };

    return (
      <Card className="p-6">
        <ContactForm
          draft={draft}
          updateDraft={(patch) => updateDraft(key, patch)}
          errors={errors}
          showErrors={showErrors}
          isEditing={isEditing}
          onSave={handleSave}
          isSaving={saveState.isSaving}
          isNew={isNewContact}
          clientOptions={(data.clientes || []).map(c => ({ value: String(c.id), label: c.nombre }))}
          selectedClientId={route.clientId || ''}
          onClientChange={handleClientChange}
          availableBranchOptions={availableBranches.map(b => ({ value: String(b.id), label: b.nombre }))}
          selectedBranchValues={selectedBranches.map(b => ({ value: String(b.id), label: b.nombre }))}
          onBranchesChange={handleBranchesChange}
          clientError={showErrors && !route.clientId ? 'Debe seleccionar un cliente' : null}
          branchError={showErrors && (!draft.associatedBranchIds || draft.associatedBranchIds.length === 0) ? 'Debe seleccionar al menos una sucursal' : null}
        />
      </Card>
    );
  };

  const renderDeviceForm = () => {
    const key = entityKey('dispositivo', route.deviceId);
    const draft = drafts[key] || emptyDeviceDraft();
    const errors = validateDevice(draft);
    const hasErrors = Object.keys(errors).length > 0;
    const isEditing = route.mode === 'edit';

    const handleSave = async () => {
      setShowErrors(true);
      if (hasErrors) return;
      setSaveState({ isSaving: true, savedAt: null });
      await new Promise(r => setTimeout(r, 400));
      setData(prev => applyDeviceUpsert(prev, route.originClientId || route.clientId, route.originBranchId || route.branchId, route.deviceId, draft));
      setSaveState({ isSaving: false, savedAt: Date.now() });
      setStack(prev => prev.map((s, idx) => idx === prev.length - 1 ? { ...s, mode: 'view' } : s));
    };

    return (
      <DeviceForm
        draft={draft}
        updateDraft={(patch) => updateDraft(key, patch)}
        errors={errors}
        showErrors={showErrors}
        isEditing={isEditing}
        onSave={handleSave}
        isSaving={saveState.isSaving}
        clients={data?.clientes}
        devices={data?.dispositivos || []}
      />
    );
  };

  const renderBranchForm = () => {
    const key = entityKey('branch', route.branchId);
    const draft = drafts[key] || emptyBranchDraft();
    const errors = validateBranch(draft);
    const hasErrors = Object.keys(errors).length > 0;
    const isEditing = route.mode === 'edit';

    const handleSave = async () => {
      setShowErrors(true);
      if (hasErrors) return;
      setSaveState({ isSaving: true, savedAt: null });
      await new Promise(r => setTimeout(r, 400));
      setData(prev => applyBranchUpsert(prev, route.clientId, route.branchId, draft));
      setSaveState({ isSaving: false, savedAt: Date.now() });
      setStack(prev => prev.map((s, idx) => idx === prev.length - 1 ? { ...s, mode: 'view' } : s));
    };

    return (
      <Card className="p-6">
        <BranchSubForm
          newBranchDraft={draft}
          updateNewBranchDraft={(patch) => updateDraft(key, patch)}
          newBranchErrors={errors}
          showErrors={showErrors}
          isEditing={isEditing}
          onSaveNewBranch={handleSave}
          isSaving={saveState.isSaving}
          onAssociateContacts={() => setAssociateContactsModal({ branchKey: key })}
          onAssociateDevices={() => setAssociateDevicesModal({ branchKey: key })}
          estadoSelectOptions={[{value: 'est-1', label: 'ACTIVO'}, {value: 'est-2', label: 'INACTIVO'}]}
          activoId="est-1"
          inactivoId="est-2"
          clientId={route.clientId}
        />
      </Card>
    );
  };


  const NavigatorBreadcrumbs = () => {
    const items = [];
    
    // Add Root Item
    const isDeviceRoot = openParams?.type === 'dispositivo' || openParams?.type === 'device';
    items.push({
      label: isDeviceRoot ? 'Dispositivos' : 'Clientes',
      icon: isDeviceRoot ? Monitor : Users,
      isActive: false, // Root is never the "active" leaf in this view
      onClick: handleClose
    });

    stack.forEach((r, idx) => {
      const isLast = idx === stack.length - 1;
      const leafId = r.type === 'cliente' ? r.clientId : (r.type === 'branch' ? r.branchId : (r.type === 'contact' ? r.contactId : r.deviceId));
      const isNew = String(leafId || '').includes('-');
      
      if (r.type === 'cliente') {
        const c = (data?.clientes || []).find(cl => String(cl.id) === String(r.clientId));
        items.push({ 
          label: isNew ? 'Nuevo Cliente' : (c?.nombre || 'Cliente'), 
          icon: Users, 
          isActive: isLast && r.activeTab === 'details',
          onClick: () => setStack(p => p.slice(0, idx + 1).map((s, i) => i === idx ? { ...s, activeTab: 'details' } : s))
        });

        if (stack[idx + 1]?.type === 'branch') {
          items.push({
            label: 'Sucursales',
            icon: Building2,
            isActive: false,
            onClick: () => setStack(p => p.slice(0, idx + 1).map((s, i) => i === idx ? { ...s, activeTab: 'branches' } : s))
          });
        }
      } else if (r.type === 'branch') {
        const cl = (data?.clientes || []).find(cl => String(cl.id) === String(r.clientId));
        const b = (cl?.sucursales || []).find(br => String(br.id) === String(r.branchId));
        items.push({ 
          label: isNew ? 'Nueva Sucursal' : (b?.nombre || 'Sucursal'), 
          icon: MapPin, 
          isActive: isLast && r.activeTab === 'details',
          onClick: () => setStack(p => p.slice(0, idx + 1).map((s, i) => i === idx ? { ...s, activeTab: 'details' } : s))
        });

        if (stack[idx + 1]?.type === 'contact') {
          items.push({
            label: 'Contactos',
            icon: User,
            isActive: false,
            onClick: () => setStack(p => p.slice(0, idx + 1).map((s, i) => i === idx ? { ...s, activeTab: 'contacts' } : s))
          });
        }

        if (stack[idx + 1]?.type === 'dispositivo') {
          items.push({
            label: 'Dispositivos',
            icon: Monitor,
            isActive: false,
            onClick: () => setStack(p => p.slice(0, idx + 1).map((s, i) => i === idx ? { ...s, activeTab: 'devices' } : s))
          });
        }
      } else if (r.type === 'contact') {
        const cl = (data?.clientes || []).find(cl => String(cl.id) === String(r.clientId));
        const b = (cl?.sucursales || []).find(br => String(br.id) === String(r.branchId));
        const ct = (b?.contactos || []).find(cnt => String(cnt.id) === String(r.contactId));
        items.push({ 
          label: isNew ? 'Nuevo Contacto' : (ct?.nombre || 'Contacto'), 
          icon: User, 
          isActive: isLast,
          onClick: () => setStack(p => p.slice(0, idx + 1))
        });
      } else if (r.type === 'dispositivo') {
        const d = (data?.dispositivos || []).find(dev => String(dev.id) === String(r.deviceId));
        items.push({ 
          label: isNew ? 'Nuevo Dispositivo' : (d?.idInmotika || 'Dispositivo'), 
          icon: Monitor, 
          isActive: isLast,
          onClick: () => setStack(p => p.slice(0, idx + 1))
        });
      } else if (r.type === 'tecnico') {
        const t = (data?.tecnicos || []).find(tec => String(tec.id) === String(r.clientId)); // using clientId as the id prop because ConfigPage sent it as such
        items.push({ 
          label: isNew ? 'Nuevo Técnico' : (t?.nombre || 'Técnico'), 
          icon: User, 
          isActive: isLast,
          onClick: () => setStack(p => p.slice(0, idx + 1))
        });
      }
    });
    return (
      <div className="mb-4 flex items-center">
        <Breadcrumbs items={items} />
      </div>
    );
  };

  const renderTecnicoForm = () => {
    const key = entityKey('tecnico', route.clientId); // using clientId as the ID prop
    const draft = drafts[key] || emptyTecnicoDraft();
    const errors = validateTecnico(draft);
    const hasErrors = Object.keys(errors).length > 0;
    const isEditing = route.mode === 'edit';

    const handleSave = async () => {
      setShowErrors(true);
      if (hasErrors) return;
      setSaveState({ isSaving: true, savedAt: null });
      await new Promise(r => setTimeout(r, 400));
      setData(prev => applyTecnicoUpsert(prev, route.clientId, draft));
      setSaveState({ isSaving: false, savedAt: Date.now() });
      setStack(prev => prev.map((s, idx) => idx === prev.length - 1 ? { ...s, mode: 'view' } : s));
    };

    return (
      <TechnicianForm
        draft={draft}
        updateDraft={(patch) => updateDraft(key, patch)}
        errors={errors}
        showErrors={showErrors}
        isEditing={isEditing}
        onSave={handleSave}
        isSaving={saveState.isSaving}
      />
    );
  };

  const routeTitle = (() => {
    if (!route) return '';
    const leafId = route.type === 'cliente' ? route.clientId : (route.type === 'branch' ? route.branchId : (route.type === 'contact' ? route.contactId : route.deviceId));
    const isNew = String(leafId || '').includes('-');
    const action = route.isActiveAction || route.mode === 'edit' ? (isNew ? (route.type === 'branch' ? 'Nueva' : 'Nuevo') : 'Editar') : 'Ver';
    const type = route.type === 'cliente' ? 'Cliente' : route.type === 'branch' ? 'Sucursal' : route.type === 'contact' ? 'Contacto' : 'Dispositivo';
    return `${action} ${type}`;
  })();

  const handleGoToClients = () => {
    setShowSuccessModal(false);
    setStack([]);
    onClose();
  };

  const handleGoToStep2 = () => {
    setShowSuccessModal(false);
    if (savedClientId) {
      // Crear un nuevo draft para la nueva sucursal
      const newBranchKey = entityKey('branch', `new-${savedClientId}`);
      ensureDraft(newBranchKey, () => emptyBranchDraft());
      
      // Activar el modo de creación de sucursal
      setCreatingNewBranch(true);
      setEditingBranchId(null);
      
      // Cambiar al tab de branches y modo edit
      setStack(prev => prev.map((s, idx) => {
        if (idx === prev.length - 1 && s.type === 'cliente' && String(s.clientId) === String(savedClientId)) {
          return { ...s, activeTab: 'branches', mode: 'edit' };
        }
        return s;
      }));
    }
  };

  const handleBranchBackToBranches = () => {
    // Cierra el popup y muestra la lista de sucursales
    if (branchSuccessInfo) {
      const { clientId } = branchSuccessInfo;
      const newBranchKey = entityKey('branch', `new-${clientId}`);
      const editBranchKey = editingBranchId ? entityKey('branch', `edit-${editingBranchId}`) : null;
      
      // Limpiar todos los drafts relacionados con sucursales
      setDrafts(prev => {
        const updated = { ...prev };
        delete updated[newBranchKey];
        if (editBranchKey) {
          delete updated[editBranchKey];
        }
        return updated;
      });
      
      // Limpiar estados de creación/edición para mostrar la lista
      setCreatingNewBranch(false);
      setEditingBranchId(null);
      
      // Cambiar al tab de branches en modo view PRIMERO
      // Esto fuerza un re-render con los datos actualizados
      setStack(prev => prev.map((r, i) => {
        if (i === prev.length - 1 && r.type === 'cliente' && String(r.clientId) === String(clientId)) {
          return { ...r, activeTab: 'branches', mode: 'view' };
        }
        return r;
      }));
      
      // Limpiar branchSuccessInfo después de actualizar el stack
      // Esto asegura que el componente se re-renderice con los datos actualizados
      setBranchSuccessInfo(null);
    }
  };

  const handleBranchCreateAnother = () => {
    // Cerrar modal y mostrar el formulario de nueva sucursal
    if (branchSuccessInfo) {
      const { clientId } = branchSuccessInfo;
      const newBranchKey = entityKey('branch', `new-${clientId}`);
      
      // Limpiar el draft anterior si existe
      setDrafts(prev => {
        const updated = { ...prev };
        delete updated[newBranchKey];
        return updated;
      });
      
      // Crear un nuevo draft para la nueva sucursal
      ensureDraft(newBranchKey, () => emptyBranchDraft());
      
      // Activar el modo de creación
      setCreatingNewBranch(true);
      setEditingBranchId(null);
      setBranchSuccessInfo(null);
      
      // Asegurar que estamos en el tab de branches en modo edit
      setStack(prev => prev.map((r, i) => {
        if (i === prev.length - 1 && r.type === 'cliente' && String(r.clientId) === String(clientId)) {
          return { ...r, activeTab: 'branches', mode: 'edit' };
        }
        return r;
      }));
    }
  };

  const handleBranchGoToStep3Contact = () => {
    if (!branchSuccessInfo) return;
    const { clientId, branchId } = branchSuccessInfo;
    setBranchSuccessInfo(null);

    // Crear directamente un nuevo contacto (Paso 3 - nuevo contacto)
    const newId = `C-${Date.now()}`;
    ensureDraft(entityKey('contact', newId), () => emptyContactDraft());
    setStack(p => [...p, { type: 'contact', clientId, branchId, contactId: newId, mode: 'edit' }]);
  };

  const handleContactBackToContacts = () => {
    setContactSuccessInfo(null);
    // Cerrar completamente el modal y volver a la lista de contactos
    setStack([]);
    onClose();
  };

  const handleContactCreateAnother = () => {
    if (!contactSuccessInfo) return;
    const { clientId, branchId } = contactSuccessInfo;
    setContactSuccessInfo(null);

    const newId = `C-${Date.now()}`;
    ensureDraft(entityKey('contact', newId), () => emptyContactDraft());

    setStack(prev => {
      const base = prev.slice(0, -1); // quitar el contacto actual
      return [...base, { type: 'contact', clientId, branchId, contactId: newId, mode: 'edit' }];
    });
  };

  // --- ASOCIAR CONTACTOS A SUCURSAL (NUEVA) ---
  const allContacts = (data?.clientes || []).flatMap(c =>
    (c.sucursales || []).flatMap(s =>
      (s.contactos || []).map(ct => ({
        ...ct,
        clientId: c.id,
        clientName: c.nombre,
        branchName: s.nombre,
      }))
    )
  );

  const filteredAssociateContacts = allContacts
    .filter(ct => {
      if (!associateContactsSearch) return true;
      const q = associateContactsSearch.toLowerCase();
      return (
        (ct.nombre || '').toLowerCase().includes(q) ||
        (ct.apellido || '').toLowerCase().includes(q) ||
        String(ct.telefonoMovil || '').includes(q) ||
        String(ct.celular || '').includes(q)
      );
    })
    .slice(0, 10); // solo 10 usuarios de ejemplo

  const toggleAssociateContactSelection = (id) => {
    setAssociateContactsSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAssociateContactsSave = () => {
    if (!associateContactsModal) return;
    const { branchKey } = associateContactsModal;
    updateDraft(branchKey, { associatedContactIds: associateContactsSelected });
    setAssociateContactsModal(null);
    setAssociateSuccess(true);
  };

  const handleAssociateContactsCancel = () => {
    setAssociateContactsModal(null);
  };

  // --- ASOCIAR DISPOSITIVOS A SUCURSAL (NUEVA) ---
  const allDevices = (data?.dispositivos || []).map(d => ({ ...d }));

  const filteredAssociateDevices = allDevices
    .filter(dev => {
      if (!associateDevicesSearch) return true;
      const q = associateDevicesSearch.toLowerCase();
      return (
        (dev.idInmotika || '').toLowerCase().includes(q) ||
        (dev.codigoUnico || '').toLowerCase().includes(q) ||
        (dev.marca || '').toLowerCase().includes(q) ||
        (dev.modelo || '').toLowerCase().includes(q) ||
        (dev.serial || '').toLowerCase().includes(q)
      );
    })
    .slice(0, 10);

  const toggleAssociateDeviceSelection = (id) => {
    setAssociateDevicesSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAssociateDevicesSave = () => {
    if (!associateDevicesModal) return;
    const { branchKey } = associateDevicesModal;
    updateDraft(branchKey, { associatedDeviceIds: associateDevicesSelected });
    setAssociateDevicesModal(null);
    setAssociateSuccess(true);
  };

  const handleAssociateDevicesCancel = () => {
    setAssociateDevicesModal(null);
  };

  if (!route) return null;

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 -mt-4">
        {route?.type === 'cliente' && renderClientForm()}
        {route?.type === 'contact' && renderContactForm()}
        {route?.type === 'dispositivo' && renderDeviceForm()}
        {route?.type === 'tecnico' && renderTecnicoForm()}
        {route?.type === 'branch' && renderBranchForm()}
      </div>

      {/* Success Modal - Cliente */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 text-green-600 mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
              <H3 className="normal-case text-gray-900">Guardado exitoso</H3>
            </div>
            <TextSmall className="text-gray-600 mb-6 leading-relaxed">
              El cliente se ha guardado correctamente. ¿Qué deseas hacer ahora?
            </TextSmall>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleGoToStep2}
                className="w-full bg-linear-to-r from-[#D32F2F] to-[#8B0000] hover:from-[#B71C1C] hover:to-[#8B0000] text-white border-0"
              >
                Paso 2 Sucursal
              </Button>
              <Button 
                onClick={handleGoToClients}
                variant="outline"
                className="w-full"
              >
                Volver a Clientes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal - Sucursal */}
      {branchSuccessInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 text-green-600 mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
              <H3 className="normal-case text-gray-900">Sucursal guardada</H3>
            </div>
            <TextSmall className="text-gray-600 mb-6 leading-relaxed">
              La sucursal se ha guardado correctamente. ¿Qué deseas hacer ahora?
            </TextSmall>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleBranchCreateAnother}
                variant="outline"
                className="w-full"
              >
                Crear más sucursales
              </Button>
              <Button 
                onClick={handleBranchBackToBranches}
                variant="outline"
                className="w-full border-gray-300 text-gray-700"
              >
                Volver a Sucursal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal - Contacto */}
      {contactSuccessInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 text-green-600 mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
              <H3 className="normal-case text-gray-900">Contacto guardado</H3>
            </div>
            <TextSmall className="text-gray-600 mb-6 leading-relaxed">
              El contacto se ha guardado correctamente. ¿Qué deseas hacer ahora?
            </TextSmall>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleContactBackToContacts}
                className="w-full bg-linear-to-r from-[#D32F2F] to-[#8B0000] hover:from-[#B71C1C] hover:to-[#8B0000] text-white border-0"
              >
                Volver a contactos
              </Button>
              <Button 
                onClick={handleContactCreateAnother}
                variant="outline"
                className="w-full"
              >
                Crear otro contacto
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Asociar contactos a sucursal */}
      {associateContactsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="mb-4">
              <H3 className="normal-case text-gray-900">Asociar contactos a la sucursal</H3>
              <TextSmall className="text-gray-500">
                Busca por nombre o número y selecciona uno o varios contactos.
              </TextSmall>
            </div>

            {/* Buscador */}
            <div className="mb-4">
              <Input
                label="Buscar contacto (nombre o celular)"
                value={associateContactsSearch}
                onChange={e => setAssociateContactsSearch(e.target.value)}
              />
            </div>

            {/* Lista de contactos */}
            <div className="max-h-72 overflow-y-auto border border-gray-100 rounded-lg">
              {filteredAssociateContacts.length === 0 ? (
                <div className="py-8 text-center">
                  <TextSmall className="text-gray-400">
                    No se encontraron contactos para el criterio de búsqueda.
                  </TextSmall>
                </div>
              ) : (
                <Table>
                  <THead variant="dark">
                    <tr>
                      <Th />
                      <Th>Nombre / Apellido</Th>
                      <Th>Documento</Th>
                    </tr>
                  </THead>
                  <TBody>
                    {filteredAssociateContacts.map(ct => (
                      <Tr key={ct.id}>
                        <Td>
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-[#D32F2F] border-gray-300 rounded"
                            checked={associateContactsSelected.includes(ct.id)}
                            onChange={() => toggleAssociateContactSelection(ct.id)}
                          />
                        </Td>
                        <Td>
                          <TextSmall className="font-semibold text-gray-800">
                            {`${ct.nombre || ''} ${ct.apellido || ''}`.trim()}
                          </TextSmall>
                        </Td>
                        <Td>
                          <TextSmall className="text-gray-700">
                            {ct.numeroDocumento || ct.identificacion || `10${String(ct.id || '').replace(/\D/g, '').padStart(8, '0')}`}
                          </TextSmall>
                        </Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              )}
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700"
                onClick={handleAssociateContactsCancel}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAssociateContactsSave}
                disabled={associateContactsSelected.length === 0}
                className="bg-linear-to-r from-[#D32F2F] to-[#8B0000] hover:from-[#B71C1C] hover:to-[#8B0000] text-white border-0"
              >
                Agregar contactos seleccionados
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Asociar dispositivos a sucursal */}
      {associateDevicesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="mb-4">
              <H3 className="normal-case text-gray-900">Asociar dispositivos a la sucursal</H3>
              <TextSmall className="text-gray-500">
                Busca por ID, serial o marca y selecciona uno o varios dispositivos.
              </TextSmall>
            </div>

            {/* Buscador */}
            <div className="mb-4">
              <Input
                label="Buscar dispositivo (ID / serial / marca)"
                value={associateDevicesSearch}
                onChange={e => setAssociateDevicesSearch(e.target.value)}
              />
            </div>

            {/* Lista de dispositivos */}
            <div className="max-h-72 overflow-y-auto border border-gray-100 rounded-lg">
              {filteredAssociateDevices.length === 0 ? (
                <div className="py-8 text-center">
                  <TextSmall className="text-gray-400">
                    No se encontraron dispositivos para el criterio de búsqueda.
                  </TextSmall>
                </div>
              ) : (
                <Table>
                  <THead variant="dark">
                    <tr>
                      <Th />
                      <Th>Nombre / ID</Th>
                      <Th>Marca / Modelo</Th>
                      <Th>Serial</Th>
                    </tr>
                  </THead>
                  <TBody>
                    {filteredAssociateDevices.map(dev => (
                      <Tr key={dev.id}>
                        <Td>
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-[#D32F2F] border-gray-300 rounded"
                            checked={associateDevicesSelected.includes(dev.id)}
                            onChange={() => toggleAssociateDeviceSelection(dev.id)}
                          />
                        </Td>
                        <Td>
                          <TextSmall className="font-semibold text-gray-800">
                            {dev.idInmotika || dev.codigoUnico || dev.id}
                          </TextSmall>
                        </Td>
                        <Td>
                          <TextSmall className="text-gray-700">
                            {dev.marca} {dev.modelo}
                          </TextSmall>
                        </Td>
                        <Td>
                          <TextSmall className="text-gray-700">
                            {dev.serial || '—'}
                          </TextSmall>
                        </Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              )}
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700"
                onClick={handleAssociateDevicesCancel}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAssociateDevicesSave}
                disabled={associateDevicesSelected.length === 0}
                className="bg-linear-to-r from-[#D32F2F] to-[#8B0000] hover:from-[#B71C1C] hover:to-[#8B0000] text-white border-0"
              >
                Agregar dispositivos seleccionados
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal - Asociación (contactos / dispositivos) */}
      {associateSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 text-green-600 mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
              <H3 className="normal-case text-gray-900">Asociación exitosa</H3>
            </div>
            <TextSmall className="text-gray-600 mb-6 leading-relaxed">
              Los elementos seleccionados se han asociado correctamente a la sucursal.
            </TextSmall>
            <div className="flex justify-end">
              <Button
                onClick={() => setAssociateSuccess(false)}
                className="bg-linear-to-r from-[#D32F2F] to-[#8B0000] hover:from-[#B71C1C] hover:to-[#8B0000] text-white border-0 px-6"
              >
                Volver a Sucursal
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>{children}</div>
);

export default ConfigurationNavigator;
