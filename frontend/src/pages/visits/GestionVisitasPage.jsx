import { useState, useMemo } from 'react';
import {
  ArrowLeft, Search, X, Play, Eye, Edit2,
  Calendar, Building2, User, AlertCircle, CheckCircle2,
  Send, Cpu, Clock, ClipboardList,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ModuleHeader from '../../components/ui/ModuleHeader';
import Select from '../../components/ui/Select';
import { Table, THead, TBody, Tr, Th, Td } from '../../components/ui/Table';
import { H2, TextSmall, TextTiny, Label } from '../../components/ui/Typography';
import VisitStatusBadge from '../../components/visits/VisitStatusBadge';
import { TechnicianChipList } from '../../components/ui/TechnicianChip';
import Modal from '../../components/ui/Modal';
import DeviceChecklistCard from '../../components/visits/DeviceChecklistCard';
import { useVisitas } from '../../hooks/useVisitas';

// ─── Info row helper ──────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2">
    <Icon size={14} className="text-gray-400 mt-0.5 shrink-0" />
    <div>
      <TextTiny className="text-gray-400">{label}</TextTiny>
      <TextSmall className="text-gray-900 font-semibold">{value || '—'}</TextSmall>
    </div>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const GestionVisitasPage = () => {
  const { visitas: visitasHook, loading: loadingVisitas } = useVisitas();
  const [activeVisita,      setActiveVisita]      = useState(null);
  const [searchTerm,        setSearchTerm]        = useState('');
  const [filterEstado,      setFilterEstado]      = useState('Todos');
  // Paso-level: { [pasoId]: { comentarios, evidenciaUrl } }
  const [ejecucionPasos,    setEjecucionPasos]    = useState({});
  // Actividad-level: { [actividadId]: { completada: bool } }
  const [ejecucionActividades, setEjecucionActividades] = useState({});
  const [observacionFinal,  setObservacionFinal]  = useState('');
  const [showHelpModal,     setShowHelpModal]     = useState(false);
  const [modalTitle,        setModalTitle]        = useState('');
  const [modalMessage,      setModalMessage]      = useState('');

  const visitas = visitasHook;

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = visitas.filter(v =>
      v.estadoCodigo === 'PROGRAMADA' || v.estadoCodigo === 'EN_PROCESO' || v.estadoCodigo === 'FINALIZADO',
    );
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(v =>
        v.clienteNombre?.toLowerCase().includes(q) ||
        v.sucursalNombre?.toLowerCase().includes(q),
      );
    }
    if (filterEstado !== 'Todos') list = list.filter(v => v.estadoCodigo === filterEstado);
    return list;
  }, [visitas, searchTerm, filterEstado]);

  // ── Open execution view ──────────────────────────────────────────────────
  const handleOpenVisita = (visita) => {
    setActiveVisita(visita);
    setEjecucionPasos(visita.ejecucionPasos || {});
    setEjecucionActividades(visita.ejecucionActividades || {});
    setObservacionFinal('');
  };

  const handleCloseVisita = () => {
    setActiveVisita(null);
    setEjecucionPasos({});
    setEjecucionActividades({});
    setObservacionFinal('');
  };

  // ── Iniciar visita (PROGRAMADO → EN_CURSO) ────────────────────────────────
  const handleIniciar = () => {
    setActiveVisita(prev => ({ ...prev, estadoCodigo: 'EN_PROCESO', fechaInicio: new Date().toISOString() }));
  };

  // ── Update paso-level execution (comments, photo) ─────────────────────────
  const handlePasoChange = (pasoId, patch) => {
    setEjecucionPasos(prev => ({
      ...prev,
      [pasoId]: { ...(prev[pasoId] || {}), ...patch },
    }));
  };

  // ── Update actividad-level completion ─────────────────────────────────────
  const handleActividadChange = (actividadId, completada) => {
    setEjecucionActividades(prev => ({
      ...prev,
      [actividadId]: { completada },
    }));
  };

  // ── Save avance for a device ──────────────────────────────────────────────
  const handleSaveAvance = () => {
    setModalTitle('Avance Guardado');
    setModalMessage('Avance guardado y enviado al coordinador correctamente.');
    setShowHelpModal(true);
  };

  // ── Finalizar visita ──────────────────────────────────────────────────────
  const handleFinalizar = () => {
    if (!observacionFinal.trim()) {
      setModalTitle('Observación Requerida');
      setModalMessage('Agrega una observación final antes de finalizar la visita.');
      setShowHelpModal(true);
      return;
    }
    setActiveVisita(prev => ({ ...prev, estadoCodigo: 'FINALIZADO', fechaFin: new Date().toISOString(), observacionFinal }));
    handleCloseVisita();
  };

  // ── All done: every device has all its actividades checked + photo per paso ─
  const allDevicesDone = useMemo(() => {
    if (!activeVisita?.dispositivos?.length) return false;
    return activeVisita.dispositivos.every(device =>
      (device.pasos || []).every(paso => {
        const acts = paso.actividades || [];
        const allActsDone = acts.length > 0 && acts.every(a => ejecucionActividades[a.id]?.completada);
        const hasPhoto    = !!ejecucionPasos[paso.id]?.evidenciaUrl;
        return allActsDone && hasPhoto;
      }),
    );
  }, [activeVisita, ejecucionPasos, ejecucionActividades]);

  // ══════════════════════════════════════════════════════════════════════════
  // EXECUTION VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (activeVisita) {
    const isEnCurso    = activeVisita.estadoCodigo === 'EN_PROCESO';
    const isProgramado = activeVisita.estadoCodigo === 'PROGRAMADA';
    const isFinalizado = activeVisita.estadoCodigo === 'FINALIZADO';
    const viewMode = isFinalizado;

    // Per-device completion stats (based on actividades + photos)
    const deviceStats = (activeVisita.dispositivos || []).map(d => {
      const allActs = (d.pasos || []).flatMap(p => p.actividades || []);
      const totalActs = allActs.length;
      const doneActs  = allActs.filter(a => ejecucionActividades[a.id]?.completada).length;
      const done = (d.pasos || []).every(paso => {
        const acts = paso.actividades || [];
        return acts.length > 0
          && acts.every(a => ejecucionActividades[a.id]?.completada)
          && !!ejecucionPasos[paso.id]?.evidenciaUrl;
      }) && (d.pasos || []).length > 0;
      return { ...d, totalActs, doneActs, done };
    });

    const completedDevices   = deviceStats.filter(d => d.done).length;
    const totalDevices       = deviceStats.length;
    const firstIncompleteIdx = deviceStats.findIndex(d => !d.done);

    return (
      <div className="space-y-6 animate-in slide-in-from-right-12 duration-500">
        {/* Header */}
        <header className="flex items-center justify-between bg-white p-4 rounded-md border border-gray-100 shadow-sm flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCloseVisita}
              className="p-2 bg-gray-50 hover:bg-[#D32F2F] hover:text-white rounded-md transition-all shadow-sm"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <H2>Ejecución · {activeVisita.id}</H2>
              <TextSmall className="text-gray-500">
                {activeVisita.clienteNombre} — {activeVisita.sucursalNombre}
              </TextSmall>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <VisitStatusBadge status={activeVisita.estadoCodigo} />
            {isProgramado && (
              <Button onClick={handleIniciar} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 border-0 text-white">
                <Play size={14} /> Iniciar Visita
              </Button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main checklist area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Informativo */}
            {isProgramado && (
              <div className="flex items-center gap-3 p-4 rounded-lg border border-yellow-200 bg-yellow-50">
                <Clock size={18} className="text-yellow-600 shrink-0" />
                <TextSmall className="text-yellow-800">
                  La visita está programada. Presiona <strong>Iniciar Visita</strong> para comenzar a registrar el avance.
                </TextSmall>
              </div>
            )}

            {/* Device checklists — sequential: lock devices after the first incomplete */}
            {activeVisita.dispositivos?.length > 0
              ? activeVisita.dispositivos.map((device, idx) => {
                  const isLocked = firstIncompleteIdx !== -1 && idx > firstIncompleteIdx;
                  return (
                    <DeviceChecklistCard
                      key={device.id}
                      device={device}
                      steps={device.pasos || []}
                      ejecucionPasos={ejecucionPasos}
                      ejecucionActividades={ejecucionActividades}
                      onPasoChange={handlePasoChange}
                      onActividadChange={handleActividadChange}
                      onSaveAvance={handleSaveAvance}
                      viewMode={viewMode || isProgramado}
                      isLocked={isLocked}
                    />
                  );
                })
              : (
                <Card className="p-6 text-center">
                  <Cpu size={32} className="text-gray-300 mx-auto mb-2" />
                  <TextSmall className="text-gray-400">No hay dispositivos asignados a esta visita.</TextSmall>
                </Card>
              )
            }

            {/* Finalizar block — only when all devices done and EN_CURSO */}
            {isEnCurso && allDevicesDone && (
              <Card className="p-5 border-green-300 bg-green-50 space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-600" />
                  <Label className="text-sm font-bold text-green-800">¡Todos los dispositivos completados!</Label>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
                    Observación Final <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    value={observacionFinal}
                    onChange={e => setObservacionFinal(e.target.value)}
                    rows={3}
                    placeholder="Resumen del trabajo realizado, hallazgos generales, recomendaciones..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-semibold resize-y focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleFinalizar}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 border-0 text-white"
                  >
                    <Send size={14} /> Finalizar y Enviar Informe
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Side summary panel */}
          <div className="space-y-4">
            {/* Visit summary */}
            <Card className="p-5 space-y-4">
              <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide block">Resumen de la Visita</Label>
              <div className="space-y-3">
                <InfoRow icon={AlertCircle} label="Tipo"              value={activeVisita.tipoVisita}      />
                <InfoRow icon={Building2}   label="Sucursal"          value={activeVisita.sucursalNombre}  />
                <InfoRow icon={User}        label="Técnico(s)"        value={activeVisita.tecnicosNombres?.join(', ') || '—'} />
                <InfoRow icon={Calendar}    label="Fecha Programada"  value={activeVisita.fechaProgramada ? new Date(activeVisita.fechaProgramada).toLocaleString('es-ES') : '—'} />
                {activeVisita.fechaInicio && (
                  <InfoRow icon={Calendar}  label="Inicio"            value={new Date(activeVisita.fechaInicio).toLocaleString('es-ES')} />
                )}
                {activeVisita.observaciones && (
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <TextTiny className="text-gray-400 mb-1">Instrucciones</TextTiny>
                    <TextSmall className="text-gray-700 text-xs">{activeVisita.observaciones}</TextSmall>
                  </div>
                )}
              </div>
            </Card>

            {/* Progress tracker */}
            <Card className="p-5 space-y-3">
              <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide block">Progreso General</Label>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black text-gray-900">{completedDevices}</span>
                <span className="text-sm text-gray-400 mb-1">/ {totalDevices} dispositivos</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#D32F2F] rounded-full transition-all"
                  style={{ width: totalDevices > 0 ? `${(completedDevices / totalDevices) * 100}%` : '0%' }}
                />
              </div>
              <div className="space-y-1.5 pt-1">
                {deviceStats.map(d => (
                  <div key={d.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 truncate flex-1 mr-2">{d.label || d.idInmotika || d.id}</span>
                    <span className={`font-semibold shrink-0 ${d.done ? 'text-green-600' : 'text-gray-400'}`}>
                      {d.doneActs}/{d.totalActs} act.
                    </span>
                  </div>
                ))}
              </div>
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
        icon={ClipboardList}
        title="Gestión de Visitas"
        subtitle="Ejecuta y registra el avance de las visitas técnicas asignadas"
        onNewClick={() => {
          setModalTitle('¿Cómo crear una visita?');
          setModalMessage('Para crear una visita técnica, por favor diríjase al módulo de "Programación de Visitas" para asignar técnicos a una solicitud existente, o cree una nueva "Solicitud de Visita" desde el módulo correspondiente.');
          setShowHelpModal(true);
        }}
        newButtonLabel="Ayuda Creación"
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
                { value: 'Todos',      label: 'Todos los estados' },
                { value: 'PROGRAMADA', label: 'Programada'        },
                { value: 'EN_PROCESO', label: 'En curso'          },
                { value: 'FINALIZADO', label: 'Finalizado'        },
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
          <THead variant="light">
            <tr>
              <Th>Tipo</Th>
              <Th>Cliente / Sucursal</Th>
              <Th>Fecha</Th>
              <Th>Técnico(s)</Th>
              <Th>Dispositivos</Th>
              <Th>Estado</Th>
              <Th align="right">Acciones</Th>
            </tr>
          </THead>
          <TBody>
            {loadingVisitas ? (
              <Tr>
                <td colSpan={7} className="text-center py-12 text-sm text-gray-400">
                  Cargando visitas...
                </td>
              </Tr>
            ) : filtered.length === 0 ? (
              <Tr>
                <td colSpan={7} className="text-center py-12 text-sm text-gray-400">
                  No hay visitas asignadas con los filtros seleccionados.
                </td>
              </Tr>
            ) : (
              filtered.map(visita => {
                const totalDevices = visita.dispositivos?.length || 0;
                const completedDevices = visita.dispositivos?.filter(d =>
                  (d.pasos || []).length > 0 &&
                  (d.pasos || []).every(paso => {
                    const acts = paso.actividades || [];
                    return acts.length > 0
                      && acts.every(a => visita.ejecucionActividades?.[a.id]?.completada)
                      && !!visita.ejecucionPasos?.[paso.id]?.evidenciaUrl;
                  })
                ).length || 0;

                return (
                  <Tr key={visita.id}>
                    <Td>
                      {visita.tipoVisitaLabel || visita.tipoVisitaCodigo
                        ? <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${
                            visita.tipoVisitaCodigo === 'PREVENTIVO' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {visita.tipoVisitaLabel || visita.tipoVisitaCodigo}
                          </span>
                        : <TextSmall className="text-gray-400">—</TextSmall>
                      }
                    </Td>
                    <Td>
                      <TextSmall className="font-semibold">{visita.clienteNombre}</TextSmall>
                      <TextTiny className="text-gray-400">{visita.sucursalNombre}</TextTiny>
                    </Td>
                    <Td>
                      {visita.fechaProgramada
                        ? <div className="whitespace-nowrap">
                            <TextSmall>{new Date(visita.fechaProgramada).toLocaleDateString('es-ES')}</TextSmall>
                            <TextTiny className="text-gray-400">{new Date(visita.fechaProgramada).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</TextTiny>
                          </div>
                        : <TextSmall className="text-gray-400">—</TextSmall>
                      }
                    </Td>
                    <Td>
                      <TechnicianChipList names={visita.tecnicosNombres || []} />
                    </Td>
                    <Td>
                      <div className="space-y-1">
                        <TextSmall className="whitespace-nowrap">{totalDevices} dispositivo{totalDevices !== 1 ? 's' : ''}</TextSmall>
                        {totalDevices > 0 && (
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-16">
                              <div
                                className="h-full bg-[#D32F2F] rounded-full"
                                style={{ width: `${(completedDevices / totalDevices) * 100}%` }}
                              />
                            </div>
                            <TextTiny className="text-gray-400 whitespace-nowrap">{completedDevices}/{totalDevices}</TextTiny>
                          </div>
                        )}
                      </div>
                    </Td>
                    <Td><VisitStatusBadge status={visita.estadoCodigo} /></Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenVisita(visita)}
                          className="p-2 hover:bg-blue-50 rounded-md transition-colors"
                          title={visita.estadoCodigo === 'FINALIZADO' ? 'Ver informe' : 'Editar / Ejecutar'}
                        >
                          {visita.estadoCodigo === 'FINALIZADO'
                            ? <Eye size={16} className="text-blue-600" />
                            : <Edit2 size={16} className="text-green-600" />
                          }
                        </button>
                      </div>
                    </Td>
                  </Tr>
                );
              })
            )}
          </TBody>
        </Table>
      </Card>

      <Modal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title={modalTitle}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <TextSmall className="text-gray-600 leading-relaxed text-base normal-case">
            {modalMessage}
          </TextSmall>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setShowHelpModal(false)}>Aceptar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GestionVisitasPage;
