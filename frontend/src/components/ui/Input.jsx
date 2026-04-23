import React from 'react';
import { Label } from './Typography';

/**
 * Input — campo de texto del Design System Inmotika.
 * h-11 · rounded-xl · bg-gray-50 → focus glow difuso rojo.
 *
 * @param {object}   props
 * @param {string}   [props.label]
 * @param {React.ElementType} [props.icon]
 * @param {string}   [props.error]
 * @param {boolean}  [props.required]
 * @param {boolean}  [props.dark=false]
 * @param {boolean}  [props.viewMode=false]
 * @param {boolean}  [props.uppercase=false]
 * @param {string}   [props.className]
 * @param {Function} [props.onChange]
 */
const Input = ({
  label, icon: Icon, error, required,
  dark = false, viewMode = false, uppercase = false,
  className = '', onChange, ...props
}) => {
  const handleChange = (e) => {
    if (uppercase && e.target.value !== undefined) {
      const nativeInput = e.target;
      const start = nativeInput.selectionStart;
      const end   = nativeInput.selectionEnd;
      nativeInput.value = e.target.value.toUpperCase();
      try { nativeInput.setSelectionRange(start, end); } catch { /* ignore */ }
      e.target.value = nativeInput.value;
    }
    onChange?.(e);
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <Label className={dark ? 'text-gray-400 ml-1' : 'ml-1'}>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
      )}
      <div className="relative group">
        {Icon && (
          <Icon
            size={15}
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-(--transition-fast) pointer-events-none ${
              dark
                ? 'text-gray-500 group-focus-within:text-gray-300'
                : 'text-ink-muted group-focus-within:text-brand'
            }`}
          />
        )}
        {viewMode ? (
          <div className={`w-full h-11 ${Icon ? 'pl-10' : 'px-1'} text-sm font-medium text-ink flex items-center`}>
            {props.value || props.defaultValue || <span className="text-ink-muted italic font-normal">No especificado</span>}
          </div>
        ) : (
          <input
            style={uppercase ? { textTransform: 'uppercase' } : undefined}
            className={[
              'w-full h-11 pr-3 rounded-xl border text-sm font-medium',
              'transition-all duration-(--transition-smooth)',
              'focus:outline-none',
              Icon ? 'pl-10' : 'px-3.5',
              dark
                ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:bg-white/10 focus:border-white/20 focus:ring-2 focus:ring-white/10 backdrop-blur-sm'
                : [
                    'bg-gray-50 border-transparent text-ink',
                    'placeholder:text-ink-muted',
                    'hover:bg-white hover:border-gray-200/80',
                    'focus:bg-white focus:border-brand/40 focus:ring-4 focus:ring-brand/10',
                    'focus:shadow-[0_0_0_4px_rgb(211_47_47/0.08)]',
                    error ? 'border-red-400 bg-red-50/50 focus:border-red-400 focus:ring-red-400/10 focus:shadow-[0_0_0_4px_rgb(220_38_38/0.08)]' : '',
                  ].join(' '),
            ].join(' ')}
            onChange={handleChange}
            {...props}
          />
        )}
      </div>
      {error && <span className="text-xs text-red-500 font-medium ml-1">{error}</span>}
    </div>
  );
};

export default Input;
