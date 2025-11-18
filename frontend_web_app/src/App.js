import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import './index.css';
import MapView from './components/MapView';
import StationList from './components/StationList';
import StationDetails from './components/StationDetails';
import useGeolocation from './hooks/useGeolocation';
import { parseFeatureFlags } from './utils/featureFlags';
import { formatDistanceKm } from './utils/distance';

// PUBLIC_INTERFACE
function App() {
  /**
   * App shell managing:
   * - userLocation: { lat, lng } or null
   * - mapCenter: current center used to fetch places
   * - stations: array of nearby gas stations with distance metadata
   * - selectedStation: current focused station
   * - loading / error states
   * - feature flags: parsed from REACT_APP_FEATURE_FLAGS
   * - logging level (REACT_APP_LOG_LEVEL) minimal in production
   */

  const [mapCenter, setMapCenter] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [uiTheme] = useState('light'); // fixed to light per style guide

  const flags = useMemo(() => parseFeatureFlags(process.env.REACT_APP_FEATURE_FLAGS), []);
  const logLevel = (process.env.REACT_APP_LOG_LEVEL || 'warn').toLowerCase();

  const { coords: userLocation, permission, error: geoError, refresh: refreshGeolocation } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000
  });

  // Apply theme for accessibility and consistency
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', uiTheme);
  }, [uiTheme]);

  // Initialize map center once geolocation is available or fallback to a default
  useEffect(() => {
    if (userLocation && !mapCenter) {
      setMapCenter(userLocation);
    } else if (!userLocation && !mapCenter) {
      // Fallback center (continental US mid) without implying user location
      setMapCenter({ lat: 39.8283, lng: -98.5795 });
    }
  }, [userLocation, mapCenter]);

  const handleStationsUpdate = useCallback((list, errMsg) => {
    if (errMsg) {
      setListError(errMsg);
    } else {
      setListError('');
    }
    setStations(Array.isArray(list) ? list : []);
  }, []);

  const handleSelectStation = (station) => {
    setSelectedStation(station);
  };

  const handleMapIdle = useCallback((center) => {
    setMapCenter(center);
  }, []);

  const userFacingGeoError = useMemo(() => {
    if (!geoError) return '';
    if (geoError.code === 'PERMISSION_DENIED') {
      return 'Location permission denied. Enable location access for better results or pan the map to refine search.';
    }
    if (geoError.code === 'POSITION_UNAVAILABLE') {
      return 'Unable to determine your location. Please try again or move the map to search other areas.';
    }
    if (geoError.code === 'TIMEOUT') {
      return 'Taking too long to get your location. You can refresh or move the map to continue.';
    }
    return 'An error occurred while detecting your location.';
  }, [geoError]);

  // Minimal internal logging
  const debug = (...args) => {
    if (logLevel === 'debug') {
      // eslint-disable-next-line no-console
      console.debug('[App]', ...args);
    }
  };

  useEffect(() => {
    debug('Flags:', flags, 'Permission:', permission, 'UserLocation:', userLocation);
  }, [flags, permission, userLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="app-root">
      <header className="app-header" role="banner">
        <div className="brand">
          <span className="brand-dot" aria-hidden="true">⛽</span>
          <h1 className="brand-title">Nearby Gas Finder</h1>
        </div>
        <div className="header-actions">
          <button
            className="btn refresh-btn"
            onClick={refreshGeolocation}
            aria-label="Refresh my location"
            title="Refresh my location"
          >
            Locate me
          </button>
        </div>
      </header>

      <main className="app-main" role="main">
        <aside className="sidebar" aria-label="Gas station results">
          <div className="sidebar-inner">
            {userFacingGeoError && (
              <div className="alert" role="alert">
                {userFacingGeoError}
              </div>
            )}
            <StationList
              stations={stations}
              onSelect={handleSelectStation}
              selectedId={selectedStation?.place_id}
              loading={loading}
              error={listError}
            />
          </div>
        </aside>

        <section className="map-section" aria-label="Map with nearby gas stations">
          <MapView
            userLocation={userLocation}
            center={mapCenter}
            onCenterChanged={handleMapIdle}
            onStationsChanged={handleStationsUpdate}
            onLoading={setLoading}
            selectedStationId={selectedStation?.place_id}
            onSelectStation={handleSelectStation}
            flags={flags}
            logLevel={logLevel}
          />
        </section>
      </main>

      <section
        className={`details-panel ${selectedStation ? 'open' : ''}`}
        aria-live="polite"
        aria-label="Selected station details"
      >
        {selectedStation ? (
          <StationDetails
            station={selectedStation}
            userLocation={userLocation}
            onClose={() => setSelectedStation(null)}
          />
        ) : (
          <div className="details-empty">
            <p>Select a station from the list or the map to see details.</p>
            {userLocation && (
              <p className="muted">Your approximate location is being used to compute distances (e.g., {formatDistanceKm(1000)}).</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
