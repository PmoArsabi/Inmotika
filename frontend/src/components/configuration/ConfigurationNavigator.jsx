import React, { useState, useEffect, useRef, useMemo } from 'react';
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

import ClientForm from '../forms/ClientForm';
import BranchForm from '../forms/BranchForm';
import ContactForm from '../forms/ContactForm';
import DeviceForm from '../forms/DeviceForm';
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
      } else {
        const cId = openParams.clientId || openParams.id;
        ensureDraft(entityKey('cliente', cId), () => toClientDraft(data.clientes?.find(c => String(c.id) === String(cId))));
        setStack([{ type: 'cliente', clientId: cId, mode: openParams.mode || 'view', activeTab: 'details' }]);
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

    const handleSave = async () => {
      setShowErrors(true);
      if (hasErrors) return;
      setSaveState({ isSaving: true, savedAt: null });
      await new Promise(r => setTimeout(r, 400));
      setData(prev => applyClientUpdate(prev, route.clientId, { ...draft, nit: `${draft.nit}-${draft.dv}` }));
      setSaveState({ isSaving: false, savedAt: Date.now() });
      setStack(prev => prev.map((s, idx) => idx === prev.length -1 ? { ...s, mode: 'view' } : s));
    };

    if (route.activeTab === 'branches') return renderClientBranches();

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
                      <IconButton icon={Eye} onClick={() => setStack(p => [...p, { type: 'branch', clientId: route.clientId, branchId: b.id, mode: 'view', activeTab: 'details' }])} />
                      <IconButton icon={Edit2} onClick={() => setStack(p => [...p, { type: 'branch', clientId: route.clientId, branchId: b.id, mode: 'edit', activeTab: 'details' }])} />
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
      setStack(prev => prev.map((s, idx) => idx === prev.length -1 ? { ...s, mode: 'view' } : s));
    };

    if (route.activeTab === 'contacts') return renderBranchContacts();
    if (route.activeTab === 'devices') return renderBranchDevices();

    return (
      <BranchForm
        draft={draft}
        updateDraft={(patch) => updateDraft(key, patch)}
        errors={errors}
        showErrors={showErrors}
        isEditing={isEditing}
        onSave={handleSave}
        isSaving={saveState.isSaving}
        activeTab={route.activeTab}
        onTabChange={(k) => setStack(p => p.map((r, i) => i === p.length-1 ? {...r, activeTab: k} : r))}
      />
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
                      <IconButton icon={Eye} onClick={() => setStack(p => [...p, { type: 'contact', clientId: route.clientId, branchId: route.branchId, contactId: ct.id, mode: 'view' }])} />
                      <IconButton icon={Edit2} onClick={() => setStack(p => [...p, { type: 'contact', clientId: route.clientId, branchId: route.branchId, contactId: ct.id, mode: 'edit' }])} />
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

    const handleSave = async () => {
      setShowErrors(true);
      if (hasErrors) return;
      setSaveState({ isSaving: true, savedAt: null });
      await new Promise(r => setTimeout(r, 400));
      setData(prev => applyContactUpsert(prev, route.clientId, route.branchId, route.contactId, draft));
      setSaveState({ isSaving: false, savedAt: Date.now() });
      setStack(prev => prev.map((s, idx) => idx === prev.length - 1 ? { ...s, mode: 'view' } : s));
    };

    return (
      <ContactForm
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
      />
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

  if (!route) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <NavigatorBreadcrumbs />
      <div className="flex items-center gap-3 mb-8">
        <IconButton icon={ChevronLeft} onClick={handleClose} className="shrink-0" />
        <H3 className="uppercase tracking-tight font-black text-gray-900 leading-none">{routeTitle}</H3>
      </div>
      
      {route?.type === 'cliente' && renderClientForm()}
      {route?.type === 'branch' && renderBranchForm()}
      {route?.type === 'contact' && renderContactForm()}
      {route?.type === 'dispositivo' && renderDeviceForm()}
      {route?.type === 'tecnico' && renderTecnicoForm()}
    </div>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>{children}</div>
);

export default ConfigurationNavigator;
