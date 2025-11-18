import { useEffect, useState } from 'react';

/**
 * PUBLIC_INTERFACE
 * useGoogleMaps
 * Dynamically loads the Google Maps JavaScript API.
 *
 * Env: REACT_APP_GOOGLE_MAPS_API_KEY (must be set by user)
 *
 * @returns {{ status: 'idle'|'loading'|'ready'|'error', error: string|null, google: any }}
 */
export default function useGoogleMaps() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [googleObj, setGoogleObj] = useState(null);

  useEffect(() => {
    const existing = window.google && window.google.maps;
    if (existing) {
      setGoogleObj(window.google);
      setStatus('ready');
      return;
    }

    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError('Google Maps API key missing. Set REACT_APP_GOOGLE_MAPS_API_KEY in your environment.');
      setStatus('error');
      return;
    }

    const scriptId = 'google-maps-js';
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        setGoogleObj(window.google);
        setStatus('ready');
      });
      existingScript.addEventListener('error', () => {
        setError('Failed to load Google Maps API. Check your API key and network.');
        setStatus('error');
      });
      setStatus('loading');
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.onload = () => {
      setGoogleObj(window.google);
      setStatus('ready');
    };
    script.onerror = () => {
      setError('Failed to load Google Maps API. Check your API key and network.');
      setStatus('error');
    };

    setStatus('loading');
    document.head.appendChild(script);

    return () => {
      // Do not remove script; keep cached for SPA navigation
    };
  }, []);

  return { status, error, google: googleObj };
}
