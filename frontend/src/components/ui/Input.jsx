import React from 'react';
import { Label } from './Typography';

const Input = ({ label, icon: Icon, error, dark = false, viewMode = false, className = "", ...props }) => (
  <div className={`flex flex-col gap-1.5 w-full ${className}`}>
    {label && <Label className={dark ? 'text-gray-400 ml-1' : 'ml-1'}>{label}</Label>}
    <div className="relative group">
      {Icon && <Icon size={18} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${dark ? 'text-gray-500 group-focus-within:text-white' : 'text-gray-400 group-focus-within:text-[#D32F2F]'}`} />}
      {viewMode ? (
        <div className={`w-full ${Icon ? 'pl-9' : 'px-3'} py-2 text-sm font-semibold text-gray-900 flex items-center min-h-[38px]`}>
          {props.value || props.defaultValue || <span className="text-gray-300 italic">No especificado</span>}
        </div>
      ) : (
        <input 
          className={`w-full ${Icon ? 'pl-9' : 'px-3'} py-2 border rounded-md focus:outline-none focus:ring-4 transition-all text-sm font-semibold 
            ${dark 
              ? 'bg-[#2A2A2A] border-transparent text-white placeholder-gray-500 focus:ring-white/10' 
              : 'bg-white border-gray-100 text-gray-900 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F]'
            } ${error ? 'border-red-500 ring-red-500/10' : ''}`}
          {...props}
        />
      )}
    </div>
    {error && <span className="text-xs text-red-500 font-bold ml-1">{error}</span>}
  </div>
);

export default Input;
