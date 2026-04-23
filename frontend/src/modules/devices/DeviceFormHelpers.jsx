/**
 * Componentes de presentación reutilizables para DeviceForm.
 * Todos son stateless — solo reciben props y renderizan.
 */
import React from 'react';
import { TextSmall } from '../../components/ui/Typography';

/**
 * Cabecera de sección con icono y label en mayúsculas.
 * @param {{ icon: React.ElementType, label: string }} props
 */
export const SectionHeader = ({ icon: SectionIcon, label }) => (
  <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
    <SectionIcon size={15} className="text-gray-500" />
    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{label}</span>
  </div>
);

/**
 * Item compacto de resumen en la columna lateral (icono + label + value).
 * @param {{ icon: React.ElementType, label: string, value: string }} props
 */
export const CompactSummaryItem = ({ icon: ItemIcon, label, value }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-1.5 text-gray-400">
      <ItemIcon size={11} className="shrink-0" />
      <span className="text-2xs font-bold uppercase tracking-wider">{label}</span>
    </div>
    <span className="text-xs font-semibold text-gray-700 truncate leading-none">
      {value || '—'}
    </span>
  </div>
);

/**
 * Fila de resumen con icono, label, value principal y sub-texto opcional.
 * @param {{ icon: React.ElementType, label: string, value: string, sub?: string }} props
 */
export const SummaryRow = ({ icon: RowIcon, label, value, sub }) => (
  <div className="flex items-start gap-3">
    <RowIcon size={16} className="text-gray-400 mt-0.5 shrink-0" />
    <div className="min-w-0">
      <TextSmall className="text-gray-500">{label}</TextSmall>
      <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  </div>
);
