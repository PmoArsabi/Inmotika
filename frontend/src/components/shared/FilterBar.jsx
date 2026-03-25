import React, { useMemo } from 'react';
import { X, Search } from 'lucide-react';
import SearchableSelect from '../ui/SearchableSelect';
import { TextTiny } from '../ui/Typography';

/**
 * Barra de filtros multi-select reutilizable.
 *
 * Props:
 * @param {{ key, label, options, dependsOn?, dependsOnLabel?, multi? }[]} filters
 * @param {Object}   values           - { [key]: string[] }
 * @param {Function} onChange
 * @param {string}   [searchPlaceholder] - si se pasa, muestra buscador propio (modo standalone)
 * @param {string}   [searchValue]
 * @param {Function} [onSearchChange]
 * @param {number}   [totalItems]
 * @param {number}   [filteredCount]
 * @param {'standalone'|'inline'} [mode='standalone']
 *   - 'standalone': renderiza todo (chips + buscador + selects) en su propio layout
 *   - 'inline': renderiza chips como w-full (wrappean a nueva línea en el flex del padre)
 *               y selects como items directos del flex padre (display:contents en wrapper)
 */
const FilterBar = ({
  filters = [],
  values = {},
  onChange,
  searchPlaceholder,
  searchValue = '',
  onSearchChange,
  totalItems,
  filteredCount,
  mode = 'standalone',
}) => {
  const activeChips = useMemo(() => {
    const chips = [];
    filters.forEach(f => {
      (values[f.key] || []).forEach(v => {
        const opt = f.options?.find(o => String(o.value) === String(v));
        chips.push({ filterKey: f.key, value: v, label: opt?.label || v });
      });
    });
    return chips;
  }, [filters, values]);

  const hasActive = activeChips.length > 0 || (searchValue || '').length > 0;

  const removeChip = (filterKey, value) => {
    const newVals = { ...values, [filterKey]: (values[filterKey] || []).filter(v => v !== value) };
    filters.forEach(f => {
      if (f.dependsOn === filterKey) newVals[f.key] = [];
    });
    onChange(newVals);
  };

  const clearAll = () => {
    const reset = {};
    filters.forEach(f => { reset[f.key] = []; });
    onChange(reset);
    onSearchChange?.('');
  };

  const handleFilterChange = (filterKey, opts) => {
    const selected = (opts || []).map(o => String(o.value));
    const newVals = { ...values, [filterKey]: selected };
    filters.forEach(f => {
      if (f.dependsOn === filterKey) newVals[f.key] = [];
    });
    onChange(newVals);
  };

  /** Chips row — siempre w-full para que wrappee a nueva línea */
  const ChipsRow = hasActive ? (
    <div className="w-full flex flex-wrap gap-1.5">
      {activeChips.map(({ filterKey, value, label }) => (
        <span
          key={`${filterKey}-${value}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-200 text-red-700 text-[11px] font-semibold rounded-full"
        >
          {label}
          <button type="button" onClick={() => removeChip(filterKey, value)} className="hover:text-red-900 transition-colors">
            <X size={10} />
          </button>
        </span>
      ))}
      {searchValue && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 border border-gray-300 text-gray-600 text-[11px] font-semibold rounded-full">
          "{searchValue}"
          <button type="button" onClick={() => onSearchChange?.('')} className="hover:text-gray-900 transition-colors">
            <X size={10} />
          </button>
        </span>
      )}
      <button
        type="button"
        onClick={clearAll}
        className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full border border-gray-200 transition-colors"
      >
        <X size={10} /> Limpiar todo
      </button>
    </div>
  ) : null;

  /** Contador — w-full */
  const Counter = hasActive && totalItems !== undefined ? (
    <div className="w-full">
      <TextTiny className="text-gray-400">
        Mostrando {filteredCount ?? '?'} de {totalItems} registros
      </TextTiny>
    </div>
  ) : null;

  /** Selectores individuales — mismas clases que el buscador del padre */
  const Selects = filters.map(f => {
    const isDisabled = f.dependsOn && (values[f.dependsOn] || []).length === 0;

    let opts = f.options || [];
    if (f.dependsOn && (values[f.dependsOn] || []).length > 0) {
      const parentVals = (values[f.dependsOn] || []).map(String);
      opts = opts.filter(o => parentVals.includes(String(o.parentValue)));
    }

    const selected = (values[f.key] || []).map(v => {
      const opt = f.options?.find(o => String(o.value) === String(v));
      return { value: v, label: opt?.label || v };
    });

    return (
      <div key={f.key} className="min-w-44 flex-1">
        <SearchableSelect
          placeholder={isDisabled ? `Seleccione ${f.dependsOnLabel || 'primero'}...` : `${f.label}...`}
          options={opts}
          value={selected}
          onChange={opts => handleFilterChange(f.key, opts)}
          isMulti={f.multi !== false}
          isDisabled={!!isDisabled}
        />
      </div>
    );
  });

  // ── Modo inline: los selects son items del flex del padre (display:contents quita el wrapper)
  // Los chips y contador van como w-full y wrappean solos en el flex del padre.
  if (mode === 'inline') {
    return (
      <>
        {ChipsRow}
        {Selects}
        {Counter}
      </>
    );
  }

  // ── Modo standalone: layout completo propio
  return (
    <div className="w-full space-y-2">
      {ChipsRow}
      <div className="flex flex-wrap gap-2">
        {searchPlaceholder !== undefined && (
          <div className="relative min-w-44 flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={e => onSearchChange?.(e.target.value)}
              className="w-full h-[38px] pl-9 pr-3 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] transition-all"
            />
          </div>
        )}
        {Selects}
      </div>
      {Counter}
    </div>
  );
};

export default FilterBar;
