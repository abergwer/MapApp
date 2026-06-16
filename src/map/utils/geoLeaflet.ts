// Leaflet-flavoured adapter on top of `./geo`. Lets the Leaflet tools keep
// working with `L.LatLng` and metres while the underlying math lives in one
// place (Turf, via `./geo`).

import L from 'leaflet';
import {
  bearingTo as _bearingTo,
  destinationPoint,
  distanceKm,
  ellipseRing,
  sectorRing,
  sweepClockwise,
  type LngLat,
} from './geo';

const M_PER_KM = 1000;

const toLngLat = (p: L.LatLng): LngLat => [p.lng, p.lat];
const fromLngLat = ([lng, lat]: LngLat): L.LatLng => L.latLng(lat, lng);

/** Initial bearing in degrees [0, 360) from `from` to `to`. */
export function bearingTo(from: L.LatLng, to: L.LatLng): number {
  return _bearingTo(toLngLat(from), toLngLat(to));
}

/** Point at `distanceMeters` from `center` along the great-circle `bearingDeg`. */
export function destination(
  center: L.LatLng,
  distanceMeters: number,
  bearingDeg: number,
): L.LatLng {
  return fromLngLat(
    destinationPoint(toLngLat(center), distanceMeters / M_PER_KM, bearingDeg),
  );
}

/**
 * Local equirectangular scale at `lat` — degrees of lat/lng per metre.
 * Used by the Leaflet ellipse tool to place its 4 cardinal edit handles.
 */
export function latLngScaleAt(lat: number): {
  latPerMeter: number;
  lngPerMeter: number;
} {
  return {
    latPerMeter: 1 / 111_320,
    lngPerMeter: 1 / (111_320 * Math.cos((lat * Math.PI) / 180)),
  };
}

/**
 * Polygon ring approximating a pie slice. `radius` is in metres, ring goes
 * center → arc samples (CW from `startBearing`) → back to center.
 */
export function sampleSectorPolygon(
  center: L.LatLng,
  radius: number,
  startBearing: number,
  endBearing: number,
  steps = 64,
): L.LatLngExpression[] {
  return sectorRing(
    toLngLat(center),
    radius / M_PER_KM,
    startBearing,
    endBearing,
    steps,
  ).map(([lng, lat]): L.LatLngExpression => [lat, lng]);
}

/** Polygon approximation of an ellipse with semi-axes in metres. */
export function sampleEllipsePolygon(
  center: L.LatLng,
  radiusX: number,
  radiusY: number,
  steps = 64,
): L.LatLngExpression[] {
  return ellipseRing(
    toLngLat(center),
    radiusX / M_PER_KM,
    radiusY / M_PER_KM,
    steps,
  ).map(([lng, lat]): L.LatLngExpression => [lat, lng]);
}

/**
 * Given two opposite corners of an axis-aligned bounding box, returns the
 * center latlng and the two semi-axes (radiusX, radiusY) in metres.
 */
export function bboxToCenterAndRadii(
  a: L.LatLng,
  b: L.LatLng,
): { center: L.LatLng; radiusX: number; radiusY: number } {
  const center = L.latLng((a.lat + b.lat) / 2, (a.lng + b.lng) / 2);
  const radiusX = distanceKm(toLngLat(center), [b.lng, center.lat]) * M_PER_KM;
  const radiusY = distanceKm(toLngLat(center), [center.lng, b.lat]) * M_PER_KM;
  return { center, radiusX, radiusY };
}

export { sweepClockwise };
