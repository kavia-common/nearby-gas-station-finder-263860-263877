import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * PUBLIC_INTERFACE
 * useGeolocation
 * Provides user coordinates with permission and error handling.
 *
 * @param {PositionOptions} options - Geolocation options
 * @returns {{
 *   coords: { lat:number, lng:number } | null,
 *   error: { code:string, message:string } | null,
 *   permission: 'granted'|'denied'|'prompt'|'unknown',
 *   refresh: () => void
 * }}
 */
export default function useGeolocation(options = {}) {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('unknown');
  const requestRef = useRef(0);

  const readPermission = useCallback(async () => {
    try {
      if (!navigator.permissions || !navigator.permissions.query) {
        setPermission('unknown');
        return;
      }
      const status = await navigator.permissions.query({ name: 'geolocation' });
      setPermission(status.state);
      status.onchange = () => setPermission(status.state);
    } catch {
      setPermission('unknown');
    }
  }, []);

  const mapError = useCallback((err) => {
    const msg = typeof err?.message === 'string' ? err.message : '';
    const codeMap = {
      1: 'PERMISSION_DENIED',
      2: 'POSITION_UNAVAILABLE',
      3: 'TIMEOUT',
    };
    setError({
      code: codeMap[err?.code] || 'UNKNOWN',
      message: msg ? String(msg).slice(0, 180) : 'Geolocation error',
    });
  }, []);

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError({ code: 'UNSUPPORTED', message: 'Geolocation is not supported by this browser.' });
      return;
    }
    requestRef.current += 1;
    const id = requestRef.current;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (id !== requestRef.current) return;
        setError(null);
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        if (id !== requestRef.current) return;
        mapError(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
        ...options
      }
    );
  }, [options, mapError]);

  // Initial permission and locate
  useEffect(() => {
    readPermission();
    locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    coords,
    error,
    permission,
    refresh: locate
  };
}
