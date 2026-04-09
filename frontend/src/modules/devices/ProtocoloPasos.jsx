/**
 * Visualiza el protocolo de mantenimiento de un dispositivo.
 * Si hay categoría seleccionada, muestra los pasos de la categoría (solo lectura).
 * Si no, muestra los pasos manuales configurables (si isEditing=true, editables).
 */
import React from 'react';
import { ClipboardList, CheckCircle2, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import IconButton from '../../components/ui/IconButton';
import { TextSmall } from '../../components/ui/Typography';

/**
 * @param {{
 *   categoriaId: string,
 *   categoryPasos: Array,
 *   pasos: Array,
 *   isEditing: boolean,
 *   onUpdateStep: (idx: number, patch: object) => void,
 *   onMoveStep: (idx: number, dir: 'up'|'down') => void,
 *   onRemoveStep: (idx: number) => void,
 * }} props
 */
const ProtocoloPasos = ({ categoriaId, categoryPasos, pasos, isEditing, onUpdateStep, onMoveStep, onRemoveStep }) => (
  <div className="pt-2 space-y-3">
    <div className="flex items-center gap-2">
      <ClipboardList size={15} className="text-gray-500" />
      <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
        Protocolo de Mantenimiento
        {categoriaId && <span className="ml-2 text-[#D32F2F] font-normal normal-case text-[10px]">(según categoría)</span>}
      </span>
    </div>

    {categoriaId && categoryPasos.length > 0 ? (
      <div className="space-y-2">
        {categoryPasos.map((paso, idx) => (
          <div key={paso.id || idx} className="flex flex-col gap-2 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-linear-to-br from-[#D32F2F] to-[#8B0000] flex items-center justify-center text-white font-bold text-xs shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1">
                <TextSmall className="font-semibold text-gray-800">{paso.descripcion}</TextSmall>
              </div>
            </div>
            {paso.actividades && paso.actividades.length > 0 && (
              <div className="pl-10 space-y-1.5 mt-1 border-l-2 border-gray-100 ml-3">
                {paso.actividades.map((act, actIdx) => (
                  <div key={actIdx} className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-gray-400 mt-0.5 shrink-0" />
                    <TextSmall className="text-gray-600">{act.descripcion}</TextSmall>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    ) : categoriaId ? (
      <div className="p-6 border border-dashed border-gray-200 rounded-lg text-center">
        <TextSmall className="text-gray-400 italic">Esta categoría no tiene protocolo definido</TextSmall>
      </div>
    ) : pasos.length === 0 ? (
      <div className="p-6 border border-dashed border-gray-200 rounded-lg text-center">
        <TextSmall className="text-gray-400 italic">Seleccione una categoría para ver el protocolo</TextSmall>
      </div>
    ) : (
      <div className="space-y-2">
        {pasos.map((step, idx) => (
          <div key={idx} className="flex flex-col gap-2 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-0.5 shrink-0">
                {isEditing && (
                  <button onClick={() => onMoveStep(idx, 'up')} disabled={idx === 0} className="text-gray-300 hover:text-[#D32F2F] disabled:opacity-30">
                    <ChevronUp size={13} />
                  </button>
                )}
                <span className="font-bold text-gray-400 text-[10px] text-center">{idx + 1}</span>
                {isEditing && (
                  <button onClick={() => onMoveStep(idx, 'down')} disabled={idx === pasos.length - 1} className="text-gray-300 hover:text-[#D32F2F] disabled:opacity-30">
                    <ChevronDown size={13} />
                  </button>
                )}
              </div>
              <div className="flex-1 space-y-1">
                {isEditing ? (
                  <input
                    className="w-full bg-transparent text-sm text-gray-700 outline-none font-medium"
                    value={step.descripcion}
                    onChange={e => onUpdateStep(idx, { descripcion: e.target.value })}
                    placeholder="Descripción del paso..."
                  />
                ) : (
                  <TextSmall className="font-medium text-gray-700">{step.descripcion}</TextSmall>
                )}
              </div>
              {isEditing && (
                <IconButton icon={Trash2} onClick={() => onRemoveStep(idx)} className="text-gray-300 hover:text-red-500 shrink-0" size={13} />
              )}
            </div>
            {step.actividades && step.actividades.length > 0 && (
              <div className="pl-10 space-y-1.5 mt-1 border-l-2 border-gray-100 ml-3">
                {step.actividades.map((act, actIdx) => (
                  <div key={actIdx} className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-gray-400 mt-0.5 shrink-0" />
                    <TextSmall className="text-gray-600">{act.descripcion}</TextSmall>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

export default ProtocoloPasos;
