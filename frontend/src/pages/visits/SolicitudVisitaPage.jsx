import { useState, useMemo } from 'react';
import {
  ArrowLeft, Eye, FileText, Edit2, Trash2,
  Calendar, Building2, Cpu, Clock, AlertCircle, X, Tag, CheckCircle2,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ModuleHeader from '../../components/ui/ModuleHeader';
import GenericListView from '../../components/shared/GenericListView';
import FilterBar from '../../components/shared/FilterBar';
import DevicePickerModal from '../../components/shared/DevicePickerModal';
import { H2, H3, TextSmall, TextTiny, Label, Subtitle } from '../../components/ui/Typography';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Select from '../../components/ui/Select';
import VisitStatusBadge from '../../components/visits/VisitStatusBadge';
import InfoRow from '../../components/ui/InfoRow';
import SectionHeader from '../../components/ui/SectionHeader';
import VisitProgressPanel from '../../components/visits/VisitProgressPanel';
import { useSolicitudesVisita } from '../../hooks/useSolicitudesVisita';
import { useVisitas } from '../../hooks/useVisitas';
import { useCatalog } from '../../hooks/useCatalog';
import { useMasterData } from '../../context/MasterDataContext';
import { useAuth } from '../../context/AuthContext';
import { useClienteData } from '../../hooks/useClienteData';
import { useConfirm } from '../../context/ConfirmContext';
import { ROLES } from '../../utils/constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const emptySolicitud = () => ({
  clienteId: '',
  clienteNombre: '',
  sucursalId: '',
  sucursalNombre: '',
  tipoVisitaCodigo: '',
  dispositivoIds: [],
  dispositivosNombres: [],
  fechaSugerida: '',
  motivo: '',
});

/** Convierte una SolicitudVisita del hook en un draft editable */
const solicitudToDraft = (sol) => ({
  clienteId:         sol.clienteId,
  clienteNombre:     sol.clienteNombre,
  sucursalId:        sol.sucursalId,
  sucursalNombre:    sol.sucursalNombre,
  tipoVisitaCodigo:  sol.tipoVisitaCodigo,
  dispositivoIds:    sol.dispositivoIds,
  dispositivosNombres: sol.dispositivosNombres,
  fechaSugerida:     sol.fechaSugerida
    ? new Date(sol.fechaSugerida).toISOString().slice(0, 16)
    : '',
  motivo: sol.motivo,
});

// ─── Form compartido (crear / editar) ─────────────────────────────────────────
const SolicitudForm = ({
  draft, updateDraft, onSubmit, onCancel, saving,
  tipoVisitaSelectOptions, clienteOptions, sucursalOptions,
  dispositivoOptions, isEdit, isClienteLocked,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
  <div className="space-y-6 animate-in slide-in-from-right-12 duration-500">
    <header className="flex items-center justify-between bg-white p-4 rounded-md border border-gray-100 shadow-sm flex-wrap gap-3">
      <div className="flex items-center gap-4">
        <button
          onClick={onCancel}
          className="p-2 bg-gray-50 hover:bg-[#D32F2F] hover:text-white rounded-md transition-all shadow-sm"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <H2>{isEdit ? 'Editar Solicitud de Visita' : 'Nueva Solicitud de Visita'}</H2>
          <TextSmall className="text-gray-500">
            {isEdit ? 'Modifica los datos de la solicitud' : 'Complete los datos para solicitar una visita técnica'}
          </TextSmall>
        </div>
      </div>
      <Button onClick={onSubmit} disabled={saving} className="flex items-center gap-2">
        <FileText size={16} />
        {saving ? (isEdit ? 'Guardando...' : 'Enviando...') : (isEdit ? 'Guardar Cambios' : 'Enviar Solicitud')}
      </Button>
    </header>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="p-6 space-y-5">
          <SectionHeader icon={FileText} title="Datos de la Solicitud" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <Select
              label="Tipo de Mantenimiento"
              icon={AlertCircle}
              options={tipoVisitaSelectOptions}
              value={draft.tipoVisitaCodigo}
              onChange={e => updateDraft({ tipoVisitaCodigo: e.target.value })}
              required
            />

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Cliente <span className="text-red-500">*</span></Label>
              {isClienteLocked ? (
                <div className="flex items-center gap-2 h-10 px-3 bg-gray-50 border border-gray-200 rounded-md">
                  <Building2 size={14} className="text-gray-400 shrink-0" />
                  <span className="text-sm font-semibold text-gray-700 truncate">
                    {draft.clienteNombre || '—'}
                  </span>
                </div>
              ) : (
                <SearchableSelect
                  options={clienteOptions}
                  value={draft.clienteId ? { value: draft.clienteId, label: draft.clienteNombre } : null}
                  onChange={opt => updateDraft({
                    clienteId: opt?.value || '',
                    clienteNombre: opt?.label || '',
                    sucursalId: '',
                    sucursalNombre: '',
                    dispositivoIds: [],
                    dispositivosNombres: [],
                  })}
                  placeholder="Seleccionar cliente..."
                />
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Sucursal <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                options={sucursalOptions}
                value={draft.sucursalId ? { value: draft.sucursalId, label: draft.sucursalNombre } : null}
                onChange={opt => updateDraft({
                  sucursalId: opt?.value || '',
                  sucursalNombre: opt?.label || '',
                  dispositivoIds: [],
                  dispositivosNombres: [],
                })}
                placeholder={draft.clienteId ? 'Seleccionar sucursal...' : 'Seleccione un cliente primero'}
                isDisabled={!draft.clienteId}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">
                Fecha y Hora Sugerida <span className="text-red-500">*</span>
              </Label>
              <input
                type="datetime-local"
                value={draft.fechaSugerida}
                onChange={e => updateDraft({ fechaSugerida: e.target.value })}
                className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm font-semibold bg-white focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] transition-all"
              />
            </div>
          </div>

          {/* ── Dispositivos a Revisar — Device Picker ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Dispositivos a Revisar <span className="text-red-500">*</span>
              </Label>
              {draft.dispositivoIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => updateDraft({ dispositivoIds: [], dispositivosNombres: [] })}
                  className="text-[10px] text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <X size={10} /> Limpiar selección
                </button>
              )}
            </div>

            {/* Botón de apertura del picker */}
            <button
              type="button"
              disabled={!draft.sucursalId}
              onClick={() => setPickerOpen(true)}
              className={`w-full flex items-center justify-between gap-3 h-10 px-3 border rounded-md text-sm transition-all ${
                !draft.sucursalId
                  ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                  : draft.dispositivoIds.length > 0
                    ? 'border-[#D32F2F] bg-white text-gray-700 hover:bg-red-50'
                    : 'border-gray-300 bg-white text-gray-400 hover:border-gray-400'
              }`}
            >
              <span className="flex items-center gap-2">
                <Cpu size={14} className="shrink-0" />
                {!draft.sucursalId
                  ? 'Seleccione una sucursal primero'
                  : draft.dispositivoIds.length > 0
                    ? `${draft.dispositivoIds.length} dispositivo${draft.dispositivoIds.length !== 1 ? 's' : ''} seleccionado${draft.dispositivoIds.length !== 1 ? 's' : ''}`
                    : 'Seleccionar dispositivos...'
                }
              </span>
              {draft.dispositivoIds.length > 0 && (
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#D32F2F] text-white text-[10px] font-bold leading-none">
                  {draft.dispositivoIds.length}
                </span>
              )}
            </button>

            {/* Listado de dispositivos seleccionados agrupados por categoría */}
            {draft.dispositivoIds.length > 0 && (
              <div className="mt-2 space-y-3">
                {(() => {
                  // Agrupar ids por categoría
                  const groups = {};
                  draft.dispositivoIds.forEach(id => {
                    const dev = dispositivoOptions.find(o => o.value === id);
                    const cat = dev?.categoria || 'Sin categoría';
                    if (!groups[cat]) groups[cat] = [];
                    groups[cat].push({ id, dev });
                  });
                  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => (
                    <div key={cat}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
                        <Tag size={9} /> {cat}
                      </p>
                      <ul className="space-y-1">
                        {items.map(({ id, dev }) => (
                          <li key={id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-gray-50 border border-gray-100 group">
                            <span className="flex items-center gap-1.5 text-xs text-gray-700 font-medium min-w-0">
                              <Cpu size={11} className="text-gray-400 shrink-0" />
                              <span className="truncate">{dev?.label || id}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => updateDraft({
                                dispositivoIds:      draft.dispositivoIds.filter(x => x !== id),
                                dispositivosNombres: draft.dispositivosNombres?.filter((_, i) => draft.dispositivoIds[i] !== id) || [],
                              })}
                              className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
              Observación / Motivo <span className="text-red-500">*</span>
            </Label>
            <textarea
              value={draft.motivo}
              onChange={e => updateDraft({ motivo: e.target.value })}
              rows={3}
              placeholder="Describe el motivo o detalles adicionales de la solicitud..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-semibold resize-y focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] transition-all"
            />
          </div>
        </Card>
      </div>

      <div>
        <Card className="p-5 bg-linear-to-br from-blue-50 to-indigo-50 border-blue-100 space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-blue-600" />
            <Label className="text-sm font-bold text-blue-900">Información</Label>
          </div>
          <TextSmall className="text-blue-800 text-xs leading-relaxed">
            {isEdit
              ? 'Solo puedes editar solicitudes en estado Pendiente. Los cambios se verán reflejados de inmediato.'
              : 'Al enviar la solicitud, el equipo de coordinación la revisará y asignará los técnicos y fechas correspondientes.'}
          </TextSmall>
        </Card>
      </div>
    </div>

    <DevicePickerModal
      isOpen={pickerOpen}
      onClose={() => setPickerOpen(false)}
      devices={dispositivoOptions}
      selected={draft.dispositivoIds}
      onConfirm={ids => updateDraft({
        dispositivoIds:      ids,
        dispositivosNombres: ids.map(id => dispositivoOptions.find(o => o.value === id)?.label || id),
      })}
    />
  </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const SolicitudVisitaPage = () => {
  const [mode,                setMode]               = useState('list'); // 'list' | 'create' | 'edit' | 'view'
  const [selectedSol,         setSelectedSol]        = useState(null);
  const [draft,               setDraft]              = useState(emptySolicitud());
  const [filters,             setFilters]            = useState({ cliente: [], sucursal: [], estado: [], tipo: [], fechaDesde: '', fechaHasta: '' });
  const [solicitudResult,    setSolicitudResult]    = useState(null); // { id, isUpdate, error?, message? } → modal resultado

  // ── Data ────────────────────────────────────────────────────────────────────
  const { user } = useAuth();
  const userRole = user?.role;
  const isClienteRole = userRole === ROLES.CLIENTE;

  const confirm = useConfirm();

  const { solicitudes, loading, saving, createSolicitud, updateSolicitud, cancelSolicitud } = useSolicitudesVisita();
  const { visitas } = useVisitas();
  const { data } = useMasterData();
  const { options: tipoVisitaOptions } = useCatalog('TIPO_VISITA');
  const { options: estadoVisitaOptions } = useCatalog('ESTADO_VISITA');

  // Para rol CLIENTE: datos del contacto autenticado
  const { cliente: clienteContacto, sucursales: sucursalesContacto, dispositivos: dispositivosContacto } = useClienteData();

  // Auto-populate draft con el cliente del contacto al abrir el formulario de creación.
  // Se hace durante el render (no en effect) para evitar setState-in-effect.
  const clienteContactoId = clienteContacto?.id ? String(clienteContacto.id) : '';
  const clienteContactoNombre = clienteContacto?.razon_social || clienteContacto?.nombre || '';
  if (isClienteRole && mode === 'create' && clienteContactoId && draft.clienteId !== clienteContactoId) {
    setDraft(prev => ({ ...prev, clienteId: clienteContactoId, clienteNombre: clienteContactoNombre }));
  }

  const tipoVisitaSelectOptions = useMemo(() => [
    { value: '', label: 'Seleccionar tipo...' },
    ...tipoVisitaOptions.map(o => ({ value: o.codigo, label: o.label })),
  ], [tipoVisitaOptions]);

  const clientes = useMemo(() => data?.clientes || [], [data?.clientes]);

  const clienteOptions = useMemo(
    () => clientes.map(c => ({ value: c.id, label: c.nombre || c.razonSocial || c.razon_social })),
    [clientes]
  );

  const sucursalOptions = useMemo(() => {
    if (!draft.clienteId) return [];
    // Para CLIENTE: usa solo las sucursales de su contacto
    if (isClienteRole) {
      return sucursalesContacto.map(s => ({ value: String(s.id), label: s.nombre }));
    }
    const c = clientes.find(cl => String(cl.id) === String(draft.clienteId));
    return (c?.sucursales || []).map(s => ({ value: s.id, label: s.nombre }));
  }, [isClienteRole, sucursalesContacto, clientes, draft.clienteId]);

  const dispositivoOptions = useMemo(() => {
    if (!draft.sucursalId) return [];
    const getName = (val) => (typeof val === 'object' ? val?.nombre : val) || '';
    // Para CLIENTE: filtra de su propio conjunto de dispositivos
    if (isClienteRole) {
      return dispositivosContacto
        .filter(d => String(d.sucursal_id || d.branchId) === String(draft.sucursalId))
        .map(d => ({
          value:      String(d.id),
          label:      d.serial || d.id_inmotika || d.idInmotika || d.codigo_unico || `Dispositivo ${d.id}`,
          serial:     d.serial || '',
          idInmotika: d.id_inmotika || d.idInmotika || '',
          modelo:     d.modelo || '',
          categoria:  getName(d.categoria),
          marca:      getName(d.marca),
          proveedor:  getName(d.proveedor),
        }));
    }
    return (data?.dispositivos || [])
      .filter(d => String(d.branchId) === String(draft.sucursalId))
      .map(d => ({
        value:      String(d.id),
        label:      d.serial || d.idInmotika || d.codigoUnico || d.modelo || String(d.id),
        serial:     d.serial || '',
        idInmotika: d.id_inmotika || d.idInmotika || '',
        modelo:     d.modelo || '',
        categoria:  getName(d.categoria),
        marca:      getName(d.marca),
        proveedor:  getName(d.proveedor),
      }));
  }, [isClienteRole, dispositivosContacto, data?.dispositivos, draft.sucursalId]);

  // Opciones para FilterBar
  const clienteFilterOptions = useMemo(() => {
    const seen = new Set();
    return solicitudes
      .map(s => ({ value: s.clienteId || '', label: s.clienteNombre || '' }))
      .filter(o => o.value && o.label && !seen.has(o.value) && seen.add(o.value))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [solicitudes]);

  const sucursalFilterOptions = useMemo(() => {
    const selectedClientes = filters.cliente;
    const seen = new Set();
    return solicitudes
      .filter(s => selectedClientes.length === 0 || selectedClientes.includes(s.clienteId || ''))
      .map(s => ({ value: s.sucursalId || '', label: s.sucursalNombre || '', parentValue: s.clienteId || '' }))
      .filter(o => {
        const key = `${o.value}__${o.parentValue}`;
        return o.value && o.label && !seen.has(key) && seen.add(key);
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [solicitudes, filters.cliente]);

  const estadoFilterOptions = useMemo(() => {
    const seen = new Set();
    return solicitudes
      .map(s => ({ value: s.estadoCodigo || '', label: s.estadoLabel || s.estadoCodigo || '' }))
      .filter(o => o.value && !seen.has(o.value) && seen.add(o.value))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [solicitudes]);

  const tipoFilterOptions = useMemo(() => {
    const seen = new Set();
    return solicitudes
      .map(s => ({ value: s.tipoVisitaCodigo || s.tipoVisitaLabel || '', label: s.tipoVisitaLabel || '' }))
      .filter(o => o.value && o.label && !seen.has(o.value) && seen.add(o.value))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [solicitudes]);

  const filterDefs = [
    { key: 'cliente',    label: 'Cliente',      options: clienteFilterOptions,  multi: true },
    { key: 'sucursal',   label: 'Sucursal',     options: sucursalFilterOptions,  multi: true, dependsOn: 'cliente', dependsOnLabel: 'un cliente' },
    { key: 'estado',     label: 'Estado',       options: estadoFilterOptions,    multi: true },
    { key: 'tipo',       label: 'Tipo',         options: tipoFilterOptions,      multi: true },
    { key: 'fechaDesde', label: 'Fecha desde',  type: 'date', dateRole: 'desde', linkedTo: 'fechaHasta' },
    { key: 'fechaHasta', label: 'Fecha hasta',  type: 'date', dateRole: 'hasta', linkedTo: 'fechaDesde' },
  ];

  const filtered = useMemo(() => {
    let list = solicitudes;
    if (filters.cliente.length > 0)
      list = list.filter(s => filters.cliente.includes(s.clienteId || ''));
    if (filters.sucursal.length > 0)
      list = list.filter(s => filters.sucursal.includes(s.sucursalId || ''));
    if (filters.estado.length > 0)
      list = list.filter(s => filters.estado.includes(s.estadoCodigo || ''));
    if (filters.tipo.length > 0)
      list = list.filter(s => filters.tipo.includes(s.tipoVisitaCodigo || s.tipoVisitaLabel || ''));
    if (filters.fechaDesde)
      list = list.filter(s => s.fechaSugerida && s.fechaSugerida >= filters.fechaDesde);
    if (filters.fechaHasta)
      list = list.filter(s => s.fechaSugerida && s.fechaSugerida <= filters.fechaHasta + 'T23:59:59');
    return list;
  }, [solicitudes, filters]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const updateDraft = (patch) => setDraft(prev => ({ ...prev, ...patch }));

  const handleGoList = () => { setMode('list'); setSelectedSol(null); };

  const handleCreate = () => {
    setDraft(emptySolicitud());
    setMode('create');
  };

  const handleEdit = (sol) => {
    setDraft(solicitudToDraft(sol));
    setSelectedSol(sol);
    setMode('edit');
  };

  const handleView = (sol) => {
    setSelectedSol(sol);
    setMode('view');
  };

  const handleSaveCreate = async () => {
    if (!draft.tipoVisitaCodigo || !draft.clienteId || !draft.sucursalId || !draft.fechaSugerida || draft.dispositivoIds.length === 0 || !draft.motivo?.trim()) {
      await confirm({
        title: 'Campos incompletos',
        message: 'Para enviar la solicitud debes completar todos los campos: Tipo de Mantenimiento, Cliente, Sucursal, Fecha sugerida, al menos un Dispositivo y la Observación.',
        confirmText: 'Entendido',
        type: 'warning',
        hideCancel: true,
      });
      return;
    }
    const ok = await confirm({
      title: '¿Enviar solicitud?',
      message: 'Revisa que todos los datos estén correctos antes de enviar. El equipo de coordinación recibirá la solicitud y la asignará próximamente.',
      confirmText: 'Sí, enviar',
      cancelText: 'Revisar',
      type: 'primary',
    });
    if (!ok) return;
    const result = await createSolicitud(
      {
        clienteId: draft.clienteId || null,
        sucursalId: draft.sucursalId,
        tipoVisitaCodigo: draft.tipoVisitaCodigo,
        fechaSugerida: draft.fechaSugerida,
        motivo: draft.motivo,
        dispositivoIds: draft.dispositivoIds,
      },
      tipoVisitaOptions,
      estadoVisitaOptions
    );
    if (result) {
      setSolicitudResult({ id: result, isUpdate: false });
    } else {
      setSolicitudResult({ id: null, isUpdate: false, error: true, message: 'No se pudo enviar la solicitud. Intenta nuevamente.' });
    }
  };

  const handleSaveEdit = async () => {
    if (!draft.tipoVisitaCodigo || !draft.sucursalId || !draft.fechaSugerida || draft.dispositivoIds.length === 0 || !draft.motivo?.trim()) {
      await confirm({
        title: 'Campos incompletos',
        message: 'Para guardar los cambios debes completar todos los campos: Tipo de Mantenimiento, Sucursal, Fecha sugerida, al menos un Dispositivo y la Observación.',
        confirmText: 'Entendido',
        type: 'warning',
        hideCancel: true,
      });
      return;
    }
    const ok = await confirm({
      title: '¿Guardar cambios?',
      message: 'Se actualizarán los datos de la solicitud. ¿Deseas continuar?',
      confirmText: 'Sí, guardar',
      cancelText: 'Revisar',
      type: 'primary',
    });
    if (!ok) return;
    const saved = await updateSolicitud(
      selectedSol.id,
      {
        tipoVisitaCodigo: draft.tipoVisitaCodigo,
        fechaSugerida: draft.fechaSugerida,
        motivo: draft.motivo,
        dispositivoIds: draft.dispositivoIds,
      },
      tipoVisitaOptions
    );
    if (saved) {
      setSolicitudResult({ id: selectedSol.id, isUpdate: true });
    } else {
      setSolicitudResult({ id: selectedSol.id, isUpdate: true, error: true, message: 'No se pudieron guardar los cambios. Intenta nuevamente.' });
    }
  };

  const handleRequestCancel = async (sol) => {
    const confirmed = await confirm({
      title: '¿Cancelar solicitud?',
      message: `¿Estás seguro de cancelar esta solicitud? Esta acción no se puede deshacer.`,
      confirmText: 'Cancelar solicitud',
      type: 'danger',
    });
    if (!confirmed) return;
    const ok = await cancelSolicitud(sol.id, estadoVisitaOptions);
    // Mostrar modal inmediatamente — el fetch ya ocurrió dentro de cancelSolicitud
    setSolicitudResult({
      id: sol.id,
      isCancel: true,
      error: !ok,
      message: ok ? null : 'No se pudo cancelar la solicitud. Intenta nuevamente.',
    });
  };

  // ── Overlay modal resultado — se monta encima de cualquier vista ─────────────
  const resultModal = solicitudResult ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={() => { setSolicitudResult(null); handleGoList(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {solicitudResult.error ? (
          <>
            <div className="bg-linear-to-br from-red-500 to-red-700 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3 border-2 border-white/30">
                  <X size={32} className="text-white" />
                </div>
                <H3 className="normal-case text-white font-black text-2xl tracking-tight">Error en la operación</H3>
              </div>
            </div>
            <div className="p-6 space-y-4 text-center">
              <TextSmall className="text-gray-600">{solicitudResult.message}</TextSmall>
              <Button variant="danger" className="w-full" onClick={() => setSolicitudResult(null)}>
                Entendido
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className={`p-8 text-center relative overflow-hidden ${solicitudResult.isUpdate || solicitudResult.isCancel ? 'bg-emerald-600' : 'bg-linear-to-br from-emerald-500 via-emerald-600 to-emerald-700'}`}>
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
              </div>
              <div className="relative z-10 flex flex-col items-center text-white">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3 border-2 border-white/30 backdrop-blur-sm">
                  <CheckCircle2 size={32} />
                </div>
                <H3 className="normal-case text-white font-black text-2xl tracking-tight">
                  {solicitudResult.isCancel ? '¡Solicitud cancelada!' : solicitudResult.isUpdate ? '¡Cambios guardados!' : '¡Solicitud enviada!'}
                </H3>
                <Subtitle className="text-white/80 text-sm mt-1">
                  {solicitudResult.isCancel
                    ? 'La solicitud fue cancelada correctamente.'
                    : solicitudResult.isUpdate
                      ? 'Los datos de la solicitud fueron actualizados correctamente.'
                      : 'El equipo de coordinación la revisará y asignará próximamente.'}
                </Subtitle>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {!solicitudResult.isCancel && (
                <Button
                  variant="success"
                  className="w-full"
                  onClick={() => {
                    const sol = solicitudes.find(s => s.id === solicitudResult.id);
                    setSolicitudResult(null);
                    if (sol) handleView(sol);
                    else handleGoList();
                  }}
                >
                  Ver Solicitud
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setSolicitudResult(null); handleGoList(); }}
              >
                Volver a Solicitudes
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  ) : null;

  // ══════════════════════════════════════════════════════════════════════════
  // FORM (create / edit)
  // ══════════════════════════════════════════════════════════════════════════
  if (mode === 'create' || mode === 'edit') {
    return (
      <>
        <SolicitudForm
          draft={draft}
          updateDraft={updateDraft}
          onSubmit={mode === 'create' ? handleSaveCreate : handleSaveEdit}
          onCancel={handleGoList}
          saving={saving}
          tipoVisitaSelectOptions={tipoVisitaSelectOptions}
          clienteOptions={clienteOptions}
          sucursalOptions={sucursalOptions}
          dispositivoOptions={dispositivoOptions}
          isEdit={mode === 'edit'}
          isClienteLocked={isClienteRole}
        />
        {resultModal}
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DETAIL / TRACE VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (mode === 'view' && selectedSol) {
    const sol = selectedSol;
    const canEdit   = sol.estadoCodigo === 'PENDIENTE';
    const canCancel = sol.estadoCodigo === 'PENDIENTE' || sol.estadoCodigo === 'PROGRAMADA';
    // Visita vinculada a esta solicitud (si ya fue programada)
    const visitaVinculada = visitas.find(v => v.solicitudId === sol.id) || null;

    return (
      <>
      <div className="space-y-6 animate-in slide-in-from-right-12 duration-500">
        <header className="flex items-center justify-between bg-white p-4 rounded-md border border-gray-100 shadow-sm flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoList}
              className="p-2 bg-gray-50 hover:bg-[#D32F2F] hover:text-white rounded-md transition-all shadow-sm"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <H3>Traza de Solicitud</H3>
              <TextSmall className="text-gray-500">Seguimiento del estado y avance de la visita</TextSmall>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <VisitStatusBadge status={sol.estadoCodigo} />
            {canEdit && (
              <Button variant="secondary" onClick={() => handleEdit(sol)} className="flex items-center gap-1.5 text-sm">
                <Edit2 size={14} /> Editar
              </Button>
            )}
            {canCancel && (
              <Button variant="danger" onClick={() => handleRequestCancel(sol)} className="flex items-center gap-1.5 text-sm">
                <Trash2 size={14} /> Cancelar
              </Button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <Card className="p-5 space-y-4">
              <SectionHeader icon={FileText} title="Datos de la Solicitud" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={AlertCircle} label="Tipo de Mantenimiento" value={sol.tipoVisitaLabel} />
                <InfoRow icon={Building2}   label="Sucursal"              value={sol.sucursalNombre} />
                <InfoRow icon={Calendar}    label="Fecha Sugerida"        value={sol.fechaSugerida ? new Date(sol.fechaSugerida).toLocaleString('es-ES') : '—'} />
                <InfoRow icon={Clock}       label="Fecha de Solicitud"    value={sol.fechaSolicitud ? new Date(sol.fechaSolicitud).toLocaleString('es-ES') : '—'} />
              </div>
              {sol.dispositivosNombres?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1">
                    <Cpu size={11} /> Dispositivos solicitados
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sol.dispositivosNombres.map((nombre, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold">
                        {nombre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {sol.motivo && (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Observación del solicitante</p>
                  <p className="text-sm text-gray-700">{sol.motivo}</p>
                </div>
              )}
            </Card>

            {/* Visita vinculada — muestra avance real si ya fue programada */}
            {visitaVinculada ? (
              <Card className="p-5 space-y-4">
                <SectionHeader icon={Clock} title="Visita Programada" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow icon={Calendar} label="Fecha Programada"
                    value={visitaVinculada.fechaProgramada
                      ? new Date(visitaVinculada.fechaProgramada).toLocaleString('es-ES')
                      : '—'} />
                  <InfoRow icon={Clock} label="Estado de la Visita"
                    value={<VisitStatusBadge status={visitaVinculada.estadoCodigo} />} />
                  {visitaVinculada.tecnicosNombres?.length > 0 && (
                    <InfoRow icon={Tag} label="Técnico(s)"
                      value={visitaVinculada.tecnicosNombres.join(', ')} />
                  )}
                  {visitaVinculada.fechaInicio && (
                    <InfoRow icon={Clock} label="Iniciada"
                      value={new Date(visitaVinculada.fechaInicio).toLocaleString('es-ES')} />
                  )}
                  {visitaVinculada.fechaFin && (
                    <InfoRow icon={Clock} label="Finalizada"
                      value={new Date(visitaVinculada.fechaFin).toLocaleString('es-ES')} />
                  )}
                </div>
                {visitaVinculada.dispositivos?.length > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Avance de dispositivos</p>
                    <VisitProgressPanel
                      dispositivos={visitaVinculada.dispositivos}
                      ejecucionPasos={visitaVinculada.ejecucionPasos}
                      ejecucionActividades={visitaVinculada.ejecucionActividades}
                      deviceEvidencias={visitaVinculada.deviceEvidencias}
                    />
                  </div>
                )}
                {visitaVinculada.observacionFinal && (
                  <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 mb-1">Observación final</p>
                    <p className="text-sm text-green-900">{visitaVinculada.observacionFinal}</p>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-5">
                <div className="flex items-center gap-3 text-gray-400">
                  <Clock size={18} />
                  <p className="text-sm">La solicitud aún no tiene una visita asignada. El coordinador la programará próximamente.</p>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card className="p-5 bg-linear-to-br from-gray-50 to-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={16} className="text-gray-600" />
                <p className="text-xs font-bold uppercase tracking-widest text-gray-700">Información del Cliente</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-900">{sol.clienteNombre || '—'}</p>
                <p className="text-xs text-gray-500">{sol.sucursalNombre}</p>
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-700 mb-4">Historial de Estado</p>
              <ol className="relative border-l border-gray-200 space-y-5 pl-6">
                {[
                  { label: 'Solicitud enviada', active: true,                                                    fecha: sol.fechaSolicitud },
                  { label: 'Visita programada', active: !!visitaVinculada,                                       fecha: visitaVinculada?.fechaProgramada || null },
                  { label: 'En curso',          active: !!visitaVinculada?.fechaInicio,                          fecha: visitaVinculada?.fechaInicio || null },
                  { label: 'Finalizada',        active: sol.estadoCodigo === 'COMPLETADA',                       fecha: visitaVinculada?.fechaFin || null },
                  { label: 'Cancelada',         active: sol.estadoCodigo === 'CANCELADA' || sol.estadoCodigo === 'CANCELADO', fecha: null },
                ].map((step, i) => (
                  <li key={i} className="relative">
                    <span className={`absolute -left-7.5 top-1 w-3 h-3 rounded-full border-2 ${
                      step.active ? 'bg-[#D32F2F] border-[#D32F2F]' : 'bg-white border-gray-300'
                    }`} />
                    <p className={`text-sm font-semibold ${step.active ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {step.fecha && (
                      <p className="text-xs text-gray-400">
                        {new Date(step.fecha).toLocaleDateString('es-ES')}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </div>
      </div>
      {resultModal}
      </>
    );
  }

  // ── Columnas para desktop ───────────────────────────────────────────────────
  const tipoBg = (codigo) =>
    codigo === 'PREVENTIVO' ? 'bg-blue-100 text-blue-700'
    : codigo === 'CORRECTIVO' ? 'bg-orange-100 text-orange-700'
    : 'bg-gray-100 text-gray-700';

  const columns = [
    {
      header: 'Tipo',
      render: (sol) => (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${tipoBg(sol.tipoVisitaCodigo)}`}>
          {sol.tipoVisitaLabel || sol.tipoVisitaCodigo || '—'}
        </span>
      ),
    },
    {
      header: 'Cliente / Sucursal',
      render: (sol) => (
        <>
          <TextSmall className="font-semibold">{sol.clienteNombre || '—'}</TextSmall>
          <TextTiny className="text-gray-400">{sol.sucursalNombre}</TextTiny>
        </>
      ),
    },
    {
      header: 'Fecha Sugerida',
      render: (sol) => sol.fechaSugerida ? (
        <>
          <TextSmall>{new Date(sol.fechaSugerida).toLocaleDateString('es-ES')}</TextSmall>
          <TextTiny className="text-gray-400">
            {new Date(sol.fechaSugerida).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </TextTiny>
        </>
      ) : <TextSmall className="text-gray-400">—</TextSmall>,
    },
    {
      header: 'Fecha Solicitud',
      render: (sol) => (
        <TextSmall>{sol.fechaSolicitud ? new Date(sol.fechaSolicitud).toLocaleDateString('es-ES') : '—'}</TextSmall>
      ),
    },
    {
      header: 'Dispositivos',
      render: (sol) => (
        <TextSmall>{sol.dispositivoIds?.length || 0} dispositivo{sol.dispositivoIds?.length !== 1 ? 's' : ''}</TextSmall>
      ),
    },
    {
      header: 'Estado',
      render: (sol) => <VisitStatusBadge status={sol.estadoCodigo} />,
    },
    {
      header: 'Acciones',
      align: 'right',
      narrow: true,
      render: (sol) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleView(sol)}
            title="Ver detalle"
            className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Eye size={15} />
          </button>
          {sol.estadoCodigo === 'PENDIENTE' && (
            <button
              onClick={() => handleEdit(sol)}
              title="Editar"
              className="p-1.5 rounded-md text-yellow-600 hover:bg-yellow-50 transition-colors"
            >
              <Edit2 size={15} />
            </button>
          )}
          {(sol.estadoCodigo === 'PENDIENTE' || sol.estadoCodigo === 'PROGRAMADA') && (
            <button
              onClick={() => handleRequestCancel(sol)}
              title="Cancelar solicitud"
              className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  // ── Card mobile personalizada ────────────────────────────────────────────────
  const renderMobileCard = (sol) => (
    <Card className="p-5 border border-gray-200 shadow-sm rounded-2xl">
      <div className="divide-y divide-gray-50 mb-4">
        <div className="flex items-start gap-3 py-2.5 first:pt-0">
          <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Cliente</TextTiny>
          <div className="flex-1 min-w-0">
            <TextSmall className="font-bold text-gray-900">{sol.clienteNombre || '—'}</TextSmall>
            <TextTiny className="text-gray-400">{sol.sucursalNombre}</TextTiny>
          </div>
        </div>
        <div className="flex items-start gap-3 py-2.5">
          <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Tipo</TextTiny>
          <div className="flex-1">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${tipoBg(sol.tipoVisitaCodigo)}`}>
              {sol.tipoVisitaLabel || sol.tipoVisitaCodigo || '—'}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-3 py-2.5">
          <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">Estado</TextTiny>
          <div className="flex-1"><VisitStatusBadge status={sol.estadoCodigo} /></div>
        </div>
        <div className="flex items-start gap-3 py-2.5">
          <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">F. Sugerida</TextTiny>
          <TextTiny className="text-gray-600 flex-1">
            {sol.fechaSugerida ? new Date(sol.fechaSugerida).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
          </TextTiny>
        </div>
        <div className="flex items-start gap-3 py-2.5 last:pb-0">
          <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">F. Solicitud</TextTiny>
          <TextTiny className="text-gray-600 flex-1">
            {sol.fechaSolicitud ? new Date(sol.fechaSolicitud).toLocaleDateString('es-ES') : '—'}
          </TextTiny>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
        <button onClick={() => handleView(sol)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-semibold">
          <Eye size={14} /> Ver
        </button>
        {sol.estadoCodigo === 'PENDIENTE' && (
          <button onClick={() => handleEdit(sol)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors text-xs font-semibold">
            <Edit2 size={14} /> Editar
          </button>
        )}
        {(sol.estadoCodigo === 'PENDIENTE' || sol.estadoCodigo === 'PROGRAMADA') && (
          <button onClick={() => handleRequestCancel(sol)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-xs font-semibold">
            <Trash2 size={14} /> Cancelar
          </button>
        )}
      </div>
    </Card>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <>
    <div className="space-y-6 animate-in fade-in duration-700">
      <GenericListView
        icon={FileText}
        title="Solicitudes de Visita"
        items={filtered}
        columns={columns}
        onNew={handleCreate}
        newButtonLabel="Nueva Solicitud"
        loading={loading}
        loadingText="Cargando solicitudes..."
        emptyText="No hay solicitudes registradas. Crea la primera."
        filterFunction={(sol, q) =>
          sol.clienteNombre?.toLowerCase().includes(q) ||
          sol.sucursalNombre?.toLowerCase().includes(q) ||
          sol.tipoVisitaLabel?.toLowerCase().includes(q) ||
          sol.motivo?.toLowerCase().includes(q)
        }
        renderMobileCard={renderMobileCard}
        filteredCount={filtered.length}
        totalItems={solicitudes.length}
        activeFiltersCount={filters.cliente.length + filters.sucursal.length + filters.estado.length + filters.tipo.length + (filters.fechaDesde ? 1 : 0) + (filters.fechaHasta ? 1 : 0)}
        onClearFilters={() => setFilters({ cliente: [], sucursal: [], estado: [], tipo: [], fechaDesde: '', fechaHasta: '' })}
        extraFilters={
          <FilterBar filters={filterDefs} values={filters} onChange={setFilters} />
        }
      />

    </div>
    {resultModal}
    </>
  );
};

export default SolicitudVisitaPage;
