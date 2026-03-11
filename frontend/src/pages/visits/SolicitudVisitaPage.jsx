import { useState, useMemo } from 'react';
import {
  Plus, ArrowLeft, Search, X, Eye, FileText,
  Calendar, Building2, Cpu, User, Clock, AlertCircle,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ModuleHeader from '../../components/ui/ModuleHeader';
import { Table, THead, TBody, Tr, Th, Td } from '../../components/ui/Table';
import { H2, Subtitle, TextSmall, TextTiny, Label } from '../../components/ui/Typography';
import Select from '../../components/ui/Select';
import SearchableSelect from '../../components/ui/SearchableSelect';
import VisitStatusBadge from '../../components/visits/VisitStatusBadge';
import VisitProgressPanel from '../../components/visits/VisitProgressPanel';

// ─── Constants ────────────────────────────────────────────────────────────────
const TIPO_VISITA_OPTIONS = [
  { value: '',           label: 'Seleccionar tipo...' },
  { value: 'PREVENTIVO', label: 'Mantenimiento Preventivo' },
  { value: 'CORRECTIVO', label: 'Mantenimiento Correctivo' },
];

const emptySolicitud = () => ({
  clienteId: '',
  clienteNombre: '',
  sucursalId: '',
  sucursalNombre: '',
  tipoVisita: '',
  dispositivoIds: [],
  dispositivosNombres: [],
  fechaSugerida: '',
  observacion: '',
});

// ─── Info row helper ──────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2">
    <Icon size={14} className="text-gray-400 mt-0.5 shrink-0" />
    <div>
      <TextTiny className="text-gray-400">{label}</TextTiny>
      <TextSmall className="text-gray-900 font-semibold">{value || '—'}</TextSmall>
    </div>
  </div>
);

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="p-1.5 bg-gray-100 rounded-lg">
      <Icon size={14} className="text-gray-600" />
    </div>
    <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">{title}</Label>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const SolicitudVisitaPage = ({ data, setData }) => {
  const [isCreating,    setIsCreating]   = useState(false);
  const [viewingSol,    setViewingSol]   = useState(null);
  const [draft,         setDraft]        = useState(emptySolicitud());
  const [searchTerm,    setSearchTerm]   = useState('');
  const [filterEstado,  setFilterEstado] = useState('Todos');

  const solicitudes = data?.solicitudesVisita || [];
  const visitas     = data?.visitas           || [];
  const clientes    = data?.clientes          || [];
  const dispositivos = data?.dispositivos     || [];

  // ── Derived options ──────────────────────────────────────────────────────
  const clienteOptions = useMemo(() =>
    clientes.map(c => ({ value: c.id, label: c.nombre || c.razonSocial || c.id })),
    [clientes],
  );

  const sucursalOptions = useMemo(() => {
    if (!draft.clienteId) return [];
    const cliente = clientes.find(c => c.id === draft.clienteId);
    return (cliente?.sucursales || []).map(s => ({ value: s.id, label: s.nombre }));
  }, [draft.clienteId, clientes]);

  const dispositivoOptions = useMemo(() =>
    dispositivos.map(d => ({ value: String(d.id), label: d.nombre || `Dispositivo ${d.id}` })),
    [dispositivos],
  );

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = solicitudes;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(s =>
        s.clienteNombre?.toLowerCase().includes(q) ||
        s.sucursalNombre?.toLowerCase().includes(q) ||
        s.tipoVisita?.toLowerCase().includes(q),
      );
    }
    if (filterEstado !== 'Todos') list = list.filter(s => s.estado === filterEstado);
    return list;
  }, [solicitudes, searchTerm, filterEstado]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCreate = () => { setIsCreating(true); setViewingSol(null); setDraft(emptySolicitud()); };
  const handleView   = (sol) => { setViewingSol(sol); setIsCreating(false); };
  const handleCancel = () => { setIsCreating(false); setViewingSol(null); setDraft(emptySolicitud()); };

  const handleSave = () => {
    if (!draft.tipoVisita || !draft.sucursalId || !draft.fechaSugerida) {
      alert('Complete los campos obligatorios: Tipo, Sucursal y Fecha sugerida.');
      return;
    }
    const nueva = {
      id: `SV-${String(solicitudes.length + 1).padStart(3, '0')}`,
      ...draft,
      estado: 'SOLICITUD',
      fechaSolicitud: new Date().toISOString(),
      visitaId: null,
    };
    setData(prev => ({ ...prev, solicitudesVisita: [...(prev.solicitudesVisita || []), nueva] }));
    handleCancel();
  };

  const updateDraft = (patch) => setDraft(prev => ({ ...prev, ...patch }));

  // ── Linked visita ─────────────────────────────────────────────────────────
  const linkedVisita = viewingSol?.visitaId ? visitas.find(v => v.id === viewingSol.visitaId) : null;

  // ══════════════════════════════════════════════════════════════════════════
  // CREATE FORM
  // ══════════════════════════════════════════════════════════════════════════
  if (isCreating) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-12 duration-500">
        <header className="flex items-center justify-between bg-white p-4 rounded-md border border-gray-100 shadow-sm flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <button onClick={handleCancel} className="p-2 bg-gray-50 hover:bg-[#D32F2F] hover:text-white rounded-md transition-all shadow-sm">
              <ArrowLeft size={16} />
            </button>
            <div>
              <H2>Nueva Solicitud de Visita</H2>
              <TextSmall className="text-gray-500">Complete los datos para solicitar una visita técnica</TextSmall>
            </div>
          </div>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <FileText size={16} /> Enviar Solicitud
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-5">
              <SectionHeader icon={FileText} title="Datos de la Solicitud" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <Select
                  label="Tipo de Mantenimiento"
                  icon={AlertCircle}
                  options={TIPO_VISITA_OPTIONS}
                  value={draft.tipoVisita}
                  onChange={e => updateDraft({ tipoVisita: e.target.value })}
                  required
                />
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Cliente
                  </Label>
                  <SearchableSelect
                    options={clienteOptions}
                    value={draft.clienteId ? { value: draft.clienteId, label: draft.clienteNombre } : null}
                    onChange={opt => updateDraft({ clienteId: opt?.value || '', clienteNombre: opt?.label || '', sucursalId: '', dispositivoIds: [] })}
                    placeholder="Seleccionar cliente..."
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Sucursal <span className="text-red-500">*</span>
                  </Label>
                  <SearchableSelect
                    options={sucursalOptions}
                    value={draft.sucursalId ? { value: draft.sucursalId, label: draft.sucursalNombre } : null}
                    onChange={opt => updateDraft({ sucursalId: opt?.value || '', sucursalNombre: opt?.label || '', dispositivoIds: [] })}
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
                  value={draft.dispositivoIds.map(id => ({ value: id, label: dispositivoOptions.find(o => o.value === id)?.label || id }))}
                  onChange={opts => updateDraft({ dispositivoIds: opts.map(o => o.value), dispositivosNombres: opts.map(o => o.label) })}
                  placeholder="Seleccionar dispositivos..."
                  isMulti
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
                  Observación
                </Label>
                <textarea
                  value={draft.observacion}
                  onChange={e => updateDraft({ observacion: e.target.value })}
                  rows={3}
                  placeholder="Describe el motivo o detalles adicionales de la solicitud..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-semibold resize-y focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] transition-all"
                />
              </div>
            </Card>
          </div>

          {/* Side info */}
          <div>
            <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-blue-600" />
                <Label className="text-sm font-bold text-blue-900">Información</Label>
              </div>
              <TextSmall className="text-blue-800 text-xs leading-relaxed">
                Al enviar la solicitud, el equipo de coordinación la revisará y asignará los técnicos y fechas correspondientes. Podrás ver el estado desde el listado.
              </TextSmall>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DETAIL / TRACE VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (viewingSol) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-12 duration-500">
        <header className="flex items-center justify-between bg-white p-4 rounded-md border border-gray-100 shadow-sm flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <button onClick={handleCancel} className="p-2 bg-gray-50 hover:bg-[#D32F2F] hover:text-white rounded-md transition-all shadow-sm">
              <ArrowLeft size={16} />
            </button>
            <div>
              <H2>Traza de Solicitud · {viewingSol.id}</H2>
              <TextSmall className="text-gray-500">Seguimiento del estado y avance de la visita</TextSmall>
            </div>
          </div>
          <VisitStatusBadge status={viewingSol.estado} />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Solicitud + linked visita */}
          <div className="lg:col-span-2 space-y-5">
            {/* Solicitud data */}
            <Card className="p-5 space-y-4">
              <SectionHeader icon={FileText} title="Datos de la Solicitud" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={AlertCircle} label="Tipo de Mantenimiento"  value={viewingSol.tipoVisita}      />
                <InfoRow icon={Building2}   label="Sucursal"               value={viewingSol.sucursalNombre}  />
                <InfoRow icon={Calendar}    label="Fecha Sugerida"         value={viewingSol.fechaSugerida ? new Date(viewingSol.fechaSugerida).toLocaleString('es-ES') : '—'} />
                <InfoRow icon={Clock}       label="Fecha de Solicitud"     value={viewingSol.fechaSolicitud ? new Date(viewingSol.fechaSolicitud).toLocaleString('es-ES') : '—'} />
              </div>
              {viewingSol.dispositivosNombres?.length > 0 && (
                <div>
                  <TextTiny className="text-gray-400 mb-1.5 flex items-center gap-1"><Cpu size={12} /> Dispositivos solicitados</TextTiny>
                  <div className="flex flex-wrap gap-2">
                    {viewingSol.dispositivosNombres.map((nombre, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">{nombre}</span>
                    ))}
                  </div>
                </div>
              )}
              {viewingSol.observacion && (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <TextTiny className="text-gray-400 mb-1">Observación del solicitante</TextTiny>
                  <TextSmall className="text-gray-700">{viewingSol.observacion}</TextSmall>
                </div>
              )}
            </Card>

            {/* Linked visita */}
            {linkedVisita ? (
              <Card className="p-5 space-y-4">
                <SectionHeader icon={Calendar} title="Visita Asignada" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {linkedVisita.fechaProgramada && (
                    <InfoRow icon={Calendar} label="Fecha Programada" value={new Date(linkedVisita.fechaProgramada).toLocaleString('es-ES')} />
                  )}
                  {linkedVisita.fechaInicio && (
                    <InfoRow icon={Calendar} label="Fecha Inicio" value={new Date(linkedVisita.fechaInicio).toLocaleString('es-ES')} />
                  )}
                  {linkedVisita.fechaFin && (
                    <InfoRow icon={Calendar} label="Fecha Fin" value={new Date(linkedVisita.fechaFin).toLocaleString('es-ES')} />
                  )}
                  <InfoRow icon={User} label="Técnico Asignado" value={linkedVisita.tecnicosNombres?.join(', ') || '—'} />
                </div>
                <div className="flex items-center gap-2">
                  <TextTiny className="text-gray-400">Estado visita:</TextTiny>
                  <VisitStatusBadge status={linkedVisita.estado} />
                </div>
                {linkedVisita.observaciones && (
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <TextTiny className="text-gray-400 mb-1">Observación del coordinador</TextTiny>
                    <TextSmall className="text-gray-700">{linkedVisita.observaciones}</TextSmall>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-5">
                <div className="flex items-center gap-3 text-gray-400">
                  <Clock size={18} />
                  <TextSmall>La solicitud aún no tiene una visita asignada. El coordinador la programará próximamente.</TextSmall>
                </div>
              </Card>
            )}

            {/* Progress panel */}
            {linkedVisita && linkedVisita.dispositivos?.length > 0 && (
              <Card className="p-5 space-y-3">
                <SectionHeader icon={Cpu} title="Avance por Dispositivo" />
                <VisitProgressPanel
                  dispositivos={linkedVisita.dispositivos}
                  ejecucionPasos={linkedVisita.ejecucionPasos || {}}
                  ejecucionActividades={linkedVisita.ejecucionActividades || {}}
                />
              </Card>
            )}
          </div>

          {/* Right side panel */}
          <div className="space-y-4">
            <Card className="p-5 bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={16} className="text-gray-600" />
                <Label className="text-sm font-bold text-gray-900">Información del Cliente</Label>
              </div>
              <div className="space-y-2">
                <TextSmall className="text-gray-900 font-semibold">{viewingSol.clienteNombre}</TextSmall>
                <TextTiny className="text-gray-500">{viewingSol.sucursalNombre}</TextTiny>
              </div>
            </Card>

            {/* Status timeline */}
            <Card className="p-5">
              <Label className="text-sm font-bold text-gray-700 block mb-3">Historial de Estado</Label>
              <ol className="relative border-l border-gray-200 space-y-5 pl-6">
                {[
                  { label: 'Solicitud enviada', fecha: viewingSol.fechaSolicitud, active: true },
                  { label: 'Visita programada', fecha: linkedVisita?.fechaProgramada, active: !!linkedVisita },
                  { label: 'En curso',          fecha: linkedVisita?.fechaInicio,     active: !!linkedVisita?.fechaInicio },
                  { label: 'Finalizada',        fecha: linkedVisita?.fechaFin,        active: !!linkedVisita?.fechaFin },
                ].map((step, i) => (
                  <li key={i} className="relative">
                    <span className={`absolute -left-[30px] top-[4px] w-3 h-3 rounded-full border-2 ${
                      step.active ? 'bg-[#D32F2F] border-[#D32F2F]' : 'bg-white border-gray-300'
                    }`} />
                    <TextSmall className={`font-semibold ${step.active ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</TextSmall>
                    {step.fecha && (
                      <TextTiny className="text-gray-400">{new Date(step.fecha).toLocaleDateString('es-ES')}</TextTiny>
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

  // ══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <ModuleHeader
        icon={FileText}
        title="Solicitudes de Visita"
        subtitle="Gestiona y da seguimiento a las solicitudes de visita técnica"
        onNewClick={handleCreate}
        newButtonLabel="Nueva Solicitud"
        filterContent={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
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
                { value: 'Todos',        label: 'Todos los estados' },
                { value: 'SOLICITUD',    label: 'Solicitud'   },
                { value: 'PROGRAMADO',   label: 'Programado'  },
                { value: 'EN_CURSO',     label: 'En curso'    },
                { value: 'FINALIZADO',   label: 'Finalizado'  },
                { value: 'CANCELADO',    label: 'Cancelado'   },
                { value: 'REPROGRAMADO', label: 'Reprogramado'},
              ]}
              value={filterEstado}
              onChange={e => setFilterEstado(e.target.value)}
            />
          </div>
        }
      />

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <THead variant="dark">
            <tr>
              <Th>ID</Th>
              <Th>Tipo</Th>
              <Th>Cliente / Sucursal</Th>
              <Th>Fecha Sugerida</Th>
              <Th>Dispositivos</Th>
              <Th>Estado</Th>
              <Th align="right">Acciones</Th>
            </tr>
          </THead>
          <TBody>
            {filtered.length === 0 ? (
              <Tr>
                <td colSpan={7} className="text-center py-12 text-sm text-gray-400">
                  {searchTerm || filterEstado !== 'Todos'
                    ? 'No se encontraron solicitudes con los filtros aplicados.'
                    : 'No hay solicitudes registradas. Crea la primera.'}
                </td>
              </Tr>
            ) : (
              filtered.map(sol => (
                <Tr key={sol.id}>
                  <Td>
                    <TextSmall className="font-bold text-gray-700">{sol.id}</TextSmall>
                    <TextTiny className="text-gray-400">{sol.fechaSolicitud ? new Date(sol.fechaSolicitud).toLocaleDateString('es-ES') : '—'}</TextTiny>
                  </Td>
                  <Td>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      sol.tipoVisita === 'PREVENTIVO' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {sol.tipoVisita || '—'}
                    </span>
                  </Td>
                  <Td>
                    <TextSmall className="font-semibold">{sol.clienteNombre}</TextSmall>
                    <TextTiny className="text-gray-400">{sol.sucursalNombre}</TextTiny>
                  </Td>
                  <Td>
                    <TextSmall>{sol.fechaSugerida ? new Date(sol.fechaSugerida).toLocaleDateString('es-ES') : '—'}</TextSmall>
                    <TextTiny className="text-gray-400">{sol.fechaSugerida ? new Date(sol.fechaSugerida).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}</TextTiny>
                  </Td>
                  <Td>
                    <TextSmall>{sol.dispositivoIds?.length || 0} dispositivo{sol.dispositivoIds?.length !== 1 ? 's' : ''}</TextSmall>
                  </Td>
                  <Td><VisitStatusBadge status={sol.estado} /></Td>
                  <Td align="right">
                    <button
                      onClick={() => handleView(sol)}
                      className="p-2 hover:bg-blue-50 rounded-md transition-colors"
                      title="Ver traza"
                    >
                      <Eye size={16} className="text-blue-600" />
                    </button>
                  </Td>
                </Tr>
              ))
            )}
          </TBody>
        </Table>
      </Card>
    </div>
  );
};

export default SolicitudVisitaPage;
