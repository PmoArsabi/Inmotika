import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Country } from 'country-state-city';
import { Label } from './Typography';
import { Phone, ChevronDown, Search } from 'lucide-react';
import { validatePhoneNumber as _validatePhoneNumber } from '../../utils/validators';

// ─── Phone codes ────────────────────────────────────────────────────────────
const COUNTRY_PHONE_CODES = {
  'CO': '+57', 'US': '+1',  'MX': '+52', 'AR': '+54', 'CL': '+56',
  'PE': '+51', 'EC': '+593','VE': '+58', 'BO': '+591','PY': '+595',
  'UY': '+598','BR': '+55', 'CR': '+506','PA': '+507','GT': '+502',
  'HN': '+504','NI': '+505','SV': '+503','DO': '+1',  'CU': '+53',
  'ES': '+34', 'FR': '+33', 'GB': '+44', 'DE': '+49', 'IT': '+39',
  'PT': '+351','NL': '+31', 'BE': '+32', 'CH': '+41', 'AT': '+43',
  'CA': '+1',  'AU': '+61', 'NZ': '+64', 'JP': '+81', 'CN': '+86',
  'IN': '+91', 'KR': '+82', 'SG': '+65', 'MY': '+60', 'TH': '+66',
  'PH': '+63', 'ID': '+62', 'VN': '+84', 'AE': '+971','SA': '+966',
  'EG': '+20', 'ZA': '+27', 'NG': '+234','KE': '+254','MA': '+212',
  'RU': '+7',  'TR': '+90', 'IL': '+972','PL': '+48', 'CZ': '+420',
  'SE': '+46', 'NO': '+47', 'DK': '+45', 'FI': '+358','IE': '+353',
  'GR': '+30', 'RO': '+40', 'HU': '+36', 'BG': '+359','HR': '+385',
};


// eslint-disable-next-line react-refresh/only-export-components
export const getPhoneCode = (isoCode) => COUNTRY_PHONE_CODES[isoCode] || '+1';

// eslint-disable-next-line react-refresh/only-export-components
export const formatFullPhone = (countryCode, phoneNumber) => {
  if (!countryCode || !phoneNumber) return '';
  const code = getPhoneCode(countryCode);
  return `${countryCode}${code} ${phoneNumber}`;
};

// Re-exportado desde utils/validators para mantener compatibilidad con importadores directos.
// eslint-disable-next-line react-refresh/only-export-components
export const validatePhoneNumber = _validatePhoneNumber;

const ALL_COUNTRIES = Country.getAllCountries().map(c => ({
  value: c.isoCode,
  label: c.name,
  isoCode: c.isoCode,
}));

// ─── Component ───────────────────────────────────────────────────────────────
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
}) => {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const [touched, setTouched] = useState(false);
  const wrapperRef  = useRef(null);
  const searchRef   = useRef(null);
  const inputRef    = useRef(null);

  const iso       = countryValue || 'CO';
  const phoneCode = useMemo(() => getPhoneCode(iso), [iso]);
  const country   = useMemo(
    () => ALL_COUNTRIES.find(c => c.value === iso) ?? ALL_COUNTRIES.find(c => c.value === 'CO'),
    [iso],
  );

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return ALL_COUNTRIES;
    const q = search.toLowerCase();
    return ALL_COUNTRIES.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.isoCode.toLowerCase().includes(q) ||
      getPhoneCode(c.isoCode).includes(q),
    );
  }, [search]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Auto-focus search when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const validationError = useMemo(
    () => (touched ? validatePhoneNumber(phoneValue, iso) : null),
    [phoneValue, iso, touched],
  );
  const shownError = error || validationError;

  const handleSelect = (isoCode) => {
    onCountryChange(isoCode);
    setOpen(false);
    setSearch('');
    inputRef.current?.focus();
  };

  // ── View mode ──
  if (viewMode) {
    return (
      <div className={`flex flex-col gap-1.5 w-full ${className}`}>
        {label && (
          <Label className={dark ? 'text-gray-400 ml-1' : 'ml-1'}>
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
          </Label>
        )}
        <div className="w-full h-10 px-3 text-sm font-semibold text-gray-900 flex items-center">
          {phoneValue
            ? `${phoneCode} ${phoneValue}`
            : <span className="text-gray-400 italic">No especificado</span>}
        </div>
      </div>
    );
  }

  // ── Edit mode ──
  return (
    <div ref={wrapperRef} className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <Label className={dark ? 'text-gray-400 ml-1' : 'ml-1'}>
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
      )}

      {/* ── Unified input box ── */}
      <div className={`relative flex w-full rounded-md border transition-all
        focus-within:ring-4
        ${dark
          ? 'border-canvas-overlay focus-within:ring-white/10 focus-within:border-white/30'
          : `border-gray-300 hover:border-gray-400 focus-within:border-brand focus-within:ring-brand/5 ${shownError ? 'border-red-500 ring-4 ring-red-500/10' : ''}`
        }`}
      >
        {/* Country trigger */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={`flex items-center gap-1.5 pl-3 pr-2 h-10 shrink-0 rounded-l-md border-r transition-colors
            ${dark
              ? 'border-canvas-overlay hover:bg-white/5'
              : 'border-gray-300 hover:bg-gray-50'
            }`}
        >
          <img
            src={`https://flagcdn.com/w20/${country?.isoCode?.toLowerCase()}.png`}
            alt={country?.label}
            className="w-5 h-3.5 object-cover rounded-sm shrink-0"
          />
          <span className={`text-sm font-bold tabular-nums ${dark ? 'text-white' : 'text-gray-700'}`}>
            {phoneCode}
          </span>
          <ChevronDown
            size={13}
            className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${dark ? 'text-gray-400' : 'text-gray-400'}`}
          />
        </button>

        {/* Number input */}
        <div className="relative flex-1 group">
          <Phone
            size={15}
            className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors
              ${dark ? 'text-gray-500 group-focus-within:text-white' : 'text-gray-400 group-focus-within:text-brand'}`}
          />
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            placeholder="Número"
            value={phoneValue || ''}
            onChange={e => onPhoneChange(e.target.value.replace(/\D/g, ''))}
            onBlur={() => setTouched(true)}
            required={required}
            className={`w-full h-10 pl-9 pr-3 text-sm font-semibold outline-none bg-transparent rounded-r-md
              ${dark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
          />
        </div>

        {/* ── Dropdown ── */}
        {open && (
          <div className={`absolute left-0 top-full mt-1.5 z-60 w-72 rounded-xl shadow-2xl border overflow-hidden
            ${dark ? 'bg-canvas-raised border-white/10' : 'bg-white border-gray-200'}`}
          >
            {/* Search box */}
            <div className={`p-2 border-b ${dark ? 'border-white/10' : 'border-gray-100'}`}>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Buscar país o código..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`w-full h-8 pl-8 pr-3 text-xs rounded-md border focus:outline-none focus:border-brand transition-colors
                    ${dark ? 'bg-canvas-overlay border-white/10 text-white placeholder-gray-500' : 'border-gray-200 text-gray-900'}`}
                />
              </div>
            </div>

            {/* Country list */}
            <div className="max-h-52 overflow-y-auto">
              {filteredCountries.length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400 text-center">Sin resultados</p>
              ) : (
                filteredCountries.slice(0, 60).map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => handleSelect(c.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors text-left
                      ${c.value === iso
                        ? (dark ? 'bg-white/10 text-white' : 'bg-red-50 text-brand')
                        : (dark ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700')
                      }`}
                  >
                    <img
                      src={`https://flagcdn.com/w20/${c.isoCode.toLowerCase()}.png`}
                      alt={c.label}
                      className="w-5 h-3.5 object-cover rounded-sm shrink-0"
                    />
                    <span className="flex-1 text-xs font-medium truncate">{c.label}</span>
                    <span className={`text-xs font-bold tabular-nums shrink-0 ${dark ? 'text-gray-400' : 'text-gray-400'}`}>
                      {getPhoneCode(c.isoCode)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {shownError && (
        <span className="text-xs text-red-500 font-bold ml-1">{shownError}</span>
      )}
    </div>
  );
};

export default PhoneInput;
