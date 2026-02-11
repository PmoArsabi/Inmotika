const DataField = ({ label, value, icon: Icon, color = "text-gray-800" }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
      {Icon && <Icon size={10} className="text-[#D32F2F]" />} {label}
    </span>
    <p className={`text-xs font-bold ${color} break-words`}>{value || 'N/A'}</p>
  </div>
);

export default DataField;
