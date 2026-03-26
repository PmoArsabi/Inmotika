import { CheckCircle2, Circle, Clock, ChevronDown, ChevronRight, Minus } from 'lucide-react';
import { useState } from 'react';
import SecureImage from '../ui/SecureImage';

// ─── Single paso section (read-only) ─────────────────────────────────────────
const PasoProgressRow = ({ paso, ejecucionPasos, ejecucionActividades }) => {
  const [open, setOpen] = useState(false);
  const actividades = paso.actividades || [];
  const totalActs   = actividades.length;
  const doneActs    = actividades.filter(a => ejecucionActividades[a.id]?.completada).length;
  const pasoDone = actividades.length === 0 || actividades.every(a => ejecucionActividades[a.id]?.completada);

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
          <span className="text-[10px] text-gray-400">{doneActs}/{totalActs}</span>
          {open ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
        </div>
      </button>

      {open && actividades.length > 0 && (
        <div className="px-3 pb-2 pt-1 space-y-1 bg-gray-50 border-t border-gray-100">
          {actividades.map((act, idx) => {
            const done = !!ejecucionActividades[act.id]?.completada;
            return (
              <div key={act.id || idx} className="flex items-start gap-1.5">
                {done
                  ? <CheckCircle2 size={12} className="shrink-0 text-green-500 mt-0.5" />
                  : <Circle       size={12} className="shrink-0 text-gray-300 mt-0.5" />
                }
                <span className={`text-[11px] leading-relaxed ${done ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
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
const DeviceProgressCard = ({ device, ejecucionPasos, ejecucionActividades, evidencias }) => {
  const [open, setOpen] = useState(false);

  const allActs  = (device.pasos || []).flatMap(p => p.actividades || []);
  const totalActs = allActs.length;
  const doneActs  = allActs.filter(a => ejecucionActividades[a.id]?.completada).length;
  const pct       = totalActs > 0 ? Math.round((doneActs / totalActs) * 100) : 0;

  const deviceDone = (device.pasos || []).length > 0 && (device.pasos || []).every(paso =>
    (paso.actividades || []).length === 0 ||
    (paso.actividades || []).every(a => ejecucionActividades[a.id]?.completada)
  );

  const estado = deviceDone ? 'COMPLETADO' : doneActs > 0 ? 'EN_PROCESO' : 'PENDIENTE';

  const estadoConfig = {
    COMPLETADO: { icon: CheckCircle2, color: 'text-green-500', bar: 'bg-green-500', bg: 'border-green-200 bg-green-50' },
    EN_PROCESO:  { icon: Clock,        color: 'text-yellow-500', bar: 'bg-yellow-400', bg: 'border-yellow-200 bg-yellow-50' },
    PENDIENTE:   { icon: Circle,       color: 'text-gray-400',   bar: 'bg-gray-200',   bg: 'border-gray-200 bg-gray-50'   },
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
            <p className="text-sm font-semibold text-gray-900 truncate">{device.nombre}</p>
            <p className="text-xs text-gray-500 truncate">{device.serial}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-2">
          <span className="text-xs font-semibold text-gray-600">{doneActs}/{totalActs} act.</span>
          {open ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
        </div>
      </button>

      <div className="h-1 bg-gray-200 mx-3 mb-1 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${estadoConfig.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {open && (device.pasos || []).length > 0 && (
        <div className="px-3 pb-3 pt-1 space-y-1.5">
          {(device.pasos || []).map((paso, idx) => (
            <PasoProgressRow
              key={paso.id || idx}
              paso={paso}
              ejecucionPasos={ejecucionPasos}
              ejecucionActividades={ejecucionActividades}
            />
          ))}
          {evidencias && (evidencias.etiqueta || evidencias.fotos?.length > 0) && (
            <div className="pt-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Evidencias</p>
              <div className="flex flex-wrap gap-2">
                {evidencias.etiqueta && (
                  <div className="flex flex-col items-center gap-0.5">
                    <SecureImage path={evidencias.etiqueta.preview} alt="Etiqueta" className="w-16 h-16 rounded border border-blue-200 object-cover" />
                    <span className="text-[9px] text-blue-600 font-semibold">Etiqueta</span>
                  </div>
                )}
                {(evidencias.fotos || []).map((foto, i) => foto && (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <SecureImage path={foto.preview} alt={`Foto ${i + 1}`} className="w-16 h-16 rounded border border-gray-200 object-cover" />
                    <span className="text-[9px] text-gray-500">Foto {i + 1}</span>
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
 * @param {object} props.ejecucionActividades
 * @param {object} [props.deviceEvidencias] - { [deviceId]: { etiqueta, fotos } }
 */
const VisitProgressPanel = ({ dispositivos = [], ejecucionPasos = {}, ejecucionActividades = {}, deviceEvidencias = {} }) => {
  if (!dispositivos.length) {
    return (
      <p className="text-sm text-gray-400 italic">Sin dispositivos registrados para esta visita.</p>
    );
  }

  const isDeviceDone = (d) => {
    const pasos = d.pasos || [];
    return pasos.length > 0 && pasos.every(paso =>
      (paso.actividades || []).length === 0 ||
      (paso.actividades || []).every(a => ejecucionActividades[a.id]?.completada)
    );
  };

  const completados = dispositivos.filter(isDeviceDone).length;
  const pendientes = dispositivos.filter(d => {
    const allActs = (d.pasos || []).flatMap(p => p.actividades || []);
    return !allActs.some(a => ejecucionActividades[a.id]?.completada);
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
          ejecucionActividades={ejecucionActividades}
          evidencias={deviceEvidencias[d.id] || null}
        />
      ))}
    </div>
  );
};

export default VisitProgressPanel;
