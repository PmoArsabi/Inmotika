import { CheckCircle2, Circle, Clock, ChevronDown, ChevronRight, Minus, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import SecureImage from '../ui/SecureImage';

// ─── Single paso section (read-only) ─────────────────────────────────────────
const PasoProgressRow = ({ paso, ejecucionActividades }) => {
  const [open, setOpen] = useState(false);
  const actividades = paso.actividades || [];
  const totalActs   = actividades.length;
  const isResuelta  = (a) => { const e = ejecucionActividades[a.id]?.estado; return e === 'completada' || e === 'omitida'; };
  const doneActs    = actividades.filter(isResuelta).length;
  const pasoDone = actividades.length === 0 || actividades.every(isResuelta);

  return (
    <div className="rounded-md border border-gray-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2 text-left ${pasoDone ? 'bg-green-50' : 'bg-white'}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {pasoDone
            ? <CheckCircle2 size={13} className="shrink-0 text-green-500" />
            : doneActs > 0
              ? <Minus size={13} className="shrink-0 text-yellow-500" />
              : <Circle size={13} className="shrink-0 text-gray-300" />
          }
          <span className={`text-xs font-semibold truncate ${pasoDone ? 'text-green-700' : 'text-gray-700'}`}>
            {paso.orden}. {paso.descripcion}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-2xs text-gray-400">{doneActs}/{totalActs}</span>
          {open ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
        </div>
      </button>

      {open && actividades.length > 0 && (
        <div className="px-3 pb-2 pt-1 space-y-1 bg-gray-50 border-t border-gray-100">
          {actividades.map((act, idx) => {
            const est = ejecucionActividades[act.id]?.estado;
            const done = est === 'completada' || est === 'omitida';
            return (
              <div key={act.id || idx} className="flex items-start gap-1.5">
                {done
                  ? <CheckCircle2 size={12} className="shrink-0 text-green-500 mt-0.5" />
                  : <Circle       size={12} className="shrink-0 text-gray-300 mt-0.5" />
                }
                <span className={`text-xs leading-relaxed ${done ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                  {act.descripcion}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Single device progress card ─────────────────────────────────────────────
/**
 * @param {{ device: object, ejecucionActividades: object, evidencias: object|null, fueraDeServicio: boolean }} props
 */
const DeviceProgressCard = ({ device, ejecucionActividades, evidencias, fueraDeServicio, motivoFueraDeServicio }) => {
  const [open, setOpen] = useState(false);

  const isResuelta  = (a) => { const e = ejecucionActividades[a.id]?.estado; return e === 'completada' || e === 'omitida'; };
  const allActs  = (device.pasos || []).flatMap(p => p.actividades || []);
  const totalActs = allActs.length;
  const doneActs  = allActs.filter(isResuelta).length;
  const pct       = totalActs > 0 ? Math.round((doneActs / totalActs) * 100) : 0;

  const deviceDone = fueraDeServicio || (
    (device.pasos || []).length > 0 && (device.pasos || []).every(paso =>
      (paso.actividades || []).length === 0 ||
      (paso.actividades || []).every(isResuelta)
    )
  );

  const estado = fueraDeServicio
    ? 'FUERA_DE_SERVICIO'
    : deviceDone
      ? 'COMPLETADO'
      : doneActs > 0
        ? 'EN_PROCESO'
        : 'PENDIENTE';

  const estadoConfig = {
    COMPLETADO:       { icon: CheckCircle2,   color: 'text-green-500',  bar: 'bg-green-500',  bg: 'border-green-200 bg-green-50'   },
    FUERA_DE_SERVICIO:{ icon: AlertTriangle,  color: 'text-red-500',    bar: 'bg-red-400',    bg: 'border-red-200 bg-red-50'       },
    EN_PROCESO:       { icon: Clock,          color: 'text-yellow-500', bar: 'bg-yellow-400', bg: 'border-yellow-200 bg-yellow-50' },
    PENDIENTE:        { icon: Circle,         color: 'text-gray-400',   bar: 'bg-gray-200',   bg: 'border-gray-200 bg-gray-50'     },
  }[estado];

  const StatusIcon = estadoConfig.icon;

  return (
    <div className={`border rounded-lg overflow-hidden ${estadoConfig.bg}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <StatusIcon size={18} className={`shrink-0 ${estadoConfig.color}`} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{device.label || device.serial || device.id}</p>
            <p className="text-xs text-gray-500 truncate">
              {fueraDeServicio
                ? <span className="text-red-500 font-semibold">Fuera de servicio</span>
                : device.serial
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-2">
          {fueraDeServicio ? (
            <span className="text-2xs font-bold text-red-500 uppercase tracking-wide">FDS</span>
          ) : (
            <span className="text-xs font-semibold text-gray-600">{doneActs}/{totalActs} act.</span>
          )}
          {open ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
        </div>
      </button>

      <div className="h-1 bg-gray-200 mx-3 mb-1 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${estadoConfig.bar}`}
          style={{ width: fueraDeServicio ? '100%' : `${pct}%` }}
        />
      </div>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-1.5">
          {fueraDeServicio ? (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-md bg-red-100 border border-red-200">
              <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-relaxed">
                <span className="font-bold">Diagnóstico del técnico: </span>
                {motivoFueraDeServicio || 'Sin diagnóstico registrado.'}
              </p>
            </div>
          ) : (
            (device.pasos || []).map((paso, idx) => (
              <PasoProgressRow
                key={paso.id || idx}
                paso={paso}
                ejecucionActividades={ejecucionActividades}
              />
            ))
          )}
          {evidencias && (evidencias.etiqueta || evidencias.fotos?.length > 0) && (
            <div className="pt-1.5">
              <p className="text-2xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Evidencias</p>
              <div className="flex flex-wrap gap-2">
                {evidencias.etiqueta && (
                  <div className="flex flex-col items-center gap-0.5">
                    <SecureImage path={evidencias.etiqueta.preview} alt="Etiqueta" className="w-16 h-16 rounded border border-blue-200 object-cover" />
                    <span className="text-2xs text-blue-600 font-semibold">Etiqueta</span>
                  </div>
                )}
                {(evidencias.fotos || []).map((foto, i) => foto && (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <SecureImage path={foto.preview} alt={`Foto ${i + 1}`} className="w-16 h-16 rounded border border-gray-200 object-cover" />
                    <span className="text-2xs text-gray-500">Foto {i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main panel ───────────────────────────────────────────────────────────────
/**
 * @param {object} props
 * @param {Array}  props.dispositivos
 * @param {object} props.ejecucionPasos
 * @param {object} props.ejecucionActividades       - { ["intervencionId:actividadId"]: estado } (useVisitas)
 *                                                    o vacío si cada dispositivo trae mapa embebido (useVisitasCliente)
 * @param {object} [props.deviceEvidencias]         - { [deviceId]: { etiqueta, fotos } }
 * @param {object} [props.dispositivoIntervencionMap] - { [deviceId]: intervencionId }
 * @param {object} [props.dispositivoFdsMap]        - { [deviceId]: { fueraDeServicio: boolean } }
 */
const VisitProgressPanel = ({
  dispositivos = [],
  ejecucionPasos = {},
  ejecucionActividades = {},
  deviceEvidencias = {},
  dispositivoIntervencionMap = {},
  dispositivoFdsMap = {},
}) => {
  if (!dispositivos.length) {
    return (
      <p className="text-sm text-gray-400 italic">Sin dispositivos registrados para esta visita.</p>
    );
  }

  /**
   * Devuelve el mapa { [actividadId]: { estado } } para un dispositivo concreto.
   * Prioridad:
   *  1. device.ejecucionActividades embebido (useVisitasCliente — indexado por actividadId simple)
   *  2. mapa global con key "intervencionId:actividadId" (useVisitas) — filtra por intervencionId
   */
  const getEjecucionForDevice = (d) => {
    if (d.ejecucionActividades) return d.ejecucionActividades;

    const intervencionId = dispositivoIntervencionMap[d.id];
    if (!intervencionId) return {};

    const prefix = `${intervencionId}:`;
    const result = {};
    for (const key of Object.keys(ejecucionActividades)) {
      if (key.startsWith(prefix)) result[key.slice(prefix.length)] = ejecucionActividades[key];
    }
    return result;
  };

  const getEvidencias = (d) => d.evidencias ?? deviceEvidencias[d.id] ?? null;

  // Fuera de servicio: viene embebido en el dispositivo (useVisitasCliente)
  // o en dispositivoFdsMap (useVisitas)
  const isFDS = (d) => d.fueraDeServicio ?? dispositivoFdsMap[d.id]?.fueraDeServicio ?? false;
  const getMotivoFDS = (d) => d.motivoFueraDeServicio ?? dispositivoFdsMap[d.id]?.motivo ?? null;

  const isDeviceDone = (d) => {
    if (isFDS(d)) return true;
    const ejec = getEjecucionForDevice(d);
    const pasos = d.pasos || [];
    return pasos.length > 0 && pasos.every(paso =>
      (paso.actividades || []).length === 0 ||
      (paso.actividades || []).every(a => {
        const e = ejec[a.id]?.estado;
        return e === 'completada' || e === 'omitida';
      })
    );
  };

  const completados = dispositivos.filter(isDeviceDone).length;
  const pendientes = dispositivos.filter(d => {
    if (isFDS(d)) return false;
    const ejec = getEjecucionForDevice(d);
    const allActs = (d.pasos || []).flatMap(p => p.actividades || []);
    return !allActs.some(a => { const e = ejec[a.id]?.estado; return e === 'completada' || e === 'omitida'; });
  }).length;
  const enProceso = dispositivos.length - completados - pendientes;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 font-semibold">
          {completados} completado{completados !== 1 ? 's' : ''}
        </span>
        <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold">
          {enProceso} en proceso
        </span>
        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold">
          {pendientes} pendiente{pendientes !== 1 ? 's' : ''}
        </span>
      </div>
      {dispositivos.map((d, i) => (
        <DeviceProgressCard
          key={d.id || i}
          device={d}
          ejecucionPasos={ejecucionPasos}
          ejecucionActividades={getEjecucionForDevice(d)}
          evidencias={getEvidencias(d)}
          fueraDeServicio={isFDS(d)}
          motivoFueraDeServicio={getMotivoFDS(d)}
        />
      ))}
    </div>
  );
};

export default VisitProgressPanel;
