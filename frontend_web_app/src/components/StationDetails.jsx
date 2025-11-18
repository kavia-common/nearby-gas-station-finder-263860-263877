import React from 'react';

/**
 * PUBLIC_INTERFACE
 * StationDetails
 * Displays selected station info and provides a link to open Google Maps directions.
 *
 * Props:
 * - station: object
 * - userLocation: { lat, lng } | null
 * - onClose: function()
 */
function StationDetails({ station, userLocation, onClose }) {
  if (!station) return null;

  const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : '';
  const destination = station.geometry?.location
    ? `${station.geometry.location.lat()},${station.geometry.location.lng()}`
    : station.location
      ? `${station.location.lat},${station.location.lng}`
      : encodeURIComponent(station.vicinity || station.name || '');

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;

  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{station.name || 'Gas station'}</div>
          {station.vicinity && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{station.vicinity}</div>}
          {station.rating != null && <div style={{ marginTop: 6, fontSize: 12 }}>⭐ {station.rating.toFixed(1)} rating</div>}
          {station.distanceText && <div style={{ marginTop: 6, fontSize: 12 }}>Distance: {station.distanceText}</div>}
          {station.durationText && <div style={{ marginTop: 2, fontSize: 12 }}>ETA: {station.durationText}</div>}
        </div>
        <button className="btn" onClick={onClose} aria-label="Close details">Close</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <a
          className="btn"
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open driving directions in Google Maps"
        >
          Directions
        </a>
      </div>
    </div>
  );
}

export default StationDetails;
