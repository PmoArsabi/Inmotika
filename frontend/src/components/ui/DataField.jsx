/**
 * DataField — unified field display primitive.
 *
 * Replaces both the original DataField and InfoField components.
 * InfoField.jsx now re-exports this component for backwards compatibility.
 *
 * @param {object}  props
 * @param {string}  props.label      — Field label, rendered uppercase in muted style.
 * @param {*}       props.value      — Field value (string, number, ReactNode).
 * @param {React.ElementType} [props.icon]  — Optional Lucide icon component.
 * @param {string}  [props.color]    — Tailwind text-color class for the value. Default "text-gray-800".
 * @param {string}  [props.iconColor] — Tailwind text-color class for the icon. Default "text-[#D32F2F]".
 * @param {string}  [props.className] — Extra classes applied to the root div.
 * @param {boolean} [props.truncate] — When true, clamps the value to one line with ellipsis.
 * @param {string}  [props.fallback] — Text shown when value is falsy. Default "—".
 */
const DataField = ({
  label,
  value,
  icon: Icon,
  color = "text-gray-800",
  iconColor = "text-[#D32F2F]",
  className = "",
  truncate = false,
  fallback = "—",
}) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
      {Icon && <Icon size={10} className={iconColor} />}
      {label}
    </span>
    <p className={`text-xs font-bold ${color} break-words${truncate ? " truncate" : ""}`}>
      {value || fallback}
    </p>
  </div>
);

export default DataField;
