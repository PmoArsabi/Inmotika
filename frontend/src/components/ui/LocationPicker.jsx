import React, { useState, useEffect, useMemo } from 'react';
import { Country, State, City } from 'country-state-city';
import SearchableSelect from './SearchableSelect';
import { Globe, Map, MapPin } from 'lucide-react';

// Module-level constant — built once, never rebuilt on re-render
const ALL_COUNTRIES = Country.getAllCountries().map(c => ({
  value: c.isoCode,
  label: c.name,
  isoCode: c.isoCode,
}));

const FlagImg = ({ isoCode, name }) => (
  <img
    src={`https://flagcdn.com/w20/${isoCode.toLowerCase()}.png`}
    width="20"
    height="15"
    alt={name}
    loading="lazy"
    className="rounded-sm object-cover"
  />
);

// Custom format for country options — only rendered for visible rows
const formatCountryOption = ({ label, isoCode }) => (
  <div className="flex items-center gap-2">
    <FlagImg isoCode={isoCode} name={label} />
    <span>{label}</span>
  </div>
);

// Custom format for country single value (selected state)
const formatCountrySingleValue = ({ data }) => (
  <div className="flex items-center gap-2">
    <FlagImg isoCode={data.isoCode} name={data.label} />
    <span>{data.label}</span>
  </div>
);

const LocationPicker = ({
  countryValue,
  stateValue,
  cityValue,
  onLocationChange,
  dark = false,
  viewMode = false,
  hideCity = false,
  className = ''
}) => {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    if (countryValue) {
      setStates(State.getStatesOfCountry(countryValue).map(s => ({ value: s.isoCode, label: s.name })));
    } else {
      setStates([]);
      setCities([]);
    }
  }, [countryValue]);

  useEffect(() => {
    if (countryValue && stateValue) {
      setCities(City.getCitiesOfState(countryValue, stateValue).map(c => ({ value: c.name, label: c.name })));
    } else {
      setCities([]);
    }
  }, [countryValue, stateValue]);

  const handleCountryChange = (opt) => onLocationChange({ country: opt?.value ?? '', state: '', city: '' });
  const handleStateChange  = (opt) => onLocationChange({ country: countryValue, state: opt?.value ?? '', city: '' });
  const handleCityChange   = (opt) => onLocationChange({ country: countryValue, state: stateValue, city: opt?.value ?? '' });

  const countryLabel = useMemo(() => {
    const c = Country.getCountryByCode(countryValue);
    return c ? { name: c.name, isoCode: c.isoCode } : null;
  }, [countryValue]);

  const stateLabel = useMemo(() => {
    const s = State.getStateByCodeAndCountry(stateValue, countryValue);
    return s?.name ?? stateValue;
  }, [stateValue, countryValue]);

  if (viewMode) {
    return (
      <div className={`grid grid-cols-2 gap-4 ${className}`}>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-gray-500 ml-1 uppercase">País</label>
          <div className="flex items-center gap-2 h-10 pl-1 text-sm font-semibold text-gray-900">
            {countryLabel ? <><FlagImg isoCode={countryLabel.isoCode} name={countryLabel.name} />{countryLabel.name}</> : <span className="text-gray-400 italic">No especificado</span>}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-gray-500 ml-1 uppercase">Estado / Depto</label>
          <div className="flex items-center gap-2 h-10 pl-1 text-sm font-semibold text-gray-900">
            <Map size={16} className="text-gray-400 shrink-0" />
            {stateLabel || <span className="text-gray-400 italic">No especificado</span>}
          </div>
        </div>
        {!hideCity && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 ml-1 uppercase">Ciudad</label>
            <div className="flex items-center gap-2 h-10 pl-1 text-sm font-semibold text-gray-900">
              <MapPin size={16} className="text-gray-400 shrink-0" />
              {cityValue || <span className="text-gray-400 italic">No especificado</span>}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      <SearchableSelect
        label="País"
        options={ALL_COUNTRIES}
        value={countryValue}
        onChange={handleCountryChange}
        dark={dark}
        placeholder="Buscar país..."
        formatOptionLabel={formatCountryOption}
        formatSingleValue={formatCountrySingleValue}
      />

      <SearchableSelect
        label="Estado / Depto"
        icon={Map}
        options={states}
        value={stateValue}
        onChange={handleStateChange}
        dark={dark}
        isDisabled={!countryValue}
        placeholder={countryValue ? 'Buscar estado...' : 'Primero elige un país'}
      />

      {!hideCity && (
        <SearchableSelect
          label="Ciudad"
          icon={MapPin}
          options={cities}
          value={cityValue}
          onChange={handleCityChange}
          dark={dark}
          isDisabled={!stateValue}
          placeholder={stateValue ? 'Buscar ciudad...' : 'Primero elige un estado'}
        />
      )}
    </div>
  );
};

export default LocationPicker;
