import { useEffect, useRef, useState } from 'react';
import { Briefcase, Building2, Calendar, Clock, Edit2, Eye, Mail, Map, MapPin, Phone, Plus, Shield, Smartphone, Trash2, User } from 'lucide-react';
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
  telefono: '',
  email: '',
  direccion: '',
  pais: 'CO',
  estado_depto: '',
  ciudad: '',
  estatus: 'activo',
  fechaRegistro: ''
});

const emptyBranchDraft = () => ({
  nombre: '',
  direccion: '',
  telefono: '',
  email: '',
  ciudad: '',
  estado: '',
  gpsLat: '',
  gpsLng: '',
  horarioAtencion: '',
  diasLaborables: ''
});

const emptyContactDraft = () => ({
  nombre: '',
  puesto: '',
  telefonoOffice: '',
  telefonoMovil: '',
  email: '',
  emailAlternativo: '',
  horarioAtencion: '',
  notas: '',
  estatus: ''
});

const emptyDeviceDraft = () => ({
  serial: '',
  tipo: '',
  marca: '',
  modelo: '',
  ubicacion: '',
  estatus: '',
  fechaInstalacion: '',
  ultimoMantenimiento: '',
  garantia: '',
  notas: ''
});

const toClientDraft = (client) => ({
  ...emptyClientDraft(),
  nombre: client?.nombre || '',
  nit: client?.nit ? client.nit.split('-')[0] : '',
  dv: client?.nit ? client.nit.split('-')[1] || '' : '',
  tipoPersona: client?.tipoPersona || 'juridica',
  rutUrl: client?.rutUrl || '',
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
  telefono: branch?.telefono || '',
  email: branch?.email || '',
  ciudad: branch?.ciudad || '',
  estado: branch?.estado || '',
  gpsLat: branch?.gpsLat || '',
  gpsLng: branch?.gpsLng || '',
  horarioAtencion: branch?.horarioAtencion || '',
  diasLaborables: branch?.diasLaborables || ''
});

const toContactDraft = (contact) => ({
  ...emptyContactDraft(),
  nombre: contact?.nombre || '',
  puesto: contact?.puesto || contact?.cargo || '',
  telefonoOffice: contact?.telefonoOffice || '',
  telefonoMovil: contact?.telefonoMovil || contact?.celular || '',
  email: contact?.email || '',
  emailAlternativo: contact?.emailAlternativo || '',
  horarioAtencion: contact?.horarioAtencion || '',
  notas: contact?.notas || '',
  estatus: contact?.estatus || ''
});

const toDeviceDraft = (device) => ({
  ...emptyDeviceDraft(),
  serial: device?.serial || '',
  tipo: device?.tipo || '',
  marca: device?.marca || '',
  modelo: device?.modelo || '',
  ubicacion: device?.ubicacion || '',
  estatus: device?.estatus || '',
  fechaInstalacion: device?.fechaInstalacion || '',
  ultimoMantenimiento: device?.ultimoMantenimiento || '',
  garantia: device?.garantia || '',
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
  if (!isEmailValid(draft.email)) errors.email = 'Email inválido';
  if (!isPhoneValid(draft.telefono)) errors.telefono = 'Teléfono inválido';
  return errors;
};

const validateContact = (draft) => {
  const errors = {};
  if (!String(draft.nombre || '').trim()) errors.nombre = 'Requerido';
  if (!isEmailValid(draft.email)) errors.email = 'Email inválido';
  if (!isEmailValid(draft.emailAlternativo)) errors.emailAlternativo = 'Email inválido';
  if (!isPhoneValid(draft.telefonoOffice)) errors.telefonoOffice = 'Teléfono inválido';
  if (!isPhoneValid(draft.telefonoMovil)) errors.telefonoMovil = 'Teléfono inválido';
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
    const upserted = exists
      ? currentBranches.map((b) => (String(b.id) === String(branchId) ? { ...b, ...branchDraft, id: b.id } : b))
      : [...currentBranches, { ...branchDraft, id: branchId, contactos: [], dispositivos: [] }];
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
        horarioAtencion: contactDraft.horarioAtencion,
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
      setStack([{ type: 'client', clientId: openParams.clientId, mode: openParams.mode || 'view', activeTab: 'details' }]);
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
        <div className="flex items-center justify-between">
          <TabBar tabs={clientTabs} active={route.activeTab} onChange={setActiveTab} />
          {route.mode === 'view' ? (
            <Button type="button" onClick={() => setStack((prev) => prev.map((r, idx) => (idx === prev.length - 1 ? { ...r, mode: 'edit' } : r)))}>
              <Edit2 size={18} /> Editar
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              {saveState.savedAt && (
                <TextSmall className="text-gray-400">{`Guardado automático: ${new Date(saveState.savedAt).toLocaleTimeString()}`}</TextSmall>
              )}
              <Button type="button" onClick={handleSave} disabled={saveState.isSaving || hasErrors}>
                {saveState.isSaving ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          )}
        </div>

        {tabLoading[`${key}|details`] ? (
          <LoadingInline label="Cargando detalles del cliente…" />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
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
                ciudad: loc.city
              })}
              onDireccionChange={(val) => updateDraft(key, { direccion: val })}
              viewMode={!isEditing}
              direccionError={errors.direccion}
            />

            {/* Row 5: Soporte Legal — full width, centered */}
            <div className="col-span-2">
              <FileUploader
                label="Soporte Legal (RUT)"
                type="rut"
                isLoaded={!!draft.rutUrl}
                viewMode={!isEditing}
                onLoad={() => updateDraft(key, { rutUrl: 'uploaded-rut.pdf' })}
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
        <div className="flex items-center justify-between">
          <TabBar tabs={clientTabs} active={route.activeTab} onChange={setActiveTab} />
          <Button type="button" onClick={handleNew}>
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
        telefono: draft.telefono,
        email: draft.email,
        ciudad: draft.ciudad,
        estado: draft.estado,
        gpsLat: draft.gpsLat,
        gpsLng: draft.gpsLng,
        horarioAtencion: draft.horarioAtencion,
        diasLaborables: draft.diasLaborables
      }));
      clearDirty(key);
      setSaveState({ isSaving: false, savedAt: Date.now() });
      setStack((prev) => prev.map((r, idx) => (idx === prev.length - 1 ? { ...r, mode: 'view' } : r)));
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <TabBar tabs={branchTabs} active={route.activeTab} onChange={setActiveTab} />
          {route.mode === 'view' ? (
            <Button type="button" onClick={() => setStack((prev) => prev.map((r, idx) => (idx === prev.length - 1 ? { ...r, mode: 'edit' } : r)))}>
              <Edit2 size={18} /> Editar
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              {saveState.savedAt && (
                <TextSmall className="text-gray-400">{`Guardado automático: ${new Date(saveState.savedAt).toLocaleTimeString()}`}</TextSmall>
              )}
              <Button type="button" onClick={handleSave} disabled={saveState.isSaving || hasErrors}>
                {saveState.isSaving ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          )}
        </div>

        {tabLoading[`${key}|details`] ? (
          <LoadingInline label="Cargando detalles de la sucursal…" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Nombre" icon={Building2} value={draft.nombre} viewMode={!isEditing} onChange={(e) => updateDraft(key, { nombre: e.target.value })} error={errors.nombre} required />
            <Input label="Ciudad" icon={MapPin} value={draft.ciudad} viewMode={!isEditing} onChange={(e) => updateDraft(key, { ciudad: e.target.value })} error={errors.ciudad} required />
            <Input className="md:col-span-2" label="Dirección completa" icon={MapPin} value={draft.direccion} viewMode={!isEditing} onChange={(e) => updateDraft(key, { direccion: e.target.value })} error={errors.direccion} required />
            <Input label="Teléfono" icon={Phone} value={draft.telefono} viewMode={!isEditing} onChange={(e) => updateDraft(key, { telefono: e.target.value })} error={errors.telefono} />
            <Input label="Email" icon={Mail} value={draft.email} viewMode={!isEditing} onChange={(e) => updateDraft(key, { email: e.target.value })} error={errors.email} />
            <Input label="GPS Latitud" value={draft.gpsLat} viewMode={!isEditing} onChange={(e) => updateDraft(key, { gpsLat: e.target.value })} />
            <Input label="GPS Longitud" value={draft.gpsLng} viewMode={!isEditing} onChange={(e) => updateDraft(key, { gpsLng: e.target.value })} />
            <Input label="Horario de atención" icon={Clock} value={draft.horarioAtencion} viewMode={!isEditing} onChange={(e) => updateDraft(key, { horarioAtencion: e.target.value })} />
            <Input label="Días laborables" icon={Calendar} value={draft.diasLaborables} viewMode={!isEditing} onChange={(e) => updateDraft(key, { diasLaborables: e.target.value })} />
            <Select
              label="Estatus"
              icon={Shield}
              value={draft.estado}
              viewMode={!isEditing}
              onChange={(e) => updateDraft(key, { estado: e.target.value })}
              options={[
                { value: '', label: 'No especificado' },
                { value: 'Activa', label: 'Activa' },
                { value: 'Inactiva', label: 'Inactiva' }
              ]}
            />
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
        <div className="flex items-center justify-between gap-4">
          <TabBar tabs={branchTabs} active={route.activeTab} onChange={setActiveTab} />
          <Button type="button" onClick={handleNew}>
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

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <TabBar tabs={branchTabs} active={route.activeTab} onChange={setActiveTab} />
        </div>

        {tabLoading[`${key}|devices`] ? (
          <LoadingInline label="Cargando dispositivos…" />
        ) : (
          <>
            <div className="overflow-hidden rounded-md border border-gray-100">
              <Table>
                <THead variant="dark">
                  <tr>
                    <Th>Número de serie</Th>
                    <Th>Tipo</Th>
                    <Th>Marca</Th>
                    <Th>Modelo</Th>
                    <Th>Ubicación</Th>
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
                        <Td><TextSmall className="text-gray-700">{d.serial || 'No especificado'}</TextSmall></Td>
                        <Td><TextSmall className="text-gray-500">{d.tipo}</TextSmall></Td>
                        <Td><TextSmall className="text-gray-500">{d.marca}</TextSmall></Td>
                        <Td><TextSmall className="text-gray-500">{d.modelo}</TextSmall></Td>
                        <Td><TextSmall className="text-gray-500">{d.ubicacion || 'No especificado'}</TextSmall></Td>
                        <Td><TextSmall className="text-gray-500">{d.estatus || 'No especificado'}</TextSmall></Td>
                        <Td align="right">
                          <IconButton icon={Eye} className="text-gray-300 hover:text-primary" onClick={() => openDevice(route.clientId, route.branchId, d.id)} />
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
        <div className="flex items-center justify-end gap-3">
          {route.mode === 'view' ? (
            <Button type="button" onClick={() => setStack((prev) => prev.map((r, idx) => (idx === prev.length - 1 ? { ...r, mode: 'edit' } : r)))}>
              <Edit2 size={18} /> Editar
            </Button>
          ) : (
            <>
              {saveState.savedAt && (
                <TextSmall className="text-gray-400">{`Guardado automático: ${new Date(saveState.savedAt).toLocaleTimeString()}`}</TextSmall>
              )}
              <Button type="button" onClick={handleSave} disabled={saveState.isSaving || hasErrors}>
                {saveState.isSaving ? 'Guardando…' : 'Guardar'}
              </Button>
            </>
          )}
        </div>

        {tabLoading[`${key}|details`] ? (
          <LoadingInline label="Cargando contacto…" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Nombre completo" icon={User} value={draft.nombre} viewMode={!isEditing} onChange={(e) => updateDraft(key, { nombre: e.target.value })} error={errors.nombre} required />
            <Input label="Puesto" icon={Briefcase} value={draft.puesto} viewMode={!isEditing} onChange={(e) => updateDraft(key, { puesto: e.target.value })} />
            <Input label="Teléfono office" icon={Phone} value={draft.telefonoOffice} viewMode={!isEditing} onChange={(e) => updateDraft(key, { telefonoOffice: e.target.value })} error={errors.telefonoOffice} />
            <Input label="Teléfono móvil" icon={Smartphone} value={draft.telefonoMovil} viewMode={!isEditing} onChange={(e) => updateDraft(key, { telefonoMovil: e.target.value })} error={errors.telefonoMovil} />
            <Input label="Email" icon={Mail} value={draft.email} viewMode={!isEditing} onChange={(e) => updateDraft(key, { email: e.target.value })} error={errors.email} />
            <Input label="Email alternativo" icon={Mail} value={draft.emailAlternativo} viewMode={!isEditing} onChange={(e) => updateDraft(key, { emailAlternativo: e.target.value })} error={errors.emailAlternativo} />
            <Input label="Horario de atención" icon={Clock} value={draft.horarioAtencion} viewMode={!isEditing} onChange={(e) => updateDraft(key, { horarioAtencion: e.target.value })} />
            <Select
              label="Estatus"
              icon={Shield}
              value={draft.estatus}
              viewMode={!isEditing}
              onChange={(e) => updateDraft(key, { estatus: e.target.value })}
              options={[
                { value: '', label: 'No especificado' },
                { value: 'Activo', label: 'Activo' },
                { value: 'Inactivo', label: 'Inactivo' }
              ]}
            />
            <div className="md:col-span-2 space-y-2">
              <Label>Notas</Label>
              {isEditing ? (
                <textarea
                  className="w-full min-h-[110px] rounded-md border border-gray-100 bg-white px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F]"
                  value={draft.notas}
                  onChange={(e) => updateDraft(key, { notas: e.target.value })}
                />
              ) : (
                <div className="w-full min-h-[38px] text-sm font-semibold text-gray-900 flex items-start py-2">
                  {draft.notas || <span className="text-gray-300 italic">No especificado</span>}
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

    return (
      <div className="space-y-8">
        {tabLoading[`${key}|details`] ? (
          <LoadingInline label="Cargando dispositivo…" />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Número de serie" value={d.serial} viewMode />
              <Input label="Tipo" value={d.tipo} viewMode />
              <Input label="Marca" value={d.marca} viewMode />
              <Input label="Modelo" value={d.modelo} viewMode />
              <Input label="Ubicación" value={d.ubicacion} viewMode />
              <Input label="Estatus" value={d.estatus} viewMode />
              <Input label="Fecha de instalación" icon={Calendar} value={d.fechaInstalacion} viewMode />
              <Input label="Último mantenimiento" icon={Calendar} value={d.ultimoMantenimiento} viewMode />
              <Input className="md:col-span-2" label="Garantía" value={d.garantia} viewMode />
              <div className="md:col-span-2 space-y-2">
                <Label>Notas</Label>
                <div className="w-full text-sm font-semibold text-gray-900 flex items-start py-2">
                  {d.notas || <span className="text-gray-300 italic">No especificado</span>}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 space-y-4">
              <Label>Histórico de mantenimientos</Label>
              <div className="overflow-hidden rounded-md border border-gray-100">
                <Table>
                  <THead>
                    <tr>
                      <Th>Fecha</Th>
                      <Th>Técnico</Th>
                      <Th>Tipo</Th>
                      <Th>Observaciones</Th>
                    </tr>
                  </THead>
                  <TBody>
                    {(device?.historial || []).length === 0 ? (
                      <Tr>
                        <Td colSpan={4} className="text-center py-8">
                          <TextSmall className="text-gray-400 italic">Sin registros</TextSmall>
                        </Td>
                      </Tr>
                    ) : (
                      (device?.historial || []).map((log, idx) => (
                        <Tr key={idx}>
                          <Td><TextSmall className="text-gray-600">{log.fecha}</TextSmall></Td>
                          <Td><TextSmall className="text-gray-800">{log.tecnico}</TextSmall></Td>
                          <Td><TextSmall className="text-gray-600">{log.tipo}</TextSmall></Td>
                          <Td><TextSmall className="text-gray-500">{log.observaciones}</TextSmall></Td>
                        </Tr>
                      ))
                    )}
                  </TBody>
                </Table>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 space-y-4">
              <Label>Documentación adjunta</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileUploader label="Garantía" type="garantia" isLoaded={Boolean(device?.docs?.garantia)} viewMode />
                <FileUploader label="Manual" type="manual" isLoaded={Boolean(device?.docs?.manual)} viewMode />
                <FileUploader label="Acta de instalación" type="instalacion" isLoaded={Boolean(device?.docs?.instalacion)} viewMode />
                <FileUploader label="Fotos" type="fotos" isLoaded={Boolean(device?.docs?.fotos)} viewMode />
              </div>
            </div>
          </>
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
    if (route.type === 'device') return device?.codigoUnico || device?.serial || '';
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
