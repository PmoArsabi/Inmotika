import React from 'react';
import { Label } from './Typography';

const Switch = ({ label, checked, onChange, viewMode = false, className = '', ...props }) => {
  const statusLabel = checked ? 'Activo' : 'Inactivo';

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && <Label className="ml-1">{label}</Label>}
      <div className="flex items-center gap-2 h-[38px]">
        {viewMode ? (
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${checked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {statusLabel}
          </div>
        ) : (
          <>
            <button
              type="button"
              role="switch"
              aria-checked={checked}
              onClick={() => onChange(!checked)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D32F2F] focus:ring-offset-2 ${checked ? 'bg-[#D32F2F]' : 'bg-gray-200'}`}
              {...props}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
            <span className={`text-sm font-semibold ${checked ? 'text-[#D32F2F]' : 'text-gray-400'}`}>
              {statusLabel}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default Switch;
