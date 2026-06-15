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
