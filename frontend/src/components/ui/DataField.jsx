const DataField = ({ label, value, icon: Icon, color = "text-gray-800" }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
      {Icon && <Icon size={12} className="text-[#D32F2F]" />} {label}
    </span>
    <p className={`text-sm font-bold ${color} break-words`}>{value || 'N/A'}</p>
  </div>
);

export default DataField;
