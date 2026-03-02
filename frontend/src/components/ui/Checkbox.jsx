import React from 'react';
import { Label } from './Typography';

const Checkbox = ({ label, checked, onChange, viewMode = false, className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && <Label className="ml-1">{label}</Label>}
      <div className="flex items-center gap-2 h-[38px]">
        {viewMode ? (
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${checked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {checked ? 'Sí' : 'No'}
          </div>
        ) : (
          <>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#D32F2F] focus:ring-[#D32F2F] focus:ring-2 cursor-pointer"
              {...props}
            />
            {label && (
              <span className={`text-sm font-semibold ${checked ? 'text-[#D32F2F]' : 'text-gray-400'}`}>
                {checked ? 'Sí' : 'No'}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Checkbox;
