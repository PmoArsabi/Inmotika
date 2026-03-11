/**
 * TechnicianChip — displays a person's name in the most readable format that fits.
 *
 * Format priority (computed from string length):
 *   1. "Nombre Apellido"   — if combined ≤ 15 chars
 *   2. "Nombre A."         — first name + initial of first surname
 *   3. "N.A."              — both initials only
 *
 * Props:
 *   fullName  {string}  — e.g. "Carlos Pérez López"
 *   className {string}  — extra Tailwind classes for the wrapper span
 */
const formatName = (fullName = '') => {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] || '';
  const last  = parts[1] || '';

  const full = last ? `${first} ${last}` : first;

  if (full.length <= 15)            return full;                          // "Carlos Pérez"
  if (last && first.length <= 10)   return `${first} ${last[0]}.`;       // "Alejandro P."
  const fi = first[0]  ? `${first[0]}.`  : '';
  const li = last[0]   ? `${last[0]}.`   : '';
  return `${fi}${li}`;                                                    // "C.P."
};

const TechnicianChip = ({ fullName = '', className = '' }) => (
  <span
    className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full text-center leading-tight ${className}`}
  >
    {formatName(fullName)}
  </span>
);

/**
 * TechnicianChipList — renders up to `max` chips + "+N more" overflow pill.
 *
 * Props:
 *   names     {string[]}  — array of full names
 *   max       {number}    — max chips before "+N" (default 2)
 *   emptyText {string}    — fallback text when empty
 */
export const TechnicianChipList = ({ names = [], max = 2, emptyText = 'Sin asignar' }) => {
  if (!names.length) {
    return <span className="text-xs text-gray-400 italic">{emptyText}</span>;
  }

  const visible  = names.slice(0, max);
  const overflow = names.length - max;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((name, i) => (
        <TechnicianChip key={i} fullName={name} />
      ))}
      {overflow > 0 && (
        <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold bg-gray-200 text-gray-600 rounded-full">
          +{overflow}
        </span>
      )}
    </div>
  );
};

export default TechnicianChip;
