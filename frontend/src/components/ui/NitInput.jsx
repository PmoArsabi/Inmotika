import React, { useRef } from 'react';
import { Label } from './Typography';
import { Hash } from 'lucide-react';

export const calculateDV = (nit) => {
  if (!nit || isNaN(nit)) return null;
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  let sum = 0;
  const nitStr = nit.toString().split('').reverse();
  for (let i = 0; i < nitStr.length; i++) sum += parseInt(nitStr[i]) * weights[i];
  const remainder = sum % 11;
  if (remainder < 2) return remainder;
  return 11 - remainder;
};

/**
 * Unified identification number input.
 *
 * showDv=true  (NIT / juridica):  [# Número ────────── 70% | DV  30%]
 * showDv=false (other doc types): [# Número ──────────────────────── ]
 */
const NitInput = ({
  label = 'Número de Identificación',
  nitValue = '',
  dvValue = '',
  onNitChange,
  onDvChange,
  showDv = false,
  error,
  viewMode = false,
  dark = false,
  className = '',
  required = false,
}) => {
  const dvRef  = useRef(null);
  const nitRef = useRef(null);

  const handleNitChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 15) {
      onNitChange(val);
      if (showDv) {
        const dv = calculateDV(val);
        onDvChange(dv !== null ? dv.toString() : '');
        if (val.length >= 10 && dvRef.current && !viewMode) dvRef.current.focus();
      }
    }
  };

  const handleNitKeyDown = (e) => {
    if (showDv && (e.key === 'Enter' || e.key === 'Tab') && nitValue && dvRef.current && !viewMode) {
      e.preventDefault();
      dvRef.current.focus();
    }
  };

  const handleDvChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 1) onDvChange(val);
  };

  const borderColor = error
    ? 'border-red-500'
    : dark
      ? 'border-transparent'
      : 'border-gray-300';

  const focusRingClass = dark
    ? 'focus-within:ring-4 focus-within:ring-white/10'
    : 'focus-within:ring-4 focus-within:ring-[#D32F2F]/5 focus-within:border-[#D32F2F] hover:border-gray-400';

  const bgClass = dark ? 'bg-[#2A2A2A]' : 'bg-white';
  const textClass = dark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400';
  const iconClass = dark
    ? 'text-gray-500 group-focus-within:text-white'
    : 'text-gray-400 group-focus-within:text-[#D32F2F]';
  const dividerClass = dark ? 'border-gray-600' : 'border-gray-200';

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <Label className={dark ? 'text-gray-400 ml-1' : 'ml-1'}>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
      )}

      {viewMode ? (
        <div className="flex items-center gap-2 h-10 pl-1 text-sm font-semibold text-gray-900">
          <Hash size={16} className="text-gray-400 shrink-0" />
          {nitValue
            ? (
              <span>
                {nitValue}
                {showDv && dvValue != null && dvValue !== ''
                  ? <span className="text-gray-400"> — DV {dvValue}</span>
                  : ''}
              </span>
            )
            : <span className="text-gray-400 italic">No especificado</span>
          }
        </div>
      ) : (
        <>
          <div className={`group flex items-stretch h-10 w-full rounded-md border overflow-hidden transition-all ${bgClass} ${borderColor} ${focusRingClass}`}>

            {/* Hash icon + main number input */}
            <div className={`flex items-center pl-3 ${showDv ? 'flex-[7]' : 'flex-1'} min-w-0`}>
              <Hash
                size={15}
                className={`shrink-0 mr-2 transition-colors pointer-events-none ${iconClass}`}
              />
              <input
                ref={nitRef}
                type="text"
                inputMode="numeric"
                placeholder="Número"
                value={nitValue}
                onChange={handleNitChange}
                onKeyDown={handleNitKeyDown}
                required={required}
                className={`min-w-0 w-full h-full border-0 outline-none bg-transparent text-sm font-semibold ${textClass} pr-2`}
              />
            </div>

            {/* DV section — only shown when showDv=true */}
            {showDv && (
              <>
                <div className={`w-px self-stretch my-1.5 ${dividerClass} border-l`} />
                <div className={`flex items-center px-3 flex-[3] min-w-0 gap-1.5`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wide shrink-0 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                    DV
                  </span>
                  <input
                    ref={dvRef}
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    maxLength={1}
                    value={dvValue}
                    onChange={handleDvChange}
                    className={`min-w-0 w-full h-full border-0 outline-none bg-transparent text-sm font-semibold text-center ${textClass}`}
                  />
                </div>
              </>
            )}
          </div>
          {error && <span className="text-xs text-red-500 font-bold ml-1">{error}</span>}
        </>
      )}
    </div>
  );
};

export default NitInput;
