 /**
  * PUBLIC_INTERFACE
  * haversineMeters
  * Computes straight-line distance between two coords in meters.
  */
export function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * PUBLIC_INTERFACE
 * metersToKm
 * Converts meters to kilometers.
 */
export function metersToKm(m) {
  return m / 1000;
}

/**
 * PUBLIC_INTERFACE
 * metersToMiles
 * Converts meters to miles.
 */
export function metersToMiles(m) {
  return m / 1609.344;
}

/**
 * PUBLIC_INTERFACE
 * formatDistance
 * Returns a human-friendly distance string in metric (km/m).
 */
export function formatDistance(meters) {
  if (meters == null || Number.isNaN(meters)) return '';
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = metersToKm(meters);
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

/**
 * PUBLIC_INTERFACE
 * formatDistanceKm
 * Aliased convenience formatter.
 */
export function formatDistanceKm(meters) {
  return formatDistance(meters);
}
