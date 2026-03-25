import { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft, Search, X, Eye, FileText, Edit2, Trash2,
  Calendar, Building2, Cpu, Clock, AlertCircle, Tag,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ModuleHeader from '../../components/ui/ModuleHeader';
import GenericListView from '../../components/shared/GenericListView';
import { H2, H3, TextSmall, TextTiny, Label, Subtitle } from '../../components/ui/Typography';
import Select from '../../components/ui/Select';
import SearchableSelect from '../../components/ui/SearchableSelect';
import VisitStatusBadge from '../../components/visits/VisitStatusBadge';
import Modal from '../../components/ui/Modal';
import InfoRow from '../../components/ui/InfoRow';
import SectionHeader from '../../components/ui/SectionHeader';
import VisitProgressPanel from '../../components/visits/VisitProgressPanel';
import { useSolicitudesVisita } from '../../hooks/useSolicitudesVisita';
import { useCatalog } from '../../hooks/useCatalog';
import { useMasterData } from '../../context/MasterDataContext';
import { useAuth } from '../../context/AuthContext';
import { useClienteData } from '../../hooks/useClienteData';
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
}) => (
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
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Cliente</Label>
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

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
              Dispositivos a Revisar
            </Label>
            <SearchableSelect
              options={dispositivoOptions}
              value={draft.dispositivoIds.map(id => ({
                value: id,
                label: dispositivoOptions.find(o => o.value === id)?.label || id,
              }))}
              onChange={opts => updateDraft({
                dispositivoIds: opts.map(o => o.value),
                dispositivosNombres: opts.map(o => o.label),
              })}
              placeholder={draft.sucursalId ? 'Seleccionar dispositivos...' : 'Seleccione una sucursal primero'}
              isMulti
              isDisabled={!draft.sucursalId}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
              Observación / Motivo
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
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const SolicitudVisitaPage = () => {
  const [mode,         setMode]        = useState('list'); // 'list' | 'create' | 'edit' | 'view'
  const [selectedSol,  setSelectedSol] = useState(null);
  const [draft,        setDraft]       = useState(emptySolicitud());
  const [searchTerm,   setSearchTerm]  = useState('');
  const [filterEstado, setFilterEstado] = useState('Todos');
  const [showModal,    setShowModal]   = useState(false);
  const [modalMsg,     setModalMsg]    = useState('');
  const [modalType,    setModalType]   = useState('error'); // 'error' | 'success'
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [lastCreatedId, setLastCreatedId] = useState(null);

  // ── Data ────────────────────────────────────────────────────────────────────
  const { user } = useAuth();
  const userRole = user?.role;
  const isClienteRole = userRole === ROLES.CLIENTE;

  const { solicitudes, loading, saving, createSolicitud, updateSolicitud, cancelSolicitud } = useSolicitudesVisita();
  const { data } = useMasterData();
  const { options: tipoVisitaOptions } = useCatalog('TIPO_VISITA');
  const { options: estadoVisitaOptions } = useCatalog('ESTADO_VISITA');

  // Para rol CLIENTE: datos del contacto autenticado
  const { cliente: clienteContacto, sucursales: sucursalesContacto, dispositivos: dispositivosContacto } = useClienteData();

  // Auto-populate draft con el cliente del contacto al abrir el formulario de creación
  useEffect(() => {
    if (isClienteRole && mode === 'create' && clienteContacto) {
      setDraft(prev => ({
        ...prev,
        clienteId: String(clienteContacto.id),
        clienteNombre: clienteContacto.razon_social || clienteContacto.nombre || '',
      }));
    }
  }, [isClienteRole, mode, clienteContacto]);

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
    // Para CLIENTE: filtra de su propio conjunto de dispositivos
    if (isClienteRole) {
      return dispositivosContacto
        .filter(d => String(d.sucursal_id || d.branchId) === String(draft.sucursalId))
        .map(d => ({ value: String(d.id), label: d.id_inmotika || d.idInmotika || d.codigo_unico || `Dispositivo ${d.id}` }));
    }
    return (data?.dispositivos || [])
      .filter(d => String(d.branchId) === String(draft.sucursalId))
      .map(d => ({ value: String(d.id), label: d.nombre || `Dispositivo ${d.id}` }));
  }, [isClienteRole, dispositivosContacto, data?.dispositivos, draft.sucursalId]);

  const filtered = useMemo(() => {
    let list = solicitudes;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(s =>
        s.clienteNombre?.toLowerCase().includes(q) ||
        s.sucursalNombre?.toLowerCase().includes(q) ||
        s.tipoVisitaLabel?.toLowerCase().includes(q) ||
        s.motivo?.toLowerCase().includes(q)
      );
    }
    if (filterEstado !== 'Todos') {
      list = list.filter(s => s.estadoCodigo === filterEstado);
    }
    return list;
  }, [solicitudes, searchTerm, filterEstado]);

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
    if (!draft.tipoVisitaCodigo || !draft.sucursalId || !draft.fechaSugerida) {
      setModalMsg('Completa los campos obligatorios: Tipo de Mantenimiento, Sucursal y Fecha sugerida.');
      setModalType('error');
      setShowModal(true);
      return;
    }
    const result = await createSolicitud(
      {
        clienteId: draft.clienteId || null,
        sucursalId: draft.sucursalId,
        tipoVisitaCodigo: draft.tipoVisitaCodigo,
        fechaSugerida: draft.fechaSugerida,
        motivo: draft.motivo || 'Sin observaciones',
        dispositivoIds: draft.dispositivoIds,
      },
      tipoVisitaOptions,
      estadoVisitaOptions
    );
    if (result) {
      setLastCreatedId(result);
      setModalMsg('Solicitud creada exitosamente. ¿Qué deseas hacer ahora?');
      setModalType('success');
      setShowModal(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!draft.tipoVisitaCodigo || !draft.sucursalId || !draft.fechaSugerida) {
      setModalMsg('Completa los campos obligatorios: Tipo de Mantenimiento, Sucursal y Fecha sugerida.');
      setModalType('error');
      setShowModal(true);
      return;
    }
    const ok = await updateSolicitud(
      selectedSol.id,
      {
        tipoVisitaCodigo: draft.tipoVisitaCodigo,
        fechaSugerida: draft.fechaSugerida,
        motivo: draft.motivo,
        dispositivoIds: draft.dispositivoIds,
      },
      tipoVisitaOptions
    );
    if (ok) handleGoList();
  };

  const handleRequestCancel = (sol) => {
    setCancelTarget(sol);
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    const ok = await cancelSolicitud(cancelTarget.id, estadoVisitaOptions);
    setShowCancelConfirm(false);
    setCancelTarget(null);
    if (ok && mode === 'view') handleGoList();
  };

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
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Información Faltante" maxWidth="max-w-md">
          <div className="space-y-4">
            <TextSmall className="text-gray-600 leading-relaxed text-base normal-case">{modalMsg}</TextSmall>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setShowModal(false)}>Aceptar</Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DETAIL / TRACE VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (mode === 'view' && selectedSol) {
    const sol = selectedSol;
    const canEdit   = sol.estadoCodigo === 'PENDIENTE';
    const canCancel = sol.estadoCodigo === 'PENDIENTE';

    return (
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

            {/* Visita asignada — se conectará en el módulo de Programación */}
            <Card className="p-5">
              <div className="flex items-center gap-3 text-gray-400">
                <Clock size={18} />
                <p className="text-sm">La solicitud aún no tiene una visita asignada. El coordinador la programará próximamente.</p>
              </div>
            </Card>
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
                  { label: 'Solicitud enviada', active: true,                               fecha: sol.fechaSolicitud },
                  { label: 'Visita programada', active: false,                              fecha: null },
                  { label: 'En curso',          active: false,                              fecha: null },
                  { label: 'Finalizada',        active: sol.estadoCodigo === 'COMPLETADA',  fecha: null },
                  { label: 'Cancelada',         active: sol.estadoCodigo === 'CANCELADA',   fecha: null },
                ].map((step, i) => (
                  <li key={i} className="relative">
                    <span className={`absolute -left-[30px] top-[4px] w-3 h-3 rounded-full border-2 ${
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
          <>
            <button onClick={() => handleEdit(sol)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors text-xs font-semibold">
              <Edit2 size={14} /> Editar
            </button>
            <button onClick={() => handleRequestCancel(sol)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-xs font-semibold">
              <Trash2 size={14} /> Cancelar
            </button>
          </>
        )}
      </div>
    </Card>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ══════════════════════════════════════════════════════════════════════════
  return (
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
        extraFilters={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end w-full">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por cliente, sucursal o tipo..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-8 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] transition-all"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded">
                  <X size={13} className="text-gray-400" />
                </button>
              )}
            </div>
            <Select
              options={[
                { value: 'Todos',       label: 'Todos los estados' },
                { value: 'PENDIENTE',   label: 'Pendiente'         },
                { value: 'PROGRAMADA',  label: 'Programada'        },
                { value: 'EN_CAMINO',   label: 'En Camino'         },
                { value: 'EN_PROGRESO', label: 'En Progreso'       },
                { value: 'COMPLETADA',  label: 'Completada'        },
                { value: 'CANCELADA',   label: 'Cancelada'         },
              ]}
              value={filterEstado}
              onChange={e => setFilterEstado(e.target.value)}
            />
          </div>
        }
      />

      {/* Modal cancelación */}
      <Modal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title="Cancelar Solicitud"
        maxWidth="max-w-md"
      >
        <div className="space-y-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <TextSmall className="text-red-900 leading-relaxed text-base normal-case">
              ¿Estás seguro que deseas cancelar esta solicitud? Esta acción no se puede deshacer.
            </TextSmall>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowCancelConfirm(false)}>
              Volver
            </Button>
            <Button variant="danger" onClick={handleConfirmCancel} disabled={saving}>
              {saving ? 'Cancelando...' : 'Sí, cancelar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal validación campos / éxito */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setLastCreatedId(null);
        }}
        title={modalType === 'success' ? '¡Solicitud Enviada!' : 'Información Faltante'}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          {modalType === 'success' ? (
            <>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <TextSmall className="text-green-900 leading-relaxed text-base normal-case">{modalMsg}</TextSmall>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => {
                  setShowModal(false);
                  handleGoList();
                }}>
                  Ir a Solicitudes
                </Button>
                <Button onClick={() => {
                  setShowModal(false);
                  if (lastCreatedId) {
                    const created = solicitudes.find(s => s.id === lastCreatedId);
                    if (created) handleView(created);
                  }
                }}>
                  Ver Solicitud
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <TextSmall className="text-red-900 leading-relaxed text-base normal-case">{modalMsg}</TextSmall>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => setShowModal(false)}>Aceptar</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SolicitudVisitaPage;
