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

// --- DRAFT HELPERS ---
const emptyClientDraft = () => ({
  nombre: '', nit: '', dv: '', tipoPersona: 'juridica',
  rutUrl: '', logoUrl: '', telefono: '', email: '',
  direccion: '', pais: 'CO', estado_depto: '', ciudad: '',
  estatus: 'activo', fechaRegistro: ''
});

const emptyBranchDraft = () => ({
  nombre: '', direccion: '', pais: 'CO', estado_depto: '',
  ciudad: '', clasificacion: 'secundaria', horario: null,
  estatus: 'activo', contratoFileUrl: '', contratoFechaInicio: '', contratoFechaFin: ''
});

const emptyContactDraft = () => ({
  nombre: '', puesto: '', telefonoOffice: '', telefonoMovil: '',
  email: '', emailAlternativo: '', genero: '', estadoCivil: '',
  fechaCumpleanos: '', fechaAniversario: '', notas: '', estatus: 'activo'
});

const emptyDeviceDraft = () => ({
  clientId: '', branchId: '', idInmotika: '', codigoUnico: '',
  serial: '', tipo: '', categoria: '', proveedor: '',
  marca: '', linea: '', modelo: '', imac: '', dueno: '',
  estatus: 'Activo', frecuencia: '', tiempoPromedio: '',
  pasoAPaso: [], notas: ''
});

const emptyTecnicoDraft = () => ({
  nombre: '', identificacion: '', ciudad: '', zona: '',
  correo: '', celular: '', especialidad: '', estado: 'Activo'
});

const toClientDraft = (client) => ({
  ...emptyClientDraft(),
  ...client,
  nit: client?.nit ? client.nit.split('-')[0] : '',
  dv: client?.nit ? client.nit.split('-')[1] || '' : ''
});

const toBranchDraft = (branch) => ({
  ...emptyBranchDraft(),
  ...branch,
  estado_depto: branch?.estado_depto || branch?.estado || ''
});

const toContactDraft = (contact) => ({
  ...emptyContactDraft(),
  ...contact,
  puesto: contact?.puesto || contact?.cargo || '',
  telefonoMovil: contact?.telefonoMovil || contact?.celular || ''
});

const toDeviceDraft = (device, route = null) => ({
  ...emptyDeviceDraft(),
  ...device,
  clientId: device?.clientId || route?.clientId || '',
  branchId: device?.branchId || route?.branchId || '',
});

// --- VALIDATION HELPERS ---
const isEmailValid = (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isPhoneValid = (p) => !p || /^\+?[\d\s-]{7,}$/.test(p);

const validateClient = (draft) => {
  const errors = {};
  if (!String(draft.nombre || '').trim()) errors.nombre = 'Requerido';
  if (!String(draft.nit || '').trim()) errors.nit = 'Requerido';
  if (!String(draft.direccion || '').trim()) errors.direccion = 'Requerido';
  if (!String(draft.ciudad || '').trim()) errors.ciudad = 'Requerido';
  if (!isEmailValid(draft.email)) errors.email = 'Email inválido';
  return errors;
};

const validateBranch = (draft) => {
  const errors = {};
  if (!String(draft.nombre || '').trim()) errors.nombre = 'Requerido';
  if (!String(draft.direccion || '').trim()) errors.direccion = 'Requerido';
  if (!String(draft.ciudad || '').trim()) errors.ciudad = 'Requerido';
  return errors;
};

const validateContact = (draft) => {
  const errors = {};
  if (!String(draft.nombre || '').trim()) errors.nombre = 'Requerido';
  if (!String(draft.telefonoMovil || '').trim()) errors.telefonoMovil = 'Requerido';
  if (!isEmailValid(draft.email)) errors.email = 'Email inválido';
  return errors;
};

const validateDevice = (draft) => {
  const errors = {};
  if (!draft.clientId) errors.clientId = 'Requerido';
  if (!draft.branchId) errors.branchId = 'Requerido';
  if (!draft.codigoUnico) errors.codigoUnico = 'Requerido';
  if (!draft.serial) errors.serial = 'Requerido';
  return errors;
};

const validateTecnico = (draft) => {
  const errors = {};
  if (!String(draft.nombre || '').trim()) errors.nombre = 'Requerido';
  if (!String(draft.identificacion || '').trim()) errors.identificacion = 'Requerido';
  if (!isEmailValid(draft.correo)) errors.correo = 'Email inválido';
  if (!isPhoneValid(draft.celular)) errors.celular = 'Teléfono inválido';
  return errors;
};

// --- DATA APPLY HELPERS ---
const applyClientUpdate = (prevData, clientId, patch) => {
  const updatedClients = (prevData?.clientes || []).map((c) => {
    if (String(c.id) !== String(clientId)) return c;
    return { ...c, ...patch };
  });
  return { ...prevData, clientes: updatedClients };
};

const applyTecnicoUpsert = (prevData, tecnicoId, tecnicoDraft) => {
  const currentTecnicos = prevData?.tecnicos || [];
  const exists = currentTecnicos.some(t => String(t.id) === String(tecnicoId));
  const tecnicoMapped = { ...tecnicoDraft, id: tecnicoId };
  
  const updatedTecnicos = exists
    ? currentTecnicos.map(t => String(t.id) === String(tecnicoId) ? { ...t, ...tecnicoMapped } : t)
    : [tecnicoMapped, ...currentTecnicos];
    
  return { ...prevData, tecnicos: updatedTecnicos };
};

const applyBranchUpsert = (prevData, clientId, branchId, branchDraft) => {
  const updatedClients = (prevData?.clientes || []).map((c) => {
    if (String(c.id) !== String(clientId)) return c;
    const currentBranches = c.sucursales || [];
    const exists = currentBranches.some((b) => String(b.id) === String(branchId));
    const branchMapped = { ...branchDraft, id: branchId };
    const upserted = exists
      ? currentBranches.map((b) => (String(b.id) === String(branchId) ? { ...b, ...branchMapped } : b))
      : [...currentBranches, { ...branchMapped, contactos: [], dispositivos: [] }];
    return { ...c, sucursales: upserted };
  });
  return { ...prevData, clientes: updatedClients };
};

const applyContactUpsert = (prevData, clientId, branchId, contactId, contactDraft) => {
  const updatedClients = (prevData?.clientes || []).map((c) => {
    if (String(c.id) !== String(clientId)) return c;
    const updatedBranches = (c.sucursales || []).map((b) => {
      if (String(b.id) !== String(branchId)) return b;
      const currentContacts = b.contactos || [];
      const exists = currentContacts.some((ct) => String(ct.id) === String(contactId));
      const mapped = { 
        id: contactId, 
        ...contactDraft, 
        puesto: contactDraft.puesto, 
        telefonoMovil: contactDraft.telefonoMovil 
      };
      const upserted = exists
        ? currentContacts.map((ct) => (String(ct.id) === String(contactId) ? { ...ct, ...mapped } : ct))
        : [...currentContacts, mapped];
      return { ...b, contactos: upserted };
    });
    return { ...c, sucursales: updatedBranches };
  });
  return { ...prevData, clientes: updatedClients };
};

const applyDeviceUpsert = (prevData, originClientId, originBranchId, deviceId, deviceDraft) => {
  const currentDevices = prevData?.dispositivos || [];
  const existsGlobal = currentDevices.some(d => String(d.id) === String(deviceId));
  const deviceMapped = {
    ...deviceDraft,
    id: deviceId,
    historialVisitas: currentDevices.find(d => String(d.id) === String(deviceId))?.historialVisitas || [],
    historialTraslados: currentDevices.find(d => String(d.id) === String(deviceId))?.historialTraslados || []
  };

  const updatedGlobalDevices = existsGlobal
    ? currentDevices.map(d => String(d.id) === String(deviceId) ? deviceMapped : d)
    : [...currentDevices, deviceMapped];

  let updatedClients = prevData?.clientes || [];
  const newClientId = deviceDraft.clientId;
  const newBranchId = deviceDraft.branchId;
  const locationChanged = String(originClientId) !== String(newClientId) || String(originBranchId) !== String(newBranchId);

  if (locationChanged && originClientId && originBranchId) {
    updatedClients = updatedClients.map(c => {
      if (String(c.id) !== String(originClientId)) return c;
      const updatedBranches = (c.sucursales || []).map(b => {
        if (String(b.id) !== String(originBranchId)) return b;
        return { ...b, dispositivos: (b.dispositivos || []).filter(id => String(id) !== String(deviceId)) };
      });
      return { ...c, sucursales: updatedBranches };
    });
  }

  if (newClientId && newBranchId) {
    updatedClients = updatedClients.map(c => {
      if (String(c.id) !== String(newClientId)) return c;
      const updatedBranches = (c.sucursales || []).map(b => {
        if (String(b.id) !== String(newBranchId)) return b;
        const branchDevices = b.dispositivos || [];
        const exists = branchDevices.some(id => String(id) === String(deviceId));
        return { ...b, dispositivos: exists ? branchDevices : [...branchDevices, deviceId] };
      });
      return { ...c, sucursales: updatedBranches };
    });
  }

  return { ...prevData, dispositivos: updatedGlobalDevices, clientes: updatedClients };
};

const applyContactDelete = (prevData, clientId, branchId, contactId) => {
  const updatedClients = (prevData?.clientes || []).map((c) => {
    if (String(c.id) !== String(clientId)) return c;
    const updatedBranches = (c.sucursales || []).map((b) => {
      if (String(b.id) !== String(branchId)) return b;
      return { ...b, contactos: (b.contactos || []).filter((ct) => String(ct.id) !== String(contactId)) };
    });
    return { ...c, sucursales: updatedBranches };
  });
  return { ...prevData, clientes: updatedClients };
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Tabs tabs={[{key:'details', label:'Detalles generales'}, {key:'branches', label:'Sucursales'}]} active={route.activeTab} onChange={(k) => setStack(p => p.map((r, i) => i === p.length-1 ? {...r, activeTab: k} : r))} />
          {isEditing && (
            <Button onClick={handleSave} disabled={saveState.isSaving}>
              {saveState.isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Tipo de Persona" value={draft.tipoPersona} onChange={e => updateDraft(key, {tipoPersona: e.target.value})} options={[{value:'natural', label:'Persona Natural'}, {value:'juridica', label:'Persona Jurídica'}]} viewMode={!isEditing} icon={User} required />
          <Input label="Nombre / Razón Social" value={draft.nombre} onChange={e => updateDraft(key, {nombre: e.target.value})} error={showErrors ? errors.nombre : null} viewMode={!isEditing} icon={Building2} required />
          <NitInput label="NIT / RUT" nitValue={draft.nit} dvValue={draft.dv} onNitChange={v => updateDraft(key, {nit: v})} onDvChange={v => updateDraft(key, {dv: v})} error={showErrors ? (errors.nit || errors.dv) : null} viewMode={!isEditing} required />
          <LocationPickerRows countryValue={draft.pais} stateValue={draft.estado_depto} cityValue={draft.ciudad} direccion={draft.direccion} onLocationChange={l => updateDraft(key, {pais: l.country, estado_depto: l.state, ciudad: l.city})} onDireccionChange={v => updateDraft(key, {direccion: v})} direccionError={showErrors ? errors.direccion : null} viewMode={!isEditing} required />
        </div>
      </div>
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Tabs tabs={[{key:'details', label:'Detalles'}, {key:'contacts', label:'Contactos'}, {key:'devices', label:'Dispositivos'}]} active={route.activeTab} onChange={(k) => setStack(p => p.map((r, i) => i === p.length-1 ? {...r, activeTab: k} : r))} />
          {isEditing && <Button onClick={handleSave} disabled={saveState.isSaving}>Guardar</Button>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nombre de Sucursal" value={draft.nombre} onChange={e => updateDraft(key, {nombre: e.target.value})} error={showErrors ? errors.nombre : null} viewMode={!isEditing} icon={Building2} required />
          <LocationPickerRows countryValue={draft.pais} stateValue={draft.estado_depto} cityValue={draft.ciudad} direccion={draft.direccion} onLocationChange={l => updateDraft(key, {pais: l.country, estado_depto: l.state, ciudad: l.city})} onDireccionChange={v => updateDraft(key, {direccion: v})} direccionError={showErrors ? errors.direccion : null} viewMode={!isEditing} required />
        </div>
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
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          {isEditing && <Button onClick={handleSave} disabled={saveState.isSaving}>Guardar</Button>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nombre del Contacto" value={draft.nombre} onChange={e => updateDraft(key, {nombre: e.target.value})} error={showErrors ? errors.nombre : null} viewMode={!isEditing} icon={User} required />
          <Input label="Cargo / Puesto" value={draft.puesto} onChange={e => updateDraft(key, {puesto: e.target.value})} viewMode={!isEditing} icon={Briefcase} />
          <Input label="Teléfono Móvil" value={draft.telefonoMovil} onChange={e => updateDraft(key, {telefonoMovil: e.target.value})} error={showErrors ? errors.telefonoMovil : null} viewMode={!isEditing} icon={Phone} required />
          <Input label="Email" value={draft.email} onChange={e => updateDraft(key, {email: e.target.value})} error={showErrors ? errors.email : null} viewMode={!isEditing} icon={Mail} />
        </div>
      </div>
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

    const activeClient = (data?.clientes || []).find(c => String(c.id) === String(draft.clientId));
    const activeBranchOptions = activeClient ? (activeClient.sucursales || []).map(b => ({ value: b.id, label: b.nombre })) : [];

    const addStep = () => {
      const newStep = prompt('Descripción del paso de mantenimiento:');
      if (newStep && newStep.trim() !== '') {
        updateDraft(key, { pasoAPaso: [...(draft.pasoAPaso || []), newStep.trim()] });
      }
    };

    const removeStep = (idx) => {
      updateDraft(key, { pasoAPaso: (draft.pasoAPaso || []).filter((_, i) => i !== idx) });
    };

    const updateStep = (idx, value) => {
      const newSteps = [...(draft.pasoAPaso || [])];
      newSteps[idx] = value;
      updateDraft(key, { pasoAPaso: newSteps });
    };

    const moveStep = (idx, dir) => {
      const newSteps = [...(draft.pasoAPaso || [])];
      if (dir === 'up' && idx > 0) {
        [newSteps[idx - 1], newSteps[idx]] = [newSteps[idx], newSteps[idx - 1]];
      } else if (dir === 'down' && idx < newSteps.length - 1) {
        [newSteps[idx + 1], newSteps[idx]] = [newSteps[idx], newSteps[idx + 1]];
      }
      updateDraft(key, { pasoAPaso: newSteps });
    };

    return (
      <div className="space-y-8 pb-10">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
          <H2 className="text-gray-900 normal-case">{isEditing ? 'CONFIGURACIÓN DE DISPOSITIVO' : `VER DISPOSITIVO — ${draft.codigoUnico || 'SIN ID'}`}</H2>
          {isEditing && <Button onClick={handleSave} disabled={saveState.isSaving}>Guardar Equipo</Button>}
        </div>

        {/* 1. UBICACIÓN */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <MapPin size={18} className="text-gray-600" />
            <Label className="text-[11px] text-gray-700 tracking-wide">1. Ubicación</Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SearchableSelect 
              label="Cliente" 
              options={(data.clientes || []).map(c => ({ value: c.id, label: c.nombre }))} 
              value={draft.clientId} 
              onChange={val => updateDraft(key, { clientId: val, branchId: '' })} 
              isDisabled={!isEditing} 
              icon={Building2}
              required 
            />
            <SearchableSelect 
              label="Sucursal" 
              options={activeBranchOptions} 
              value={draft.branchId} 
              onChange={val => updateDraft(key, { branchId: val })} 
              isDisabled={!isEditing || !draft.clientId} 
              placeholder={draft.clientId ? 'Seleccionar sucursal...' : 'Primero seleccione un cliente'}
              icon={MapPin}
              required 
            />
          </div>
        </section>

        {/* 2. IDENTIFICADORES ÚNICOS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <Hash size={18} className="text-gray-600" />
            <Label className="text-[11px] text-gray-700 tracking-wide">2. Identificadores Únicos</Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input label="ID Inmotika" value={draft.idInmotika} onChange={e => updateDraft(key, {idInmotika: e.target.value})} viewMode={!isEditing} icon={Hash} placeholder="Ej: IMK-001" />
            <Input label="Código Único" value={draft.codigoUnico} onChange={e => updateDraft(key, {codigoUnico: e.target.value})} error={showErrors ? errors.codigoUnico : null} viewMode={!isEditing} icon={Hash} placeholder="Ej: CAM-771" required />
            <Input label="Número de Serie" value={draft.serial} onChange={e => updateDraft(key, {serial: e.target.value})} error={showErrors ? errors.serial : null} viewMode={!isEditing} icon={Hash} placeholder="SN-9988..." required />
          </div>
        </section>

        {/* 3. CLASIFICACIÓN TÉCNICA */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <Monitor size={18} className="text-gray-600" />
            <Label className="text-[11px] text-gray-700 tracking-wide">3. Clasificación Técnica</Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select label="Categoría" value={draft.categoria} onChange={e => updateDraft(key, {categoria: e.target.value})} viewMode={!isEditing} options={[ {value:'', label:'No especificada'}, {value:'Cámara', label:'Cámara'}, {value:'Sensor', label:'Sensor'}, {value:'Panel', label:'Panel'} ]} />
            <Input label="Proveedor" value={draft.proveedor} onChange={e => updateDraft(key, {proveedor: e.target.value})} viewMode={!isEditing} />
            <Input label="Marca" value={draft.marca} onChange={e => updateDraft(key, {marca: e.target.value})} viewMode={!isEditing} />
            <Input label="Línea" value={draft.linea} onChange={e => updateDraft(key, {linea: e.target.value})} viewMode={!isEditing} placeholder="Ej: Industrial / Residencial" />
            <Input label="Modelo" value={draft.modelo} onChange={e => updateDraft(key, {modelo: e.target.value})} viewMode={!isEditing} />
            <Input label="Dirección IMAC" value={draft.imac} onChange={e => updateDraft(key, {imac: e.target.value})} viewMode={!isEditing} icon={Navigation2} placeholder="00:1A:2B:..." />
          </div>
        </section>

        {/* 4. GESTIÓN DE PROPIEDAD */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <User size={18} className="text-gray-600" />
            <Label className="text-[11px] text-gray-700 tracking-wide">4. Gestión de Propiedad</Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select label="Dueño" value={draft.dueno} onChange={e => updateDraft(key, {dueno: e.target.value})} viewMode={!isEditing} options={[{value:'', label:'No especificado'}, {value:'Inmotika', label:'Inmotika'}, {value:'Cliente', label:'Cliente'}]} icon={User} />
            <Select label="Estado" value={draft.estatus} onChange={e => updateDraft(key, {estatus: e.target.value})} viewMode={!isEditing} options={[{value:'Activo', label:'Activo'}, {value:'Inactivo', label:'Inactivo'}, {value:'Mantenimiento', label:'Mantenimiento'}]} icon={Activity} />
          </div>
        </section>

        {/* 5. MANTENIMIENTO PREVENTIVO */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <ClipboardList size={18} className="text-gray-600" />
            <Label className="text-[11px] text-gray-700 tracking-wide">5. Mantenimiento Preventivo (Configuración)</Label>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <Input label="Frecuencia / Tiempo" value={draft.frecuencia} onChange={e => updateDraft(key, {frecuencia: e.target.value})} viewMode={!isEditing} placeholder="Ej: cada 6 meses / Anual" icon={Timer} />
            <div>
              <Label className="block mb-2">Notas Técnicas</Label>
              {isEditing ? (
                <textarea 
                  className="w-full p-3 border border-gray-200 rounded-lg min-h-[80px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={draft.notasTecnicas || draft.notas}
                  onChange={e => updateDraft(key, {notasTecnicas: e.target.value, notas: e.target.value})}
                />
              ) : (
                <Card className="p-4 bg-gray-50/50"><TextSmall className="text-gray-600">{draft.notasTecnicas || draft.notas || 'Sin notas.'}</TextSmall></Card>
              )}
            </div>
            
            <div className="pt-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-gray-500" />
                  <Subtitle className="uppercase text-gray-600 font-semibold text-[11px] tracking-wide">Pasos del Mantenimiento</Subtitle>
                </div>
                {isEditing && <IconButton icon={Plus} onClick={addStep} title="Añadir paso" className="hover:text-primary" />}
              </div>
              
              <div className="space-y-2">
                {!(draft.pasoAPaso?.length) ? (
                  <div className="p-8 border border-dashed border-gray-200 rounded-xl text-center">
                    <TextSmall className="text-gray-400 italic">No hay pasos configurados</TextSmall>
                  </div>
                ) : (
                  draft.pasoAPaso.map((step, idx) => (
                    <div key={idx} className="flex flex-row items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                      <div className="flex flex-col gap-1 text-gray-300">
                        {isEditing && <button onClick={() => moveStep(idx, 'up')} disabled={idx===0} className="hover:text-primary -mb-1"><ChevronUp size={14}/></button>}
                        <span className="font-bold text-gray-400 text-xs text-center w-full">{idx + 1}</span>
                        {isEditing && <button onClick={() => moveStep(idx, 'down')} disabled={idx===draft.pasoAPaso.length-1} className="hover:text-primary -mt-1"><ChevronDown size={14}/></button>}
                      </div>
                      <div className="flex-1">
                        {isEditing ? (
                          <input className="w-full bg-transparent text-sm text-gray-700 outline-none font-medium" value={step} onChange={e => updateStep(idx, e.target.value)} placeholder="Descripción del paso..." />
                        ) : (
                          <TextSmall className="font-medium text-gray-700">{step}</TextSmall>
                        )}
                      </div>
                      {isEditing && <IconButton icon={Trash2} onClick={() => removeStep(idx)} className="text-gray-300 hover:text-red-500" size={16} />}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 6. TRAZABILIDAD */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <ArrowRightLeft size={18} className="text-gray-600" />
            <Label className="text-[11px] text-gray-700 tracking-wide">6. Trazabilidad</Label>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ArrowRightLeft size={14} className="text-gray-400" />
                <Label className="uppercase text-[10px] tracking-wider text-gray-500">Historial de Traslados entre Sucursales</Label>
              </div>
              <Card className="p-0 border-none overflow-hidden shadow-sm">
                <Table>
                  <THead variant="dark"><tr><Th>Fecha</Th><Th>Origen</Th><Th>Destino</Th></tr></THead>
                  <TBody>
                    {!(draft.historialTraslados?.length) ? (
                      <Tr><Td colSpan={3} className="text-center py-4"><TextSmall className="italic text-gray-400">Sin traslados</TextSmall></Td></Tr>
                    ) : (
                      draft.historialTraslados.map((h, i) => (
                        <Tr key={i}><Td><TextSmall>{h.fecha}</TextSmall></Td><Td><TextSmall>{h.origen}</TextSmall></Td><Td><TextSmall>{h.destino}</TextSmall></Td></Tr>
                      ))
                    )}
                  </TBody>
                </Table>
              </Card>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-gray-400" />
                <Label className="uppercase text-[10px] tracking-wider text-gray-500">Historial de Visitas Técnicas Realizadas</Label>
              </div>
              <Card className="p-0 border-none overflow-hidden shadow-sm">
                <Table>
                  <THead variant="dark"><tr><Th>Fecha</Th><Th>Técnico</Th><Th>Tipo / Obs.</Th></tr></THead>
                  <TBody>
                    {!(draft.historialVisitas?.length) ? (
                      <Tr><Td colSpan={3} className="text-center py-4"><TextSmall className="italic text-gray-400">No hay registros</TextSmall></Td></Tr>
                    ) : (
                      draft.historialVisitas.map((h, i) => (
                        <Tr key={i}><Td><TextSmall>{h.fecha}</TextSmall></Td><Td><TextSmall>{h.tecnico}</TextSmall></Td><Td><TextSmall>{h.observaciones}</TextSmall></Td></Tr>
                      ))
                    )}
                  </TBody>
                </Table>
              </Card>
            </div>
          </div>
        </section>
      </div>
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
      <div className="space-y-6 pb-10">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
          <H2 className="text-gray-900 normal-case">{isEditing ? 'EDITAR TÉCNICO' : `VER TÉCNICO — ${draft.nombre || 'NUEVO'}`}</H2>
          {isEditing && <Button onClick={handleSave} disabled={saveState.isSaving}>Guardar Técnico</Button>}
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <User size={18} className="text-gray-600" />
            <Label className="text-[11px] text-gray-700 tracking-wide">1. Información del Técnico</Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Nombre del Técnico" value={draft.nombre} onChange={e => updateDraft(key, {nombre: e.target.value})} error={showErrors ? errors.nombre : null} viewMode={!isEditing} icon={User} required />
            <Input label="Documento / ID" value={draft.identificacion} onChange={e => updateDraft(key, {identificacion: e.target.value})} error={showErrors ? errors.identificacion : null} viewMode={!isEditing} icon={Hash} required />
            <Input label="Especialidad" value={draft.especialidad} onChange={e => updateDraft(key, {especialidad: e.target.value})} viewMode={!isEditing} icon={Briefcase} />
            <Input label="Zona / Región" value={draft.zona} onChange={e => updateDraft(key, {zona: e.target.value})} viewMode={!isEditing} icon={MapPin} />
            <Input label="Ciudad" value={draft.ciudad} onChange={e => updateDraft(key, {ciudad: e.target.value})} viewMode={!isEditing} icon={Building2} />
            <Select label="Estado" value={draft.estado} onChange={e => updateDraft(key, {estado: e.target.value})} viewMode={!isEditing} options={[{value:'Activo', label:'Activo'}, {value:'Inactivo', label:'Inactivo'}]} icon={Activity} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <Mail size={18} className="text-gray-600" />
            <Label className="text-[11px] text-gray-700 tracking-wide">2. Datos de Contacto</Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Teléfono / Celular" value={draft.celular} onChange={e => updateDraft(key, {celular: e.target.value})} error={showErrors ? errors.celular : null} viewMode={!isEditing} icon={Phone} required />
            <Input label="Correo Electrónico" value={draft.correo} onChange={e => updateDraft(key, {correo: e.target.value})} error={showErrors ? errors.correo : null} viewMode={!isEditing} icon={Mail} />
          </div>
        </section>
      </div>
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
