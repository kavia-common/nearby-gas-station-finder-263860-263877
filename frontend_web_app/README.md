# Nearby Gas Station Finder (Frontend)

A React web app that uses Google Maps to help users locate nearby gas stations. The app detects the user's current location (with permission), displays stations on the map, and provides distance and directions.

## Features

- Google Maps integration using the official JS API (no extra UI libs)
- User geolocation with permission handling and HTTPS notes
- Nearby gas station listing via Google Places Nearby Search
- Distances via Distance Matrix API (feature-flag toggle) or straight-line fallback
- Directions deep-link to Google Maps
- Debounced map movements to reduce quota usage
- Light, modern UI, accessible focus states, good contrast
- Env-driven configuration (no secrets in code)

## Prerequisites

1. Node.js LTS and npm
2. A Google Cloud project with the following APIs enabled:
   - Maps JavaScript API
   - Places API
   - Distance Matrix API (optional; only if using the feature flag)

3. A Google Maps API key with proper restrictions (HTTP referrers for your domain during production).

## Setup

1. Create a `.env` file in this directory based on `.env.example`:

```
cp .env.example .env
```

2. Edit `.env` and set:
   - REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_KEY
   - Optionally set `REACT_APP_FEATURE_FLAGS=enableDistanceMatrix=true` to use the Distance Matrix API.
   - Optionally set `REACT_APP_LOG_LEVEL=debug` for verbose logs in development.

3. Install dependencies:

```
npm install
```

4. Run locally:

```
npm start
```

- App will open at http://localhost:3000.
- Geolocation requires HTTPS or localhost. If testing over HTTP (non-localhost), your browser will block geolocation.

5. Build for production:

```
npm run build
```

## Security & Permissions

- Do not hardcode API keys. Use environment variables (REACT_APP_GOOGLE_MAPS_API_KEY).
- Restrict your API key in Google Cloud (HTTP referrers).
- The app requests location access. If denied, the app will still function: use map panning/zoom to explore and see stations; distances fall back gracefully.

## Configuration

Environment variables used:

- REACT_APP_GOOGLE_MAPS_API_KEY (required)
- REACT_APP_FEATURE_FLAGS (optional; e.g., `enableDistanceMatrix=true`)
- REACT_APP_LOG_LEVEL (optional; `debug|info|warn|error`)

Other container vars supported but optional:
REACT_APP_API_BASE, REACT_APP_BACKEND_URL, REACT_APP_FRONTEND_URL, REACT_APP_WS_URL, REACT_APP_NODE_ENV, REACT_APP_NEXT_TELEMETRY_DISABLED, REACT_APP_ENABLE_SOURCE_MAPS, REACT_APP_PORT, REACT_APP_TRUST_PROXY, REACT_APP_HEALTHCHECK_PATH, REACT_APP_EXPERIMENTS_ENABLED

## Notes on Quotas

- Nearby Search and Distance Matrix have quotas. This app debounces map idle events and limits markers to reduce usage.
- Use the feature flag to disable Distance Matrix if you want to rely on straight-line distances only.

## Accessibility

- Visible focus styles
- Sufficient color contrast
- ARIA labels for landmark sections and buttons

## Troubleshooting

- "Google Maps API key missing": Ensure `.env` has REACT_APP_GOOGLE_MAPS_API_KEY and restart dev server.
- Geolocation blocked: Use HTTPS or localhost, and enable permissions in your browser.
- No stations found: Zoom out or move the map to a populated area.

