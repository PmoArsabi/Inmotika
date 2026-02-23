import React from 'react';
import Select from 'react-select';
import { Label } from './Typography';

// Shared border token — matches Input, Select, NitInput
const BORDER_NORMAL  = '#D1D5DB'; // gray-300
const BORDER_FOCUS   = '#D32F2F';
const BORDER_HOVER   = '#9CA3AF'; // gray-400
const CONTROL_HEIGHT = 40;        // px — same as h-10

const SearchableSelect = ({
  label,
  icon: Icon,
  options = [],
  value,
  onChange,
  dark = false,
  viewMode = false,
  className = '',
  placeholder = 'Seleccionar...',
  formatOptionLabel,   // overrides how each dropdown option renders
  formatSingleValue,   // overrides how the selected value renders
  isDisabled = false,
  ...props
}) => {

  const customStyles = {
    control: (base, state) => ({
      ...base,
      height: CONTROL_HEIGHT,
      minHeight: CONTROL_HEIGHT,
      backgroundColor: dark ? '#2A2A2A' : 'white',
      borderColor: state.isFocused ? BORDER_FOCUS : BORDER_NORMAL,
      borderRadius: '0.375rem',
      paddingLeft: Icon ? '2.25rem' : '0.25rem',
      fontSize: '0.875rem',
      fontWeight: '600',
      boxShadow: state.isFocused
        ? (dark ? '0 0 0 4px rgba(255,255,255,0.1)' : '0 0 0 4px rgba(211,47,47,0.05)')
        : 'none',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      opacity: isDisabled ? 0.45 : 1,
      cursor: isDisabled ? 'not-allowed' : 'default',
      '&:hover': { borderColor: state.isFocused ? BORDER_FOCUS : BORDER_HOVER },
    }),
    valueContainer: (base) => ({
      ...base,
      height: CONTROL_HEIGHT - 2,  // subtract borders
      padding: '0 0.25rem',
      flexWrap: 'nowrap',
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
    menu: (base) => ({
      ...base,
      backgroundColor: dark ? '#2A2A2A' : 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      zIndex: 50,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#D32F2F' : (state.isFocused ? (dark ? '#3A3A3A' : '#F9FAFB') : 'transparent'),
      color: state.isSelected ? 'white' : (dark ? 'white' : '#111827'),
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '600',
      '&:active': { backgroundColor: '#D32F2F', color: 'white' },
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
  const selected = options.find(o => o.value === value) ?? null;

  if (viewMode) {
    return (
      <div className={`flex flex-col gap-1.5 w-full ${className}`}>
        {label && <Label className={dark ? 'text-gray-400 ml-1' : 'ml-1'}>{label}</Label>}
        <div className="relative group">
          {Icon && <Icon size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${dark ? 'text-gray-500' : 'text-gray-400'}`} />}
          <div className={`w-full h-10 ${Icon ? 'pl-9' : 'px-3'} text-sm font-semibold text-gray-900 flex items-center`}>
            {selected?.label ?? value ?? <span className="text-gray-400 italic">No especificado</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && <Label className={dark ? 'text-gray-400 ml-1' : 'ml-1'}>{label}</Label>}
      <div className="relative group">
        {Icon && (
          <Icon
            size={16}
            className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none z-10 ${
              dark ? 'text-gray-500 group-focus-within:text-white' : 'text-gray-400 group-focus-within:text-[#D32F2F]'
            }`}
          />
        )}
        <Select
          options={options}
          value={selected}
          onChange={onChange}
          styles={customStyles}
          placeholder={placeholder}
          noOptionsMessage={() => 'No hay resultados'}
          formatOptionLabel={formatOptionLabel}
          components={components}
          isDisabled={isDisabled}
          {...props}
        />
      </div>
    </div>
  );
};

export default SearchableSelect;
