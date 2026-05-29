import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { listCities, nearestCity as apiNearest } from '../api/cities.api.js';

const LocationContext = createContext(null);
const STORAGE_KEY = 'bookify_city_object';
const ALLOWED_CITIES_LC = ['rohtak', 'noida'];
const isAllowed = (name) =>
  Boolean(name) && ALLOWED_CITIES_LC.includes(String(name).trim().toLowerCase());

export function LocationProvider({ children }) {
  const [cities, setCities] = useState([]);
  const [selected, setSelected] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : null;
      /* Drop any previously-saved city that's no longer in the allowed list
         — keeps users from being stuck on a city the picker no longer offers. */
      if (saved && !isAllowed(saved.cityName)) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return saved;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    let mounted = true;
    listCities()
      .then((res) => {
        if (!mounted) return;
        setCities(res.items || []);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const setCity = useCallback((cityObj) => {
    setSelected(cityObj);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cityObj));
    } catch (e) {
      // ignore
    }
  }, []);

  const detectNearest = useCallback(async (lat, lng, maxDistance) => {
    const res = await apiNearest(lat, lng, maxDistance);
    return res.data; // may be null
  }, []);

  return (
    <LocationContext.Provider value={{ cities, city: selected, setCity, detectNearest }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within a LocationProvider');
  return ctx;
}
