const Input = ({ label, icon: Icon, error, dark = false, ...props }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</label>}
    <div className="relative group">
      {Icon && <Icon size={18} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${dark ? 'text-gray-500 group-focus-within:text-white' : 'text-gray-400 group-focus-within:text-[#D32F2F]'}`} />}
      <input 
        className={`w-full ${Icon ? 'pl-10' : 'px-4'} py-3 border rounded-xl focus:outline-none focus:ring-4 transition-all text-sm font-semibold 
          ${dark 
            ? 'bg-[#2A2A2A] border-transparent text-white placeholder-gray-500 focus:ring-white/10' 
            : 'bg-white border-gray-100 text-gray-900 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F]'
          } ${error ? 'border-red-500 ring-red-500/10' : ''}`}
        {...props}
      />
    </div>
    {error && <span className="text-xs text-red-500 font-bold ml-1">{error}</span>}
  </div>
);

export default Input;
