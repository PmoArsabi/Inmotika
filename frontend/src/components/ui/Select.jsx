import { ChevronRight } from 'lucide-react';

const Select = ({ label, icon: Icon, options, dark = false, ...props }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</label>}
    <div className="relative group">
      {Icon && <Icon size={18} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${dark ? 'text-gray-500 group-focus-within:text-white' : 'text-gray-400 group-focus-within:text-[#D32F2F]'}`} />}
      <select 
        className={`w-full ${Icon ? 'pl-10' : 'px-4'} py-3 border rounded-xl focus:outline-none focus:ring-4 transition-all text-sm font-bold appearance-none
          ${dark 
            ? 'bg-[#2A2A2A] border-transparent text-white focus:ring-white/10' 
            : 'bg-white border-gray-100 text-gray-900 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F]'
          }`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-white text-gray-900 font-medium">{opt.label}</option>
        ))}
      </select>
      <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
        <ChevronRight size={16} className="rotate-90" />
      </div>
    </div>
  </div>
);

export default Select;
