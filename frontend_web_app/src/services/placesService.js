import { formatDistance, haversineMeters } from '../utils/distance';

/**
 * PUBLIC_INTERFACE
 * searchNearbyGasStations
 * Uses Google Maps Places Nearby Search to find gas stations near a location.
 *
 * @param {{ google:any, location:{lat:number,lng:number}, radius:number, limit?:number }} params
 * @returns {Promise<Array<any>>}
 */
export function searchNearbyGasStations({ google, location, radius = 5000, limit = 50 }) {
  return new Promise((resolve, reject) => {
    try {
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      const request = {
        location: new google.maps.LatLng(location.lat, location.lng),
        radius,
        type: ['gas_station']
      };
      service.nearbySearch(request, (results, status, pagination) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !Array.isArray(results)) {
          return reject(new Error('Places nearby search failed'));
        }
        const trimmed = results.slice(0, limit);
        resolve(trimmed);
      });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * PUBLIC_INTERFACE
 * computeDistancesIfEnabled
 * Optionally computes distance and duration using Distance Matrix if feature-flagged;
 * otherwise uses straight-line distance as a fallback.
 *
 * Flags: { enableDistanceMatrix?: boolean }
 *
 * @param {{ google:any, origins:Array<{lat:number,lng:number}>, places:Array<any>, flags:Record<string,any> }} params
 * @returns {Promise<Array<any>>}
 */
export async function computeDistancesIfEnabled({ google, origins = [], places = [], flags = {} }) {
  const enableDM = Boolean(flags.enableDistanceMatrix);
  if (enableDM && origins.length > 0 && places.length > 0) {
    try {
      const service = new google.maps.DistanceMatrixService();
      const origin = origins[0];
      const destinations = places.map((p) => {
        const loc = p.geometry?.location;
        if (loc && typeof loc.lat === 'function') {
          return loc;
        }
        if (p.location) {
          return new google.maps.LatLng(p.location.lat, p.location.lng);
        }
        // fallback to text address
        return p.vicinity || p.name;
      });

      const response = await new Promise((resolve, reject) => {
        service.getDistanceMatrix(
          {
            origins: [new google.maps.LatLng(origin.lat, origin.lng)],
            destinations,
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC
          },
          (res, status) => {
            if (status !== 'OK' || !res) return reject(new Error('Distance Matrix failed'));
            resolve(res);
          }
        );
      });

      const distances = response.rows?.[0]?.elements || [];
      return places.map((p, idx) => {
        const el = distances[idx];
        const dmMeters = el?.distance?.value;
        const dmText = el?.distance?.text;
        const durText = el?.duration?.text;
        return {
          ...p,
          distanceMeters: typeof dmMeters === 'number' ? dmMeters : undefined,
          distanceText: dmText || (typeof dmMeters === 'number' ? formatDistance(dmMeters) : undefined),
          durationText: durText
        };
      });
    } catch {
      // fall through to haversine
    }
  }

  // Haversine fallback
  const origin = origins[0];
  return places.map((p) => {
    let meters;
    const loc = p.geometry?.location;
    if (origin && loc && typeof loc.lat === 'function') {
      meters = haversineMeters(origin.lat, origin.lng, loc.lat(), loc.lng());
    } else if (origin && p.location) {
      meters = haversineMeters(origin.lat, origin.lng, p.location.lat, p.location.lng);
    }
    return {
      ...p,
      distanceMeters: typeof meters === 'number' ? meters : undefined,
      distanceText: typeof meters === 'number' ? formatDistance(meters) : undefined
    };
  });
}
