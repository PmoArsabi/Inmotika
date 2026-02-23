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

const NitInput = ({
  label = 'NIT / RUT',
  nitValue,
  dvValue,
  onNitChange,
  onDvChange,
  error,
  viewMode = false,
  dark = false,
  className = '',
  autoCalculate = true,
  required = false,
}) => {
  const dvRef  = useRef(null);
  const nitRef = useRef(null);

  const handleNitChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 15) {
      onNitChange(val);
      if (autoCalculate) {
        const dv = calculateDV(val);
        onDvChange(dv !== null ? dv.toString() : '');
      }
      if (val.length >= 10 && dvRef.current && !viewMode) dvRef.current.focus();
    }
  };

  const handleNitKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === 'Tab') && nitValue && dvRef.current && !viewMode) {
      e.preventDefault();
      dvRef.current.focus();
    }
  };

  const handleDvChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 1) onDvChange(val);
  };

  const baseInput = `h-10 border rounded-md focus:outline-none focus:ring-4 transition-all text-sm font-semibold
    ${dark
      ? 'bg-[#2A2A2A] border-transparent text-white placeholder-gray-500 focus:ring-white/10'
      : 'bg-white border-gray-300 text-gray-900 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] hover:border-gray-400'
    } ${error ? 'border-red-500 ring-red-500/10' : ''}`;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && <Label className={dark ? 'text-gray-400 ml-1' : 'ml-1'}>{label}</Label>}

      {viewMode ? (
        /* ── View mode: icon + "900111222-1" as plain text ── */
        <div className="flex items-center gap-2 h-10 pl-1 text-sm font-semibold text-gray-900">
          <Hash size={16} className="text-gray-400 shrink-0" />
          {nitValue
            ? <span>{nitValue}{dvValue != null && dvValue !== '' ? <span className="text-gray-400"> — {dvValue}</span> : ''}</span>
            : <span className="text-gray-400 italic">No especificado</span>
          }
        </div>
      ) : (
        /* ── Edit mode: [# [Input] ] - [DV] ── */
        <>
          <div className="flex items-center gap-2 w-full">
            {/* Main NIT Container with Icon inside */}
            <div className="relative flex-1 group">
              <Hash 
                size={16} 
                className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none 
                  ${dark ? 'text-gray-500 group-focus-within:text-white' : 'text-gray-400 group-focus-within:text-[#D32F2F]'}`}
              />
              <input
                ref={nitRef}
                type="text"
                inputMode="numeric"
                placeholder="Número de identificación"
                value={nitValue}
                onChange={handleNitChange}
                onKeyDown={handleNitKeyDown}
                required={required}
                className={`w-full h-10 pl-9 pr-3 border rounded-md focus:outline-none focus:ring-4 transition-all text-sm font-semibold
                  ${dark
                    ? 'bg-[#2A2A2A] border-transparent text-white placeholder-gray-500 focus:ring-white/10'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] hover:border-gray-400'
                  } ${error ? 'border-red-500 ring-red-500/10' : ''}`}
              />
            </div>

            <span className={`text-sm font-bold shrink-0 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>-</span>

            {/* DV — fixed narrow width */}
            <input
              ref={dvRef}
              type="text"
              inputMode="numeric"
              placeholder="DV"
              maxLength={1}
              value={dvValue}
              onChange={handleDvChange}
              required={required}
              className={`w-12 h-10 px-2 text-center border rounded-md focus:outline-none focus:ring-4 transition-all text-sm font-semibold
                ${dark
                  ? 'bg-[#2A2A2A] border-transparent text-white placeholder-gray-500 focus:ring-white/10'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] hover:border-gray-400'
                } ${error ? 'border-red-500 ring-red-500/10' : ''}`}
            />
          </div>
          {error && <span className="text-xs text-red-500 font-bold ml-1">{error}</span>}
        </>
      )}
    </div>
  );
};

export default NitInput;
