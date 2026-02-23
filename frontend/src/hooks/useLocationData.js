import { useState, useMemo, useEffect } from 'react';
import { City, State } from 'country-state-city';

/**
 * Hook that derives states and cities lists from parent-controlled countryValue/stateValue.
 * All handlers work the same way as inside LocationPicker.
 */
export const useLocationData = ({ countryValue, stateValue, onLocationChange }) => {
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

  return { states, cities, handleCountryChange, handleStateChange, handleCityChange };
};
