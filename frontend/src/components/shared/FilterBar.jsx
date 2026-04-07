import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, Check } from 'lucide-react';

/**
 * FilterBar — grid responsive de filtros (selectores y fechas) en un único contenedor.
 *
 * Cada filtro puede ser de tipo 'select' (default) o 'date'.
 *
 * @typedef {Object} FilterDef
 * @property {string}   key             - Clave única del filtro
 * @property {string}   label           - Etiqueta visible
 * @property {'select'|'date'} [type]   - Tipo de control (default: 'select')
 * @property {Array}    [options]       - Opciones para type='select': [{ value, label, parentValue? }]
 * @property {string}   [dependsOn]     - key del filtro padre (type='select')
 * @property {string}   [dependsOnLabel]- Nombre del padre para placeholder deshabilitado
 * @property {boolean}  [multi]         - Permite selección múltiple (type='select')
 * @property {string}   [linkedTo]      - Para type='date': key del otro extremo del rango ('desde'|'hasta')
 * @property {'desde'|'hasta'} [dateRole] - Rol del input de fecha en el rango
 *
 * @param {FilterDef[]}      filters
 * @param {Object}           values        - { [key]: string[] para select, string para date }
 * @param {Function}         onChange      - (newValues) => void
 * @param {React.ReactNode}  [leadingSlot] - Nodo que se renderiza como primera celda del grid (ej: buscador)
 */
const FilterBar = ({ filters = [], values = {}, onChange, leadingSlot }) => {
  const [openKey, setOpenKey] = useState(null);

  const handleSelectChange = (filterKey, optValue, allOpts) => {
    let next;
    if (optValue === '__all__') {
      const current = values[filterKey] || [];
      next = current.length === allOpts.length ? [] : allOpts.map(o => String(o.value));
    } else {
      const current = values[filterKey] || [];
      const isSelected = current.includes(String(optValue));
      next = isSelected
        ? current.filter(v => v !== String(optValue))
        : [...current, String(optValue)];
    }
    const newVals = { ...values, [filterKey]: next };
    filters.forEach(f => {
      if (f.dependsOn === filterKey) newVals[f.key] = [];
    });
    onChange(newVals);
  };

  const clearFilter = (filterKey, e) => {
    e?.stopPropagation();
    const newVals = { ...values, [filterKey]: [] };
    filters.forEach(f => {
      if (f.dependsOn === filterKey) newVals[f.key] = [];
    });
    onChange(newVals);
  };

  const handleDateChange = (filterKey, e) => {
    onChange({ ...values, [filterKey]: e.target.value });
  };

  return (
    <div className="grid gap-x-2 gap-y-3 items-end" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
      {leadingSlot}
      {filters.map(f =>
        f.type === 'date' ? (
          <FilterDateInput
            key={f.key}
            filter={f}
            values={values}
            onChange={handleDateChange}
          />
        ) : (
          <FilterSelect
            key={f.key}
            filter={f}
            values={values}
            isOpen={openKey === f.key}
            onToggle={() => setOpenKey(prev => prev === f.key ? null : f.key)}
            onClose={() => setOpenKey(null)}
            onSelect={handleSelectChange}
            onClear={clearFilter}
          />
        )
      )}
    </div>
  );
};

// ─── FilterDateInput ───────────────────────────────────────────────────────────

/**
 * Input de fecha que participa en el grid del FilterBar.
 * Soporta constraint min/max cruzado con el campo linkedTo.
 */
const FilterDateInput = ({ filter, values, onChange }) => {
  const value = values[filter.key] || '';
  const linkedValue = filter.linkedTo ? (values[filter.linkedTo] || '') : '';
  const hasValue = !!value;

  const inputClass = [
    'w-full h-10 px-3 border rounded-md bg-white text-sm text-gray-600',
    'focus:outline-none transition-all cursor-pointer',
    hasValue
      ? 'border-[#D32F2F] ring-2 ring-[#D32F2F]/10'
      : 'border-gray-300 hover:border-gray-400 focus:border-[#D32F2F] focus:ring-2 focus:ring-[#D32F2F]/10',
  ].join(' ');

  return (
    <div className="flex flex-col gap-0.5 min-w-35">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 leading-none px-0.5">
        {filter.label}
      </span>
      <input
        type="date"
        value={value}
        max={filter.dateRole === 'desde' && linkedValue ? linkedValue : undefined}
        min={filter.dateRole === 'hasta' && linkedValue ? linkedValue : undefined}
        onChange={e => onChange(filter.key, e)}
        aria-label={filter.label}
        className={inputClass}
      />
    </div>
  );
};

// ─── FilterSelect ──────────────────────────────────────────────────────────────

/**
 * Select con label encima y dropdown portal de checkboxes.
 */
const FilterSelect = ({ filter, values, isOpen, onToggle, onClose, onSelect, onClear }) => {
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const isDisabled = !!(filter.dependsOn && (values[filter.dependsOn] || []).length === 0);

  let opts = filter.options || [];
  if (filter.dependsOn && (values[filter.dependsOn] || []).length > 0) {
    const parentVals = (values[filter.dependsOn] || []).map(String);
    opts = opts.filter(o => parentVals.includes(String(o.parentValue)));
  }

  const selected = values[filter.key] || [];
  const count = selected.length;
  const allSelected = opts.length > 0 && count === opts.length;
  const someSelected = count > 0 && !allSelected;

  const displayText = count === 0
    ? (isDisabled ? `Sel. ${filter.dependsOnLabel || 'primero'}...` : 'Todos')
    : count === 1
      ? (opts.find(o => String(o.value) === selected[0])?.label ?? '1 seleccionado')
      : `${count} seleccionados`;

  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      const inTrigger = triggerRef.current?.contains(e.target);
      const inDropdown = dropdownRef.current?.contains(e.target);
      if (!inTrigger && !inDropdown) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  return (
    <div className="flex flex-col gap-0.5 min-w-35">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 leading-none px-0.5">
        {filter.label}
      </span>

      <button
        ref={triggerRef}
        type="button"
        disabled={isDisabled}
        onClick={onToggle}
        className={[
          'flex items-center justify-between gap-2 w-full h-10 px-3 border rounded-md text-sm transition-all select-none text-left',
          isDisabled
            ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400 bg-gray-50'
            : isOpen
              ? 'border-[#D32F2F] ring-2 ring-[#D32F2F]/10 bg-white text-gray-700'
              : count > 0
                ? 'border-[#D32F2F] bg-white text-gray-700'
                : 'border-gray-300 bg-white text-gray-400 hover:border-gray-400',
        ].join(' ')}
      >
        <span className="truncate flex-1 text-left text-sm">{displayText}</span>
        <div className="flex items-center gap-1 shrink-0">
          {count > 0 && (
            <span className="flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-[#D32F2F] text-white text-[10px] font-bold leading-none">
              {count}
            </span>
          )}
          {count > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={e => onClear(filter.key, e)}
              onKeyDown={e => e.key === 'Enter' && onClear(filter.key, e)}
              className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
              aria-label={`Limpiar ${filter.label}`}
            >
              <X size={11} />
            </span>
          )}
          <ChevronDown size={14} className={`text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && !isDisabled && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: Math.max(dropPos.width, 180), zIndex: 9999 }}
          className="bg-white border border-gray-200 rounded-md shadow-xl overflow-hidden"
        >
          {opts.length === 0 ? (
            <p className="px-3 py-4 text-xs text-gray-400 text-center">Sin opciones disponibles</p>
          ) : (
            <ul className="max-h-60 overflow-y-auto py-1">
              <li>
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => onSelect(filter.key, '__all__', opts)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors border-b border-gray-100
                    ${allSelected ? 'bg-red-50 text-[#D32F2F]' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <span className={`flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-colors
                    ${allSelected ? 'bg-[#D32F2F] border-[#D32F2F]' : 'border-gray-300 bg-white'}`}
                  >
                    {allSelected
                      ? <Check size={10} className="text-white" strokeWidth={3} />
                      : someSelected
                        ? <span className="w-2 h-0.5 bg-gray-400 rounded-full block" />
                        : null
                    }
                  </span>
                  <span className="font-semibold text-gray-700">Seleccionar todo</span>
                </button>
              </li>
              {opts.map(opt => {
                const isChecked = selected.includes(String(opt.value));
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => onSelect(filter.key, opt.value, opts)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors
                        ${isChecked ? 'bg-red-50 text-[#D32F2F]' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <span className={`flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-colors
                        ${isChecked ? 'bg-[#D32F2F] border-[#D32F2F]' : 'border-gray-300 bg-white'}`}
                      >
                        {isChecked && <Check size={10} className="text-white" strokeWidth={3} />}
                      </span>
                      <span className="truncate">{opt.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default FilterBar;
