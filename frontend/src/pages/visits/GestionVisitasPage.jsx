import { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowLeft, Play, Eye, Edit2,
  Calendar, Building2, AlertCircle, Clock,
  Send, Cpu, ClipboardList, CheckCircle2, User,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import GenericListView from '../../components/shared/GenericListView';
import FilterBar from '../../components/shared/FilterBar';
import VisitaMobileCard from '../../components/visits/VisitaMobileCard';
import { H2, H3, TextSmall, TextTiny, Label } from '../../components/ui/Typography';
import VisitStatusBadge from '../../components/visits/VisitStatusBadge';
import { TechnicianChipList } from '../../components/ui/TechnicianChip';
import Modal from '../../components/ui/Modal';
import DeviceChecklistCard from '../../components/visits/DeviceChecklistCard';
import { useVisitas } from '../../hooks/useVisitas';
import { useNotify } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import { iniciarVisita, guardarAvanceDispositivo, finalizarVisita } from '../../api/visitaApi';

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
/**
 * @param {{ initialVisitaId?: string|null, onInitialVisitaConsumed?: () => void }} props
 */
const GestionVisitasPage = ({ initialVisitaId = null, onInitialVisitaConsumed }) => {
  const { visitas: visitasHook, loading: loadingVisitas, fetchVisitas } = useVisitas();
  const notify   = useNotify();
  const { user } = useAuth();
  const isTecnico = user?.role === ROLES.TECNICO;
  const [activeVisita,         setActiveVisita]         = useState(null);
  const [filters,              setFilters]              = useState({ cliente: [], sucursal: [], estado: [], tecnico: [], fechaDesde: '', fechaHasta: '' });
  const [ejecucionPasos,       setEjecucionPasos]       = useState({});
  const [ejecucionActividades, setEjecucionActividades] = useState({});
  const [deviceEvidencias,     setDeviceEvidencias]     = useState({});
  // Modal finalizar — captura observación final antes de confirmar
  const [observacionFinal,     setObservacionFinal]     = useState('');
  const [isSaving,             setIsSaving]             = useState(false);
  const [showHelpModal,        setShowHelpModal]        = useState(false);
  const [modalTitle,           setModalTitle]           = useState('');
  const [modalMessage,         setModalMessage]         = useState('');
  const [successModal,         setSuccessModal]         = useState({ open: false, deviceNombre: '' });

  const visitas = visitasHook;

  // Auto-abrir la visita indicada desde el dashboard del técnico.
  // consumedRef guarda el último ID procesado para evitar doble apertura
  // cuando visitas se recarga en background, pero sí responde a un nuevo ID.
  const consumedRef = useRef(null);
  useEffect(() => {
    if (!initialVisitaId || loadingVisitas) return;
    if (consumedRef.current === initialVisitaId) return;
    const target = visitas.find(v => v.id === initialVisitaId);
    if (!target) return;
    consumedRef.current = initialVisitaId;
    onInitialVisitaConsumed?.();
    handleOpenVisita(target);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialVisitaId, visitas, loadingVisitas]);

  // Base list: only relevant states for gestión
  const baseList = useMemo(() => visitas.filter(v =>
    v.estadoCodigo === 'PROGRAMADA' || v.estadoCodigo === 'EN_PROGRESO' || v.estadoCodigo === 'COMPLETADA',
  ), [visitas]);

  // Opciones para FilterBar
  const clienteOptions = useMemo(() => {
    const seen = new Set();
    return baseList
      .map(v => ({ value: v.clienteId || '', label: v.clienteNombre || '' }))
      .filter(o => o.value && o.label && !seen.has(o.value) && seen.add(o.value))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [baseList]);

  const sucursalOptions = useMemo(() => {
    const selectedClientes = filters.cliente;
    const seen = new Set();
    return baseList
      .filter(v => selectedClientes.length === 0 || selectedClientes.includes(v.clienteId || ''))
      .map(v => ({ value: v.sucursalId || '', label: v.sucursalNombre || '', parentValue: v.clienteId || '' }))
      .filter(o => {
        const key = `${o.value}__${o.parentValue}`;
        return o.value && o.label && !seen.has(key) && seen.add(key);
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [baseList, filters.cliente]);

  const estadoOptions = useMemo(() => [
    { value: 'PROGRAMADA',  label: 'Programada'  },
    { value: 'EN_PROGRESO', label: 'En curso'     },
    { value: 'COMPLETADA',  label: 'Completada'   },
  ], []);

  const tecnicoOptions = useMemo(() => {
    const seen = new Set();
    return baseList
      .flatMap(v => (v.tecnicosNombres || []).map((nombre, i) => ({ value: (v.tecnicoIds || [])[i] || nombre, label: nombre })))
      .filter(o => o.value && o.label && !seen.has(o.value) && seen.add(o.value))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [baseList]);

  const filterDefs = [
    { key: 'cliente',    label: 'Cliente',      options: clienteOptions,  multi: true },
    { key: 'sucursal',   label: 'Sucursal',     options: sucursalOptions,  multi: true, dependsOn: 'cliente', dependsOnLabel: 'un cliente' },
    { key: 'estado',     label: 'Estado',       options: estadoOptions,    multi: true },
    { key: 'tecnico',    label: 'Técnico',      options: tecnicoOptions,   multi: true },
    { key: 'fechaDesde', label: 'Fecha desde',  type: 'date', dateRole: 'desde', linkedTo: 'fechaHasta' },
    { key: 'fechaHasta', label: 'Fecha hasta',  type: 'date', dateRole: 'hasta', linkedTo: 'fechaDesde' },
  ];

  // ── Filtered list (multi-select filters; text search handled by GenericListView) ──
  const filtered = useMemo(() => {
    let list = baseList;
    if (filters.cliente.length > 0)
      list = list.filter(v => filters.cliente.includes(v.clienteId || ''));
    if (filters.sucursal.length > 0)
      list = list.filter(v => filters.sucursal.includes(v.sucursalId || ''));
    if (filters.estado.length > 0)
      list = list.filter(v => filters.estado.includes(v.estadoCodigo || ''));
    if (filters.tecnico.length > 0)
      list = list.filter(v => (v.tecnicoIds || []).some(id => filters.tecnico.includes(id)));
    if (filters.fechaDesde)
      list = list.filter(v => v.fechaProgramada && v.fechaProgramada >= filters.fechaDesde);
    if (filters.fechaHasta)
      list = list.filter(v => v.fechaProgramada && v.fechaProgramada <= filters.fechaHasta + 'T23:59:59');
    return list;
  }, [baseList, filters]);

  // ── Open execution view ──────────────────────────────────────────────────
  const handleOpenVisita = (visita) => {
    setActiveVisita(visita);
    setEjecucionPasos(visita.ejecucionPasos || {});
    setEjecucionActividades(visita.ejecucionActividades || {});
    // Inicializar con evidencias ya subidas (preview = url pública) para mostrar imágenes guardadas
    setDeviceEvidencias(visita.deviceEvidencias || {});
    setObservacionFinal(visita.observacionFinal || '');
  };

  const handleCloseVisita = () => {
    setActiveVisita(null);
    setEjecucionPasos({});
    setEjecucionActividades({});
    setDeviceEvidencias({});
    setObservacionFinal('');
  };

  // ── Update device-level evidencias ───────────────────────────────────────
  const handleDeviceEvidenciasChange = (deviceId, patch) => {
    setDeviceEvidencias(prev => ({
      ...prev,
      [deviceId]: { ...(prev[deviceId] || { etiqueta: null, fotos: [] }), ...patch },
    }));
  };

  // ── Iniciar visita (PROGRAMADA → EN_PROCESO) ─────────────────────────────
  /**
   * Actualiza la visita en Supabase (fecha_inicio + estado EN_PROCESO) y
   * refleja el cambio en el estado local de forma optimista.
   */
  const handleIniciar = async () => {
    if (!activeVisita || isSaving) return;
    setIsSaving(true);
    // Optimistic update: refleja el cambio en UI antes de la confirmación
    setActiveVisita(prev => ({ ...prev, estadoCodigo: 'EN_PROGRESO', fechaInicio: new Date().toISOString() }));
    try {
      await iniciarVisita(activeVisita.id);
      // Refrescar lista de fondo sin bloquear UI
      fetchVisitas();
    } catch (err) {
      console.error('[GestionVisitasPage] handleIniciar error:', err);
      // Revertir optimistic update en caso de error
      setActiveVisita(prev => ({ ...prev, estadoCodigo: 'PROGRAMADA', fechaInicio: null }));
      setModalTitle('Error al iniciar');
      setModalMessage(err.message || 'No se pudo iniciar la visita. Intenta de nuevo.');
      setShowHelpModal(true);
    } finally {
      setIsSaving(false);
    }
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
  /**
   * Persiste el avance de pasos, actividades y evidencias de un dispositivo en Supabase.
   * Recibe dispositivoId y evidencias directamente desde DeviceChecklistCard via onSaveAvance.
   *
   * @param {string} dispositivoId - UUID del dispositivo que se está guardando
   * @param {{ etiqueta: { file: File, preview: string }|null, fotos: Array<{ file: File, preview: string }> }} evidencias
   *   Evidencias fotográficas capturadas a nivel de dispositivo
   */
  const handleSaveAvance = async (dispositivoId, evidencias, codigoEtiqueta) => {
    if (!activeVisita || !dispositivoId || isSaving) return;

    const device = (activeVisita.dispositivos || []).find(d => d.id === dispositivoId);
    const allPasos = device?.pasos || [];
    const isFinalStep = allDevicesDone;

    if (isFinalStep && !observacionFinal.trim()) {
      notify('warning', 'Agrega una observación final antes de finalizar la visita.');
      return;
    }

    setIsSaving(true);
    try {
      await guardarAvanceDispositivo(
        activeVisita.id,
        dispositivoId,
        allPasos,
        ejecucionPasos,
        ejecucionActividades,
        evidencias || { etiqueta: null, fotos: [] },
        codigoEtiqueta || null,
      );

      if (isFinalStep) {
        await finalizarVisita(activeVisita.id, observacionFinal);
        await fetchVisitas();
        handleCloseVisita();
        return;
      }

      // Mostrar popup inmediatamente — sin esperar el refresco
      setSuccessModal({ open: true, deviceNombre: device?.label || 'dispositivo' });

      // Refrescar en background para sincronizar ejecucionPasos, actividades y evidencias desde BD
      const visitaId = activeVisita.id;
      const refreshed = await fetchVisitas();
      if (refreshed) {
        const updated = refreshed.find(v => v.id === visitaId);
        if (updated) {
          setActiveVisita(prev => ({ ...prev, deviceEvidencias: updated.deviceEvidencias }));
          setEjecucionPasos(updated.ejecucionPasos || {});
          setEjecucionActividades(updated.ejecucionActividades || {});
          setDeviceEvidencias(updated.deviceEvidencias || {});
        }
      }
    } catch (err) {
      console.error('[GestionVisitasPage] handleSaveAvance error:', err);
      notify('error', err.message || 'No se pudo guardar el avance. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── All done: every device has all its mandatory actividades checked ──────
  const allDevicesDone = useMemo(() => {
    if (!activeVisita?.dispositivos?.length) return false;
    return activeVisita.dispositivos.every(device =>
      (device.pasos || []).length > 0 &&
      (device.pasos || []).every(paso =>
        (paso.actividades || []).length === 0 ||
        (paso.actividades || []).every(a => ejecucionActividades[a.id]?.completada)
      ),
    );
  }, [activeVisita, ejecucionActividades]);

  // ══════════════════════════════════════════════════════════════════════════
  // EXECUTION VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (activeVisita) {
    const isEnCurso    = activeVisita.estadoCodigo === 'EN_PROGRESO';
    const isProgramado = activeVisita.estadoCodigo === 'PROGRAMADA';
    const isFinalizado = activeVisita.estadoCodigo === 'COMPLETADA';
    const viewMode = isFinalizado;

    // Per-device completion stats — done when all actividades are checked
    const deviceStats = (activeVisita.dispositivos || []).map(d => {
      const allActs = (d.pasos || []).flatMap(p => p.actividades || []);
      const totalActs = allActs.length;
      const doneActs  = allActs.filter(a => ejecucionActividades[a.id]?.completada).length;
      const done = (d.pasos || []).length > 0 && (d.pasos || []).every(paso =>
        (paso.actividades || []).length === 0 ||
        (paso.actividades || []).every(a => ejecucionActividades[a.id]?.completada)
      );
      // started: al menos una actividad completada pero no terminado del todo
      const started = doneActs > 0 && !done;
      return { ...d, totalActs, doneActs, done, started };
    });

    const completedDevices = deviceStats.filter(d => d.done).length;
    const totalDevices     = deviceStats.length;

    // Dispositivo actualmente en progreso (empezado pero no terminado)
    // Si existe, bloquea a los demás hasta que se termine
    const inProgressDevice = deviceStats.find(d => d.started);

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
              <H2>{activeVisita.clienteNombre} — {activeVisita.sucursalNombre}</H2>
              <TextSmall className="text-gray-500">
                {activeVisita.tipoVisitaLabel || 'Sin tipo'} · {activeVisita.fechaProgramada ? new Date(activeVisita.fechaProgramada).toLocaleDateString('es-ES') : ''}
              </TextSmall>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <VisitStatusBadge status={activeVisita.estadoCodigo} />
            {isProgramado && isTecnico && (
              <Button
                onClick={handleIniciar}
                disabled={isSaving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 border-0 text-white disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Play size={14} /> {isSaving ? 'Iniciando...' : 'Iniciar Visita'}
              </Button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main checklist area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Informativo */}
            {isProgramado && isTecnico && (
              <div className="flex items-center gap-3 p-4 rounded-lg border border-yellow-200 bg-yellow-50">
                <Clock size={18} className="text-yellow-600 shrink-0" />
                <TextSmall className="text-yellow-800">
                  La visita está programada. Presiona <strong>Iniciar Visita</strong> para comenzar a registrar el avance.
                </TextSmall>
              </div>
            )}

            {/* Device checklists — libre elección; bloqueado solo si otro dispositivo está en progreso */}
            {activeVisita.dispositivos?.length > 0
              ? activeVisita.dispositivos.map((device, idx) => {
                  const stat = deviceStats[idx];
                  // Bloqueado si hay un dispositivo en progreso Y este dispositivo no es ese, ni está ya terminado
                  const isLocked = !!(inProgressDevice && inProgressDevice.id !== device.id && !stat.done);
                  const isLastDevice = idx === activeVisita.dispositivos.length - 1;
                  // isFinalDevice: último dispositivo, tanto en ejecución como en lectura (para mostrar observacion_final)
                  const isFinalDevice = isLastDevice && (isEnCurso || viewMode);
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
                      deviceEvidencias={deviceEvidencias[device.id] || { etiqueta: null, fotos: [] }}
                      onDeviceEvidenciasChange={(patch) => handleDeviceEvidenciasChange(device.id, patch)}
                      codigoEtiquetaInicial={activeVisita.codigoEtiquetaByDevice?.[device.id] || ''}
                      isFinalDevice={isFinalDevice}
                      allDevicesDone={allDevicesDone}
                      observacionFinal={observacionFinal}
                      onObservacionChange={setObservacionFinal}
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

          </div>

          {/* Side summary panel */}
          <div className="space-y-4">
            {/* Visit summary */}
            <Card className="p-5 space-y-4">
              <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide block">Resumen de la Visita</Label>
              <div className="space-y-3">
                <InfoRow icon={AlertCircle} label="Tipo"              value={activeVisita.tipoVisitaLabel} />
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

        {/* Popup éxito — avance guardado (mismo patrón que ConfigurationNavigator) */}
        {successModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-3 text-green-600 mb-4">
                <CheckCircle2 size={32} />
                <H3 className="normal-case text-gray-900">Avance Guardado</H3>
              </div>
              <TextSmall className="text-gray-600 mb-6 leading-relaxed">
                El avance del dispositivo <strong>{successModal.deviceNombre}</strong> fue guardado y enviado al coordinador correctamente. ¿Qué deseas hacer ahora?
              </TextSmall>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => setSuccessModal({ open: false, deviceNombre: '' })}
                  variant="success"
                  className="w-full"
                >
                  Continuar con la visita
                </Button>
                <Button
                  onClick={() => { setSuccessModal({ open: false, deviceNombre: '' }); handleCloseVisita(); }}
                  variant="outline"
                  className="w-full"
                >
                  Volver a visitas
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ══════════════════════════════════════════════════════════════════════════

  /** Calcula dispositivos completados (obligatorios) para una visita */
  const getDeviceProgress = (visita) => {
    const total     = visita.dispositivos?.length || 0;
    const completed = visita.dispositivos?.filter(d =>
      (d.pasos || []).length > 0 &&
      (d.pasos || []).every(paso =>
        (paso.actividades || []).length === 0 ||
        (paso.actividades || []).every(a => visita.ejecucionActividades?.[a.id]?.completada)
      )
    ).length || 0;
    return { total, completed };
  };

  const columns = [
    {
      header: 'Tipo',
      render: visita => visita.tipoVisitaLabel || visita.tipoVisitaCodigo
        ? <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${visita.tipoVisitaCodigo === 'PREVENTIVO' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
            {visita.tipoVisitaLabel || visita.tipoVisitaCodigo}
          </span>
        : <TextSmall className="text-gray-400">—</TextSmall>,
    },
    {
      header: 'Cliente / Sucursal',
      render: visita => <>
        <TextSmall className="font-semibold">{visita.clienteNombre}</TextSmall>
        <TextTiny className="text-gray-400">{visita.sucursalNombre}</TextTiny>
      </>,
    },
    {
      header: 'Fecha',
      render: visita => visita.fechaProgramada
        ? <div className="whitespace-nowrap">
            <TextSmall>{new Date(visita.fechaProgramada).toLocaleDateString('es-ES')}</TextSmall>
            <TextTiny className="text-gray-400">{new Date(visita.fechaProgramada).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</TextTiny>
          </div>
        : <TextSmall className="text-gray-400">—</TextSmall>,
    },
    {
      header: 'Técnico(s)',
      render: visita => <TechnicianChipList names={visita.tecnicosNombres || []} />,
    },
    {
      header: 'Dispositivos',
      render: visita => {
        const { total, completed } = getDeviceProgress(visita);
        return (
          <div className="flex items-center gap-1.5 min-w-20">
            {total > 0 ? (
              <>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#D32F2F] rounded-full" style={{ width: `${(completed / total) * 100}%` }} />
                </div>
                <TextTiny className="text-gray-400 whitespace-nowrap shrink-0">{completed}/{total}</TextTiny>
              </>
            ) : (
              <TextTiny className="text-gray-400">—</TextTiny>
            )}
          </div>
        );
      },
    },
    {
      header: 'Estado',
      render: visita => <VisitStatusBadge status={visita.estadoCodigo} />,
    },
    {
      header: 'Acciones',
      narrow: true,
      align: 'right',
      render: visita => (
        <button
          onClick={() => handleOpenVisita(visita)}
          className="p-2 hover:bg-blue-50 rounded-md transition-colors"
          title={visita.estadoCodigo === 'COMPLETADA' ? 'Ver informe' : 'Ejecutar'}
        >
          {visita.estadoCodigo === 'COMPLETADA'
            ? <Eye size={16} className="text-blue-600" />
            : <Edit2 size={16} className="text-green-600" />}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <GenericListView
        icon={ClipboardList}
        title="Gestión de Visitas"
        items={filtered}
        columns={columns}
        loading={loadingVisitas}
        loadingText="Cargando visitas..."
        emptyText="No hay visitas asignadas con los filtros seleccionados."
        emptyIcon={ClipboardList}
        onNew={() => {
          setModalTitle('¿Cómo crear una visita?');
          setModalMessage('Para crear una visita técnica, por favor diríjase al módulo de "Programación de Visitas" para asignar técnicos a una solicitud existente, o cree una nueva "Solicitud de Visita" desde el módulo correspondiente.');
          setShowHelpModal(true);
        }}
        newButtonLabel="Ayuda Creación"
        filteredCount={filtered.length}
        totalItems={baseList.length}
        activeFiltersCount={filters.cliente.length + filters.sucursal.length + filters.estado.length + filters.tecnico.length + (filters.fechaDesde ? 1 : 0) + (filters.fechaHasta ? 1 : 0)}
        onClearFilters={() => setFilters({ cliente: [], sucursal: [], estado: [], tecnico: [], fechaDesde: '', fechaHasta: '' })}
        extraFilters={
          <FilterBar filters={filterDefs} values={filters} onChange={setFilters} />
        }
        renderMobileCard={visita => {
          const { total, completed } = getDeviceProgress(visita);
          return (
            <VisitaMobileCard
              visita={visita}
              tipoCodigo={visita.tipoVisitaCodigo}
              tipoLabel={visita.tipoVisitaLabel}
              fechaDisplay={visita.fechaProgramada}
              estadoCodigo={visita.estadoCodigo}
              tecnicos={visita.tecnicosNombres || []}
              totalDevices={total}
              completedDevices={completed}
              actions={[
                visita.estadoCodigo === 'COMPLETADA'
                  ? { label: 'Ver informe',     icon: Eye,   onClick: () => handleOpenVisita(visita), colorClass: 'bg-blue-50 text-blue-700 hover:bg-blue-100' }
                  : { label: 'Ejecutar visita', icon: Edit2, onClick: () => handleOpenVisita(visita), colorClass: 'bg-green-50 text-green-700 hover:bg-green-100' },
              ]}
            />
          );
        }}
      />

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
