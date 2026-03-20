import { useMemo } from 'react';
import { City, State } from 'country-state-city';

/**
 * Hook that derives states and cities lists from parent-controlled countryValue/stateValue.
 * Uses useMemo to avoid setState-in-effect lint errors and prevent cascading renders.
 */
export const useLocationData = ({ countryValue, stateValue, onLocationChange }) => {
  const states = useMemo(
    () => countryValue
      ? State.getStatesOfCountry(countryValue).map(s => ({ value: s.isoCode, label: s.name }))
      : [],
    [countryValue]
  );

  const cities = useMemo(
    () => countryValue && stateValue
      ? City.getCitiesOfState(countryValue, stateValue).map(c => ({ value: c.name, label: c.name }))
      : [],
    [countryValue, stateValue]
  );

  const handleCountryChange = (opt) => {
    const newCountry = opt?.value ?? '';
    if (newCountry === countryValue) return;
    onLocationChange({ country: newCountry, state: '', city: '' });
  };
  const handleStateChange = (opt) => onLocationChange({ country: countryValue, state: opt?.value ?? '', city: '' });
  const handleCityChange  = (opt) => onLocationChange({ country: countryValue, state: stateValue, city: opt?.value ?? '' });

  return { states, cities, handleCountryChange, handleStateChange, handleCityChange };
};
