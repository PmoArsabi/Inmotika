import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Label } from './Typography';

const Select = ({ label, icon: Icon, options = [], value, onChange, error, required, dark = false, viewMode = false, className = '', ...props }) => (
  <div className={`flex flex-col gap-1.5 w-full ${className}`}>
    {label && (
      <Label className={dark ? 'text-gray-400 ml-1' : 'ml-1'}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
    )}
    <div className="relative group">
      {Icon && (
        <Icon
          size={16}
          className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none z-10 ${
            dark ? 'text-gray-500 group-focus-within:text-white' : 'text-gray-400 group-focus-within:text-[#D32F2F]'
          }`}
        />
      )}
      {viewMode ? (
        <div className={`w-full h-10 ${Icon ? 'pl-9' : 'px-3'} text-sm font-semibold text-gray-900 flex items-center`}>
          {options.find(o => o.value === value)?.label || value || <span className="text-gray-400 italic">No especificado</span>}
        </div>
      ) : (
        <>
          <select
            className={`w-full h-10 ${Icon ? 'pl-9' : 'px-3'} pr-8 border rounded-md focus:outline-none focus:ring-4 transition-all text-sm font-semibold appearance-none cursor-pointer
              ${dark
                ? 'bg-[#2A2A2A] border-transparent text-white focus:ring-white/10'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] hover:border-gray-400'
              }`}
            value={value}
            onChange={onChange}
            {...props}
          >
            {options.map((opt, i) => (
              <option key={i} value={opt.value} className={dark ? 'bg-[#2A2A2A] text-white' : 'text-gray-900'}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={15}
            className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
              dark ? 'text-gray-500 group-hover:text-white' : 'text-gray-400 group-hover:text-[#D32F2F]'
            }`}
          />
        </>
      )}
    </div>
    {error && <span className="text-xs text-red-500 font-bold ml-1">{error}</span>}
  </div>
);

export default Select;
