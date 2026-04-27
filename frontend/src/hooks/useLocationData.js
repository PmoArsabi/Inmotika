import { useMemo } from 'react';
import { getStatesOfCountry, getCitiesOfState } from '../utils/locationData';

/**
 * Hook that derives states and cities lists from parent-controlled countryValue/stateValue.
 * Uses useMemo to avoid setState-in-effect lint errors and prevent cascading renders.
 */
export const useLocationData = ({ countryValue, stateValue, onLocationChange }) => {
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
  const handleStateChange = (opt) => onLocationChange({ country: countryValue, state: opt?.value ?? '', city: '' });
  const handleCityChange  = (opt) => onLocationChange({ country: countryValue, state: stateValue, city: opt?.value ?? '' });

  return { states, cities, handleCountryChange, handleStateChange, handleCityChange };
};
