import { createContext, useContext, useState, useCallback } from 'react';
import { CITIES, DEFAULT_CITY } from '../lib/constants.js';

const LocationContext = createContext(null);
const STORAGE_KEY = 'bookify_city';
const LEGACY_STORAGE_KEY = 'district_city';

export function LocationProvider({ children }) {
  const [city, setCityState] = useState(
    () =>
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem(LEGACY_STORAGE_KEY) ||
      DEFAULT_CITY,
  );

  const setCity = useCallback((next) => {
    setCityState(next);
    localStorage.setItem(STORAGE_KEY, next);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }, []);

  return (
    <LocationContext.Provider value={{ city, setCity, cities: CITIES }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within a LocationProvider');
  return ctx;
}
