import React from 'react';
import { Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { Label } from './Typography';

const DAYS = [
  { key: 'mon', label: 'Lun', full: 'Lunes' },
  { key: 'tue', label: 'Mar', full: 'Martes' },
  { key: 'wed', label: 'Mié', full: 'Miércoles' },
  { key: 'thu', label: 'Jue', full: 'Jueves' },
  { key: 'fri', label: 'Vie', full: 'Viernes' },
  { key: 'sat', label: 'Sáb', full: 'Sábado' },
  { key: 'sun', label: 'Dom', full: 'Domingo' }
];

const DEFAULT_START = '08:00';
const DEFAULT_END = '17:00';

const SchedulePicker = ({ label, value, onChange, viewMode = false, dark = false, className = '' }) => {
  const schedule = value || DAYS.reduce((acc, day) => {
    acc[day.key] = { isOpen: false, start: DEFAULT_START, end: DEFAULT_END };
    return acc;
  }, {});

  const handleDayToggle = (dayKey) => {
    const d = schedule[dayKey] || { isOpen: false, start: DEFAULT_START, end: DEFAULT_END };
    const next = { ...schedule, [dayKey]: { ...d, isOpen: !d.isOpen } };
    onChange(next);
  };

  const handleTimeChange = (dayKey, field, time) => {
    const next = { ...schedule, [dayKey]: { ...schedule[dayKey], [field]: time } };
    onChange(next);
  };

  if (viewMode) {
    const openDays = DAYS.filter(day => schedule[day.key]?.isOpen);
    
    return (
      <div className={`flex flex-col gap-3 w-full ${className}`}>
        {label && <Label className="ml-1">{label}</Label>}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 border border-gray-100">
          {openDays.length > 0 ? (
            openDays.map((day) => {
              const d = schedule[day.key];
              return (
                <div key={day.key} className="flex justify-between items-center group">
                  <span className="text-sm font-bold text-gray-900">{day.full}:</span>
                  <span className="text-sm font-semibold text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                    {d.start} - {d.end}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-2">
              <span className="text-sm text-gray-400 italic">No se han configurado horarios de atención</span>
            </div>
          )}
          
          {openDays.length > 0 && (
            <div className="pt-2 mt-2 border-t border-gray-200 flex justify-center">
              <div className="inline-flex items-center gap-1.5 text-green-700 font-bold text-[10px] uppercase tracking-wider">
                <CheckCircle2 size={12} />
                Disponibilidad Activa
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const selectedCount = DAYS.filter(d => schedule[d.key]?.isOpen).length;

  return (
    <div className={`flex flex-col gap-5 w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between ml-1">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <Label>{label}</Label>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-full">
            {selectedCount} Días
          </span>
        </div>
      )}
      
      {/* Step 1: Centered Day Selection Buttons */}
      <div className="flex flex-wrap gap-2.5 justify-center px-2">
        {DAYS.map((day) => {
          const isActive = schedule[day.key]?.isOpen;
          return (
            <button
              key={day.key}
              type="button"
              onClick={() => handleDayToggle(day.key)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-extrabold transition-all border-2
                ${isActive 
                  ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-[0_4px_12px_rgba(211,47,47,0.3)] scale-105' 
                  : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200 hover:text-gray-600 hover:bg-gray-50'
                }`}
            >
              {day.label}
            </button>
          );
        })}
      </div>

      {/* Step 2: Ultra-Compact Two-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
        {DAYS.map((day) => {
          const d = schedule[day.key];
          if (!d?.isOpen) return null;

          return (
            <div key={day.key} className="flex flex-row flex-wrap items-center justify-between gap-x-2 gap-y-3 p-3.5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden">
              {/* Day Label - Standardized 84px space for maximum horizontal compaction */}
              <div className="flex items-center gap-2.5 shrink-0 w-[84px]">
                <div className="w-2 h-2 rounded-full bg-green-500 group-hover:animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <span className="text-[14.5px] font-bold text-gray-900 tracking-tight truncate">
                  {day.full}
                </span>
              </div>

              {/* Ultra-Compact Hours - Flexible wrapping prevents clipping when space narrows */}
              <div className="flex flex-row flex-wrap items-center justify-center gap-1.5 grow sm:grow-0 ml-auto md:ml-0">
                <div className="relative">
                  <input
                    type="time"
                    value={d.start}
                    onChange={(e) => handleTimeChange(day.key, 'start', e.target.value)}
                    className="h-10 w-[120px] px-2 bg-gray-50/50 border border-gray-200 rounded-xl text-[13.5px] font-bold focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/10 focus:border-[#D32F2F] transition-all"
                  />
                </div>
                
                <span className="text-gray-300 font-bold select-none px-0.5 text-center leading-none">-</span>

                <div className="relative">
                  <input
                    type="time"
                    value={d.end}
                    onChange={(e) => handleTimeChange(day.key, 'end', e.target.value)}
                    className="h-10 w-[120px] px-2 bg-gray-50/50 border border-gray-200 rounded-xl text-[13.5px] font-bold focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/10 focus:border-[#D32F2F] transition-all"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedCount === 0 && (
        <div className="p-6 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-center gap-2 bg-gray-50/20">
          <Clock size={24} className="text-gray-200" />
          <p className="text-xs font-bold text-gray-400">Sin días seleccionados</p>
        </div>
      )}
    </div>
  );
};

export default SchedulePicker;
