/**
 * Selector multi-opción con dropdown portal de checkboxes.
 * Mismo estilo visual que los filtros de FilterBar.
 *
 * @param {{
 *   label: string,
 *   options: Array<{value: string, label: string}>,
 *   value: string[],
 *   onChange: (next: string[]) => void,
 *   placeholder?: string,
 *   disabled?: boolean,
 *   error?: string|null,
 * }} props
 */
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, Check } from 'lucide-react';

const MultiSelectDropdown = ({ label, options = [], value = [], onChange, placeholder, disabled = false, error = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const selected = value.map(String);
  const count = selected.length;
  const allSelected = options.length > 0 && count === options.length;
  const someSelected = count > 0 && !allSelected;

  const displayText = count === 0
    ? (placeholder || 'Todos')
    : count === 1
      ? (options.find(o => String(o.value) === selected[0])?.label ?? '1 seleccionado')
      : `${count} seleccionados`;

  const toggle = () => {
    if (disabled) return;
    setIsOpen(prev => !prev);
  };

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (!triggerRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleSelect = (optValue) => {
    if (optValue === '__all__') {
      onChange(allSelected ? [] : options.map(o => String(o.value)));
    } else {
      const isChecked = selected.includes(String(optValue));
      onChange(isChecked
        ? selected.filter(v => v !== String(optValue))
        : [...selected, String(optValue)]
      );
    }
  };

  const clear = (e) => {
    e?.stopPropagation();
    onChange([]);
  };

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-2xs font-semibold uppercase tracking-wider text-gray-500 leading-none px-0.5">
          {label}
        </span>
      )}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={[
          'flex items-center justify-between gap-2 w-full h-10 px-3 border rounded-md text-sm transition-all select-none text-left',
          disabled
            ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400 bg-gray-50'
            : isOpen
              ? 'border-brand ring-2 ring-brand/10 bg-white text-gray-700'
              : count > 0
                ? 'border-brand bg-white text-gray-700'
                : 'border-gray-300 bg-white text-gray-400 hover:border-gray-400',
          error ? 'border-red-400' : '',
        ].join(' ')}
      >
        <span className="truncate flex-1 text-left text-sm">{displayText}</span>
        <div className="flex items-center gap-1 shrink-0">
          {count > 0 && (
            <span className="flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-brand text-white text-2xs font-bold leading-none">
              {count}
            </span>
          )}
          {count > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={clear}
              onKeyDown={e => e.key === 'Enter' && clear(e)}
              className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
              aria-label="Limpiar selección"
            >
              <X size={11} />
            </span>
          )}
          <ChevronDown size={14} className={`text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {error && (
        <p className="text-xs text-red-500 font-semibold px-0.5">{error}</p>
      )}

      {isOpen && !disabled && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: Math.max(dropPos.width, 180), zIndex: 9999 }}
          className="bg-white border border-gray-200 rounded-md shadow-xl overflow-hidden"
        >
          {options.length === 0 ? (
            <p className="px-3 py-4 text-xs text-gray-400 text-center">Sin opciones disponibles</p>
          ) : (
            <ul className="max-h-60 overflow-y-auto py-1">
              <li>
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => handleSelect('__all__')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors border-b border-gray-100
                    ${allSelected ? 'bg-red-50 text-brand' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <span className={`flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-colors
                    ${allSelected ? 'bg-brand border-brand' : 'border-gray-300 bg-white'}`}
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
              {options.map(opt => {
                const isChecked = selected.includes(String(opt.value));
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors
                        ${isChecked ? 'bg-red-50 text-brand' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <span className={`flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-colors
                        ${isChecked ? 'bg-brand border-brand' : 'border-gray-300 bg-white'}`}
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

export default MultiSelectDropdown;
