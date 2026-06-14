import L from 'leaflet';

/**
 * Spherical-earth helpers for drawing pie-slice sectors. Bearings are in
 * degrees from North, clockwise (0 = N, 90 = E, 180 = S, 270 = W).
 */
const EARTH_RADIUS_M = 6_371_000;

/** Point at `distanceMeters` from `center` along the great-circle `bearingDeg`. */
export function destination(
  center: L.LatLng,
  distanceMeters: number,
  bearingDeg: number
): L.LatLng {
  const δ = distanceMeters / EARTH_RADIUS_M;
  const θ = (bearingDeg * Math.PI) / 180;
  const φ1 = (center.lat * Math.PI) / 180;
  const λ1 = (center.lng * Math.PI) / 180;

  const sinφ2 =
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ);
  const φ2 = Math.asin(sinφ2);
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * sinφ2
    );

  return L.latLng((φ2 * 180) / Math.PI, (λ2 * 180) / Math.PI);
}

/** Initial bearing in degrees [0, 360) from `from` to `to`. */
export function bearingTo(from: L.LatLng, to: L.LatLng): number {
  const φ1 = (from.lat * Math.PI) / 180;
  const φ2 = (to.lat * Math.PI) / 180;
  const Δλ = ((to.lng - from.lng) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = (Math.atan2(y, x) * 180) / Math.PI;
  return (θ + 360) % 360;
}

/** Clockwise sweep angle from `start` to `end`, in (0, 360]. */
export function sweepClockwise(startDeg: number, endDeg: number): number {
  const s = ((endDeg - startDeg) % 360 + 360) % 360;
  return s === 0 ? 360 : s;
}

/**
 * Polygon ring approximating a pie slice centred at `center` with the given
 * `radius` (meters) and clockwise arc from `startBearing` to `endBearing`.
 * The ring goes center → arc samples → back to center.
 */
export function sampleSectorPolygon(
  center: L.LatLng,
  radius: number,
  startBearing: number,
  endBearing: number,
  steps = 64
): L.LatLngExpression[] {
  const sweep = sweepClockwise(startBearing, endBearing);
  const pts: L.LatLngExpression[] = [[center.lat, center.lng]];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = destination(center, radius, startBearing + sweep * t);
    pts.push([p.lat, p.lng]);
  }
  return pts;
}
