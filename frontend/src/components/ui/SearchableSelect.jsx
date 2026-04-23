import React from 'react';
import Select from 'react-select';
import { Label } from './Typography';

const BORDER_FOCUS  = '#D32F2F';
const CONTROL_HEIGHT = 44;

const SearchableSelect = ({
  label,
  icon: Icon,
  action,
  options = [],
  value,
  onChange,
  dark = false,
  viewMode = false,
  className = '',
  placeholder = 'Seleccionar...',
  formatOptionLabel,
  formatSingleValue,
  isDisabled = false,
  required = false,
  error = null,
  isMulti = false,
  ...props
}) => {
  const customStyles = {
    control: (base, state) => ({
      ...base,
      height: isMulti ? 'auto' : CONTROL_HEIGHT,
      minHeight: CONTROL_HEIGHT,
      maxHeight: isMulti ? '120px' : CONTROL_HEIGHT,
      backgroundColor: dark ? 'rgb(255 255 255 / 0.05)' : (state.isFocused ? 'white' : '#F9FAFB'),
      borderColor: state.isFocused ? BORDER_FOCUS : 'transparent',
      borderRadius: '0.75rem',
      paddingLeft: Icon ? '2.25rem' : '0.25rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      boxShadow: state.isFocused
        ? (dark ? '0 0 0 4px rgba(255,255,255,0.1)' : '0 0 0 4px rgba(211,47,47,0.10)')
        : 'none',
      transition: 'all 320ms cubic-bezier(0.22, 1, 0.36, 1)',
      opacity: isDisabled ? 0.5 : 1,
      cursor: isDisabled ? 'not-allowed' : 'default',
      '&:hover': {
        backgroundColor: state.isFocused ? 'white' : (dark ? 'rgb(255 255 255 / 0.08)' : 'white'),
        borderColor: state.isFocused ? BORDER_FOCUS : 'rgb(229 231 235 / 0.8)',
      },
      overflow: 'hidden',
    }),
    valueContainer: (base) => ({
      ...base,
      height: isMulti ? 'auto' : CONTROL_HEIGHT - 2,
      minHeight: isMulti ? CONTROL_HEIGHT - 2 : undefined,
      maxHeight: isMulti ? '100px' : undefined,
      padding: isMulti ? '0.125rem 0.25rem' : '0 0.25rem',
      flexWrap: isMulti ? 'wrap' : 'nowrap',
      overflow: isMulti ? 'auto' : 'hidden',
      gap: isMulti ? '0.125rem' : '0',
      alignItems: 'center',
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: CONTROL_HEIGHT - 2,
    }),
    singleValue: (base) => ({
      ...base,
      color: dark ? 'white' : '#111827',
      marginTop: 0,
      marginBottom: 0,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: 'calc(100% - 2px)',
    }),
    placeholder: (base) => ({
      ...base,
      color: dark ? '#6B7280' : '#9CA3AF',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: 'calc(100% - 2px)',
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: dark ? '#3A3A3A' : '#F3F4F6',
      borderRadius: '0.5rem',
      margin: '0',
      maxWidth: '100%',
      marginRight: '0.25rem',
      marginBottom: '0.125rem',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: dark ? 'white' : '#111827',
      fontSize: '0.75rem',
      fontWeight: '500',
      padding: '0.125rem 0.375rem',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '120px',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: dark ? '#9CA3AF' : '#6B7280',
      borderRadius: '0 0.5rem 0.5rem 0',
      padding: '0.125rem 0.25rem',
      '&:hover': {
        backgroundColor: '#D32F2F',
        color: 'white',
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: dark ? 'rgb(26 26 26 / 0.96)' : 'rgb(255 255 255 / 0.96)',
      borderRadius: '1rem',
      boxShadow: '0 12px 24px -6px rgb(17 24 39 / 0.10), 0 4px 10px -4px rgb(17 24 39 / 0.06)',
      border: '1px solid rgb(243 244 246 / 0.6)',
      backdropFilter: 'blur(12px)',
      zIndex: 9999,
      overflow: 'hidden',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#FFF5F5'
        : (state.isFocused ? (dark ? '#3A3A3A' : '#F9FAFB') : 'transparent'),
      color: state.isSelected ? '#D32F2F' : (dark ? 'white' : '#111827'),
      fontWeight: state.isSelected ? '600' : '400',
      cursor: 'pointer',
      fontSize: '0.875rem',
      borderRadius: '0.5rem',
      margin: '1px 6px',
      width: 'calc(100% - 12px)',
      '&:active': { backgroundColor: '#FFF5F5', color: '#D32F2F' },
    }),
    input: (base) => ({
      ...base,
      color: dark ? 'white' : '#111827',
      margin: 0,
      padding: 0,
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: dark ? '#6B7280' : '#9CA3AF',
      padding: '0 6px',
      '&:hover': { color: '#D32F2F' },
    }),
    indicatorSeparator: () => ({ display: 'none' }),
  };

  const components = formatSingleValue ? { SingleValue: formatSingleValue } : undefined;

  const selected = isMulti
    ? (Array.isArray(value) ? options.filter(o => value.some(v => (v && v.value === o.value) || v === o.value || String(v) === String(o.value))) : [])
    : (typeof value === 'string' || typeof value === 'number'
        ? options.find(o => o.value === value || String(o.value) === String(value)) ?? null
        : value);

  if (viewMode) {
    return (
      <div className={`flex flex-col gap-1.5 w-full ${className}`}>
        {label && (
          <div className="flex items-center justify-between">
            <Label className={dark ? 'text-gray-400 ml-1' : 'ml-1'}>
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </Label>
          </div>
        )}
        <div className="relative">
          {Icon && <Icon size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${dark ? 'text-gray-500' : 'text-ink-muted'}`} />}
          <div className={`w-full min-h-11 py-1.5 ${Icon ? 'pl-10' : 'px-1'} text-sm font-medium text-ink flex items-center flex-wrap gap-2`}>
            {isMulti
              ? (selected && selected.length > 0
                  ? selected.map((s, idx) => (
                      <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-surface text-brand">
                        {s.label}
                      </span>
                    ))
                  : <span className="text-ink-muted italic font-normal">No especificado</span>)
              : (selected?.label ?? value ?? <span className="text-ink-muted italic font-normal">No especificado</span>)
            }
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <Label className={dark ? 'text-gray-400 ml-1' : 'ml-1'}>
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </Label>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="relative group">
        {Icon && (
          <Icon
            size={15}
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none z-10 ${
              dark ? 'text-gray-500 group-focus-within:text-gray-300' : 'text-ink-muted group-focus-within:text-brand'
            }`}
          />
        )}
        <Select
          options={options}
          value={selected}
          onChange={onChange}
          styles={customStyles}
          placeholder={placeholder}
          noOptionsMessage={() => 'Sin opciones disponibles'}
          formatOptionLabel={formatOptionLabel}
          components={components}
          isDisabled={isDisabled}
          isMulti={isMulti}
          isClearable={false}
          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
          menuPosition="fixed"
          {...props}
        />
      </div>
      {error && <span className="text-xs text-red-500 font-medium ml-1">{error}</span>}
    </div>
  );
};

export default SearchableSelect;
