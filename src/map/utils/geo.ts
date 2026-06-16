// Shared geographic primitives — one source of truth for both map engines.
// Thin wrappers around Turf so the rest of the app deals with simple
// `[lng, lat]` tuples and never has to import Turf directly.

import bearing from '@turf/bearing';
import destination from '@turf/destination';
import distance from '@turf/distance';
import ellipse from '@turf/ellipse';
import sector from '@turf/sector';

/** A GeoJSON-style `[longitude, latitude]` tuple in degrees. */
export type LngLat = [number, number];

/** Great-circle distance in kilometres between two points. */
export function distanceKm(a: LngLat, b: LngLat): number {
  return distance(a, b, { units: 'kilometers' });
}

/** Initial bearing in degrees [0, 360) from `from` to `to` (0 = N, CW). */
export function bearingTo(from: LngLat, to: LngLat): number {
  return (bearing(from, to) + 360) % 360;
}

/** Point reached by travelling `distanceKm` from `center` along `bearingDeg`. */
export function destinationPoint(
  center: LngLat,
  distanceKm: number,
  bearingDeg: number,
): LngLat {
  return destination(center, distanceKm, bearingDeg, { units: 'kilometers' })
    .geometry.coordinates as LngLat;
}

/** Clockwise sweep angle from `start` to `end`, in (0, 360]. */
export function sweepClockwise(startDeg: number, endDeg: number): number {
  const s = (((endDeg - startDeg) % 360) + 360) % 360;
  return s === 0 ? 360 : s;
}

/**
 * Closed ring approximating a pie slice. Ring is `[center, arc samples CW
 * from startBearing, center]`. Equal bearings are treated as a full 360°
 * sweep so the shape stays closed.
 */
export function sectorRing(
  center: LngLat,
  radiusKm: number,
  startBearing: number,
  endBearing: number,
  steps = 64,
): LngLat[] {
  const sweep = sweepClockwise(startBearing, endBearing);
  return sector(center, radiusKm, startBearing, startBearing + sweep, {
    units: 'kilometers',
    steps,
  }).geometry.coordinates[0] as LngLat[];
}

/** Closed ring approximating an ellipse with semi-axes in kilometres. */
export function ellipseRing(
  center: LngLat,
  radiusXKm: number,
  radiusYKm: number,
  steps = 64,
): LngLat[] {
  return ellipse(center, radiusXKm, radiusYKm, {
    units: 'kilometers',
    steps,
  }).geometry.coordinates[0] as LngLat[];
}

/** Total great-circle length of a polyline in kilometres. */
export function lineLengthKm(positions: LngLat[]): number {
  let total = 0;
  for (let i = 1; i < positions.length; i++) {
    total += distanceKm(positions[i - 1], positions[i]);
  }
  return total;
}

/**
 * Spherical-excess area of a polygon ring (km²). Uses the trapezoidal form
 * from Chamberlain & Duquette (NASA, 2007). Accepts open or closed rings.
 */
export function polygonAreaKm2(positions: LngLat[]): number {
  if (positions.length < 3) return 0;
  const last = positions.length - 1;
  const closed =
    positions[0][0] === positions[last][0] &&
    positions[0][1] === positions[last][1];
  const ring = closed ? positions.slice(0, last) : positions;
  const n = ring.length;
  const R = 6371.0088; // mean Earth radius in km

  let sum = 0;
  for (let i = 0; i < n; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[(i + 1) % n];
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    sum += dLng * (Math.sin(phi1) + Math.sin(phi2));
  }
  return (Math.abs(sum) * R * R) / 2;
}

/** Arithmetic mean of `[lng, lat]` points — good enough for label placement. */
export function centroidOf(positions: LngLat[]): LngLat {
  let lng = 0;
  let lat = 0;
  for (const [x, y] of positions) {
    lng += x;
    lat += y;
  }
  return [lng / positions.length, lat / positions.length];
}

/** Format a distance in km as `"1.23 km"` or `"234 m"`. */
export function formatDistance(km: number): string {
  return km >= 1 ? `${km.toFixed(2)} km` : `${(km * 1000).toFixed(0)} m`;
}

/** Format an area in km² as `"1.23 km²"` or `"5,432 m²"`. */
export function formatArea(km2: number): string {
  if (km2 >= 1) return `${km2.toFixed(2)} km²`;
  return `${Math.round(km2 * 1_000_000).toLocaleString()} m²`;
}
