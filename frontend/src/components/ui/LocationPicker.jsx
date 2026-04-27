import React, { useMemo } from 'react';
import { ALL_COUNTRIES_OPTIONS, getCountryByCode, getStatesOfCountry, getCitiesOfState, getStateName } from '../../utils/locationData';
import SearchableSelect from './SearchableSelect';
import { Map, MapPin } from 'lucide-react';

const ALL_COUNTRIES = ALL_COUNTRIES_OPTIONS;

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
  const states = useMemo(
    () => countryValue ? getStatesOfCountry(countryValue) : [],
    [countryValue]
  );

  const cities = useMemo(
    () => countryValue && stateValue ? getCitiesOfState(countryValue, stateValue) : [],
    [countryValue, stateValue]
  );

  const handleCountryChange = (opt) => {
    const newCountry = opt?.value ?? '';
    if (newCountry === countryValue) return;
    onLocationChange({ country: newCountry, state: '', city: '' });
  };
  const handleStateChange  = (opt) => onLocationChange({ country: countryValue, state: opt?.value ?? '', city: '' });
  const handleCityChange   = (opt) => onLocationChange({ country: countryValue, state: stateValue, city: opt?.value ?? '' });

  const countryLabel = useMemo(() => {
    const c = getCountryByCode(countryValue);
    return c ? { name: c.name, isoCode: c.iso } : null;
  }, [countryValue]);

  const stateLabel = useMemo(() => getStateName(stateValue, countryValue), [stateValue, countryValue]);

  if (viewMode) {
    return (
      <div className={`grid grid-cols-2 gap-4 ${className}`}>
        <div className="flex flex-col gap-1.5">
          <label className="text-2xs font-bold text-gray-500 ml-1 uppercase">País</label>
          <div className="flex items-center gap-2 h-10 pl-1 text-sm font-semibold text-gray-900">
            {countryLabel ? <><FlagImg isoCode={countryLabel.isoCode} name={countryLabel.name} />{countryLabel.name}</> : <span className="text-gray-400 italic">No especificado</span>}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-2xs font-bold text-gray-500 ml-1 uppercase">Estado / Depto</label>
          <div className="flex items-center gap-2 h-10 pl-1 text-sm font-semibold text-gray-900">
            <Map size={16} className="text-gray-400 shrink-0" />
            {stateLabel || <span className="text-gray-400 italic">No especificado</span>}
          </div>
        </div>
        {!hideCity && (
          <div className="flex flex-col gap-1.5">
            <label className="text-2xs font-bold text-gray-500 ml-1 uppercase">Ciudad</label>
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
