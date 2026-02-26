import { useEffect, useRef, useState } from 'react';
import { Activity, ArrowRightLeft, Barcode, Briefcase, Building2, Calendar, CheckCircle2, ClipboardList, Clock, Cpu, Edit2, Eye, Fingerprint, Globe, Hash, Heart, Layers, Mail, Map, MapPin, Package, Phone, Plus, Save, Settings, Shield, ShieldCheck, Smartphone, Tag, Trash2, User, Users, Zap } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import Input from '../ui/Input';
import Select from '../ui/Select';
import FileUploader from '../ui/FileUploader';
import Switch from '../ui/Switch';
import NitInput from '../ui/NitInput';
import LocationPicker from '../ui/LocationPicker';
import SearchableSelect from '../ui/SearchableSelect';
import { useLocationData } from '../../hooks/useLocationData';
import { Country as CscCountry, State as CscState } from 'country-state-city';
import { Table, TBody, THead, Td, Th, Tr } from '../ui/Table';
import { Label, TextSmall } from '../ui/Typography';
import SchedulePicker from '../ui/SchedulePicker';

const PAGE_SIZE = 10;
const AUTOSAVE_MS = 30_000;

const clampPage = (page, pageCount) => Math.min(Math.max(1, page), Math.max(1, pageCount));

const paginate = (items, page, pageSize) => {
  const safePageSize = Math.max(1, pageSize);
  const pageCount = Math.ceil((items?.length || 0) / safePageSize) || 1;
  const safePage = clampPage(page, pageCount);
  const start = (safePage - 1) * safePageSize;
  return { page: safePage, pageCount, slice: (items || []).slice(start, start + safePageSize) };
};

const isEmailValid = (value) => {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
};

const normalizePhone = (value) => String(value || '').replace(/[^\d+]/g, '');

const isPhoneValid = (value) => {
  if (!value) return true;
  const normalized = normalizePhone(value);
  const digits = normalized.replace(/[^\d]/g, '');
  return digits.length >= 7;
};

const LoadingInline = ({ label = 'Cargando…' }) => (
  <div className="flex items-center gap-3 py-6 text-gray-500">
    <div className="h-4 w-4 rounded-full border-2 border-gray-200 border-t-[#D32F2F] animate-spin" />
    <TextSmall className="text-gray-500">{label}</TextSmall>
  </div>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div className="flex bg-gray-100 p-1.5 rounded-xl w-fit">
    {tabs.map((t) => (
      <button
        key={t.key}
        type="button"
        onClick={() => onChange(t.key)}
        className={`px-6 py-2 rounded-lg transition-all ${active === t.key ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
      >
        <TextSmall className={`uppercase font-bold ${active === t.key ? 'text-primary' : 'text-gray-400'}`}>
          {t.label}
        </TextSmall>
      </button>
    ))}
  </div>
);

const Pager = ({ page, pageCount, onChange }) => (
  <div className="flex items-center justify-between pt-4">
    <TextSmall className="text-gray-400">{`Página ${page} de ${pageCount}`}</TextSmall>
    <div className="flex gap-2">
      <Button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        Anterior
      </Button>
      <Button type="button" onClick={() => onChange(page + 1)} disabled={page >= pageCount}>
        Siguiente
      </Button>
    </div>
  </div>
);

const ConfirmDialog = ({ isOpen, title = 'Confirmación', message, confirmLabel = 'Eliminar', cancelLabel = 'Cancelar', onConfirm, onCancel, isLoading = false }) => (
  <Modal isOpen={isOpen} onClose={onCancel} title={title} maxWidth="max-w-xl" durationMs={300}>
    <div className="space-y-6">
      <TextSmall className="text-gray-700">{message}</TextSmall>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Eliminando…' : confirmLabel}
        </Button>
      </div>
    </div>
  </Modal>
);

const entityKey = (type, id) => `${type}:${String(id ?? '')}`;

const getClientById = (data, clientId) => (data?.clientes || []).find((c) => String(c.id) === String(clientId)) || null;

const getBranchById = (client, branchId) => (client?.sucursales || []).find((b) => String(b.id) === String(branchId)) || null;

const getContactById = (branch, contactId) => (branch?.contactos || []).find((c) => String(c.id) === String(contactId)) || null;

const getDeviceById = (data, deviceId) => (data?.dispositivos || []).find((d) => String(d.id) === String(deviceId)) || null;

const routeKeyOf = (route) => {
  if (!route) return '';
  return [
    route.type,
    route.clientId ?? '',
    route.branchId ?? '',
    route.contactId ?? '',
    route.deviceId ?? '',
    route.mode ?? '',
    route.activeTab ?? ''
  ].join('|');
};

const getRouteContext = (data, route) => {
  const client = route?.clientId ? getClientById(data, route.clientId) : null;
  const branch = route?.branchId ? getBranchById(client, route.branchId) : null;
  const contact = route?.contactId ? getContactById(branch, route.contactId) : null;
  const device = route?.deviceId ? getDeviceById(data, route.deviceId) : null;
  return { client, branch, contact, device };
};

const ALL_COUNTRIES_LIST = CscCountry.getAllCountries().map(c => ({ value: c.isoCode, label: c.name, isoCode: c.isoCode }));

const FlagImg = ({ iso }) => iso ? (
  <img src={`https://flagcdn.com/w20/${iso.toLowerCase()}.png`} width="20" height="15" alt="" loading="lazy" className="rounded-sm object-cover" />
) : null;

const formatCountryOption = ({ label, isoCode }) => (
  <div className="flex items-center gap-2">
    <FlagImg iso={isoCode} />
    <span>{label}</span>
  </div>
);

const ViewCell = ({ label, icon: Icon, children }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[10px] font-bold text-gray-500 ml-1 uppercase">{label}</span>
    <div className="flex items-center gap-2 h-10 pl-1 text-sm font-semibold text-gray-900">
      {Icon && <Icon size={16} className="text-gray-400 shrink-0" />}
      {children ?? <span className="text-gray-400 italic">No especificado</span>}
    </div>
  </div>
);

const LocationPickerRows = ({
  countryValue, stateValue, cityValue, direccion,
  onLocationChange, onDireccionChange,
  viewMode, direccionError
}) => {
  const { states, cities, handleCountryChange, handleStateChange, handleCityChange } = useLocationData({
    countryValue, stateValue, onLocationChange
  });
  const countryData = CscCountry.getCountryByCode(countryValue);
  const stateData   = CscState.getStateByCodeAndCountry(stateValue, countryValue);

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
      />
      <SearchableSelect
        label="Estado / Depto"
        icon={Map}
        options={states}
        value={stateValue}
        onChange={handleStateChange}
        isDisabled={!countryValue}
        placeholder={countryValue ? 'Buscar estado...' : 'Primero elige un país'}
      />
      <SearchableSelect
        label="Ciudad"
        icon={MapPin}
        options={cities}
        value={cityValue}
        onChange={handleCityChange}
        isDisabled={!stateValue}
        placeholder={stateValue ? 'Buscar ciudad...' : 'Primero elige un estado'}
      />
      <Input
        label="Dirección Física"
        icon={MapPin}
        value={direccion}
        onChange={(e) => onDireccionChange(e.target.value)}
        error={direccionError}
        required
      />
    </>
  );
};

const emptyClientDraft = () => ({
  nombre: '',
  nit: '',
  dv: '',
  tipoPersona: 'juridica',
  rutUrl: '',
  logoUrl: '',
  telefono: '',
  email: '',
  direccion: '',
  pais: 'CO',
  estado_depto: '',
  city: '',
  ciudad: '',
  estatus: 'activo',
  fechaRegistro: ''
});

const emptyBranchDraft = () => ({
  nombre: '',
  direccion: '',
  pais: 'CO',
  estado_depto: '',
  ciudad: '',
  clasificacion: 'secundaria',
  horario: null, // Structured object { mon: { isOpen, start, end }, ... }
  estatus: 'activo',
  contratoFileUrl: '',
  contratoFechaInicio: '',
  contratoFechaFin: ''
});

const emptyContactDraft = () => ({
  nombre: '',
  puesto: '',
  telefonoOffice: '',
  telefonoMovil: '',
  email: '',
  emailAlternativo: '',
  genero: '',
  estadoCivil: '',
  fechaCumpleanos: '',
  fechaAniversario: '',
  notas: '',
  estatus: 'activo'
});

const emptyDeviceDraft = () => ({
  clientId: '',
  branchId: '',
  idInmotika: '',
  codigoUnico: '',
  serial: '',
  tipo: '',
  categoria: '',
  proveedor: '',
  marca: '',
  linea: '',
  modelo: '',
  imac: '',
  dueno: '',
  estatus: 'Activo',
  frecuencia: '',
  tiempoPromedio: '',
  pasoAPaso: [],
  notas: ''
});

const toClientDraft = (client) => ({
  ...emptyClientDraft(),
  nombre: client?.nombre || '',
  nit: client?.nit ? client.nit.split('-')[0] : '',
  dv: client?.nit ? client.nit.split('-')[1] || '' : '',
  tipoPersona: client?.tipoPersona || 'juridica',
  rutUrl: client?.rutUrl || '',
  logoUrl: client?.logoUrl || '',
  telefono: client?.telefono || '',
  email: client?.email || '',
  direccion: client?.direccion || '',
  pais: client?.pais || 'CO',
  estado_depto: client?.estado_depto || '',
  ciudad: client?.ciudad || '',
  estatus: client?.estatus || 'activo',
  fechaRegistro: client?.fechaRegistro || ''
});

const toBranchDraft = (branch) => ({
  ...emptyBranchDraft(),
  nombre: branch?.nombre || '',
  direccion: branch?.direccion || '',
  pais: branch?.pais || 'CO',
  estado_depto: branch?.estado_depto || branch?.estado || '',
  ciudad: branch?.ciudad || '',
  clasificacion: branch?.clasificacion || 'secundaria',
  horario: branch?.horario || null,
  estatus: branch?.estatus || 'activo',
  contratoFileUrl: branch?.contratoFileUrl || '',
  contratoFechaInicio: branch?.contratoFechaInicio || '',
  contratoFechaFin: branch?.contratoFechaFin || ''
});

const toContactDraft = (contact) => ({
  ...emptyContactDraft(),
  nombre: contact?.nombre || '',
  puesto: contact?.puesto || contact?.cargo || '',
  telefonoOffice: contact?.telefonoOffice || '',
  telefonoMovil: contact?.telefonoMovil || contact?.celular || '',
  email: contact?.email || '',
  emailAlternativo: contact?.emailAlternativo || '',
  genero: contact?.genero || '',
  estadoCivil: contact?.estadoCivil || '',
  fechaCumpleanos: contact?.fechaCumpleanos || '',
  fechaAniversario: contact?.fechaAniversario || '',
  notas: contact?.notas || '',
  estatus: contact?.estatus || 'activo'
});

const toDeviceDraft = (device, route = null) => ({
  ...emptyDeviceDraft(),
  clientId: device?.clientId || route?.clientId || '',
  branchId: device?.branchId || route?.branchId || '',
  idInmotika: device?.idInmotika || '',
  codigoUnico: device?.codigoUnico || '',
  serial: device?.serial || '',
  tipo: device?.tipo || '',
  categoria: device?.categoria || '',
  proveedor: device?.proveedor || '',
  marca: device?.marca || '',
  linea: device?.linea || '',
  modelo: device?.modelo || '',
  imac: device?.imac || '',
  dueno: device?.dueno || '',
  estatus: device?.estatus || 'Activo',
  frecuencia: device?.frecuencia || '',
  tiempoPromedio: device?.tiempoPromedio || '',
  pasoAPaso: Array.isArray(device?.pasoAPaso) ? [...device.pasoAPaso] : [],
  notas: device?.notas || ''
});

const validateClient = (draft) => {
  const errors = {};
  if (!String(draft.nombre || '').trim()) errors.nombre = 'Requerido';
  if (!String(draft.nit || '').trim()) errors.nit = 'Requerido';
  if (!String(draft.dv || '').trim()) errors.dv = 'Requerido';
  if (!String(draft.direccion || '').trim()) errors.direccion = 'Requerido';
  if (!String(draft.ciudad || '').trim()) errors.ciudad = 'Requerido';
  if (!isEmailValid(draft.email)) errors.email = 'Email inválido';
  if (!isPhoneValid(draft.telefono)) errors.telefono = 'Teléfono inválido';
  return errors;
};

const validateBranch = (draft) => {
  const errors = {};
  if (!String(draft.nombre || '').trim()) errors.nombre = 'Requerido';
  if (!String(draft.direccion || '').trim()) errors.direccion = 'Requerido';
  if (!String(draft.ciudad || '').trim()) errors.ciudad = 'Requerido';
  
  if (draft.contratoFechaInicio && draft.contratoFechaFin) {
    if (new Date(draft.contratoFechaInicio) > new Date(draft.contratoFechaFin)) {
      errors.contratoFechaFin = 'La fecha de fin debe ser posterior a la de inicio';
    }
  }
  return errors;
};

const validateContact = (draft) => {
  const errors = {};
  if (!String(draft.nombre || '').trim()) errors.nombre = 'Requerido';
  if (!String(draft.telefonoMovil || '').trim()) errors.telefonoMovil = 'Requerido';
  if (!isEmailValid(draft.email)) errors.email = 'Email inválido';
  if (!isEmailValid(draft.emailAlternativo)) errors.emailAlternativo = 'Email inválido';
  return errors;
};

const validateDevice = (draft) => {
  const errors = {};
  if (!String(draft.clientId || '').trim()) errors.clientId = 'Requerido';
  if (!String(draft.branchId || '').trim()) errors.branchId = 'Requerido';
  if (!String(draft.codigoUnico || '').trim()) errors.codigoUnico = 'Requerido';
  if (!String(draft.serial || '').trim()) errors.serial = 'Requerido';
  return errors;
};

const applyClientUpdate = (prevData, clientId, patch) => {
  const updatedClients = (prevData?.clientes || []).map((c) => {
    if (String(c.id) !== String(clientId)) return c;
    return { ...c, ...patch };
  });
  return { ...prevData, clientes: updatedClients };
};

const applyBranchUpsert = (prevData, clientId, branchId, branchDraft) => {
  const updatedClients = (prevData?.clientes || []).map((c) => {
    if (String(c.id) !== String(clientId)) return c;
    const currentBranches = c.sucursales || [];
    const exists = currentBranches.some((b) => String(b.id) === String(branchId));
    const branchMapped = {
      ...branchDraft,
      id: branchId
    };
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
        nombre: contactDraft.nombre,
        cargo: contactDraft.puesto,
        celular: contactDraft.telefonoMovil,
        telefonoOffice: contactDraft.telefonoOffice,
        telefonoMovil: contactDraft.telefonoMovil,
        email: contactDraft.email,
        emailAlternativo: contactDraft.emailAlternativo,
        genero: contactDraft.genero,
        estadoCivil: contactDraft.estadoCivil,
        fechaCumpleanos: contactDraft.fechaCumpleanos,
        fechaAniversario: contactDraft.fechaAniversario,
        notas: contactDraft.notas,
        estatus: contactDraft.estatus
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

const applyDeviceUpsert = (prevData, originalClientId, originalBranchId, deviceId, deviceDraft) => {
  // 1. Update global devices list
  const currentDevices = prevData?.dispositivos || [];
  const existsGlobal = currentDevices.some(d => String(d.id) === String(deviceId));
  
  const deviceMapped = {
    id: deviceId,
    clientId: deviceDraft.clientId,
    branchId: deviceDraft.branchId,
    idInmotika: deviceDraft.idInmotika,
    codigoUnico: deviceDraft.codigoUnico,
    serial: deviceDraft.serial,
    tipo: deviceDraft.tipo,
    categoria: deviceDraft.categoria,
    proveedor: deviceDraft.proveedor,
    marca: deviceDraft.marca,
    linea: deviceDraft.linea,
    modelo: deviceDraft.modelo,
    imac: deviceDraft.imac,
    dueno: deviceDraft.dueno,
    estatus: deviceDraft.estatus,
    frecuencia: deviceDraft.frecuencia,
    tiempoPromedio: deviceDraft.tiempoPromedio,
    pasoAPaso: deviceDraft.pasoAPaso,
    notas: deviceDraft.notas,
    historialVisitas: currentDevices.find(d => String(d.id) === String(deviceId))?.historialVisitas || [],
    historialTraslados: currentDevices.find(d => String(d.id) === String(deviceId))?.historialTraslados || []
  };

  const updatedGlobalDevices = existsGlobal
    ? currentDevices.map(d => String(d.id) === String(deviceId) ? deviceMapped : d)
    : [...currentDevices, deviceMapped];

  // 2. Handle branch mapping (and relocation)
  let updatedClients = prevData?.clientes || [];
  const newClientId = deviceDraft.clientId;
  const newBranchId = deviceDraft.branchId;

  const locationChanged = String(originalClientId) !== String(newClientId) || String(originalBranchId) !== String(newBranchId);

  // Remove from old branch if location changed
  if (locationChanged && originalClientId && originalBranchId) {
    updatedClients = updatedClients.map(c => {
      if (String(c.id) !== String(originalClientId)) return c;
      const updatedBranches = (c.sucursales || []).map(b => {
        if (String(b.id) !== String(originalBranchId)) return b;
        return { ...b, dispositivos: (b.dispositivos || []).filter(id => String(id) !== String(deviceId)) };
      });
      return { ...c, sucursales: updatedBranches };
    });
  }

  // Add to new branch
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

const storageKey = 'inmotika.clientModalDrafts.v1';

const loadDraftsFromStorage = () => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const saveDraftsToStorage = (drafts) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(drafts || {}));
  } catch {
    return;
  }
};

const ClientModalNavigator = ({ openParams, data, setData, onClose }) => {
  const [stack, setStack] = useState([]);
  const [drafts, setDrafts] = useState(() => (typeof window !== 'undefined' ? loadDraftsFromStorage() : {}));
  const [dirtyKeys, setDirtyKeys] = useState(() => new Set());
  const dirtyKeysRef = useRef(dirtyKeys);
  const [tabLoading, setTabLoading] = useState({});
  const [tabLoaded, setTabLoaded] = useState({});
  const tabLoadedRef = useRef(tabLoaded);
  const [confirmState, setConfirmState] = useState({ isOpen: false, payload: null, isLoading: false });
  const [saveState, setSaveState] = useState({ isSaving: false, savedAt: null });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    dirtyKeysRef.current = dirtyKeys;
  }, [dirtyKeys]);

  useEffect(() => {
    tabLoadedRef.current = tabLoaded;
  }, [tabLoaded]);

  useEffect(() => {
    if (!openParams) return;
    const t = setTimeout(() => {
      if (openParams.type === 'device') {
        const dId = openParams.deviceId || openParams.id;
        ensureDraft(entityKey('device', dId), () => toDeviceDraft(getDeviceById(data, dId)));
        setStack([{ type: 'device', deviceId: dId, mode: openParams.mode || 'view' }]);
      } else {
        setStack([{ type: 'client', clientId: openParams.clientId, mode: openParams.mode || 'view', activeTab: 'details' }]);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [openParams]);

  const top = stack[stack.length - 1] || null;
  const isOpen = Boolean(openParams) && Boolean(top);

  const [displayRoute, setDisplayRoute] = useState(null);
  const [contentVisible, setContentVisible] = useState(true);
  const transitionTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!isOpen || !top) {
        setDisplayRoute(null);
        setContentVisible(true);
        return;
      }

      if (!displayRoute) {
        setDisplayRoute(top);
        setContentVisible(true);
        return;
      }

      const nextKey = routeKeyOf(top);
      const currentKey = routeKeyOf(displayRoute);
      if (nextKey === currentKey) return;

      setContentVisible(false);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = setTimeout(() => {
        setDisplayRoute(top);
        setContentVisible(true);
        transitionTimerRef.current = null;
      }, 300);
    }, 0);

    return () => clearTimeout(t);
  }, [displayRoute, isOpen, top]);

  const route = displayRoute || top;
  const { client, branch, contact, device } = getRouteContext(data, route);

  const ensureDraft = (key, builder) => {
    setDrafts((prev) => {
      if (prev && prev[key]) return prev;
      const next = { ...(prev || {}) };
      next[key] = builder();
      return next;
    });
  };

  useEffect(() => {
    if (!top) return;
    const t = setTimeout(() => {
      if (top.type === 'client') {
        const key = entityKey('client', top.clientId);
        ensureDraft(key, () => toClientDraft(getClientById(data, top.clientId)));
      }
      if (top.type === 'branch') {
        const key = entityKey('branch', top.branchId);
        ensureDraft(key, () => toBranchDraft(getBranchById(getClientById(data, top.clientId), top.branchId)));
      }
      if (top.type === 'contact') {
        const key = entityKey('contact', top.contactId);
        ensureDraft(key, () => toContactDraft(getContactById(getBranchById(getClientById(data, top.clientId), top.branchId), top.contactId)));
      }
      if (top.type === 'device') {
        const key = entityKey('device', top.deviceId);
        ensureDraft(key, () => toDeviceDraft(getDeviceById(data, top.deviceId)));
      }
    }, 0);

    return () => clearTimeout(t);
  }, [data, top]);

  useEffect(() => {
    if (!isOpen || !top) return;
    const isEditing = top.mode === 'edit';
    if (!isEditing) return;

    const timer = setInterval(() => {
      if (dirtyKeysRef.current.size === 0) return;
      saveDraftsToStorage(drafts);
      setSaveState({ isSaving: false, savedAt: Date.now() });
    }, AUTOSAVE_MS);

    return () => clearInterval(timer);
  }, [drafts, isOpen, top]);

  const setActiveTab = (tabKey) => {
    if (!top) return;
    setStack((prev) => prev.map((r, idx) => (idx === prev.length - 1 ? { ...r, activeTab: tabKey } : r)));
  };

  const startLazyTab = (routeKey, tabKey) => {
    const cacheKey = `${routeKey}|${tabKey}`;
    if (tabLoadedRef.current[cacheKey]) return;
    setTabLoading((p) => ({ ...p, [cacheKey]: true }));
    setTimeout(() => {
      setTabLoading((p) => ({ ...p, [cacheKey]: false }));
      setTabLoaded((p) => ({ ...p, [cacheKey]: true }));
    }, 300);
  };

  useEffect(() => {
    if (!top) return;
    const rKey = top.type === 'client'
      ? entityKey('client', top.clientId)
      : top.type === 'branch'
        ? entityKey('branch', top.branchId)
        : top.type === 'contact'
          ? entityKey('contact', top.contactId)
          : entityKey('device', top.deviceId);
    const t = setTimeout(() => {
      startLazyTab(rKey, top.activeTab || 'details');
    }, 0);
    return () => clearTimeout(t);
  }, [top]);

  const markDirty = (key) => {
    setDirtyKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const clearDirty = (key) => {
    setDirtyKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const updateDraft = (key, patch) => {
    setDrafts((prev) => ({ ...(prev || {}), [key]: { ...(prev?.[key] || {}), ...patch } }));
    markDirty(key);
  };

  const popModal = () => {
    setStack((prev) => prev.slice(0, -1));
  };

  const closeAll = () => {
    setStack([]);
    onClose?.();
  };

  const openBranch = (clientId, branchId, mode = 'view') => {
    setStack((prev) => [...prev, { type: 'branch', clientId, branchId, mode, activeTab: 'details' }]);
  };

  const openContact = (clientId, branchId, contactId, mode = 'view') => {
    setStack((prev) => [...prev, { type: 'contact', clientId, branchId, contactId, mode, activeTab: 'details' }]);
  };

  const openDevice = (clientId, branchId, deviceId) => {
    setStack((prev) => [...prev, { type: 'device', clientId, branchId, deviceId, mode: 'view', activeTab: 'details' }]);
  };

  const clientTabs = [
    { key: 'details', label: 'Detalles generales' },
    { key: 'branches', label: 'Sucursales' }
  ];

  const branchTabs = [
    { key: 'details', label: 'Detalles generales' },
    { key: 'contacts', label: 'Contactos' },
    { key: 'devices', label: 'Dispositivos' }
  ];

  const routeTitle = (() => {
    if (!route) return '';
    if (route.type === 'client') return `${route.mode === 'edit' ? 'Editar' : 'Ver'} Cliente`;
    if (route.type === 'branch') return `${route.mode === 'edit' ? 'Editar' : 'Ver'} Sucursal`;
    if (route.type === 'contact') return `${route.mode === 'edit' ? 'Editar' : 'Ver'} Contacto`;
    if (route.type === 'device') return 'Ver Dispositivo';
    return '';
  })();

  const renderClientDetails = () => {
    const key = entityKey('client', route.clientId);
    const draft = drafts[key] || emptyClientDraft();
    const errors = validateClient(draft);
    const hasErrors = Object.keys(errors).length > 0;
    const isEditing = route.mode === 'edit';

    const handleSave = async () => {
      if (hasErrors) return;
      setSaveState((s) => ({ ...s, isSaving: true }));
      await new Promise((r) => setTimeout(r, 300));
      setData((prev) => applyClientUpdate(prev, route.clientId, {
        nombre: draft.nombre,
        nit: `${draft.nit}-${draft.dv}`,
        tipoPersona: draft.tipoPersona,
        rutUrl: draft.rutUrl,
        logoUrl: draft.logoUrl,
        telefono: draft.telefono,
        email: draft.email,
        direccion: draft.direccion,
        pais: draft.pais,
        estado_depto: draft.estado_depto,
        ciudad: draft.city || draft.ciudad, // city from LocationPicker might be mapped to ciudad
        estatus: draft.estatus,
        fechaRegistro: draft.fechaRegistro
      }));
      clearDirty(key);
      setSaveState({ isSaving: false, savedAt: Date.now() });
      setStack((prev) => prev.map((r, idx) => (idx === prev.length - 1 ? { ...r, mode: 'view' } : r)));
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="overflow-x-auto pb-1 sm:pb-0">
            <TabBar tabs={clientTabs} active={route.activeTab} onChange={setActiveTab} />
          </div>
          {route.mode === 'view' ? (
            <Button type="button" className="w-full sm:w-auto" onClick={() => setStack((prev) => prev.map((r, idx) => (idx === prev.length - 1 ? { ...r, mode: 'edit' } : r)))}>
              <Edit2 size={18} /> Editar
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:justify-end">
              {saveState.savedAt && (
                <TextSmall className="text-gray-400 order-2 sm:order-1">{`Guardado automático: ${new Date(saveState.savedAt).toLocaleTimeString()}`}</TextSmall>
              )}
              <Button type="button" className="w-full sm:w-auto order-1 sm:order-2" onClick={handleSave} disabled={saveState.isSaving || hasErrors}>
                {saveState.isSaving ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          )}
        </div>

        {tabLoading[`${key}|details`] ? (
          <LoadingInline label="Cargando detalles del cliente…" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
            {/* Row 1: Tipo de Persona | Razón Social */}
            <Select
              label="Tipo de Persona"
              options={[
                { value: 'natural', label: 'Persona Natural' },
                { value: 'juridica', label: 'Persona Jurídica' }
              ]}
              value={draft.tipoPersona}
              onChange={(e) => updateDraft(key, { tipoPersona: e.target.value })}
              viewMode={!isEditing}
              icon={Building2}
            />

            <Input
              label={draft.tipoPersona === 'juridica' ? 'Razón Social' : 'Nombre Completo'}
              icon={Building2}
              value={draft.nombre}
              viewMode={!isEditing}
              onChange={(e) => updateDraft(key, { nombre: e.target.value })}
              error={errors.nombre}
              required
              placeholder={draft.tipoPersona === 'juridica' ? 'Ej: Empresa S.A.S' : 'Ej: Juan Pérez'}
            />

            {/* Row 2: NIT/RUT | Estado del Cliente */}
            <NitInput
              nitValue={draft.nit}
              dvValue={draft.dv}
              onNitChange={(val) => updateDraft(key, { nit: val })}
              onDvChange={(val) => updateDraft(key, { dv: val })}
              viewMode={!isEditing}
              error={errors.nit || errors.dv}
              required
            />

            <Switch
              label="Estado del Cliente"
              checked={draft.estatus === 'activo'}
              onChange={(val) => updateDraft(key, { estatus: val ? 'activo' : 'inactivo' })}
              viewMode={!isEditing}
            />

            {/* Rows 3-4: País | Estado / Depto, Ciudad | Dirección */}
            <LocationPickerRows
              countryValue={draft.pais}
              stateValue={draft.estado_depto}
              cityValue={draft.ciudad}
              direccion={draft.direccion}
              onLocationChange={(loc) => updateDraft(key, {
                pais: loc.country,
                estado_depto: loc.state,
                ciudad: loc.city || loc.ciudad || ''
              })}
              onDireccionChange={(val) => updateDraft(key, { direccion: val })}
              viewMode={!isEditing}
              direccionError={errors.direccion}
            />

            {/* Soporte Legal & Logo — responsive stack/grid */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FileUploader
                label="Soporte Legal (RUT)"
                type="rut"
                isLoaded={!!draft.rutUrl}
                viewMode={!isEditing}
                onLoad={() => updateDraft(key, { rutUrl: 'uploaded-rut.pdf' })}
              />
              <FileUploader
                label="Logo del Cliente"
                type="logo"
                isLoaded={!!draft.logoUrl}
                viewMode={!isEditing}
                onLoad={() => updateDraft(key, { logoUrl: 'uploaded-logo.png' })}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderClientBranches = () => {
    const key = entityKey('client', route.clientId);
    const branches = client?.sucursales || [];
    const pagingKey = `${key}|branches`;
    const page = pagination[pagingKey] || 1;
    const { page: safePage, pageCount, slice } = paginate(branches, page, PAGE_SIZE);

    const handleNew = () => {
      const newId = `S-${Date.now()}`;
      ensureDraft(entityKey('branch', newId), () => emptyBranchDraft());
      openBranch(route.clientId, newId, 'edit');
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="overflow-x-auto pb-1 sm:pb-0">
            <TabBar tabs={clientTabs} active={route.activeTab} onChange={setActiveTab} />
          </div>
          <Button type="button" className="w-full sm:w-auto" onClick={handleNew}>
            <Plus size={18} /> Nueva Sucursal
          </Button>
        </div>

        {tabLoading[`${key}|branches`] ? (
          <LoadingInline label="Cargando sucursales…" />
        ) : (
          <>
            <div className="overflow-hidden rounded-md border border-gray-100">
              <Table>
                <THead variant="dark">
                  <tr>
                    <Th>Nombre</Th>
                    <Th>Dirección</Th>
                    <Th>Teléfono</Th>
                    <Th>Ciudad</Th>
                    <Th>Estado</Th>
                    <Th align="right">Acciones</Th>
                  </tr>
                </THead>
                <TBody>
                  {slice.length === 0 ? (
                    <Tr>
                      <Td colSpan={6} className="text-center py-8">
                        <TextSmall className="text-gray-400 italic">No hay sucursales registradas</TextSmall>
                      </Td>
                    </Tr>
                  ) : (
                    slice.map((b) => (
                      <Tr key={b.id}>
                        <Td><TextSmall className="text-gray-700">{b.nombre}</TextSmall></Td>
                        <Td><TextSmall className="text-gray-500">{b.direccion}</TextSmall></Td>
                        <Td><TextSmall className="text-gray-500">{b.telefono}</TextSmall></Td>
                        <Td><TextSmall className="text-gray-500">{b.ciudad}</TextSmall></Td>
                        <Td><TextSmall className="text-gray-500">{b.estado || 'No especificado'}</TextSmall></Td>
                        <Td align="right">
                          <div className="flex justify-end gap-3">
                            <IconButton icon={Eye} className="text-gray-300 hover:text-primary" onClick={() => openBranch(route.clientId, b.id, 'view')} />
                            <IconButton icon={Edit2} className="text-gray-300 hover:text-primary" onClick={() => openBranch(route.clientId, b.id, 'edit')} />
                          </div>
                        </Td>
                      </Tr>
                    ))
                  )}
                </TBody>
              </Table>
            </div>
            {branches.length > PAGE_SIZE && (
              <Pager
                page={safePage}
                pageCount={pageCount}
                onChange={(next) => setPagination((p) => ({ ...p, [pagingKey]: clampPage(next, pageCount) }))}
              />
            )}
          </>
        )}
      </div>
    );
  };

  const renderBranchDetails = () => {
    const key = entityKey('branch', route.branchId);
    const draft = drafts[key] || emptyBranchDraft();
    const errors = validateBranch(draft);
    const hasErrors = Object.keys(errors).length > 0;
    const isEditing = route.mode === 'edit';

    const handleSave = async () => {
      if (hasErrors) return;
      setSaveState((s) => ({ ...s, isSaving: true }));
      await new Promise((r) => setTimeout(r, 300));
      setData((prev) => applyBranchUpsert(prev, route.clientId, route.branchId, {
        nombre: draft.nombre,
        direccion: draft.direccion,
        pais: draft.pais,
        estado_depto: draft.estado_depto,
        ciudad: draft.ciudad,
        clasificacion: draft.clasificacion,
        horario: draft.horario,
        estatus: draft.estatus,
        contratoFileUrl: draft.contratoFileUrl,
        contratoFechaInicio: draft.contratoFechaInicio,
        contratoFechaFin: draft.contratoFechaFin
      }));
      clearDirty(key);
      setSaveState({ isSaving: false, savedAt: Date.now() });
      setStack((prev) => prev.map((r, idx) => (idx === prev.length - 1 ? { ...r, mode: 'view' } : r)));
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="overflow-x-auto pb-1 sm:pb-0">
            <TabBar tabs={branchTabs} active={route.activeTab} onChange={setActiveTab} />
          </div>
          {route.mode === 'view' ? (
            <Button type="button" className="w-full sm:w-auto" onClick={() => setStack((prev) => prev.map((r, idx) => (idx === prev.length - 1 ? { ...r, mode: 'edit' } : r)))}>
              <Edit2 size={18} /> Editar
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:justify-end">
              {saveState.savedAt && (
                <TextSmall className="text-gray-400 order-2 sm:order-1">{`Guardado automático: ${new Date(saveState.savedAt).toLocaleTimeString()}`}</TextSmall>
              )}
              <Button type="button" className="w-full sm:w-auto order-1 sm:order-2" onClick={handleSave} disabled={saveState.isSaving || hasErrors}>
                {saveState.isSaving ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          )}
        </div>

        {tabLoading[`${key}|details`] ? (
          <LoadingInline label="Cargando detalles de la sucursal…" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
            <Input
              label="Nombre de Sede"
              icon={Building2}
              value={draft.nombre}
              viewMode={!isEditing}
              onChange={(e) => updateDraft(key, { nombre: e.target.value })}
              error={errors.nombre}
              required
              placeholder="Ej: Sede Norte, Bodega 5"
            />

            <Select
              label="Clasificación"
              icon={Shield}
              value={draft.clasificacion}
              viewMode={!isEditing}
              onChange={(e) => updateDraft(key, { clasificacion: e.target.value })}
              options={[
                { value: 'principal', label: 'Sede Principal' },
                { value: 'secundaria', label: 'Sede Secundaria' }
              ]}
            />

            <LocationPickerRows
              countryValue={draft.pais}
              stateValue={draft.estado_depto}
              cityValue={draft.ciudad}
              direccion={draft.direccion}
              onLocationChange={(loc) => updateDraft(key, {
                pais: loc.country,
                estado_depto: loc.state,
                ciudad: loc.city || loc.ciudad || ''
              })}
              onDireccionChange={(val) => updateDraft(key, { direccion: val })}
              viewMode={!isEditing}
              direccionError={errors.direccion}
            />

            <SchedulePicker
              label="Configuración de Horarios"
              value={draft.horario}
              viewMode={!isEditing}
              onChange={(val) => updateDraft(key, { horario: val })}
              className="md:col-span-2 mt-4"
            />

            {/* Maintenance Contract - Moved to end and header removed for parity */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 pt-6 border-t border-gray-100 mt-2">
              <FileUploader
                label="Documento del Contrato"
                type="contrato"
                isLoaded={!!draft.contratoFileUrl}
                viewMode={!isEditing}
                onLoad={() => updateDraft(key, { contratoFileUrl: 'contrato_mantenimiento.pdf' })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Fecha Inicio Contrato"
                  icon={Calendar}
                  type="date"
                  value={draft.contratoFechaInicio}
                  viewMode={!isEditing}
                  onChange={(e) => updateDraft(key, { contratoFechaInicio: e.target.value })}
                />
                <Input
                  label="Fecha Fin Contrato"
                  icon={Calendar}
                  type="date"
                  value={draft.contratoFechaFin}
                  viewMode={!isEditing}
                  onChange={(e) => updateDraft(key, { contratoFechaFin: e.target.value })}
                  error={errors.contratoFechaFin}
                />
              </div>
            </div>

            <div className="md:col-span-2 pt-4 border-t border-gray-50">
              <Switch
                label="Estado de la Sede"
                checked={draft.estatus === 'activo'}
                onChange={(val) => updateDraft(key, { estatus: val ? 'activo' : 'inactivo' })}
                viewMode={!isEditing}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBranchContacts = () => {
    const key = entityKey('branch', route.branchId);
    const contacts = branch?.contactos || [];
    const pagingKey = `${key}|contacts`;
    const page = pagination[pagingKey] || 1;
    const { page: safePage, pageCount, slice } = paginate(contacts, page, PAGE_SIZE);

    const handleNew = () => {
      const newId = `C-${Date.now()}`;
      ensureDraft(entityKey('contact', newId), () => emptyContactDraft());
      openContact(route.clientId, route.branchId, newId, 'edit');
    };

    const requestDelete = (contactId) => {
      setConfirmState({ isOpen: true, payload: { contactId }, isLoading: false });
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="overflow-x-auto pb-1 sm:pb-0">
            <TabBar tabs={branchTabs} active={route.activeTab} onChange={setActiveTab} />
          </div>
          <Button type="button" className="w-full sm:w-auto" onClick={handleNew}>
            <Plus size={18} /> Nuevo Contacto
          </Button>
        </div>

        {tabLoading[`${key}|contacts`] ? (
          <LoadingInline label="Cargando contactos…" />
        ) : (
          <>
            <div className="overflow-hidden rounded-md border border-gray-100">
              <Table>
                <THead variant="dark">
                  <tr>
                    <Th>Nombre</Th>
                    <Th>Puesto</Th>
                    <Th>Teléfono</Th>
                    <Th>Email principal</Th>
                    <Th>Estatus</Th>
                    <Th align="right">Acciones</Th>
                  </tr>
                </THead>
                <TBody>
                  {slice.length === 0 ? (
                    <Tr>
                      <Td colSpan={6} className="text-center py-8">
                        <TextSmall className="text-gray-400 italic">No hay contactos registrados</TextSmall>
                      </Td>
                    </Tr>
                  ) : (
                    slice.map((ct) => (
                      <Tr key={ct.id}>
                        <Td><TextSmall className="text-gray-700">{ct.nombre}</TextSmall></Td>
                        <Td><TextSmall className="text-gray-500">{ct.puesto || ct.cargo}</TextSmall></Td>
                        <Td><TextSmall className="text-gray-500">{ct.telefonoMovil || ct.celular || ct.telefonoOffice}</TextSmall></Td>
                        <Td><TextSmall className="text-gray-500">{ct.email}</TextSmall></Td>
                        <Td><TextSmall className="text-gray-500">{ct.estatus || 'No especificado'}</TextSmall></Td>
                        <Td align="right">
                          <div className="flex justify-end gap-3">
                            <IconButton icon={Eye} className="text-gray-300 hover:text-primary" onClick={() => openContact(route.clientId, route.branchId, ct.id, 'view')} />
                            <IconButton icon={Edit2} className="text-gray-300 hover:text-primary" onClick={() => openContact(route.clientId, route.branchId, ct.id, 'edit')} />
                            <IconButton icon={Trash2} className="text-gray-300 hover:text-red-500" onClick={() => requestDelete(ct.id)} />
                          </div>
                        </Td>
                      </Tr>
                    ))
                  )}
                </TBody>
              </Table>
            </div>
            {contacts.length > PAGE_SIZE && (
              <Pager
                page={safePage}
                pageCount={pageCount}
                onChange={(next) => setPagination((p) => ({ ...p, [pagingKey]: clampPage(next, pageCount) }))}
              />
            )}
          </>
        )}

        <ConfirmDialog
          isOpen={confirmState.isOpen}
          message="¿Está seguro de eliminar este contacto? Esta acción no se puede deshacer"
          onCancel={() => setConfirmState({ isOpen: false, payload: null, isLoading: false })}
          isLoading={confirmState.isLoading}
          onConfirm={async () => {
            setConfirmState((s) => ({ ...s, isLoading: true }));
            await new Promise((r) => setTimeout(r, 300));
            const contactId = confirmState.payload?.contactId;
            if (contactId) {
              setData((prev) => applyContactDelete(prev, route.clientId, route.branchId, contactId));
            }
            setConfirmState({ isOpen: false, payload: null, isLoading: false });
          }}
        />
      </div>
    );
  };

  const renderBranchDevices = () => {
    const key = entityKey('branch', route.branchId);
    const deviceIds = branch?.dispositivos || [];
    const devices = deviceIds.map((id) => getDeviceById(data, id)).filter(Boolean);
    const pagingKey = `${key}|devices`;
    const page = pagination[pagingKey] || 1;
    const { page: safePage, pageCount, slice } = paginate(devices, page, PAGE_SIZE);

    const handleNew = () => {
      const newId = `D-${Date.now()}`;
      ensureDraft(entityKey('device', newId), () => emptyDeviceDraft());
      openDevice(route.clientId, route.branchId, newId, 'edit');
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="overflow-x-auto pb-1 sm:pb-0">
            <TabBar tabs={branchTabs} active={route.activeTab} onChange={setActiveTab} />
          </div>
          <Button type="button" className="w-full sm:w-auto" onClick={handleNew}>
            <Plus size={18} /> Nuevo Equipo
          </Button>
        </div>

        {tabLoading[`${key}|devices`] ? (
          <LoadingInline label="Cargando dispositivos…" />
        ) : (
          <>
            <div className="overflow-hidden rounded-md border border-gray-100">
              <Table>
                <THead variant="dark">
                  <tr>
                    <Th>Código Único</Th>
                    <Th>S/N</Th>
                    <Th>Tipo / Categoría</Th>
                    <Th>Marca / Modelo</Th>
                    <Th>Propiedad</Th>
                    <Th>Estatus</Th>
                    <Th align="right">Acción</Th>
                  </tr>
                </THead>
                <TBody>
                  {slice.length === 0 ? (
                    <Tr>
                      <Td colSpan={7} className="text-center py-8">
                        <TextSmall className="text-gray-400 italic">No hay dispositivos asignados</TextSmall>
                      </Td>
                    </Tr>
                  ) : (
                    slice.map((d) => (
                      <Tr key={d.id}>
                        <Td><TextSmall className="text-gray-700 font-bold">{d.codigoUnico || '—'}</TextSmall></Td>
                        <Td><TextSmall className="text-gray-500">{d.serial || '—'}</TextSmall></Td>
                        <Td>
                          <div className="flex flex-col">
                            <TextSmall className="text-gray-700">{d.tipo}</TextSmall>
                            <TextSmall className="text-gray-400 text-[10px] uppercase font-bold">{d.categoria || 'Sin categoría'}</TextSmall>
                          </div>
                        </Td>
                        <Td>
                          <div className="flex flex-col">
                            <TextSmall className="text-gray-700">{d.marca}</TextSmall>
                            <TextSmall className="text-gray-400 text-[10px] uppercase">{d.modelo}</TextSmall>
                          </div>
                        </Td>
                        <Td>
                          <div className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${d.dueno === 'Inmotika' ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-600'}`}>
                            {d.dueno || 'Cliente'}
                          </div>
                        </Td>
                        <Td><TextSmall className="text-gray-500">{d.estatus || 'Activo'}</TextSmall></Td>
                        <Td align="right">
                          <div className="flex justify-end gap-2">
                            <IconButton icon={Eye} title="Ver" className="text-gray-300 hover:text-primary" onClick={() => openDevice(route.clientId, route.branchId, d.id, 'view')} />
                            <IconButton icon={Edit2} title="Editar" className="text-gray-300 hover:text-primary" onClick={() => openDevice(route.clientId, route.branchId, d.id, 'edit')} />
                          </div>
                        </Td>
                      </Tr>
                    ))
                  )}
                </TBody>
              </Table>
            </div>
            {devices.length > PAGE_SIZE && (
              <Pager
                page={safePage}
                pageCount={pageCount}
                onChange={(next) => setPagination((p) => ({ ...p, [pagingKey]: clampPage(next, pageCount) }))}
              />
            )}
          </>
        )}
      </div>
    );
  };

  const renderContactModal = () => {
    const key = entityKey('contact', route.contactId);
    const draft = drafts[key] || emptyContactDraft();
    const errors = validateContact(draft);
    const hasErrors = Object.keys(errors).length > 0;
    const isEditing = route.mode === 'edit';

    const handleSave = async () => {
      if (hasErrors) return;
      setSaveState((s) => ({ ...s, isSaving: true }));
      await new Promise((r) => setTimeout(r, 300));
      setData((prev) => applyContactUpsert(prev, route.clientId, route.branchId, route.contactId, draft));
      clearDirty(key);
      setSaveState({ isSaving: false, savedAt: Date.now() });
      setStack((prev) => prev.map((r, idx) => (idx === prev.length - 1 ? { ...r, mode: 'view' } : r)));
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3">
          {route.mode === 'view' ? (
            <Button type="button" className="w-full sm:w-auto" onClick={() => setStack((prev) => prev.map((r, idx) => (idx === prev.length - 1 ? { ...r, mode: 'edit' } : r)))}>
              <Edit2 size={18} /> Editar
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:justify-end">
              {saveState.savedAt && (
                <TextSmall className="text-gray-400 order-2 sm:order-1">{`Guardado automático: ${new Date(saveState.savedAt).toLocaleTimeString()}`}</TextSmall>
              )}
              <Button type="button" className="w-full sm:w-auto order-1 sm:order-2" onClick={handleSave} disabled={saveState.isSaving || hasErrors}>
                {saveState.isSaving ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          )}
        </div>

        {tabLoading[`${key}|details`] ? (
          <LoadingInline label="Cargando contacto…" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
            <Input 
              label="Nombre completo" 
              icon={User} 
              value={draft.nombre} 
              viewMode={!isEditing} 
              onChange={(e) => updateDraft(key, { nombre: e.target.value })} 
              error={errors.nombre} 
              required 
              placeholder="Ej: Juan Pérez"
            />
            
            <Select
              label="Cargo"
              icon={Briefcase}
              value={draft.puesto}
              viewMode={!isEditing}
              onChange={(e) => updateDraft(key, { puesto: e.target.value })}
              options={[
                { value: '', label: 'No especificado' },
                { value: 'Directivo', label: 'Directivo' },
                { value: 'Administrativo', label: 'Administrativo' },
                { value: 'Ingeniería', label: 'Ingeniería' },
                { value: 'Mantenimiento', label: 'Mantenimiento' },
                { value: 'Comercial', label: 'Comercial' }
              ]}
            />

            <Input 
              label="Celular de contacto" 
              icon={Smartphone} 
              value={draft.telefonoMovil} 
              viewMode={!isEditing} 
              onChange={(e) => updateDraft(key, { telefonoMovil: e.target.value })} 
              error={errors.telefonoMovil} 
              required 
              placeholder="Ej: 300 123 4567"
            />

            <Input 
              label="Correo electrónico" 
              icon={Mail} 
              value={draft.email} 
              viewMode={!isEditing} 
              onChange={(e) => updateDraft(key, { email: e.target.value })} 
              error={errors.email} 
              placeholder="Ej: contacto@empresa.com"
            />

            <Select
              label="Género"
              icon={Users}
              value={draft.genero}
              viewMode={!isEditing}
              onChange={(e) => updateDraft(key, { genero: e.target.value })}
              options={[
                { value: '', label: 'No especificado' },
                { value: 'Masculino', label: 'Masculino' },
                { value: 'Femenino', label: 'Femenino' },
                { value: 'Otro', label: 'Otro' },
                { value: 'Prefiero no Decir', label: 'Prefiero no Decir' }
              ]}
            />

            <Select
              label="Estado civil"
              icon={Heart}
              value={draft.estadoCivil}
              viewMode={!isEditing}
              onChange={(e) => updateDraft(key, { estadoCivil: e.target.value })}
              options={[
                { value: '', label: 'No especificado' },
                { value: 'Soltero', label: 'Soltero' },
                { value: 'Casado', label: 'Casado' },
                { value: 'Unión Libre', label: 'Unión Libre' },
                { value: 'Divorciado', label: 'Divorciado' },
                { value: 'Viudo', label: 'Viudo' }
              ]}
            />

            <Input 
              label="Fecha de cumpleaños" 
              icon={Calendar} 
              type="date"
              value={draft.fechaCumpleanos} 
              viewMode={!isEditing} 
              onChange={(e) => updateDraft(key, { fechaCumpleanos: e.target.value })} 
            />

            <Input 
              label="Fecha de aniversario" 
              icon={Calendar} 
              type="date"
              value={draft.fechaAniversario} 
              viewMode={!isEditing} 
              onChange={(e) => updateDraft(key, { fechaAniversario: e.target.value })} 
            />

            <div className="md:col-span-2 space-y-2 mt-2">
              <Label>Notas / Comentarios</Label>
              {isEditing ? (
                <textarea
                  className="w-full min-h-[110px] rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] transition-all"
                  placeholder="Información adicional sobre el contacto..."
                  value={draft.notas}
                  onChange={(e) => updateDraft(key, { notas: e.target.value })}
                />
              ) : (
                <div className="w-full min-h-[44px] bg-gray-50/30 rounded-2xl border border-gray-50 px-4 py-3 text-sm font-semibold text-gray-900">
                  {draft.notas || <span className="text-gray-300 italic">Sin notas detalladas</span>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDeviceModal = () => {
    const key = entityKey('device', route.deviceId);
    const d = drafts[key] || toDeviceDraft(device);
    const errors = validateDevice(d);
    const hasErrors = Object.keys(errors).length > 0;
    const isEditing = route.mode === 'edit';

    const handleSave = async () => {
      if (hasErrors) return;
      setSaveState((s) => ({ ...s, isSaving: true }));
      await new Promise((r) => setTimeout(r, 300));
      setData((prev) => applyDeviceUpsert(prev, route.clientId, route.branchId, route.deviceId, d));
      clearDirty(key);
      setSaveState({ isSaving: false, savedAt: Date.now() });
      setStack((prev) => prev.map((r, idx) => (idx === prev.length - 1 ? { ...r, mode: 'view' } : r)));
    };

    const addPaso = () => {
      const nuevo = prompt('Ingrese el nuevo paso de mantenimiento:');
      if (nuevo) updateDraft(key, { pasoAPaso: [...(d.pasoAPaso || []), nuevo] });
    };

    const removePaso = (idx) => {
      updateDraft(key, { pasoAPaso: (d.pasoAPaso || []).filter((_, i) => i !== idx) });
    };

    const clients = data?.clientes || [];
    const currentClient = clients.find(c => String(c.id) === String(d.clientId));
    const branches = currentClient?.sucursales || [];

    return (
      <div className="space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3">
          {route.mode === 'view' ? (
            <Button type="button" className="w-full sm:w-auto" onClick={() => setStack((prev) => prev.map((r, idx) => (idx === prev.length - 1 ? { ...r, mode: 'edit' } : r)))}>
              <Edit2 size={18} /> Editar Equipo
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:justify-end">
              {saveState.savedAt && (
                <TextSmall className="text-gray-400 order-2 sm:order-1">{`Guardado automático: ${new Date(saveState.savedAt).toLocaleTimeString()}`}</TextSmall>
              )}
              <Button type="button" className="w-full sm:w-auto order-1 sm:order-2" onClick={handleSave} disabled={saveState.isSaving || hasErrors}>
                {saveState.isSaving ? 'Guardando…' : <><Save size={18} /> Guardar Equipo</>}
              </Button>
            </div>
          )}
        </div>

        {tabLoading[`${key}|details`] ? (
          <LoadingInline label="Cargando equipo…" />
        ) : (
          <div className="space-y-12">
            {/* 1. Ubicación */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <MapPin size={18} className="text-primary" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">1. Ubicación</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
                <SearchableSelect
                  label="Cliente"
                  icon={Briefcase}
                  options={clients.map(c => ({ value: c.id, label: c.nombre }))}
                  value={d.clientId}
                  viewMode={!isEditing || (route.clientId && route.type !== 'device')}
                  onChange={(val) => updateDraft(key, { clientId: val, branchId: '' })}
                  error={errors.clientId}
                  required
                />
                <SearchableSelect
                  label="Sucursal"
                  icon={Building2}
                  options={branches.map(b => ({ value: b.id, label: b.nombre }))}
                  value={d.branchId}
                  viewMode={!isEditing || (route.branchId && route.type !== 'device')}
                  onChange={(val) => updateDraft(key, { branchId: val })}
                  isDisabled={!d.clientId}
                  error={errors.branchId}
                  required
                  placeholder={d.clientId ? "Seleccione una sucursal..." : "Primero seleccione un cliente"}
                />
              </div>
            </div>

            {/* 2. Identificadores Únicos */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <Tag size={18} className="text-primary" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">2. Identificadores Únicos</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <Input label="ID Inmotika" icon={Hash} value={d.idInmotika} viewMode={!isEditing} onChange={(e) => updateDraft(key, { idInmotika: e.target.value })} placeholder="Ej: IMK-001" />
                <Input label="Código Único" icon={Fingerprint} value={d.codigoUnico} viewMode={!isEditing} onChange={(e) => updateDraft(key, { codigoUnico: e.target.value })} error={errors.codigoUnico} required placeholder="Ej: CAM-771" />
                <Input label="Número de Serie" icon={Barcode} value={d.serial} viewMode={!isEditing} onChange={(e) => updateDraft(key, { serial: e.target.value })} error={errors.serial} required placeholder="SN-9988..." />
              </div>
            </div>

            {/* 3. Clasificación Técnica */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <Layers size={18} className="text-primary" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">3. Clasificación Técnica</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <Select
                  label="Categoría"
                  icon={Layers}
                  value={d.categoria}
                  viewMode={!isEditing}
                  onChange={(e) => updateDraft(key, { categoria: e.target.value })}
                  options={[
                    { value: '', label: 'No especificada' },
                    { value: 'Seguridad Electrónica', label: 'Seguridad Electrónica' },
                    { value: 'Climatización', label: 'Climatización' },
                    { value: 'Energía', label: 'Energía' },
                    { value: 'Control de Acceso', label: 'Control de Acceso' }
                  ]}
                />
                <Input label="Proveedor" icon={Building2} value={d.proveedor} viewMode={!isEditing} onChange={(e) => updateDraft(key, { proveedor: e.target.value })} />
                <Input label="Marca" icon={ShieldCheck} value={d.marca} viewMode={!isEditing} onChange={(e) => updateDraft(key, { marca: e.target.value })} />
                <Input label="Línea" icon={Zap} value={d.linea} viewMode={!isEditing} onChange={(e) => updateDraft(key, { linea: e.target.value })} placeholder="Ej: Industrial / Residencial" />
                <Input label="Modelo" icon={Cpu} value={d.modelo} viewMode={!isEditing} onChange={(e) => updateDraft(key, { modelo: e.target.value })} />
                <Input label="Dirección iMAC" icon={Globe} value={d.imac} viewMode={!isEditing} onChange={(e) => updateDraft(key, { imac: e.target.value })} placeholder="00:1A:2B:..." />
              </div>
            </div>

            {/* 4. Gestión de Propiedad */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <Shield size={18} className="text-primary" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">4. Gestión de Propiedad</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
                <Select
                  label="Dueño"
                  icon={User}
                  value={d.dueno}
                  viewMode={!isEditing}
                  onChange={(e) => updateDraft(key, { dueno: e.target.value })}
                  options={[
                    { value: '', label: 'No especificado' },
                    { value: 'Inmotika', label: 'Inmotika' },
                    { value: 'Cliente', label: 'Cliente' }
                  ]}
                />
                <Select
                  label="Estado"
                  icon={Activity}
                  value={d.estatus}
                  viewMode={!isEditing}
                  onChange={(e) => updateDraft(key, { estatus: e.target.value })}
                  options={[
                    { value: 'Activo', label: 'Activo' },
                    { value: 'Para recuperar', label: 'Para recuperar' },
                    { value: 'Recomprado', label: 'Recomprado' }
                  ]}
                />
              </div>
            </div>

            {/* 5. Mantenimiento Preventivo */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <ClipboardList size={18} className="text-primary" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">5. Mantenimiento Preventivo (Configuración)</h3>
              </div>
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-5">
                  <Input label="Frecuencia / Tiempo" icon={Clock} value={d.frecuencia} viewMode={!isEditing} onChange={(e) => updateDraft(key, { frecuencia: e.target.value })} placeholder="Ej: cada 6 meses / Anual" />
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-gray-400">
                      <Settings size={14} /> Notas Técnicas
                    </Label>
                    {isEditing ? (
                      <textarea
                        className="w-full min-h-[100px] rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] transition-all"
                        value={d.notas}
                        onChange={(e) => updateDraft(key, { notas: e.target.value })}
                      />
                    ) : (
                      <div className="w-full bg-gray-50/30 rounded-2xl border border-gray-50 px-4 py-3 text-sm font-semibold text-gray-900">
                        {d.notas || <span className="text-gray-300 italic">Sin notas</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-primary uppercase tracking-wider text-[11px] flex items-center gap-2">
                      <CheckCircle2 size={16} /> Pasos del Mantenimiento
                    </Label>
                    {isEditing && (
                      <button onClick={addPaso} className="p-1 hover:bg-red-50 text-primary rounded-full transition-colors">
                        <Plus size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {Array.isArray(d.pasoAPaso) && d.pasoAPaso.length > 0 ? (
                      d.pasoAPaso.map((paso, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm group">
                          <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                          <span className="text-xs font-bold text-gray-700 flex-1">{paso}</span>
                          {isEditing && (
                            <button onClick={() => removePaso(idx)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                        <span className="text-xs text-gray-400 italic">No hay pasos configurados</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Trazabilidad */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <ArrowRightLeft size={18} className="text-primary" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">6. Trazabilidad</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Historial de Traslados */}
                <div className="space-y-3">
                  <Label className="text-gray-400 uppercase tracking-widest text-[10px] flex items-center gap-2">
                    <ArrowRightLeft size={14} /> Historial de traslados entre sucursales
                  </Label>
                  <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                    <Table size="sm">
                      <THead variant="dark">
                        <tr>
                          <Th size="sm">Fecha</Th>
                          <Th size="sm">Origen</Th>
                          <Th size="sm">Destino</Th>
                        </tr>
                      </THead>
                      <TBody>
                        {(d.historialTraslados || []).length === 0 ? (
                          <Tr><Td colSpan={3} className="text-center py-4 text-xs italic text-gray-300">Sin traslados</Td></Tr>
                        ) : (
                          d.historialTraslados.map((log, i) => (
                            <Tr key={i}>
                              <Td><TextSmall className="text-[11px] font-bold">{log.fecha}</TextSmall></Td>
                              <Td><TextSmall className="text-[11px] text-gray-500">{log.origen}</TextSmall></Td>
                              <Td><TextSmall className="text-[11px] text-gray-500 font-bold">{log.destino}</TextSmall></Td>
                            </Tr>
                          ))
                        )}
                      </TBody>
                    </Table>
                  </div>
                </div>

                {/* Historial de Visitas */}
                <div className="space-y-3">
                  <Label className="text-gray-400 uppercase tracking-widest text-[10px] flex items-center gap-2">
                    <Calendar size={14} /> Historial de visitas técnicas realizadas
                  </Label>
                  <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                    <Table size="sm">
                      <THead variant="dark">
                        <tr>
                          <Th size="sm">Fecha</Th>
                          <Th size="sm">Técnico</Th>
                          <Th size="sm">Tipo / Obs.</Th>
                        </tr>
                      </THead>
                      <TBody>
                        {(d.historialVisitas || []).length === 0 ? (
                          <Tr><Td colSpan={3} className="text-center py-4 text-xs italic text-gray-300">No hay registros</Td></Tr>
                        ) : (
                          d.historialVisitas.map((log, i) => (
                            <Tr key={i}>
                              <Td><TextSmall className="text-[11px] font-bold">{log.fecha}</TextSmall></Td>
                              <Td><TextSmall className="text-[11px] text-gray-700">{log.tecnico}</TextSmall></Td>
                              <Td>
                                <div className="flex flex-col">
                                  <div className="px-1.5 py-0.5 bg-gray-50 rounded text-[10px] font-bold uppercase w-fit">{log.tipo}</div>
                                  <TextSmall className="text-[9px] text-gray-400 truncate max-w-[100px]">{log.observaciones}</TextSmall>
                                </div>
                              </Td>
                            </Tr>
                          ))
                        )}
                      </TBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const body = (() => {
    if (!route) return null;
    if (route.type === 'client') return route.activeTab === 'branches' ? renderClientBranches() : renderClientDetails();
    if (route.type === 'branch') {
      if (route.activeTab === 'contacts') return renderBranchContacts();
      if (route.activeTab === 'devices') return renderBranchDevices();
      return renderBranchDetails();
    }
    if (route.type === 'contact') return renderContactModal();
    if (route.type === 'device') return renderDeviceModal();
    return null;
  })();

  const maxWidth = route?.type === 'device' ? 'max-w-5xl' : 'max-w-4xl';
  const handleClose = () => {
    if (stack.length <= 1) closeAll();
    else popModal();
  };

  const subtitle = (() => {
    if (!route) return '';
    if (route.type === 'client') return client?.nombre || '';
    if (route.type === 'branch') return branch?.nombre || '';
    if (route.type === 'contact') return contact?.nombre || '';
    if (route.type === 'device') {
      const d = device || (drafts[entityKey('device', route.deviceId)]);
      return d?.codigoUnico || d?.serial || 'Sin ID';
    }
    return '';
  })();

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={subtitle ? `${routeTitle} — ${subtitle}` : routeTitle} maxWidth={maxWidth} durationMs={300}>
      <div className={`transition-opacity duration-300 ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
        {body}
      </div>
    </Modal>
  );
};

export default ClientModalNavigator;
