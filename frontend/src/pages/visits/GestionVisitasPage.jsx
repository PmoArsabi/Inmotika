import { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowLeft, Play, Eye, Edit2,
  Calendar, Building2, AlertCircle, Clock,
  Cpu, ClipboardList, CheckCircle2, User, Send, Save,
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
import { iniciarVisita, guardarAvanceDispositivo, finalizarVisita, notificarAvanceDispositivo, marcarDispositivoEnMantenimiento } from '../../api/visitaApi';
import { supabase } from '../../utils/supabase';

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
  const [codigoEtiquetas,      setCodigoEtiquetas]      = useState({});
  const [observacionFinal,     setObservacionFinal]     = useState('');
  const [isSaving,             setIsSaving]             = useState(false);
  const [savingDeviceId,       setSavingDeviceId]       = useState(null);
  const [showHelpModal,        setShowHelpModal]        = useState(false);
  const [modalTitle,           setModalTitle]           = useState('');
  const [modalMessage,         setModalMessage]         = useState('');
  const [successModal,         setSuccessModal]         = useState({ open: false, deviceNombre: '' });
  const [finalizadoModal,      setFinalizadoModal]      = useState({ open: false, clienteNombre: '', sucursalNombre: '' });
  /** @type {{ [deviceId: string]: { active: boolean, observacion: string } }} */
  const [fueraDeServicioMap,   setFueraDeServicioMap]   = useState({});
  /** Set de deviceIds ya marcados EN_MANTENIMIENTO — evita re-disparos */
  const enMantenimientoRef = useRef(new Set());

  const visitas = visitasHook;

  /**
   * Guarda los IDs de actividades/pasos que el técnico local ha modificado
   * manualmente, para no pisarlos con merges remotos.
   * @type {React.MutableRefObject<{ actividades: Set<string>, pasos: Set<string> }>}
   */
  const localChangesRef = useRef({ actividades: new Set(), pasos: new Set() });

  // ── Realtime: sincronizar avance entre técnicos de la misma visita ──────────
  useEffect(() => {
    if (!activeVisita?.id || activeVisita.estadoCodigo !== 'EN_PROGRESO') return;

    const visitaId = activeVisita.id;

    // Función que recarga las ejecuciones de la visita activa desde Supabase
    // y hace merge sin pisar los cambios locales no guardados del técnico.
    const syncRemoteChanges = async () => {
      // 1. Obtener IDs de intervenciones de esta visita
      const { data: intervenciones } = await supabase
        .from('intervencion')
        .select('id')
        .eq('visita_id', visitaId);
      const intervencionIds = (intervenciones || []).map(i => i.id);
      if (!intervencionIds.length) return;

      // 2. Fetch fresco de actividades y pasos
      const [{ data: actRows }, { data: pasoRows }] = await Promise.all([
        supabase
          .from('ejecucion_actividad')
          .select('actividad_id, estado_id, catalogo:estado_id(codigo), observacion')
          .in('intervencion_id', intervencionIds),
        supabase
          .from('ejecucion_paso')
          .select('paso_protocolo_id, comentarios, fecha_inicio, fecha_fin')
          .in('intervencion_id', intervencionIds),
      ]);

      // 3. Merge actividades: solo actualizar las que el técnico local NO ha tocado
      if (actRows?.length) {
        setEjecucionActividades(prev => {
          const next = { ...prev };
          for (const a of actRows) {
            if (localChangesRef.current.actividades.has(a.actividad_id)) continue;
            const catalogoCodigo = a.catalogo?.codigo || 'PENDIENTE';
            const estadoInterno =
              catalogoCodigo === 'COMPLETADA' ? 'completada' :
              catalogoCodigo === 'INCOMPLETA' ? 'omitida' : 'pendiente';
            next[a.actividad_id] = { estado: estadoInterno, observacion: a.observacion || null };
          }
          return next;
        });
      }

      // 4. Merge pasos: solo actualizar los que el técnico local NO ha tocado
      if (pasoRows?.length) {
        setEjecucionPasos(prev => {
          const next = { ...prev };
          for (const p of pasoRows) {
            if (localChangesRef.current.pasos.has(p.paso_protocolo_id)) continue;
            next[p.paso_protocolo_id] = {
              comentarios: p.comentarios || '',
              fechaInicio: p.fecha_inicio,
              fechaFin: p.fecha_fin,
            };
          }
          return next;
        });
      }
    };

    // Suscribirse a cambios en ejecucion_actividad y ejecucion_paso
    // No hay filtro nativo por visita_id (es a través de intervencion), así que
    // filtramos en el callback después de recibir el evento.
    const channel = supabase
      .channel(`visita-avance-${visitaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ejecucion_actividad' }, syncRemoteChanges)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ejecucion_paso' }, syncRemoteChanges)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeVisita?.id, activeVisita?.estadoCodigo]);

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
    localChangesRef.current = { actividades: new Set(), pasos: new Set() };
    setActiveVisita(null);
    setEjecucionPasos({});
    setEjecucionActividades({});
    setDeviceEvidencias({});
    setObservacionFinal('');
    // Refrescar la lista para que al volver se vean los estados actualizados
    fetchVisitas();
  };

  // ── Update device-level evidencias ───────────────────────────────────────
  const handleDeviceEvidenciasChange = (deviceId, patch) => {
    setDeviceEvidencias(prev => ({
      ...prev,
      [deviceId]: { ...(prev[deviceId] || { etiqueta: null, fotos: [] }), ...patch },
    }));
  };

  const handleEtiquetaChange = (deviceId, valor) => {
    setCodigoEtiquetas(prev => ({ ...prev, [deviceId]: valor }));
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
    localChangesRef.current.pasos.add(pasoId);
    setEjecucionPasos(prev => ({
      ...prev,
      [pasoId]: { ...(prev[pasoId] || {}), ...patch },
    }));
  };

  // ── Update actividad-level execution state ────────────────────────────────
  // patch: { estado: 'completada'|'omitida'|'pendiente', observacion?: string|null }
  const handleActividadChange = (actividadId, patch, deviceId) => {
    localChangesRef.current.actividades.add(actividadId);
    setEjecucionActividades(prev => ({
      ...prev,
      [actividadId]: { ...(prev[actividadId] || {}), ...patch },
    }));
    // Auto EN_MANTENIMIENTO: primera vez que el técnico toca una actividad del dispositivo
    if (deviceId && !enMantenimientoRef.current.has(deviceId)) {
      enMantenimientoRef.current.add(deviceId);
      marcarDispositivoEnMantenimiento(deviceId);
    }
  };

  // ── Update fuera-de-servicio state for a device ───────────────────────────
  const handleFueraDeServicioChange = (deviceId, patch) => {
    setFueraDeServicioMap(prev => ({
      ...prev,
      [deviceId]: { ...(prev[deviceId] || { active: false, observacion: '' }), ...patch },
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
  /**
   * Guarda el avance de todos los dispositivos en paralelo.
   * Si allDevicesDone y hay observación final, finaliza la visita.
   */
  const handleGuardarTodo = async () => {
    if (!activeVisita || isSaving) return;
    const dispositivos = activeVisita.dispositivos || [];
    setIsSaving(true);
    try {
      await Promise.all(
        dispositivos.map(device => {
          const fds = fueraDeServicioMap[device.id];
          const estadoCodigo = fds?.active ? 'FUERA_DE_SERVICIO' : 'OPERATIVO';
          const observacionDevice = fds?.active ? (fds.observacion || null) : null;
          return guardarAvanceDispositivo(
            activeVisita.id,
            device.id,
            device.pasos || [],
            ejecucionPasos,
            ejecucionActividades,
            deviceEvidencias[device.id] || { etiqueta: null, fotos: [] },
            codigoEtiquetas[device.id] || null,
            observacionDevice,
            estadoCodigo,
          );
        })
      );

      // Limpiar cambios locales para que el realtime pueda refrescar desde BD
      localChangesRef.current = { actividades: new Set(), pasos: new Set() };

      if (allDevicesDone) {
        await finalizarVisita(activeVisita.id, observacionFinal);
        setFinalizadoModal({
          open: true,
          clienteNombre: activeVisita.clienteNombre,
          sucursalNombre: activeVisita.sucursalNombre,
        });
      } else {
        notify('success', 'Avance guardado correctamente.');
      }
      fetchVisitas();
    } catch (err) {
      console.error('[GestionVisitasPage] handleGuardarTodo error:', err);
      notify('error', err.message || 'No se pudo guardar el avance. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Guarda el avance de UN dispositivo específico y envía email de notificación.
   * Solo disponible cuando el dispositivo tiene todos sus pasos/actividades resueltos.
   *
   * @param {Object} device - Objeto dispositivo completo (con pasos y actividades)
   * @param {number} completados - Cantidad de dispositivos completados hasta ahora (incluye este)
   * @param {number} total - Total de dispositivos de la visita
   */
  const handleGuardarDispositivo = async (device, completados, total) => {
    if (!activeVisita || savingDeviceId) return;
    setSavingDeviceId(device.id);
    try {
      const fds = fueraDeServicioMap[device.id];
      const estadoCodigo = fds?.active ? 'FUERA_DE_SERVICIO' : 'OPERATIVO';
      const observacionDevice = fds?.active ? (fds.observacion || null) : null;
      await guardarAvanceDispositivo(
        activeVisita.id,
        device.id,
        device.pasos || [],
        ejecucionPasos,
        ejecucionActividades,
        deviceEvidencias[device.id] || { etiqueta: null, fotos: [] },
        codigoEtiquetas[device.id] || null,
        observacionDevice,
        estadoCodigo,
      );
      notificarAvanceDispositivo(
        activeVisita.id,
        device.id,
        { completados, total },
        ejecucionActividades,
        device,
      );
      // Limpiar cambios locales del dispositivo guardado para que realtime pueda refrescar
      const deviceActIds = new Set(
        (device.pasos || []).flatMap(p => (p.actividades || []).map(a => a.id))
      );
      const devicePasoIds = new Set((device.pasos || []).map(p => p.id));
      localChangesRef.current.actividades = new Set(
        [...localChangesRef.current.actividades].filter(id => !deviceActIds.has(id))
      );
      localChangesRef.current.pasos = new Set(
        [...localChangesRef.current.pasos].filter(id => !devicePasoIds.has(id))
      );
      fetchVisitas();
    } catch (err) {
      console.error('[GestionVisitasPage] handleGuardarDispositivo error:', err);
      notify('error', err.message || 'No se pudo guardar el avance del dispositivo.');
    } finally {
      setSavingDeviceId(null);
    }
  };

  // ── All done: toda actividad resuelta (completada u omitida) ─────────────
  const isActResuelta = (a) => {
    const e = ejecucionActividades[a.id]?.estado;
    return e === 'completada' || e === 'omitida';
  };
  const allDevicesDone = useMemo(() => {
    if (!activeVisita?.dispositivos?.length) return false;
    return activeVisita.dispositivos.every(device =>
      (device.pasos || []).length > 0 &&
      (device.pasos || []).every(paso =>
        (paso.actividades || []).length === 0 ||
        (paso.actividades || []).every(isActResuelta)
      ),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVisita, ejecucionActividades]);

  // ══════════════════════════════════════════════════════════════════════════
  // EXECUTION VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (activeVisita) {
    const isEnCurso    = activeVisita.estadoCodigo === 'EN_PROGRESO';
    const isProgramado = activeVisita.estadoCodigo === 'PROGRAMADA';
    const isFinalizado = activeVisita.estadoCodigo === 'COMPLETADA';
    const viewMode = isFinalizado;

    // Per-device completion stats — resuelta = completada u omitida
    const deviceStats = (activeVisita.dispositivos || []).map(d => {
      const allActs   = (d.pasos || []).flatMap(p => p.actividades || []);
      const totalActs = allActs.length;
      const doneActs  = allActs.filter(isActResuelta).length;
      const done = (d.pasos || []).length > 0 && (d.pasos || []).every(paso =>
        (paso.actividades || []).length === 0 ||
        (paso.actividades || []).every(isActResuelta)
      );
      // started: al menos una actividad resuelta pero el dispositivo no está terminado del todo
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
                  const isLocked = !!(inProgressDevice && inProgressDevice.id !== device.id && !stat.done);
                  const isSavingThis = savingDeviceId === device.id;
                  // Completados hasta este punto: dispositivos anteriores done + este si done
                  const completadosHastaAqui = deviceStats.filter((d, i) => i <= idx && d.done).length;
                  return (
                    <div key={device.id} className="space-y-2">
                      <DeviceChecklistCard
                        device={device}
                        steps={device.pasos || []}
                        ejecucionPasos={ejecucionPasos}
                        ejecucionActividades={ejecucionActividades}
                        onPasoChange={handlePasoChange}
                        onActividadChange={(actividadId, patch) => handleActividadChange(actividadId, patch, device.id)}
                        viewMode={viewMode || isProgramado}
                        isLocked={isLocked}
                        deviceEvidencias={deviceEvidencias[device.id] || { etiqueta: null, fotos: [] }}
                        onDeviceEvidenciasChange={(patch) => handleDeviceEvidenciasChange(device.id, patch)}
                        codigoEtiquetaInicial={activeVisita.codigoEtiquetaByDevice?.[device.id] || ''}
                        onEtiquetaChange={handleEtiquetaChange}
                        fueraDeServicio={fueraDeServicioMap[device.id]?.active ?? false}
                        observacionFinalDevice={fueraDeServicioMap[device.id]?.observacion ?? ''}
                        onFueraDeServicioChange={(patch) => handleFueraDeServicioChange(device.id, patch)}
                      />
                      {isEnCurso && !viewMode && stat.done && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={!!savingDeviceId}
                            onClick={() => handleGuardarDispositivo(device, completadosHastaAqui, totalDevices)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded-md transition-all shadow-sm text-white bg-[#1A1A1A] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Save size={12} />
                            {isSavingThis ? 'Guardando...' : 'Guardar avance'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              : (
                <Card className="p-6 text-center">
                  <Cpu size={32} className="text-gray-300 mx-auto mb-2" />
                  <TextSmall className="text-gray-400">No hay dispositivos asignados a esta visita.</TextSmall>
                </Card>
              )
            }

            {/* Observación final — visible solo cuando todos los dispositivos están completos */}
            {isEnCurso && !viewMode && allDevicesDone && (
              <Card className="p-5 space-y-3 border-green-300 bg-green-50/40">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                  <Label className="text-sm font-bold uppercase tracking-wide text-gray-700">
                    Observación Final <span className="text-red-500">*</span>
                  </Label>
                </div>
                <TextTiny className="text-gray-500">
                  Resumen general del trabajo realizado, hallazgos y recomendaciones.
                </TextTiny>
                <textarea
                  value={observacionFinal}
                  onChange={e => setObservacionFinal(e.target.value)}
                  rows={4}
                  placeholder="Ej: Se realizó mantenimiento preventivo completo. Se detectó desgaste en sensor X, se recomienda reemplazo en próxima visita..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-y focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all bg-white"
                />
              </Card>
            )}

            {/* Observación final en modo lectura */}
            {viewMode && observacionFinal && (
              <Card className="p-5 space-y-2 border-gray-200">
                <Label className="text-sm font-bold uppercase tracking-wide text-gray-700">Observación Final</Label>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{observacionFinal}</p>
              </Card>
            )}

            {/* Botón global — siempre visible en ejecución */}
            {isEnCurso && !viewMode && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  disabled={isSaving || (allDevicesDone && !observacionFinal.trim())}
                  onClick={handleGuardarTodo}
                  className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase rounded-md transition-all shadow-sm text-white disabled:opacity-40 disabled:cursor-not-allowed ${
                    allDevicesDone ? 'bg-green-600 hover:bg-green-700' : 'bg-[#1A1A1A] hover:bg-black'
                  }`}
                >
                  {allDevicesDone ? <Send size={13} /> : <Save size={13} />}
                  {isSaving ? 'Guardando...' : allDevicesDone ? 'Finalizar y Enviar Informe' : 'Guardar Avance'}
                </button>
              </div>
            )}

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

        {/* Popup éxito — visita finalizada */}
        {finalizadoModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-3 text-green-600 mb-3">
                <CheckCircle2 size={36} className="shrink-0" />
                <div>
                  <H3 className="normal-case text-gray-900">¡Visita Finalizada!</H3>
                  <p className="text-xs text-gray-400 mt-0.5">Informe enviado correctamente</p>
                </div>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3 mb-5">
                <p className="text-sm text-green-800 font-semibold">{finalizadoModal.clienteNombre}</p>
                <p className="text-xs text-green-600">{finalizadoModal.sucursalNombre}</p>
              </div>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                El avance y la observación final fueron guardados. El coordinador recibirá el reporte de esta visita.
              </p>
              <Button
                onClick={() => { setFinalizadoModal({ open: false, clienteNombre: '', sucursalNombre: '' }); handleCloseVisita(); }}
                className="w-full bg-green-600 hover:bg-green-700 border-0 text-white"
              >
                Volver a visitas
              </Button>
            </div>
          </div>
        )}

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
        (paso.actividades || []).every(a => { const e = visita.ejecucionActividades?.[a.id]?.estado; return e === 'completada' || e === 'omitida'; })
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
