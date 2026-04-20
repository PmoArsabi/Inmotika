import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ClipboardCheck, CheckCircle2, XCircle, AlertCircle, Send,
  ChevronLeft, Building2, Calendar, Tag, MessageSquare,
  Circle, AlertTriangle, ChevronDown, ChevronRight,
} from 'lucide-react';
import GenericListView from '../../components/shared/GenericListView';
import FilterBar from '../../components/shared/FilterBar';
import Button from '../../components/ui/Button';
import ActionResultModal from '../../components/ui/ActionResultModal';
import { TextSmall, TextTiny } from '../../components/ui/Typography';
import { useAuth } from '../../context/AuthContext';
import {
  getInformesEnRevision,
  getRevisionesCoordinador,
  upsertRevisionCoordinador,
  enviarInformeADirector,
} from '../../api/informeApi';
import { supabase } from '../../utils/supabase';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ─── Badges ──────────────────────────────────────────────────────────────────

const EstadoBadge = ({ estado }) => {
  const cfg = {
    EN_REVISION: { label: 'En revisión',           cls: 'bg-yellow-100 text-yellow-800' },
    RECHAZADO:   { label: 'Rechazado por director', cls: 'bg-red-100 text-red-800'      },
  }[estado] || { label: estado, cls: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

// ─── Fila de actividad (solo lectura, igual visual que ActividadRow del técnico) ─

const ActividadReadRow = ({ act }) => {
  const isCompletada = act.estadoCodigo === 'COMPLETADA' || act.estadoCodigo === 'completada';
  const isOmitida    = act.estadoCodigo === 'OMITIDA'    || act.estadoCodigo === 'omitida';

  return (
    <div className={`rounded-md transition-all ${
      isOmitida    ? 'bg-amber-50 border border-amber-200' :
      isCompletada ? 'bg-green-50' : 'hover:bg-gray-50'
    }`}>
      <div className="flex items-start gap-2.5 py-1.5 px-2">
        <span className="mt-0.5 shrink-0">
          {isCompletada
            ? <CheckCircle2 size={16} className="text-green-500" />
            : isOmitida
              ? <AlertTriangle size={16} className="text-amber-500" />
              : <Circle size={16} className="text-gray-300" />
          }
        </span>
        <span className={`flex-1 text-xs leading-relaxed ${
          isCompletada ? 'text-gray-400 line-through' :
          isOmitida    ? 'text-amber-700 font-medium'  :
                         'text-gray-700'
        }`}>
          {act.nombre || '—'}
          {isOmitida && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-600">· Omitida</span>}
        </span>
      </div>
      {act.observacion && (
        <div className="px-3 pb-2">
          <p className={`text-[11px] px-2 py-1.5 rounded-md ${isOmitida ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
            {act.observacion}
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Sección de paso (misma visual que PasoSection del técnico, solo lectura) ──

const PasoReadSection = ({ paso, index, actividades }) => {
  const hasOmitidas   = actividades.some(a => a.estadoCodigo === 'OMITIDA' || a.estadoCodigo === 'omitida');
  const allCompletadas = actividades.length > 0 && actividades.every(a => a.estadoCodigo === 'COMPLETADA' || a.estadoCodigo === 'completada' || a.estadoCodigo === 'OMITIDA' || a.estadoCodigo === 'omitida');
  const doneActs       = actividades.filter(a => a.estadoCodigo === 'COMPLETADA' || a.estadoCodigo === 'completada' || a.estadoCodigo === 'OMITIDA' || a.estadoCodigo === 'omitida').length;
  const [open, setOpen] = useState(true);

  return (
    <div className={`border rounded-lg overflow-hidden transition-all bg-white ${
      hasOmitidas   ? 'border-amber-300' :
      allCompletadas ? 'border-green-300' : 'border-gray-200'
    }`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left ${
          hasOmitidas    ? 'bg-amber-50'  :
          allCompletadas ? 'bg-green-50'  : 'bg-white'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {hasOmitidas
            ? <AlertTriangle size={16} className="shrink-0 text-amber-500" />
            : <span className={`shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                allCompletadas ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>{index + 1}</span>
          }
          <div className="min-w-0">
            <p className={`text-xs font-bold uppercase tracking-wide ${
              hasOmitidas    ? 'text-amber-700' :
              allCompletadas ? 'text-green-700'  : 'text-gray-700'
            }`}>
              {index + 1}. {paso.descripcion || '—'}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {doneActs}/{actividades.length} actividades
              {hasOmitidas ? ` · ${actividades.filter(a => a.estadoCodigo === 'OMITIDA' || a.estadoCodigo === 'omitida').length} omitida(s)` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {open ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
        </div>
      </button>

      {/* Barra de progreso */}
      <div className="h-1 bg-gray-100">
        <div
          className={`h-full transition-all ${hasOmitidas ? 'bg-amber-400' : allCompletadas ? 'bg-green-500' : 'bg-[#D32F2F]'}`}
          style={{ width: actividades.length > 0 ? `${(doneActs / actividades.length) * 100}%` : '0%' }}
        />
      </div>

      {open && (
        <div className="px-3 py-2 space-y-1 bg-gray-50">
          {actividades.map((act, ai) => (
            <ActividadReadRow key={act.id || ai} act={act} />
          ))}
          {paso.comentarios && (
            <p className="text-xs text-gray-500 px-2 py-1.5 bg-gray-100 rounded-md mt-1">{paso.comentarios}</p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Card de dispositivo para revisión ───────────────────────────────────────

const DispositivoCard = ({ interv, rev, onRevision, saving }) => {
  const [open, setOpen]           = useState(true);
  const [showRechazo, setShowRechazo] = useState(false);
  const [nota, setNota]               = useState(rev?.nota || '');

  const aprobado  = rev?.aprobado === true;
  const rechazado = rev?.aprobado === false;
  const disp      = interv.dispositivo;
  const label     = disp?.serial || disp?.codigo_unico || disp?.id_inmotika || interv.id.slice(0, 8);
  const categoria = disp?.categoria?.nombre || '—';
  const pasos       = interv._pasos      || [];
  const actividades = interv._actividades || [];

  const totalActs = actividades.length;
  const doneActs  = actividades.filter(a => a.estadoCodigo === 'COMPLETADA' || a.estadoCodigo === 'completada' || a.estadoCodigo === 'OMITIDA' || a.estadoCodigo === 'omitida').length;
  const omitidas  = actividades.filter(a => a.estadoCodigo === 'OMITIDA' || a.estadoCodigo === 'omitida').length;
  const allDone   = totalActs > 0 && doneActs === totalActs;
  const hasOmit   = omitidas > 0;

  const handleAprobar = () => {
    setShowRechazo(false);
    onRevision(interv.id, true, null);
  };

  const handleRechazarClick = () => {
    setNota(rev?.nota || '');
    setShowRechazo(v => !v);
  };

  const handleConfirmarRechazo = () => {
    onRevision(interv.id, false, nota.trim() || null);
    setShowRechazo(false);
  };

  return (
    <div className={`border rounded-lg overflow-hidden transition-all bg-white ${
      aprobado  ? 'border-green-300' :
      rechazado ? 'border-red-300'   :
      hasOmit   ? 'border-amber-300' :
      allDone   ? 'border-green-300' : 'border-gray-200'
    }`}>
      {/* Header — mismo patrón que DeviceChecklistCard */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between p-4 text-left ${
          aprobado  ? 'bg-green-50'  :
          rechazado ? 'bg-red-50'    :
          hasOmit   ? 'bg-amber-50'  :
          allDone   ? 'bg-green-50'  : 'bg-white'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {aprobado
            ? <CheckCircle2  size={20} className="shrink-0 text-green-500" />
            : rechazado
              ? <XCircle       size={20} className="shrink-0 text-red-500" />
              : hasOmit
                ? <AlertTriangle size={20} className="shrink-0 text-amber-500" />
                : allDone
                  ? <CheckCircle2  size={20} className="shrink-0 text-green-500" />
                  : <Circle        size={20} className="shrink-0 text-gray-300" />
          }
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{label}</p>
            <p className="text-xs text-gray-500">
              {[categoria, interv.observacion_final ? `"${interv.observacion_final}"` : null].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-2">
          {aprobado  && <span className="text-[10px] font-bold uppercase tracking-wide text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Aprobado</span>}
          {rechazado && <span className="text-[10px] font-bold uppercase tracking-wide text-red-700 bg-red-100 px-2 py-0.5 rounded-full">Rechazado</span>}
          <div className="text-right">
            <span className={`text-xs font-bold ${hasOmit ? 'text-amber-600' : allDone ? 'text-green-600' : 'text-gray-600'}`}>
              {doneActs}/{totalActs}
            </span>
            {omitidas > 0 && (
              <span className="text-xs text-gray-400 ml-1">· {omitidas} omitida{omitidas !== 1 ? 's' : ''}</span>
            )}
          </div>
          {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
        </div>
      </button>

      {/* Barra de progreso */}
      <div className="h-1.5 bg-gray-100">
        <div
          className={`h-full transition-all ${
            aprobado  ? 'bg-green-500' :
            rechazado ? 'bg-red-400'   :
            hasOmit   ? 'bg-amber-400' :
            allDone   ? 'bg-green-500' : 'bg-[#D32F2F]'
          }`}
          style={{ width: totalActs > 0 ? `${(doneActs / totalActs) * 100}%` : '0%' }}
        />
      </div>

      {/* Pasos y actividades */}
      {open && (
        <div className="p-4 space-y-3 bg-white">
          {pasos.length === 0 && (
            <p className="text-xs text-gray-400 italic text-center py-2">Sin pasos de protocolo registrados.</p>
          )}
          {pasos.map((paso, pi) => (
            <PasoReadSection
              key={paso.id || pi}
              paso={paso}
              index={pi}
              actividades={actividades.filter(a => a.paso_id === paso.paso_protocolo_id)}
            />
          ))}

          {/* Nota de rechazo existente */}
          {rechazado && rev?.nota && !showRechazo && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <MessageSquare size={12} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-700 italic">{rev.nota}</p>
            </div>
          )}

          {/* Formulario de rechazo inline */}
          {showRechazo && (
            <div className="space-y-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-red-700">Nota de rechazo (opcional)</p>
              <textarea
                autoFocus
                className="w-full px-2 py-1.5 text-xs border border-red-300 rounded-md bg-white resize-none focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 transition-all"
                rows={2}
                placeholder="Describe el motivo del rechazo…"
                value={nota}
                onChange={e => setNota(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowRechazo(false)}
                  className="px-3 py-1.5 text-[11px] font-bold text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleConfirmarRechazo}
                  className="flex-1 py-1.5 text-[11px] font-bold bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white rounded-md transition-colors"
                >
                  Confirmar rechazo
                </button>
              </div>
            </div>
          )}

          {/* Acciones */}
          {!showRechazo && (
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                disabled={saving}
                onClick={handleRechazarClick}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-md transition-colors ${
                  rechazado
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'text-gray-400 hover:bg-red-50 hover:text-red-600'
                }`}
              >
                <XCircle size={14} />
                {rechazado ? 'Cambiar nota' : 'Rechazar'}
              </button>
              <button
                type="button"
                disabled={saving || aprobado}
                onClick={handleAprobar}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-md transition-colors ${
                  aprobado
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : 'text-gray-400 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <CheckCircle2 size={14} />
                {aprobado ? 'Aprobado ✓' : 'Aprobar'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Panel de revisión ────────────────────────────────────────────────────────

const RevisionPanel = ({ informe, intervenciones, revisiones, onRevision, onEnviarDirector, onBack, saving, sending }) => {
  const todasRevisadas = intervenciones.length > 0 && intervenciones.every(i => revisiones.has(i.id));
  const aprobados  = [...revisiones.values()].filter(r => r.aprobado).length;
  const rechazados = [...revisiones.values()].filter(r => !r.aprobado).length;

  return (
    <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
      {/* Header rojo */}
      <div className="rounded-xl overflow-hidden shadow border border-gray-200">
        <div className="bg-linear-to-r from-[#D32F2F] via-[#B71C1C] to-[#8B0000] px-5 py-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 bg-white/20 rounded-lg border border-white/30 hover:bg-white/30 transition-colors shrink-0"
            >
              <ChevronLeft size={16} className="text-white" />
            </button>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm border border-white/30 shrink-0">
              <ClipboardCheck size={18} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-base leading-tight uppercase truncate">{informe.cliente_nombre}</p>
              <p className="text-white/75 text-xs mt-0.5">{informe.sucursal_nombre} · {informe.tipo_visita} · {fmt(informe.fecha_fin)}</p>
            </div>
            <EstadoBadge estado={informe.estado} />
          </div>
        </div>
      </div>

      {/* Alerta rechazo director */}
      {informe.estado === 'RECHAZADO' && informe.observacion_director && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <TextSmall className="font-bold text-red-700">El director rechazó este informe</TextSmall>
            <TextTiny className="text-red-600 mt-1">{informe.observacion_director}</TextTiny>
          </div>
        </div>
      )}

      {/* Progreso */}
      {intervenciones.length > 0 && (
        <div className="flex items-center gap-3 px-1">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${revisiones.size === intervenciones.length ? 'bg-green-500' : 'bg-[#D32F2F]'}`}
              style={{ width: `${Math.round((revisiones.size / intervenciones.length) * 100)}%` }}
            />
          </div>
          <TextTiny className="text-gray-500 shrink-0">
            <span className="font-bold text-gray-700">{revisiones.size}</span>/{intervenciones.length} revisados
            {revisiones.size > 0 && (
              <> · <span className="text-green-600 font-semibold">{aprobados} ✓</span> <span className="text-red-500 font-semibold">{rechazados} ✗</span></>
            )}
          </TextTiny>
        </div>
      )}

      {/* Cards de dispositivos */}
      {intervenciones.length === 0 ? (
        <div className="text-center py-12">
          <TextTiny className="text-gray-400 italic">No hay dispositivos registrados en este informe.</TextTiny>
        </div>
      ) : (
        <div className="space-y-3">
          {intervenciones.map(interv => (
            <DispositivoCard
              key={interv.id}
              interv={interv}
              rev={revisiones.get(interv.id)}
              onRevision={onRevision}
              saving={saving}
            />
          ))}
        </div>
      )}

      {/* Botón enviar al director */}
      {todasRevisadas && (
        <div className="flex justify-end pt-2">
          <Button variant="primary" disabled={sending} onClick={onEnviarDirector} className="flex items-center gap-2">
            <Send size={14} />
            {sending ? 'Enviando…' : 'Enviar al director'}
          </Button>
        </div>
      )}
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

const ValidacionInformePage = () => {
  const { user } = useAuth();
  const coordinadorId = user?.id;

  const [informes, setInformes]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [selected, setSelected]             = useState(null);
  const [intervenciones, setIntervenciones] = useState([]);
  const [revisiones, setRevisiones]         = useState(new Map());
  const [loadingDetail, setLoadingDetail]   = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [sending, setSending]               = useState(false);
  const [resultModal, setResultModal]       = useState(null);
  const [filters, setFilters]               = useState({ estado: [], cliente: [], sucursal: [], fechaDesde: '', fechaHasta: '' });

  const loadInformes = useCallback(async () => {
    setLoading(true);
    try { setInformes(await getInformesEnRevision()); }
    catch (err) { console.error('[ValidacionInformePage]', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadInformes(); }, [loadInformes]);

  const filterDefs = useMemo(() => {
    const clientes   = [...new Map(informes.map(i => [i.cliente_nombre, i.cliente_nombre])).entries()].map(([v]) => ({ value: v, label: v }));
    const sucursales = [...new Map(informes.map(i => [i.sucursal_nombre, i.cliente_nombre])).entries()].map(([v, p]) => ({ value: v, label: v, parentValue: p }));
    return [
      { key: 'estado',     label: 'Estado',       multi: true, options: [{ value: 'EN_REVISION', label: 'En revisión' }, { value: 'RECHAZADO', label: 'Rechazado' }] },
      { key: 'cliente',    label: 'Cliente',       multi: true, options: clientes },
      { key: 'sucursal',   label: 'Sucursal',      multi: true, options: sucursales, dependsOn: 'cliente', dependsOnLabel: 'Cliente' },
      { key: 'fechaDesde', label: 'Fecha desde',   type: 'date', dateRole: 'desde', linkedTo: 'fechaHasta' },
      { key: 'fechaHasta', label: 'Fecha hasta',   type: 'date', dateRole: 'hasta', linkedTo: 'fechaDesde' },
    ];
  }, [informes]);

  const informesFiltrados = useMemo(() => informes.filter(inf => {
    if (filters.estado?.length   && !filters.estado.includes(inf.estado))             return false;
    if (filters.cliente?.length  && !filters.cliente.includes(inf.cliente_nombre))    return false;
    if (filters.sucursal?.length && !filters.sucursal.includes(inf.sucursal_nombre))  return false;
    if (filters.fechaDesde && inf.fecha_fin && inf.fecha_fin < filters.fechaDesde)    return false;
    if (filters.fechaHasta && inf.fecha_fin && inf.fecha_fin > filters.fechaHasta + 'T23:59:59') return false;
    return true;
  }), [informes, filters]);

  const activeFiltersCount = (filters.estado?.length || 0) + (filters.cliente?.length || 0)
    + (filters.sucursal?.length || 0) + (filters.fechaDesde ? 1 : 0) + (filters.fechaHasta ? 1 : 0);

  const columns = useMemo(() => [
    {
      header: 'Cliente / Sucursal',
      render: inf => (
        <div>
          <TextSmall className="font-bold text-gray-900">{inf.cliente_nombre}</TextSmall>
          <TextTiny className="text-gray-400 flex items-center gap-1 mt-0.5">
            <Building2 size={10} /> {inf.sucursal_nombre}{inf.sucursal_ciudad ? ` · ${inf.sucursal_ciudad}` : ''}
          </TextTiny>
        </div>
      ),
    },
    {
      header: 'Tipo',
      render: inf => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold">
          <Tag size={10} /> {inf.tipo_visita}
        </span>
      ),
    },
    {
      header: 'Fecha cierre',
      render: inf => (
        <TextSmall className="flex items-center gap-1.5 text-gray-600">
          <Calendar size={12} className="text-gray-400" /> {fmt(inf.fecha_fin)}
        </TextSmall>
      ),
    },
    { header: 'Estado',   render: inf => <EstadoBadge estado={inf.estado} /> },
    {
      header: 'Progreso',
      render: inf => {
        const pct = inf.total_intervenciones > 0 ? Math.round((inf.revisadas / inf.total_intervenciones) * 100) : 0;
        return (
          <div className="flex items-center gap-2 min-w-24">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-yellow-400'}`} style={{ width: `${pct}%` }} />
            </div>
            <TextTiny className="text-gray-500 shrink-0">{inf.revisadas}/{inf.total_intervenciones}</TextTiny>
          </div>
        );
      },
    },
    {
      header: 'Obs. director',
      render: inf => inf.observacion_director
        ? <TextTiny className="text-red-600 max-w-48 truncate">{inf.observacion_director}</TextTiny>
        : <TextTiny className="text-gray-300">—</TextTiny>,
    },
  ], []);

  // ── Carga detalle: 2 pasos para evitar ambigüedad PostgREST ──────────────
  const handleSelectInforme = async (informe) => {
    setSelected(informe);
    setLoadingDetail(true);
    try {
      // Paso 1: intervenciones con dispositivo
      const { data: intData, error: intErr } = await supabase
        .from('intervencion')
        .select(`
          id, observacion_final,
          dispositivo:dispositivo_id(id, serial, codigo_unico, id_inmotika, categoria:categoria_id(nombre))
        `)
        .eq('visita_id', informe.visita_id)
        .eq('activo', true);

      if (intErr) throw intErr;
      const intervs = intData || [];
      const intervIds = intervs.map(i => i.id);

      // Paso 2: pasos, actividades y revisiones en paralelo
      const [{ data: pasosData }, { data: actsData }, revData] = await Promise.all([
        intervIds.length
          ? supabase.from('ejecucion_paso')
              .select('id, intervencion_id, paso_protocolo_id, comentarios, paso_protocolo:paso_protocolo_id(descripcion)')
              .in('intervencion_id', intervIds)
          : { data: [] },
        intervIds.length
          ? supabase.from('ejecucion_actividad')
              .select('id, intervencion_id, actividad_id, observacion, estado:estado_id(codigo)')
              .in('intervencion_id', intervIds)
          : { data: [] },
        getRevisionesCoordinador(informe.id),
      ]);

      // Paso 3: fetch de actividad_protocolo para obtener nombre y paso_id
      const actividadIds = [...new Set((actsData || []).map(a => a.actividad_id).filter(Boolean))];
      const { data: actProtoData } = actividadIds.length
        ? await supabase.from('actividad_protocolo').select('id, descripcion, paso_id').in('id', actividadIds)
        : { data: [] };
      const actProtoMap = new Map((actProtoData || []).map(a => [a.id, a]));

      // Enriquecer intervenciones con sus pasos y actividades
      const enriched = intervs.map(interv => ({
        ...interv,
        _pasos: (pasosData || [])
          .filter(p => p.intervencion_id === interv.id)
          .map(p => ({
            id: p.id,
            paso_protocolo_id: p.paso_protocolo_id,
            descripcion: p.paso_protocolo?.descripcion || '—',
            comentarios: p.comentarios || null,
          })),
        _actividades: (actsData || [])
          .filter(a => a.intervencion_id === interv.id)
          .map(a => {
            const proto = actProtoMap.get(a.actividad_id);
            return {
              id: a.id,
              paso_id: proto?.paso_id || null,
              nombre: proto?.descripcion || '—',
              estadoCodigo: a.estado?.codigo || null,
              observacion: a.observacion || null,
            };
          }),
      }));
      setIntervenciones(enriched);
      const map = new Map();
      for (const r of revData) map.set(r.intervencion_id, { aprobado: r.aprobado, nota: r.nota });
      setRevisiones(map);
    } catch (err) {
      console.error('[ValidacionInformePage] detalle:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRevision = async (intervencionId, aprobado, nota) => {
    if (!selected || !coordinadorId) return;
    setSaving(true);
    try {
      await upsertRevisionCoordinador(selected.id, intervencionId, coordinadorId, aprobado, nota);
      setRevisiones(prev => { const n = new Map(prev); n.set(intervencionId, { aprobado, nota }); return n; });
    } catch (err) {
      setResultModal({ error: true, title: 'Error al guardar', errorMessage: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEnviarDirector = async () => {
    if (!selected) return;
    setSending(true);
    try {
      const { data: coordRow } = await supabase
        .from('coordinador')
        .select('coordinador_director(director:director_id(perfil:usuario_id(email)))')
        .eq('usuario_id', coordinadorId)
        .eq('activo', true)
        .maybeSingle();

      const directorEmails = (coordRow?.coordinador_director || [])
        .map(cd => cd.director?.perfil?.email).filter(Boolean);

      const { data: coordPerfil } = await supabase
        .from('perfil_usuario').select('nombres, apellidos').eq('id', coordinadorId).maybeSingle();

      const coordNombre = coordPerfil
        ? `${coordPerfil.nombres || ''} ${coordPerfil.apellidos || ''}`.trim() : 'Coordinador';

      await enviarInformeADirector(selected.id, {
        directorEmails,
        clienteNombre:     selected.cliente_nombre,
        sucursalNombre:    selected.sucursal_nombre,
        tipoVisita:        selected.tipo_visita,
        coordinadorNombre: coordNombre,
        appUrl:            window.location.origin,
      });

      setResultModal({
        error: false,
        title: 'Informe enviado al director',
        subtitle: directorEmails.length
          ? `Se notificó a ${directorEmails.length} director(es).`
          : 'El informe fue marcado como enviado.',
      });
      setSelected(null);
      loadInformes();
    } catch (err) {
      setResultModal({ error: true, title: 'Error al enviar', errorMessage: err.message });
    } finally {
      setSending(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (selected) {
    return (
      <div className="space-y-5 animate-in slide-in-from-right-12 duration-500">
        {loadingDetail ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-16 bg-gray-100 rounded-xl" />
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        ) : (
          <RevisionPanel
            informe={selected}
            intervenciones={intervenciones}
            revisiones={revisiones}
            onRevision={handleRevision}
            onEnviarDirector={handleEnviarDirector}
            onBack={() => setSelected(null)}
            saving={saving}
            sending={sending}
          />
        )}
        <ActionResultModal
          open={!!resultModal}
          error={resultModal?.error || false}
          title={resultModal?.title || ''}
          subtitle={resultModal?.subtitle || ''}
          errorMessage={resultModal?.errorMessage}
          actions={[{ label: 'Cerrar', onClick: () => setResultModal(null) }]}
          onBackdropClick={() => setResultModal(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in slide-in-from-right-12 duration-500">
      <GenericListView
        title="Validación de Informes"
        icon={ClipboardCheck}
        items={informesFiltrados}
        columns={columns}
        loading={loading}
        loadingText="Cargando informes…"
        emptyText="No hay informes pendientes de revisión"
        emptyIcon={ClipboardCheck}
        searchPlaceholder="Buscar por cliente o sucursal…"
        filterFunction={(inf, q) =>
          inf.cliente_nombre.toLowerCase().includes(q) ||
          inf.sucursal_nombre.toLowerCase().includes(q)
        }
        onEdit={handleSelectInforme}
        activeFiltersCount={activeFiltersCount}
        filteredCount={informesFiltrados.length}
        totalItems={informes.length}
        onClearFilters={() => setFilters({ estado: [], cliente: [], sucursal: [], fechaDesde: '', fechaHasta: '' })}
        extraFilters={<FilterBar filters={filterDefs} values={filters} onChange={setFilters} />}
      />
      <ActionResultModal
        open={!!resultModal}
        error={resultModal?.error || false}
        title={resultModal?.title || ''}
        subtitle={resultModal?.subtitle || ''}
        errorMessage={resultModal?.errorMessage}
        actions={[{ label: 'Cerrar', onClick: () => setResultModal(null) }]}
        onBackdropClick={() => setResultModal(null)}
      />
    </div>
  );
};

export default ValidacionInformePage;
