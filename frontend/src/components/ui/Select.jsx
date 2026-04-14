import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { Label } from './Typography';

/**
 * Select personalizado de selección única.
 * Visualmente idéntico a MultiSelectDropdown pero sin checkboxes ni "Seleccionar todo".
 * API compatible con el <select> nativo anterior:
 *   value      — string con el value de la opción seleccionada
 *   onChange   — (e) => void  donde e.target.value es el nuevo valor
 *   options    — Array<{ value: string, label: string }>
 */
const Select = ({
  label,
  icon: Icon,
  options = [],
  value,
  onChange,
  error,
  required,
  dark = false,
  viewMode = false,
  className = '',
  placeholder,
  disabled = false,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const listRef = useRef(null);

  const selectedOption = options.find(o => String(o.value) === String(value ?? '')) ?? null;
  const displayText = selectedOption?.label ?? placeholder ?? '';
  const isEmpty = !selectedOption || selectedOption.value === '';

  const toggle = () => {
    if (disabled) return;
    if (!isOpen) {
      const currentIndex = options.findIndex(o => String(o.value) === String(value ?? ''));
      setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
    setIsOpen(prev => !prev);
  };

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropHeight = Math.min(options.length * 36 + 8, 240);
    const top = spaceBelow < dropHeight && rect.top > dropHeight
      ? rect.top - dropHeight - 4
      : rect.bottom + 4;
    setDropPos({ top, left: rect.left, width: rect.width });
  }, [isOpen, options.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (
        !triggerRef.current?.contains(e.target) &&
        !dropdownRef.current?.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Scroll automático al ítem enfocado
  useEffect(() => {
    if (!isOpen || focusedIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[focusedIndex];
    item?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex, isOpen]);

  const handleKeyDown = (e) => {
    if (disabled) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setFocusedIndex(0);
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => Math.min(prev + 1, options.length - 1));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0 && options[focusedIndex]) {
          handleSelect(options[focusedIndex].value);
        } else {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleSelect = (optValue) => {
    onChange?.({ target: { value: optValue } });
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  if (viewMode) {
    return (
      <div className={`flex flex-col gap-1.5 w-full ${className}`}>
        {label && (
          <Label className="ml-1">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </Label>
        )}
        <div className="relative">
          {Icon && (
            <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          )}
          <div className={`w-full h-10 ${Icon ? 'pl-9' : 'px-1'} text-sm font-semibold text-gray-900 flex items-center`}>
            {selectedOption?.label || value || <span className="text-gray-400 italic">No especificado</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <Label className={dark ? 'text-gray-400 ml-1' : 'ml-1'}>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
      )}

      <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className={[
          'flex items-center gap-2 w-full h-10 border rounded-md text-sm transition-all select-none text-left',
          Icon ? 'pl-9' : 'pl-3',
          'pr-3',
          disabled
            ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
            : isOpen
              ? `border-[#D32F2F] ring-4 ring-[#D32F2F]/5 ${dark ? 'bg-[#2A2A2A] text-white' : 'bg-white text-gray-700'}`
              : `${dark ? 'bg-[#2A2A2A] border-transparent text-white hover:border-white/10' : `bg-white ${isEmpty ? 'text-gray-400' : 'text-gray-900 font-semibold'} border-gray-300 hover:border-gray-400`}`,
          error ? 'border-red-400' : '',
        ].join(' ')}
        {...props}
      >
        {Icon && (
          <Icon
            size={16}
            className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
              dark ? 'text-gray-500' : isOpen ? 'text-[#D32F2F]' : 'text-gray-400'
            }`}
          />
        )}
        <span className="truncate flex-1">{displayText}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180 text-[#D32F2F]' : 'text-gray-400'}`}
        />
      </button>
      </div>

      {error && <span className="text-xs text-red-500 font-bold ml-1">{error}</span>}

      {isOpen && !disabled && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropPos.top,
            left: dropPos.left,
            width: Math.max(dropPos.width, 180),
            zIndex: 9999,
          }}
          className="bg-white border border-gray-200 rounded-md shadow-xl overflow-hidden"
        >
          {options.length === 0 ? (
            <p className="px-3 py-4 text-xs text-gray-400 text-center">Sin opciones disponibles</p>
          ) : (
            <ul ref={listRef} className="max-h-60 overflow-y-auto py-1">
              {options.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value ?? '');
                const isFocused = idx === focusedIndex;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => handleSelect(opt.value)}
                      onMouseEnter={() => setFocusedIndex(idx)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors
                        ${isSelected
                          ? 'bg-red-50 text-[#D32F2F] font-semibold'
                          : isFocused
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
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

export default Select;
