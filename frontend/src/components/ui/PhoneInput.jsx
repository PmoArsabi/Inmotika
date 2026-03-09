import React, { useState, useMemo } from 'react';
import { Country } from 'country-state-city';
import { Label } from './Typography';
import { Phone } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

// Códigos telefónicos por país (ISO code -> dial code)
const COUNTRY_PHONE_CODES = {
  'CO': '+57', 'US': '+1', 'MX': '+52', 'AR': '+54', 'CL': '+56',
  'PE': '+51', 'EC': '+593', 'VE': '+58', 'BO': '+591', 'PY': '+595',
  'UY': '+598', 'BR': '+55', 'CR': '+506', 'PA': '+507', 'GT': '+502',
  'HN': '+504', 'NI': '+505', 'SV': '+503', 'DO': '+1', 'CU': '+53',
  'ES': '+34', 'FR': '+33', 'GB': '+44', 'DE': '+49', 'IT': '+39',
  'PT': '+351', 'NL': '+31', 'BE': '+32', 'CH': '+41', 'AT': '+43',
  'CA': '+1', 'AU': '+61', 'NZ': '+64', 'JP': '+81', 'CN': '+86',
  'IN': '+91', 'KR': '+82', 'SG': '+65', 'MY': '+60', 'TH': '+66',
  'PH': '+63', 'ID': '+62', 'VN': '+84', 'AE': '+971', 'SA': '+966',
  'EG': '+20', 'ZA': '+27', 'NG': '+234', 'KE': '+254', 'MA': '+212',
  'RU': '+7', 'TR': '+90', 'IL': '+972', 'PL': '+48', 'CZ': '+420',
  'SE': '+46', 'NO': '+47', 'DK': '+45', 'FI': '+358', 'IE': '+353',
  'GR': '+30', 'RO': '+40', 'HU': '+36', 'BG': '+359', 'HR': '+385',
};

// Obtener código telefónico por ISO code
export const getPhoneCode = (isoCode) => COUNTRY_PHONE_CODES[isoCode] || '+1';

// Formatear teléfono completo: "CO+57 3225865888"
export const formatFullPhone = (countryCode, phoneNumber) => {
  if (!countryCode || !phoneNumber) return '';
  const code = getPhoneCode(countryCode);
  return `${countryCode}${code} ${phoneNumber}`;
};

// Formatear opción de país con bandera
const formatCountryOption = ({ label, isoCode }) => {
  const phoneCode = getPhoneCode(isoCode);
  return (
    <div className="flex items-center gap-2">
      <img
        src={`https://flagcdn.com/w20/${isoCode.toLowerCase()}.png`}
        alt={label}
        className="w-5 h-3.5 object-cover rounded-sm"
      />
      <span className="flex-1">{label}</span>
      <span className="text-gray-500 text-sm">{phoneCode}</span>
    </div>
  );
};

// Formatear valor seleccionado
const formatCountrySingleValue = ({ data }) => {
  const phoneCode = getPhoneCode(data.isoCode);
  return (
    <div className="flex items-center gap-2">
      <img
        src={`https://flagcdn.com/w20/${data.isoCode.toLowerCase()}.png`}
        alt={data.label}
        className="w-5 h-3.5 object-cover rounded-sm"
      />
      <span className="text-sm font-semibold">{data.isoCode}</span>
      <span className="text-gray-600">{phoneCode}</span>
    </div>
  );
};

// Lista de países con códigos telefónicos
const ALL_COUNTRIES = Country.getAllCountries().map(c => ({
  value: c.isoCode,
  label: c.name,
  isoCode: c.isoCode,
}));

const PhoneInput = ({
  label = 'Celular',
  countryValue,
  phoneValue,
  onCountryChange,
  onPhoneChange,
  error,
  viewMode = false,
  dark = false,
  className = '',
  required = false,
  icon: Icon = Phone,
}) => {
  const phoneCode = useMemo(() => getPhoneCode(countryValue || 'CO'), [countryValue]);
  const displayValue = useMemo(() => {
    if (!countryValue || !phoneValue) return '';
    return `${countryValue}${phoneCode} ${phoneValue}`;
  }, [countryValue, phoneCode, phoneValue]);

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // Solo números
    onPhoneChange(val);
  };

  if (viewMode) {
    return (
      <div className={`flex flex-col gap-1.5 w-full ${className}`}>
        {label && (
          <Label className={dark ? 'text-gray-400 ml-1' : 'ml-1'}>
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </Label>
        )}
        <div className={`w-full h-10 ${Icon ? 'pl-9' : 'px-3'} text-sm font-semibold text-gray-900 flex items-center`}>
          {displayValue || <span className="text-gray-400 italic">No especificado</span>}
        </div>
        {error && <span className="text-xs text-red-500 font-bold ml-1">{error}</span>}
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
      <div className="flex flex-col gap-2">
        {/* Selector de país */}
        <div className="w-full">
          <SearchableSelect
            options={ALL_COUNTRIES}
            value={countryValue ? ALL_COUNTRIES.find(c => c.value === countryValue) || ALL_COUNTRIES.find(c => c.value === 'CO') : ALL_COUNTRIES.find(c => c.value === 'CO')}
            onChange={(opt) => onCountryChange(opt?.value || 'CO')}
            placeholder="País"
            formatOptionLabel={formatCountryOption}
            formatSingleValue={formatCountrySingleValue}
            dark={dark}
          />
        </div>

        {/* Input del número telefónico */}
        <div className="relative w-full group">
          {Icon && (
            <Icon
              size={16}
              className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${
                dark ? 'text-gray-500 group-focus-within:text-white' : 'text-gray-400 group-focus-within:text-[#D32F2F]'
              }`}
            />
          )}
          <input
            type="tel"
            inputMode="numeric"
            placeholder="Número de celular"
            value={phoneValue || ''}
            onChange={handlePhoneChange}
            required={required}
            className={`w-full h-10 ${Icon ? 'pl-9' : 'px-3'} pr-3 border rounded-md focus:outline-none focus:ring-4 transition-all text-sm font-semibold
              ${dark
                ? 'bg-[#2A2A2A] border-transparent text-white placeholder-gray-500 focus:ring-white/10'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] hover:border-gray-400'
              } ${error ? 'border-red-500 ring-red-500/10' : ''}`}
          />
        </div>
      </div>
      {error && <span className="text-xs text-red-500 font-bold ml-1">{error}</span>}
    </div>
  );
};

export default PhoneInput;
