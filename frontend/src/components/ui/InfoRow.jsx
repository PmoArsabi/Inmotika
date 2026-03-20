import React from 'react';

/**
 * Fila de información con icono, label y valor.
 * @param {{ icon: React.ElementType, label: string, value: React.ReactNode }} props
 */
// eslint-disable-next-line no-unused-vars
const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2">
    <Icon size={15} className="text-gray-400 mt-0.5 shrink-0" />
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value || '—'}</p>
    </div>
  </div>
);

export default InfoRow;
