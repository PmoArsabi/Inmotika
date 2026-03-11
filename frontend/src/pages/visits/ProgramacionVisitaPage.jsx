import { useState, useMemo } from 'react';
import {
  ArrowLeft, Search, X, Edit, Eye, CalendarCheck,
  Calendar, Building2, User, AlertCircle, Users, Save, Cpu, Plus,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ModuleHeader from '../../components/ui/ModuleHeader';
import Select from '../../components/ui/Select';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { Table, THead, TBody, Tr, Th, Td } from '../../components/ui/Table';
import { H2, Subtitle, TextSmall, TextTiny, Label } from '../../components/ui/Typography';
import VisitStatusBadge from '../../components/visits/VisitStatusBadge';
import { TechnicianChipList } from '../../components/ui/TechnicianChip';
import VisitProgressPanel from '../../components/visits/VisitProgressPanel';
import { ROLES } from '../../utils/constants';

// ─── Constants ────────────────────────────────────────────────────────────────
const TIPO_VISITA_OPTIONS = [
  { value: '',           label: 'Seleccionar tipo...' },
  { value: 'PREVENTIVO', label: 'Mantenimiento Preventivo' },
  { value: 'CORRECTIVO', label: 'Mantenimiento Correctivo' },
];

const ESTADO_OPTIONS = [
  { value: '',            label: 'Seleccionar estado...' },
  { value: 'SOLICITUD',   label: 'Solicitud'    },
  { value: 'PROGRAMADO',  label: 'Programado'   },
  { value: 'REPROGRAMADO',label: 'Reprogramado' },
  { value: 'CANCELADO',   label: 'Cancelado'    },
];

const emptyVisitaDraft = (solicitud = null) => ({
  solicitudId:     solicitud?.id        || null,
  clienteId:       solicitud?.clienteId || '',
  clienteNombre:   solicitud?.clienteNombre || '',
  sucursalId:      solicitud?.sucursalId || '',
  sucursalNombre:  solicitud?.sucursalNombre || '',
  tipoVisita:      solicitud?.tipoVisita || '',
  dispositivoIds:  solicitud?.dispositivoIds || [],
  dispositivosNombres: solicitud?.dispositivosNombres || [],
  tecnicoIds:      [],
  tecnicosNombres: [],
  fechaProgramada: '',
  fechaInicio:     '',
  fechaFin:        '',
  observaciones:   solicitud?.observacion || '',
  estado:          'PROGRAMADO',
  dispositivos:    [],
  ejecucionPasos:  {},
});

// ─── Info row helper ──────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value, children }) => (
  <div className="flex items-start gap-2">
    <Icon size={14} className="text-gray-400 mt-0.5 shrink-0" />
    <div className="min-w-0">
      <TextTiny className="text-gray-400">{label}</TextTiny>
      {children || <TextSmall className="text-gray-900 font-semibold truncate">{value || '—'}</TextSmall>}
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
const ProgramacionVisitaPage = ({ data, setData }) => {
  const [editingVisita, setEditingVisita]     = useState(null);   // visita being scheduled/edited
  const [viewingVisita, setViewingVisita]     = useState(null);   // visita read-only
  const [solicitudOrigen, setSolicitudOrigen] = useState(null);   // linked solicitud for context
  const [draft,           setDraft]           = useState(emptyVisitaDraft());
  const [searchTerm,      setSearchTerm]      = useState('');
  const [filterEstado,    setFilterEstado]    = useState('Todos');

  const solicitudes = data?.solicitudesVisita || [];
  const visitas     = data?.visitas           || [];
  const usuarios    = data?.usuarios          || [];

  // Tecnicos from usuarios list
  const tecnicosOptions = useMemo(() =>
    usuarios
      .filter(u => u.rol === ROLES.TECNICO || u.rol === 'tecnico')
      .map(u => ({ value: u.id, label: `${u.nombres || ''} ${u.apellidos || ''}`.trim() || u.email })),
    [usuarios],
  );

  const dispositivoOptions = useMemo(() =>
    (data?.dispositivos || []).map(d => ({ value: String(d.id), label: d.nombre || `Dispositivo ${d.id}` })),
    [data],
  );

  // ── Build combined list: pending solicitudes + existing visitas ──────────
  const combinedList = useMemo(() => {
    const visitaIds = new Set(visitas.map(v => v.solicitudId).filter(Boolean));
    const pendingSolicitudes = solicitudes
      .filter(s => !visitaIds.has(s.id) && s.estado !== 'CANCELADO')
      .map(s => ({ ...s, _type: 'solicitud' }));
    const allVisitas = visitas.map(v => ({ ...v, _type: 'visita' }));
    return [...pendingSolicitudes, ...allVisitas];
  }, [solicitudes, visitas]);

  const filtered = useMemo(() => {
    let list = combinedList;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(item =>
        item.clienteNombre?.toLowerCase().includes(q) ||
        item.sucursalNombre?.toLowerCase().includes(q),
      );
    }
    if (filterEstado !== 'Todos') list = list.filter(item => item.estado === filterEstado);
    return list;
  }, [combinedList, searchTerm, filterEstado]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleNewVisita = () => {
    setSolicitudOrigen(null);
    setDraft(emptyVisitaDraft());
    setEditingVisita(null);
    setViewingVisita(null);
  };

  const handleSchedule = (item) => {
    const solicitud = item._type === 'solicitud' ? item : solicitudes.find(s => s.id === item.solicitudId);
    setSolicitudOrigen(solicitud || null);
    setDraft(item._type === 'visita'
      ? {
          ...item,
          dispositivoIds:      item.dispositivoIds      ?? (item.dispositivos?.map(d => String(d.id)) ?? []),
          dispositivosNombres: item.dispositivosNombres ?? (item.dispositivos?.map(d => d.nombre)     ?? []),
          tecnicoIds:          item.tecnicoIds          ?? [],
        }
      : emptyVisitaDraft(item),
    );
    setEditingVisita(item._type === 'visita' ? item : null);
    setViewingVisita(null);
  };

  const handleView = (item) => {
    const solicitud = item._type === 'solicitud' ? item : solicitudes.find(s => s.id === item.solicitudId);
    setSolicitudOrigen(solicitud || null);
    setViewingVisita(item);
    setEditingVisita(null);
  };

  const handleCancel = () => {
    setEditingVisita(null);
    setViewingVisita(null);
    setSolicitudOrigen(null);
    setDraft(emptyVisitaDraft());
  };

  const updateDraft = (patch) => setDraft(prev => ({ ...prev, ...patch }));

  const handleSave = () => {
    if (!draft.tipoVisita || !draft.fechaInicio || !draft.estado) {
      alert('Complete los campos obligatorios: Tipo, Fecha de Inicio y Estado.');
      return;
    }
    const tecnicosNombres = (draft.tecnicoIds || []).map(id => {
      const u = usuarios.find(u => u.id === id);
      return u ? `${u.nombres || ''} ${u.apellidos || ''}`.trim() : id;
    });

    if (editingVisita) {
      // Update existing visita
      setData(prev => ({
        ...prev,
        visitas: (prev.visitas || []).map(v =>
          v.id === editingVisita.id ? { ...v, ...draft, tecnicosNombres } : v,
        ),
      }));
      // Update solicitud estado if linked
      if (draft.solicitudId) {
        setData(prev => ({
          ...prev,
          solicitudesVisita: (prev.solicitudesVisita || []).map(s =>
            s.id === draft.solicitudId ? { ...s, estado: draft.estado } : s,
          ),
        }));
      }
    } else {
      // Create new visita from solicitud
      const newId = `VIS-${String((data?.visitas || []).length + 1).padStart(3, '0')}`;
      const nuevaVisita = {
        id: newId,
        ...draft,
        fechaProgramada: draft.fechaInicio,  // fechaInicio doubles as the scheduled start time
        tecnicosNombres,
        dispositivos: [],
        ejecucionPasos: {},
      };
      setData(prev => ({
        ...prev,
        visitas: [...(prev.visitas || []), nuevaVisita],
        solicitudesVisita: (prev.solicitudesVisita || []).map(s =>
          s.id === draft.solicitudId ? { ...s, estado: draft.estado, visitaId: newId } : s,
        ),
      }));
    }
    handleCancel();
  };

  // ══════════════════════════════════════════════════════════════════════════
  // SCHEDULE / EDIT FORM
  // ══════════════════════════════════════════════════════════════════════════
  if (editingVisita !== null || (draft.solicitudId && !viewingVisita)) {
    const isEditing = !!editingVisita;
    return (
      <div className="space-y-6 animate-in slide-in-from-right-12 duration-500">
        <header className="flex items-center justify-between bg-white p-4 rounded-md border border-gray-100 shadow-sm flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <button onClick={handleCancel} className="p-2 bg-gray-50 hover:bg-[#D32F2F] hover:text-white rounded-md transition-all shadow-sm">
              <ArrowLeft size={16} />
            </button>
            <div>
              <H2>{isEditing ? 'Editar Programación' : 'Programar Visita'}</H2>
              <TextSmall className="text-gray-500">
                {solicitudOrigen ? `Origen: solicitud ${solicitudOrigen.id}` : 'Visita sin solicitud origen'}
              </TextSmall>
            </div>
          </div>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save size={16} /> {isEditing ? 'Guardar Cambios' : 'Programar Visita'}
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Base data */}
            <Card className="p-5 space-y-4">
              <SectionHeader icon={AlertCircle} title="Datos de la Visita" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Tipo de Visita"
                  icon={AlertCircle}
                  options={TIPO_VISITA_OPTIONS}
                  value={draft.tipoVisita}
                  onChange={e => updateDraft({ tipoVisita: e.target.value })}
                  required
                />
                <Select
                  label="Estado"
                  options={ESTADO_OPTIONS}
                  value={draft.estado}
                  onChange={e => updateDraft({ estado: e.target.value })}
                  required
                />
              </div>

              {/* Devices multi-select */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
                  Dispositivos a Evaluar
                </Label>
                <SearchableSelect
                  options={dispositivoOptions}
                  value={(draft.dispositivoIds || []).map(id => ({ value: id, label: dispositivoOptions.find(o => o.value === id)?.label || id }))}
                  onChange={opts => updateDraft({ dispositivoIds: opts.map(o => o.value), dispositivosNombres: opts.map(o => o.label) })}
                  placeholder="Seleccionar dispositivos..."
                  isMulti
                />
              </div>
            </Card>

            {/* Technicians assignment */}
            <Card className="p-5 space-y-4">
              <SectionHeader icon={Users} title="Asignación de Técnicos" />
              <SearchableSelect
                options={tecnicosOptions}
                value={(draft.tecnicoIds || []).map(id => ({ value: id, label: tecnicosOptions.find(o => o.value === id)?.label || id }))}
                onChange={opts => updateDraft({ tecnicoIds: opts.map(o => o.value) })}
                placeholder="Asignar técnicos..."
                isMulti
              />
              {draft.tecnicoIds.length === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <AlertCircle size={14} className="text-yellow-600 shrink-0" />
                  <TextTiny className="text-yellow-700">Se recomienda asignar al menos un técnico antes de programar.</TextTiny>
                </div>
              )}
            </Card>

            {/* Dates */}
            <Card className="p-5 space-y-4">
              <SectionHeader icon={Calendar} title="Fechas" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'fechaInicio', label: 'Fecha y Hora de Inicio', required: true  },
                  { key: 'fechaFin',    label: 'Fecha y Hora de Fin',    required: false },
                ].map(({ key, label, required }) => (
                  <div key={key}>
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">
                      {label} {required && <span className="text-red-500">*</span>}
                    </Label>
                    <input
                      type="datetime-local"
                      value={draft[key] || ''}
                      onChange={e => updateDraft({ [key]: e.target.value })}
                      className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm font-semibold bg-white focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] transition-all"
                    />
                  </div>
                ))}
              </div>
            </Card>

            {/* Observation */}
            <Card className="p-5 space-y-2">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
                Observación del Coordinador
              </Label>
              <textarea
                value={draft.observaciones}
                onChange={e => updateDraft({ observaciones: e.target.value })}
                rows={3}
                placeholder="Instrucciones adicionales para el técnico, acceso, contacto en sitio..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-semibold resize-y focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] transition-all"
              />
            </Card>
          </div>

          {/* Side panel: solicitud origin */}
          <div className="space-y-4">
            {solicitudOrigen && (
              <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="text-blue-600" />
                  <Label className="text-sm font-bold text-blue-900">Solicitud Origen</Label>
                </div>
                <div className="space-y-2">
                  <InfoRow icon={Building2} label="Cliente"   value={solicitudOrigen.clienteNombre}  />
                  <InfoRow icon={Building2} label="Sucursal"  value={solicitudOrigen.sucursalNombre} />
                  <InfoRow icon={Calendar}  label="Fecha sugerida" value={solicitudOrigen.fechaSugerida ? new Date(solicitudOrigen.fechaSugerida).toLocaleString('es-ES') : '—'} />
                </div>
                {solicitudOrigen.observacion && (
                  <div className="p-2 rounded bg-white/60 border border-blue-100">
                    <TextTiny className="text-blue-700 italic">{solicitudOrigen.observacion}</TextTiny>
                  </div>
                )}
                <div className="pt-1">
                  <VisitStatusBadge status={solicitudOrigen.estado} />
                </div>
              </Card>
            )}

            <Card className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 space-y-3">
              <div className="flex items-center gap-2">
                <CalendarCheck size={15} className="text-gray-600" />
                <Label className="text-sm font-bold text-gray-900">Resumen de Programación</Label>
              </div>
              <div className="space-y-2">
                <InfoRow icon={AlertCircle} label="Tipo"    value={draft.tipoVisita || '—'} />
                <InfoRow icon={Users}       label="Técnicos" value={`${draft.tecnicoIds.length} asignado${draft.tecnicoIds.length !== 1 ? 's' : ''}`} />
                <InfoRow icon={Cpu}         label="Dispositivos" value={`${draft.dispositivoIds.length} seleccionado${draft.dispositivoIds.length !== 1 ? 's' : ''}`} />
              </div>
              {draft.estado && (
                <div className="pt-1">
                  <VisitStatusBadge status={draft.estado} />
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DETAIL / VIEW MODE
  // ══════════════════════════════════════════════════════════════════════════
  if (viewingVisita) {
    const item = viewingVisita;
    return (
      <div className="space-y-6 animate-in slide-in-from-right-12 duration-500">
        <header className="flex items-center justify-between bg-white p-4 rounded-md border border-gray-100 shadow-sm flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <button onClick={handleCancel} className="p-2 bg-gray-50 hover:bg-[#D32F2F] hover:text-white rounded-md transition-all shadow-sm">
              <ArrowLeft size={16} />
            </button>
            <div>
              <H2>Detalle · {item.id}</H2>
              <TextSmall className="text-gray-500">{item.clienteNombre} — {item.sucursalNombre}</TextSmall>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <VisitStatusBadge status={item.estado} />
            {item._type === 'visita' && (
              <Button onClick={() => handleSchedule(item)} className="flex items-center gap-2">
                <Edit size={14} /> Editar
              </Button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <Card className="p-5 space-y-4">
              <SectionHeader icon={CalendarCheck} title="Datos de la Visita" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={AlertCircle} label="Tipo"              value={item.tipoVisita}         />
                <InfoRow icon={Building2}   label="Sucursal"          value={item.sucursalNombre}     />
                <InfoRow icon={Calendar}    label="Fecha Programada"  value={item.fechaProgramada ? new Date(item.fechaProgramada).toLocaleString('es-ES') : '—'} />
                <InfoRow icon={Calendar}    label="Fecha Inicio"      value={item.fechaInicio ? new Date(item.fechaInicio).toLocaleString('es-ES') : '—'} />
                <InfoRow icon={Calendar}    label="Fecha Fin"         value={item.fechaFin ? new Date(item.fechaFin).toLocaleString('es-ES') : '—'} />
                <InfoRow icon={User}        label="Técnicos"          value={item.tecnicosNombres?.join(', ') || '—'} />
              </div>
              {item.observaciones && (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <TextTiny className="text-gray-400 mb-1">Observación</TextTiny>
                  <TextSmall className="text-gray-700">{item.observaciones}</TextSmall>
                </div>
              )}
            </Card>

            {item._type === 'visita' && item.dispositivos?.length > 0 && (
              <Card className="p-5 space-y-3">
                <SectionHeader icon={Cpu} title="Avance por Dispositivo" />
                <VisitProgressPanel
                  dispositivos={item.dispositivos.map(d => ({
                    ...d,
                    pasos: d.pasos?.map(p => ({
                      ...p,
                      estado: item.ejecucionPasos?.[p.id]?.estado || 'PENDIENTE',
                    })),
                  }))}
                />
              </Card>
            )}
          </div>

          <div className="space-y-4">
            {solicitudOrigen && (
              <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-blue-600" />
                  <Label className="text-sm font-bold text-blue-900">Solicitud Origen</Label>
                </div>
                <InfoRow icon={Calendar} label="Solicitada el" value={solicitudOrigen.fechaSolicitud ? new Date(solicitudOrigen.fechaSolicitud).toLocaleDateString('es-ES') : '—'} />
                <InfoRow icon={AlertCircle} label="Tipo Solicitado" value={solicitudOrigen.tipoVisita} />
                <VisitStatusBadge status={solicitudOrigen.estado} />
              </Card>
            )}
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
        icon={CalendarCheck}
        title="Programación de Visitas"
        subtitle="Asigna técnicos y fechas a las solicitudes pendientes"
        onNewClick={handleNewVisita}
        newButtonLabel="Nueva Visita"
        filterContent={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por cliente o sucursal..."
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
                { value: 'SOLICITUD',    label: 'Solicitud'         },
                { value: 'PROGRAMADO',   label: 'Programado'        },
                { value: 'REPROGRAMADO', label: 'Reprogramado'      },
                { value: 'EN_CURSO',     label: 'En curso'          },
                { value: 'CANCELADO',    label: 'Cancelado'         },
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
              <Th>Fecha</Th>
              <Th>Técnicos</Th>
              <Th>Estado</Th>
              <Th align="right">Acciones</Th>
            </tr>
          </THead>
          <TBody>
            {filtered.length === 0 ? (
              <Tr>
                <td colSpan={7} className="text-center py-12 text-sm text-gray-400">
                  No hay visitas o solicitudes pendientes con los filtros aplicados.
                </td>
              </Tr>
            ) : (
              filtered.map(item => (
                <Tr key={item.id}>
                  <Td>
                    <TextSmall className="font-bold text-gray-700 whitespace-nowrap">{item.id}</TextSmall>
                  </Td>
                  <Td>
                    {item.tipoVisita
                      ? <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${
                          item.tipoVisita === 'PREVENTIVO' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {item.tipoVisita}
                        </span>
                      : <TextSmall className="text-gray-400">—</TextSmall>
                    }
                  </Td>
                  <Td>
                    <TextSmall className="font-semibold">{item.clienteNombre}</TextSmall>
                    <TextTiny className="text-gray-400">{item.sucursalNombre}</TextTiny>
                  </Td>
                  <Td>
                    {item.fechaProgramada
                      ? <div className="whitespace-nowrap">
                          <TextSmall>{new Date(item.fechaProgramada).toLocaleDateString('es-ES')}</TextSmall>
                          <TextTiny className="text-gray-400">{new Date(item.fechaProgramada).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</TextTiny>
                        </div>
                      : <TextSmall className="text-gray-400 italic whitespace-nowrap">Sin programar</TextSmall>
                    }
                  </Td>
                  <Td>
                    <TechnicianChipList names={item.tecnicosNombres || []} />
                  </Td>
                  <Td><VisitStatusBadge status={item.estado} /></Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleView(item)}
                        className="p-2 hover:bg-blue-50 rounded-md transition-colors"
                        title="Ver detalle"
                      >
                        <Eye size={15} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleSchedule(item)}
                        className="p-2 hover:bg-green-50 rounded-md transition-colors"
                        title="Editar"
                      >
                        <Edit size={15} className="text-green-600" />
                      </button>
                    </div>
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

export default ProgramacionVisitaPage;
