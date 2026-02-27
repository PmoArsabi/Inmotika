import React from 'react';
import { Map, MapPin } from 'lucide-react';
import { Country, State } from 'country-state-city';
import { useLocationData } from '../../hooks/useLocationData';
import { Label, TextSmall } from '../ui/Typography';
import SearchableSelect from '../ui/SearchableSelect';
import Input from '../ui/Input';

const ALL_COUNTRIES_LIST = Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name }));
const formatCountryOption = (option) => (
  <div className="flex items-center gap-2">
    <img src={`https://flagcdn.com/w20/${option.value.toLowerCase()}.png`} alt={option.label} className="w-5 h-3.5 object-cover rounded-sm" />
    <span>{option.label}</span>
  </div>
);

const FlagImg = ({ iso }) => (
  <img src={`https://flagcdn.com/w20/${iso.toLowerCase()}.png`} alt={iso} className="w-5 h-3.5 object-cover rounded-sm inline mr-2" />
);

const ViewCell = ({ label, children, icon: Icon }) => (
  <div className="space-y-1">
    <Label className="text-gray-400 ml-1 uppercase text-[10px] tracking-wider">{label}</Label>
    <div className="flex items-center gap-2 h-10 px-3 bg-gray-50/50 rounded-md border border-gray-100">
      {Icon && <Icon size={14} className="text-gray-400 shrink-0" />}
      <TextSmall className="text-gray-900 font-semibold truncate">
        {children || <span className="text-gray-300 italic font-normal">No especificado</span>}
      </TextSmall>
    </div>
  </div>
);

export const LocationPickerRows = ({
  countryValue, stateValue, cityValue, direccion,
  onLocationChange, onDireccionChange,
  viewMode, direccionError, required
}) => {
  const { states, cities, handleCountryChange, handleStateChange, handleCityChange } = useLocationData({
    countryValue, stateValue, onLocationChange
  });
  const countryData = Country.getCountryByCode(countryValue);
  const stateData   = State.getStateByCodeAndCountry(stateValue, countryValue);

  if (viewMode) {
    return (
      <>
        <ViewCell label="País">
          {countryData && (<><FlagImg iso={countryData.isoCode} /> {countryData.name}</>)}
        </ViewCell>
        <ViewCell label="Estado / Depto" icon={Map}>
          {stateData?.name}
        </ViewCell>
        <ViewCell label="Ciudad" icon={MapPin}>
          {cityValue}
        </ViewCell>
        <ViewCell label="Dirección Física" icon={MapPin}>
          {direccion}
        </ViewCell>
      </>
    );
  }

  return (
    <>
      <SearchableSelect
        label="País"
        options={ALL_COUNTRIES_LIST}
        value={countryValue}
        onChange={handleCountryChange}
        placeholder="Buscar país..."
        formatOptionLabel={formatCountryOption}
        required={required}
      />
      <SearchableSelect
        label="Estado / Depto"
        icon={Map}
        options={states}
        value={stateValue}
        onChange={handleStateChange}
        isDisabled={!countryValue}
        placeholder={countryValue ? 'Buscar estado...' : 'Primero elige un país'}
        required={required}
      />
      <SearchableSelect
        label="Ciudad"
        icon={MapPin}
        options={cities}
        value={cityValue}
        onChange={handleCityChange}
        isDisabled={!stateValue}
        placeholder={stateValue ? 'Buscar ciudad...' : 'Primero elige un estado'}
        required={required}
      />
      <Input
        label="Dirección Física"
        icon={MapPin}
        value={direccion}
        onChange={(e) => onDireccionChange(e.target.value)}
        error={direccionError}
        required={required}
      />
    </>
  );
};
