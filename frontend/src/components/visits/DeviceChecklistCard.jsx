import { useState, useRef } from 'react';
import {
  CheckCircle2, Circle, ChevronDown, ChevronRight,
  Save, Send, Lock, Camera, X, Plus, Tag,
} from 'lucide-react';
import SecureImage from '../ui/SecureImage';

// ─── Single activity row ──────────────────────────────────────────────────────
/**
 * @param {object}  props
 * @param {object}  props.actividad  - Actividad del protocolo
 * @param {boolean} props.completada - Si la actividad está completada
 * @param {function} props.onChange  - (boolean) => void
 * @param {boolean} props.viewMode   - Modo solo lectura
 * @param {boolean} props.isBlocked  - true si una actividad previa obligatoria no está completada
 */
const ActividadRow = ({ actividad, completada, onChange, viewMode, isBlocked }) => {
  const disabled = viewMode || isBlocked;
  return (
    <div className={`flex items-start gap-2.5 py-1.5 px-2 rounded-md transition-all ${
      completada ? 'bg-green-50' : isBlocked ? 'opacity-40' : 'hover:bg-gray-50'
    }`}>
      <button
        type="button"
        disabled={disabled || completada}
        onClick={() => !disabled && !completada && onChange(true)}
        className={`mt-0.5 shrink-0 transition-colors ${isBlocked ? 'cursor-not-allowed' : ''}`}
        title={isBlocked ? 'Completa la actividad anterior primero' : undefined}
      >
        {completada
          ? <CheckCircle2 size={16} className="text-green-500" />
          : isBlocked
            ? <Lock size={16} className="text-gray-300" />
            : <Circle size={16} className="text-gray-300 hover:text-gray-400" />
        }
      </button>
      <span className={`text-xs leading-relaxed ${completada ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
        {actividad.descripcion}
      </span>
    </div>
  );
};

// ─── Single paso section (collapsible) ───────────────────────────────────────
/**
 * @param {object}  props
 * @param {object}  props.paso                 - Paso del protocolo
 * @param {object}  props.execPaso             - Estado de ejecución del paso
 * @param {object}  props.ejecucionActividades - Estado de todas las actividades
 * @param {function} props.onPasoChange        - (pasoId, patch) => void
 * @param {function} props.onActividadChange   - (actividadId, bool) => void
 * @param {boolean} props.viewMode             - Modo solo lectura
 * @param {boolean} props.isLocked             - Paso bloqueado por paso anterior incompleto
 */
const PasoSection = ({ paso, execPaso, ejecucionActividades, onPasoChange, onActividadChange, viewMode, isLocked = false }) => {
  const actividades = paso.actividades || [];
  const totalActs   = actividades.length;
  const doneActs    = actividades.filter(a => ejecucionActividades[a.id]?.completada).length;
  const pasoCerrado = actividades.length === 0 || actividades.every(a => ejecucionActividades[a.id]?.completada);
  const [open, setOpen] = useState(!isLocked);

  return (
    <div className={`border rounded-lg overflow-hidden transition-all bg-white ${
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

      {/* Activities */}
      {open && (
        <div className="px-3 py-2 space-y-1 bg-gray-50">
          {actividades.map((act, actIdx) => {
            const isActBlocked = !viewMode && !isLocked && actividades
              .slice(0, actIdx)
              .some(prev => !ejecucionActividades[prev.id]?.completada);
            return (
              <ActividadRow
                key={act.id}
                actividad={act}
                completada={!!ejecucionActividades[act.id]?.completada}
                onChange={val => onActividadChange(act.id, val)}
                viewMode={viewMode || isLocked}
                isBlocked={isActBlocked}
              />
            );
          })}

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

// ─── Single evidence photo card ───────────────────────────────────────────────
/**
 * @param {object}      props
 * @param {string}      props.label     - Etiqueta visible bajo la tarjeta
 * @param {boolean}     props.isEtiqueta - Si es la foto de etiqueta (label en azul)
 * @param {{ file: File, preview: string }|null} props.value - Foto actual o null
 * @param {function}    props.onAdd     - () => void — abre el file input
 * @param {function}    props.onRemove  - () => void — elimina la foto (null si no removible)
 * @param {React.Ref}   props.inputRef  - Ref del input file oculto
 * @param {function}    props.onFileChange - (File) => void
 */
const EvidenciaCard = ({ label, isEtiqueta, value, onAdd, onRemove, inputRef, onFileChange }) => {
  const handleFile = (e) => {
    const selected = e.target.files?.[0];
    if (selected) onFileChange(selected);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col items-center">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {value ? (
        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
          <SecureImage path={value.preview} alt={label} className="object-cover w-full h-full" />
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 text-white hover:bg-black/80 transition-colors"
            >
              <X size={10} />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#D32F2F] hover:bg-red-50 transition-all"
        >
          <Camera size={20} className="text-gray-400" />
          <span className="text-[10px] text-gray-400">Agregar</span>
        </button>
      )}
      <p className={`text-[10px] text-center mt-1 ${isEtiqueta ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
        {label}
      </p>
    </div>
  );
};

// ─── Add-more card ────────────────────────────────────────────────────────────
const AgregarFotoCard = ({ onClick }) => (
  <div className="flex flex-col items-center">
    <button
      type="button"
      onClick={onClick}
      className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#D32F2F] hover:bg-red-50 transition-all"
    >
      <Plus size={20} className="text-gray-400" />
      <span className="text-[10px] text-gray-400">Agregar</span>
    </button>
    <p className="text-[10px] text-gray-400 text-center mt-1">Nueva foto</p>
  </div>
);

// ─── Device-level evidencias section ─────────────────────────────────────────
/**
 * Sección de evidencias a nivel de dispositivo (aparece después de todos los pasos).
 * Siempre disponible, independiente de si los pasos están completos.
 *
 * @param {object} props
 * @param {{ etiqueta: { file: File, preview: string }|null, fotos: Array<{ file: File, preview: string }> }} props.evidencias
 *   Estado actual de evidencias del dispositivo
 * @param {function} props.onChange - (patch) => void — patch: { etiqueta?, fotos? }
 */
const EvidenciasSection = ({ evidencias, onChange }) => {
  const etiquetaInputRef = useRef(null);
  // Refs para cada foto adicional — mapa indexado por posición
  const fotosInputRefs = useRef({});

  const handleEtiquetaFile = (file) => {
    const preview = URL.createObjectURL(file);
    onChange({ etiqueta: { file, preview } });
  };

  const handleFotoFile = (idx, file) => {
    const preview = URL.createObjectURL(file);
    const newFotos = [...(evidencias.fotos || [])];
    newFotos[idx] = { file, preview };
    onChange({ fotos: newFotos });
  };

  const handleRemoveEtiqueta = () => {
    onChange({ etiqueta: null });
  };

  const handleRemoveFoto = (idx) => {
    const newFotos = (evidencias.fotos || []).filter((_, i) => i !== idx);
    onChange({ fotos: newFotos });
  };

  const handleAddFoto = () => {
    // Agrega una entrada null y dispara el input correspondiente
    const newFotos = [...(evidencias.fotos || []), null];
    onChange({ fotos: newFotos });
    // El input se renderizará en el siguiente ciclo; click se dispara desde el card vacío
  };

  const fotos = evidencias.fotos || [];

  return (
    <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <Camera size={13} className="text-gray-400 shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Evidencias</span>
      </div>

      {/* Photo grid */}
      <div className="flex flex-wrap gap-3">
        {/* Etiqueta card — always first, always present */}
        <EvidenciaCard
          label="Foto Etiqueta"
          isEtiqueta
          value={evidencias.etiqueta || null}
          onAdd={() => etiquetaInputRef.current?.click()}
          onRemove={evidencias.etiqueta ? handleRemoveEtiqueta : null}
          inputRef={etiquetaInputRef}
          onFileChange={handleEtiquetaFile}
        />

        {/* Dynamic extra photos */}
        {fotos.map((foto, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <input
              ref={el => { fotosInputRefs.current[idx] = el; }}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) handleFotoFile(idx, selected);
                e.target.value = '';
              }}
            />
            {foto ? (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                <SecureImage path={foto.preview} alt={`Foto ${idx + 1}`} className="object-cover w-full h-full" />
                <button
                  type="button"
                  onClick={() => handleRemoveFoto(idx)}
                  className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 text-white hover:bg-black/80 transition-colors"
                >
                  <X size={10} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fotosInputRefs.current[idx]?.click()}
                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#D32F2F] hover:bg-red-50 transition-all"
              >
                <Camera size={20} className="text-gray-400" />
                <span className="text-[10px] text-gray-400">Agregar</span>
              </button>
            )}
            <p className="text-[10px] text-gray-500 text-center mt-1">Foto {idx + 1}</p>
          </div>
        ))}

        {/* Add more */}
        <AgregarFotoCard onClick={handleAddFoto} />
      </div>
    </div>
  );
};

// ─── Device checklist card ────────────────────────────────────────────────────
/**
 * Tarjeta de checklist para un dispositivo dentro de una visita.
 *
 * @param {object}  props
 * @param {object}  props.device                - Dispositivo con pasos y actividades
 * @param {Array}   props.steps                 - Pasos del protocolo del dispositivo
 * @param {object}  props.ejecucionPasos        - Estado de ejecución por paso
 * @param {object}  props.ejecucionActividades  - Estado de ejecución por actividad
 * @param {function} props.onPasoChange         - (pasoId, patch) => void
 * @param {function} props.onActividadChange    - (actividadId, bool) => void
 * @param {function} props.onSaveAvance              - (deviceId, evidencias, codigoEtiqueta) => void
 * @param {boolean}  props.viewMode                 - Modo solo lectura
 * @param {boolean}  props.isLocked                 - Dispositivo bloqueado
 * @param {{ etiqueta: { file: File, preview: string }|null, fotos: Array<{ file: File, preview: string }> }} props.deviceEvidencias
 *   Evidencias actuales del dispositivo (gestionadas por el padre)
 * @param {function} props.onDeviceEvidenciasChange  - (patch) => void
 * @param {string}   [props.codigoEtiquetaInicial]   - Código de etiqueta existente (si ya fue guardado)
 * @param {boolean}  [props.isFinalDevice]           - true si es el último dispositivo de la visita (EN_PROGRESO)
 * @param {boolean}  [props.allDevicesDone]          - true si todos los dispositivos están completados
 * @param {string}   [props.observacionFinal]        - Valor del textarea de observación final
 * @param {function} [props.onObservacionChange]     - (string) => void
 */
const DeviceChecklistCard = ({
  device,
  steps = [],
  ejecucionPasos = {},
  ejecucionActividades = {},
  onPasoChange,
  onActividadChange,
  onSaveAvance,
  viewMode = false,
  isLocked = false,
  deviceEvidencias = { etiqueta: null, fotos: [] },
  onDeviceEvidenciasChange,
  codigoEtiquetaInicial = '',
  isFinalDevice = false,
  allDevicesDone = false,
  observacionFinal = '',
  onObservacionChange,
}) => {
  const [open, setOpen] = useState(!isLocked);
  const [codigoEtiqueta, setCodigoEtiqueta] = useState(codigoEtiquetaInicial);

  // Compute overall device completion — only requires all mandatory activities done (no photo)
  const allActividades = steps.flatMap(p => p.actividades || []);
  const totalActs      = allActividades.length;
  const doneActs       = allActividades.filter(a => ejecucionActividades[a.id]?.completada).length;
  const pct            = totalActs > 0 ? Math.round((doneActs / totalActs) * 100) : 0;

  const allDone = steps.length > 0 && steps.every(paso =>
    (paso.actividades || []).length === 0 ||
    (paso.actividades || []).every(a => ejecucionActividades[a.id]?.completada)
  );

  return (
    <div className={`border rounded-lg overflow-hidden transition-all bg-white ${
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

      {/* Pasos + Evidencias + Save */}
      {open && (
        <div className="p-4 space-y-3 bg-white">
          {steps.length === 0 && (
            <p className="text-xs text-gray-400 italic text-center py-2">Sin pasos de protocolo definidos</p>
          )}
          {steps.map((paso, pasoIdx) => {
            const isPasoLocked = !viewMode && steps.slice(0, pasoIdx).some(prev =>
              (prev.actividades || []).some(a => !ejecucionActividades[a.id]?.completada)
            );
            return (
              <PasoSection
                key={paso.id}
                paso={paso}
                execPaso={ejecucionPasos[paso.id] || {}}
                ejecucionActividades={ejecucionActividades}
                onPasoChange={onPasoChange}
                onActividadChange={onActividadChange}
                viewMode={viewMode}
                isLocked={isPasoLocked}
              />
            );
          })}

          {/* Código de etiqueta + evidencias */}
          {!viewMode ? (
            <>
              {/* Código de etiqueta — editable en ejecución */}
              <div className="flex items-center gap-2 px-1">
                <Tag size={13} className="text-gray-400 shrink-0" />
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                  Código Etiqueta
                </label>
                <input
                  type="text"
                  value={codigoEtiqueta}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 8);
                    const formatted = raw.length > 4 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw;
                    setCodigoEtiqueta(formatted);
                  }}
                  placeholder="XXXX-XXXX"
                  maxLength={9}
                  className="flex-1 h-8 px-2 text-xs border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/10 focus:border-[#D32F2F] font-mono tracking-widest uppercase transition-all"
                />
              </div>
              <EvidenciasSection
                evidencias={deviceEvidencias}
                onChange={onDeviceEvidenciasChange}
              />
            </>
          ) : (
            /* Modo lectura — código de etiqueta + evidencias guardadas */
            (() => {
              const tieneEvidencias = deviceEvidencias.etiqueta || (deviceEvidencias.fotos || []).length > 0;
              const tieneCodigo = !!codigoEtiqueta;
              if (!tieneEvidencias && !tieneCodigo) return null;
              return (
                <div className="space-y-3">
                  {tieneCodigo && (
                    <div className="flex items-center gap-2">
                      <Tag size={13} className="text-gray-400 shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Código Etiqueta</span>
                      <span className="text-xs font-mono font-bold tracking-widest text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                        {codigoEtiqueta}
                      </span>
                    </div>
                  )}
                  {tieneEvidencias && <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Evidencias</p>}
                  <div className="flex flex-wrap gap-3">
                    {deviceEvidencias.etiqueta && (
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-24 h-24 rounded-lg overflow-hidden border border-blue-200">
                          <SecureImage path={deviceEvidencias.etiqueta.preview} alt="Etiqueta" className="object-cover w-full h-full" />
                        </div>
                        <p className="text-[10px] text-blue-600 font-semibold">Foto Etiqueta</p>
                      </div>
                    )}
                    {(deviceEvidencias.fotos || []).map((foto, idx) => foto && (
                      <div key={idx} className="flex flex-col items-center gap-1">
                        <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                          <SecureImage path={foto.preview} alt={`Foto ${idx + 1}`} className="object-cover w-full h-full" />
                        </div>
                        <p className="text-[10px] text-gray-500">Foto {idx + 1}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()
          )}

          {/* Observación final — en el último dispositivo: editable si allDevicesDone, solo lectura si ya hay valor */}
          {isFinalDevice && (allDevicesDone || observacionFinal) && (
            <div className="mt-4 pt-4 border-t border-green-200 space-y-2">
              {allDevicesDone && (
                <div className="flex items-center gap-2 text-green-700 mb-1">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wide">¡Todos los dispositivos completados!</span>
                </div>
              )}
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block">
                Observación Final {allDevicesDone && !viewMode && <span className="text-red-500">*</span>}
              </label>
              {viewMode || !allDevicesDone ? (
                <p className="text-sm text-gray-700 px-3 py-2 bg-gray-50 rounded-md border border-gray-200 whitespace-pre-wrap">
                  {observacionFinal || <span className="text-gray-400 italic">Sin observación final registrada.</span>}
                </p>
              ) : (
                <textarea
                  value={observacionFinal}
                  onChange={e => onObservacionChange?.(e.target.value)}
                  rows={3}
                  placeholder="Resumen del trabajo realizado, hallazgos generales, recomendaciones..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-y focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all"
                />
              )}
            </div>
          )}

          {/* Guardar / Finalizar */}
          {!viewMode && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => onSaveAvance && onSaveAvance(device.id, deviceEvidencias, codigoEtiqueta || null)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded-md transition-all shadow-sm text-white ${
                  isFinalDevice && allDevicesDone
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-[#1A1A1A] hover:bg-black'
                }`}
              >
                {isFinalDevice && allDevicesDone ? <Send size={13} /> : <Save size={13} />}
                {isFinalDevice && allDevicesDone ? 'Finalizar y Enviar Informe' : 'Guardar · Enviar Avance'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeviceChecklistCard;
