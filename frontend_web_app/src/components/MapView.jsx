import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import useGoogleMaps from '../hooks/useGoogleMaps';
import { searchNearbyGasStations, computeDistancesIfEnabled } from '../services/placesService';

/**
 * PUBLIC_INTERFACE
 * MapView
 * Renders the Google Map, manages markers, and emits station updates based on map center.
 *
 * Props:
 * - userLocation: { lat, lng } | null
 * - center: { lat, lng } | null
 * - onCenterChanged: function(center) called when map has idled after drag/zoom (debounced upstream)
 * - onStationsChanged: function(stations, errorMessage?)
 * - onLoading: function(boolean)
 * - selectedStationId: string | undefined
 * - onSelectStation: function(station)
 * - flags: feature flags object
 * - logLevel: 'debug' | 'info' | 'warn' | 'error'
 */
function MapView({
  userLocation,
  center,
  onCenterChanged,
  onStationsChanged,
  onLoading,
  selectedStationId,
  onSelectStation,
  flags,
  logLevel = 'warn'
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const infoWindowRef = useRef(null);
  const idleTimerRef = useRef(null);

  const { status, error, google } = useGoogleMaps();

  const debug = useCallback((...args) => {
    if (logLevel === 'debug') {
      // eslint-disable-next-line no-console
      console.debug('[MapView]', ...args);
    }
  }, [logLevel]);

  // Initialize map
  useEffect(() => {
    if (status !== 'ready' || !google || mapRef.current || !containerRef.current || !center) return;
    const map = new google.maps.Map(containerRef.current, {
      center,
      zoom: 13,
      mapId: 'nearby-gas-finder',
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: false,
    });
    mapRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();

    // Debounced idle handler
    const handleIdle = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = setTimeout(() => {
        const c = map.getCenter();
        if (c) {
          const nextCenter = { lat: c.lat(), lng: c.lng() };
          onCenterChanged && onCenterChanged(nextCenter);
        }
      }, 500);
    };

    // Dragend and zoom_changed both lead to idle; listen to idle
    map.addListener('idle', handleIdle);
  }, [status, google, center, onCenterChanged]);

  // Sync center externally controlled
  useEffect(() => {
    if (status !== 'ready' || !google || !mapRef.current || !center) return;
    const map = mapRef.current;
    const current = map.getCenter();
    const needsPan = !current || current.lat() !== center.lat || current.lng() !== center.lng;
    if (needsPan) {
      map.panTo(center);
    }
  }, [status, google, center]);

  // User marker
  useEffect(() => {
    if (status !== 'ready' || !google || !mapRef.current) return;
    const map = mapRef.current;

    if (userLocation) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = new google.maps.Marker({
          position: userLocation,
          map,
          title: 'You are here',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#06b6d4',
            fillOpacity: 1,
            scale: 6,
            strokeColor: '#0891b2',
            strokeWeight: 2,
          },
          zIndex: 999,
        });
      } else {
        userMarkerRef.current.setPosition(userLocation);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }
  }, [status, google, userLocation]);

  // Fetch and render stations whenever center changes
  useEffect(() => {
    let alive = true;
    const map = mapRef.current;
    if (status !== 'ready' || !google || !map || !center) return;

    const maxMarkers = 50; // reasonable limit
    const fetchStations = async () => {
      try {
        onLoading && onLoading(true);
        const raw = await searchNearbyGasStations({ google, location: center, radius: 5000, limit: maxMarkers });
        const enriched = await computeDistancesIfEnabled({ google, origins: userLocation ? [userLocation] : [], places: raw, flags });
        if (!alive) return;
        onStationsChanged && onStationsChanged(enriched);
        // Paint markers
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        enriched.forEach((place) => {
          const marker = new google.maps.Marker({
            position: place.geometry?.location || place.location,
            map,
            title: place.name,
          });

          marker.addListener('click', () => {
            onSelectStation && onSelectStation(place);
            if (infoWindowRef.current) {
              infoWindowRef.current.setContent(`
                <div style="min-width:180px">
                  <div style="font-weight:600;margin-bottom:4px">${place.name || 'Station'}</div>
                  ${place.vicinity ? `<div style="font-size:12px;color:#6b7280">${place.vicinity}</div>` : ''}
                  ${place.distanceText ? `<div style="margin-top:6px;font-size:12px"><strong>${place.distanceText}</strong></div>` : ''}
                </div>
              `);
              infoWindowRef.current.open({ map, anchor: marker });
            }
          });

          markersRef.current.push(marker);
        });

      } catch (e) {
        if (!alive) return;
        const msg = 'Failed to load nearby stations. Please try again shortly.';
        onStationsChanged && onStationsChanged([], msg);
        if (logLevel === 'debug') {
          // eslint-disable-next-line no-console
          console.error(e);
        }
      } finally {
        onLoading && onLoading(false);
      }
    };

    fetchStations();

    return () => {
      alive = false;
    };
  }, [status, google, center, userLocation, flags, onStationsChanged, onSelectStation, onLoading, logLevel]);

  // Highlight selected marker
  useEffect(() => {
    if (status !== 'ready' || !google) return;
    markersRef.current.forEach(m => {
      m.setAnimation(null);
    });
    if (selectedStationId && markersRef.current.length > 0) {
      // Optionally animate the selected marker
      const map = mapRef.current;
      const match = markersRef.current.find(m => m.getTitle && m.getTitle() && selectedStationId);
      if (match && map) {
        match.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => match.setAnimation(null), 1400);
      }
    }
  }, [status, google, selectedStationId]);

  return (
    <div className="map-container" style={{ width: '100%', height: '100%' }}>
      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} aria-label="Google Map canvas" />
    </div>
  );
}

export default MapView;
