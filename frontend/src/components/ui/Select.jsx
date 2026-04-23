import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { Label } from './Typography';

/**
 * Select — selección única. Paridad visual con Input:
 * h-11 · rounded-xl · bg-gray-50 · focus glow difuso.
 */
const Select = ({
  label, icon: Icon, options = [], value, onChange,
  error, required, dark = false, viewMode = false,
  className = '', placeholder, disabled = false, ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const triggerRef  = useRef(null);
  const dropdownRef = useRef(null);
  const listRef     = useRef(null);

  const selectedOption = options.find(o => String(o.value) === String(value ?? '')) ?? null;
  const displayText    = selectedOption?.label ?? placeholder ?? '';
  const isEmpty        = !selectedOption || selectedOption.value === '';

  const toggle = () => {
    if (disabled) return;
    if (!isOpen) {
      const idx = options.findIndex(o => String(o.value) === String(value ?? ''));
      setFocusedIndex(idx >= 0 ? idx : 0);
    }
    setIsOpen(p => !p);
  };

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect       = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropHeight = Math.min(options.length * 38 + 12, 260);
    const top        = spaceBelow < dropHeight && rect.top > dropHeight
      ? rect.top - dropHeight - 4
      : rect.bottom + 4;
    setDropPos({ top, left: rect.left, width: rect.width });
  }, [isOpen, options.length]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => {
      if (!triggerRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || focusedIndex < 0 || !listRef.current) return;
    listRef.current.children[focusedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex, isOpen]);

  const handleKeyDown = (e) => {
    if (disabled) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) { setFocusedIndex(0); setIsOpen(true); }
        else setFocusedIndex(p => Math.min(p + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) setFocusedIndex(p => Math.max(p - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0 && options[focusedIndex]) handleSelect(options[focusedIndex].value);
        else setIsOpen(true);
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default: break;
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
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
          </Label>
        )}
        <div className="relative">
          {Icon && <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted" />}
          <div className={`w-full h-11 ${Icon ? 'pl-10' : 'px-1'} text-sm font-medium text-ink flex items-center`}>
            {selectedOption?.label || value || <span className="text-ink-muted italic font-normal">No especificado</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <Label className={dark ? 'text-gray-400 ml-1' : 'ml-1'}>
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
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
            'flex items-center gap-2 w-full h-11 rounded-xl text-sm font-medium',
            'transition-all duration-(--transition-smooth) select-none text-left',
            Icon ? 'pl-10' : 'pl-3.5',
            'pr-3',
            disabled
              ? 'opacity-50 cursor-not-allowed bg-gray-100 text-ink-muted border border-transparent'
              : isOpen
                ? dark
                  ? 'bg-white/10 border border-white/20 text-white ring-2 ring-white/10'
                  : 'bg-white border border-brand/40 ring-4 ring-brand/10 shadow-[0_0_0_4px_rgb(211_47_47/0.08)] text-ink'
                : dark
                  ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  : ['bg-gray-50 border border-transparent', isEmpty ? 'text-ink-muted' : 'text-ink', 'hover:bg-white hover:border-gray-200/80'].join(' '),
            error ? 'border-red-400 bg-red-50/50' : '',
          ].join(' ')}
          {...props}
        >
          {Icon && (
            <Icon
              size={15}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                dark ? 'text-gray-500' : isOpen ? 'text-brand' : 'text-ink-muted'
              }`}
            />
          )}
          <span className="truncate flex-1">{displayText}</span>
          <ChevronDown
            size={14}
            className={`shrink-0 transition-transform duration-(--transition-fast) ${isOpen ? 'rotate-180 text-brand' : 'text-ink-muted'}`}
          />
        </button>
      </div>
      {error && <span className="text-xs text-red-500 font-medium ml-1">{error}</span>}

      {isOpen && !disabled && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: Math.max(dropPos.width, 180), zIndex: 9999 }}
          className="bg-white/95 backdrop-blur-xl border border-gray-100/60 rounded-2xl shadow-(--shadow-elevated) overflow-hidden"
        >
          {options.length === 0 ? (
            <p className="px-4 py-4 text-xs text-ink-muted text-center">Sin opciones disponibles</p>
          ) : (
            <ul ref={listRef} className="max-h-64 overflow-y-auto py-1.5 px-1.5">
              {options.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value ?? '');
                const isFocused  = idx === focusedIndex;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => handleSelect(opt.value)}
                      onMouseEnter={() => setFocusedIndex(idx)}
                      className={[
                        'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-lg transition-colors',
                        isSelected ? 'bg-brand-surface text-brand font-semibold'
                          : isFocused ? 'bg-gray-100 text-ink'
                          : 'text-ink-secondary hover:bg-gray-50',
                      ].join(' ')}
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
