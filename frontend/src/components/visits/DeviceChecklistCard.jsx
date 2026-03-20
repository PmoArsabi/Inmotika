import { useState, useRef } from 'react';
import {
  CheckCircle2, Circle, ChevronDown, ChevronRight,
  Save, UploadCloud, Lock, Minus,
} from 'lucide-react';

// ─── Evidence photo uploader (per paso) ──────────────────────────────────────
const EvidenciaUploader = ({ value, onChange }) => {
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) onChange(URL.createObjectURL(file));
    e.target.value = '';
  };

  return (
    <div className="space-y-1.5">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <div
        onClick={() => inputRef.current?.click()}
        className={`h-12 border-2 border-dashed rounded-md flex items-center justify-center gap-2 cursor-pointer select-none transition-all ${
          value
            ? 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100'
            : 'border-gray-300 bg-gray-50 hover:border-[#D32F2F] hover:bg-gray-100 text-gray-500'
        }`}
      >
        {value ? <CheckCircle2 size={16} /> : <UploadCloud size={16} />}
        <span className="text-xs font-bold uppercase tracking-normal">
          {value ? 'Foto cargada · Reemplazar' : 'Subir / Tomar Foto de Evidencia'}
        </span>
      </div>
      {value && (
        <img src={value} alt="evidencia" className="h-20 w-full rounded-md border border-green-200 object-cover" />
      )}
    </div>
  );
};

// ─── Single activity row ──────────────────────────────────────────────────────
const ActividadRow = ({ actividad, completada, onChange, viewMode }) => (
  <div className={`flex items-start gap-2.5 py-1.5 px-2 rounded-md transition-all ${
    completada ? 'bg-green-50' : 'hover:bg-gray-50'
  }`}>
    <button
      type="button"
      disabled={viewMode}
      onClick={() => !viewMode && onChange(!completada)}
      className="mt-0.5 shrink-0 transition-colors"
    >
      {completada
        ? <CheckCircle2 size={16} className="text-green-500" />
        : <Circle      size={16} className="text-gray-300 hover:text-gray-400" />
      }
    </button>
    <span className={`text-xs leading-relaxed ${completada ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
      {actividad.descripcion}
      {actividad.esObligatorio && (
        <span className="ml-1 text-[9px] font-bold text-red-400 uppercase">*</span>
      )}
    </span>
  </div>
);

// ─── Single paso section (collapsible) ───────────────────────────────────────
const PasoSection = ({ paso, execPaso, ejecucionActividades, onPasoChange, onActividadChange, viewMode, triedClose, setTriedClose, isLocked = false }) => {
  const actividades  = paso.actividades || [];
  const totalActs    = actividades.length;
  const doneActs     = actividades.filter(a => ejecucionActividades[a.id]?.completada).length;
  const allActsDone  = totalActs > 0 && doneActs === totalActs;
  const hasPhoto     = !!execPaso?.evidenciaUrl;
  const pasoCerrado  = allActsDone && hasPhoto;
  const [open, setOpen] = useState(!isLocked);

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${
      pasoCerrado ? 'border-green-300' : 'border-gray-200'
    }`}>
      {/* Paso header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left ${
          isLocked ? 'bg-gray-50' : pasoCerrado ? 'bg-green-50' : 'bg-white'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {isLocked
            ? <Lock size={16} className="shrink-0 text-gray-200" />
            : pasoCerrado
              ? <CheckCircle2 size={16} className="shrink-0 text-green-500" />
              : allActsDone && !hasPhoto
                ? <Minus size={16} className="shrink-0 text-yellow-500" />
                : <Circle size={16} className="shrink-0 text-gray-300" />
          }
          <div className="min-w-0">
            <p className={`text-xs font-bold uppercase tracking-wide ${
              isLocked ? 'text-gray-500' : pasoCerrado ? 'text-green-700' : 'text-gray-700'
            }`}>
              {paso.orden}. {paso.descripcion}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {isLocked ? 'Completa el paso anterior primero' : `${doneActs}/${totalActs} actividades`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {open ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
        </div>
      </button>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className={`h-full transition-all ${pasoCerrado ? 'bg-green-500' : 'bg-[#D32F2F]'}`}
          style={{ width: totalActs > 0 ? `${(doneActs / totalActs) * 100}%` : '0%' }}
        />
      </div>

      {/* Activities + evidence */}
      {open && (
        <div className="px-3 py-2 space-y-1">
          {actividades.map(act => (
            <ActividadRow
              key={act.id}
              actividad={act}
              completada={!!ejecucionActividades[act.id]?.completada}
              onChange={val => onActividadChange(act.id, val)}
              viewMode={viewMode || isLocked}
            />
          ))}

          {/* Photo evidence section */}
          {!(viewMode || isLocked) && (
            <div className="pt-2 space-y-1">
              <EvidenciaUploader
                value={execPaso?.evidenciaUrl || null}
                onChange={url => onPasoChange(paso.id, { evidenciaUrl: url })}
              />
              {/* Inline warnings */}
              {triedClose === 'acts' && !allActsDone && (
                <p className="text-[10px] text-orange-500 font-semibold">
                  Completa todas las actividades antes de cerrar el paso.
                </p>
              )}
              {triedClose === 'photo' && allActsDone && !hasPhoto && (
                <p className="text-[10px] text-orange-500 font-semibold">
                  Debes subir la foto de evidencia antes de cerrar el paso.
                </p>
              )}
            </div>
          )}

          {/* View mode / locked mode: show photo if uploaded */}
          {(viewMode || isLocked) && execPaso?.evidenciaUrl && (
            <div className="pt-1">
              <img src={execPaso.evidenciaUrl} alt="evidencia" className="h-20 w-full rounded-md border border-gray-200 object-cover" />
            </div>
          )}

          {/* Observation textarea */}
          <textarea
            disabled={viewMode || isLocked}
            value={execPaso?.comentarios || ''}
            onChange={e => onPasoChange(paso.id, { comentarios: e.target.value })}
            placeholder="Observación del paso (opcional)"
            rows={1}
            spellCheck="true"
            lang="es"
            className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-md bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/10 focus:border-[#D32F2F] transition-all disabled:opacity-60"
          />
        </div>
      )}
    </div>
  );
};

// ─── Device checklist card ────────────────────────────────────────────────────
const DeviceChecklistCard = ({
  device,
  steps = [],          // paso[] — each paso has actividades[]
  ejecucionPasos = {},
  ejecucionActividades = {},
  onPasoChange,
  onActividadChange,
  onSaveAvance,
  viewMode = false,
  isLocked = false,
}) => {
  const [open, setOpen] = useState(!isLocked);
  // triedClose: { [pasoId]: 'acts' | 'photo' }
  const [triedClose, setTriedCloseMap] = useState({});

  const setTriedClose = (pasoId, reason) =>
    setTriedCloseMap(prev => ({ ...prev, [pasoId]: reason }));

  // Compute overall device completion
  const allActividades = steps.flatMap(p => p.actividades || []);
  const totalActs      = allActividades.length;
  const doneActs       = allActividades.filter(a => ejecucionActividades[a.id]?.completada).length;
  const pct            = totalActs > 0 ? Math.round((doneActs / totalActs) * 100) : 0;

  // A device is fully done when every paso has all activities done + a photo
  const allDone = steps.length > 0 && steps.every(paso => {
    const acts = paso.actividades || [];
    const allActsDone = acts.length > 0 && acts.every(a => ejecucionActividades[a.id]?.completada);
    return allActsDone && !!ejecucionPasos[paso.id]?.evidenciaUrl;
  });

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${
      allDone ? 'border-green-300' : 'border-gray-200'
    }`}>
      {/* Card header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between p-4 text-left ${
          isLocked ? 'bg-gray-50' : allDone ? 'bg-green-50' : 'bg-white'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {isLocked
            ? <Lock size={18} className="shrink-0 text-gray-300" />
            : allDone
              ? <CheckCircle2 size={20} className="shrink-0 text-green-500" />
              : <Circle       size={20} className="shrink-0 text-gray-300" />
          }
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{device.label || device.nombre || device.id}</p>
            <p className="text-xs text-gray-500">
              {[device.categoria, device.serial ? `Serie: ${device.serial}` : null].filter(Boolean).join(' · ') || 'Dispositivo'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-2">
          {isLocked
            ? <span className="text-xs text-gray-400 italic">Completa el anterior primero</span>
            : <>
                <div className="text-right">
                  <span className={`text-xs font-bold ${allDone ? 'text-green-600' : 'text-gray-600'}`}>
                    {doneActs}/{totalActs}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">actividades</span>
                </div>
                {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
              </>
          }
        </div>
      </button>

      {/* Overall progress bar */}
      {!isLocked && (
        <div className="h-1.5 bg-gray-100">
          <div
            className={`h-full transition-all ${allDone ? 'bg-green-500' : 'bg-[#D32F2F]'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Pasos */}
      {open && (
        <div className="p-4 space-y-3">
          {steps.length === 0 && (
            <p className="text-xs text-gray-400 italic text-center py-2">Sin pasos de protocolo definidos</p>
          )}
          {steps.map((paso, pasoIdx) => {
            // A paso is locked if any previous paso is not yet complete
            const isPasoLocked = !viewMode && steps.slice(0, pasoIdx).some(prev => {
              const acts = prev.actividades || [];
              const allDone = acts.length > 0 && acts.every(a => ejecucionActividades[a.id]?.completada);
              return !(allDone && !!ejecucionPasos[prev.id]?.evidenciaUrl);
            });
            return (
              <PasoSection
                key={paso.id}
                paso={paso}
                execPaso={ejecucionPasos[paso.id] || {}}
                ejecucionActividades={ejecucionActividades}
                onPasoChange={onPasoChange}
                onActividadChange={onActividadChange}
                viewMode={viewMode}
                triedClose={triedClose[paso.id] || null}
                setTriedClose={setTriedClose}
                isLocked={isPasoLocked}
              />
            );
          })}

          {/* Save + Enviar Avance */}
          {!viewMode && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => onSaveAvance && onSaveAvance(device.id)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded-md bg-[#1A1A1A] text-white hover:bg-black transition-all shadow-sm"
              >
                <Save size={13} />
                Guardar · Enviar Avance
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeviceChecklistCard;
