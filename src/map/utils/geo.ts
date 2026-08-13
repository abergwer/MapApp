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
  // turf throws if either semi-axis is 0 (e.g. a zero-size drag). Clamp.
  return ellipse(center, Math.max(radiusXKm, 1e-6), Math.max(radiusYKm, 1e-6), {
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

/** Point a `fraction` (0..1) of the way from `a` to `b`. */
function lerpLngLat(a: LngLat, b: LngLat, fraction: number): LngLat {
  return [
    a[0] + (b[0] - a[0]) * fraction,
    a[1] + (b[1] - a[1]) * fraction,
  ];
}

/**
 * Point at parameter `t` (0..1) on the quadratic Bézier curve that starts at
 * `start`, is pulled toward `control`, and ends at `end`.
 */
function quadBezier(start: LngLat, control: LngLat, end: LngLat, t: number): LngLat {
  const inv = 1 - t;
  const startWeight = inv * inv; //        (1 - t)^2
  const controlWeight = 2 * inv * t; //    2(1 - t)t
  const endWeight = t * t; //              t^2
  return [
    startWeight * start[0] + controlWeight * control[0] + endWeight * end[0],
    startWeight * start[1] + controlWeight * control[1] + endWeight * end[1],
  ];
}

/**
 * Round the sharp turns of a polyline while keeping the segments between
 * turns straight. Each interior vertex is replaced by a small fillet: the
 * path is cut back along both adjacent segments and the corner is bridged
 * with a quadratic Bézier that stays tangent to both segments.
 *
 * The cut-back distance is `radiusFraction` of the shorter adjacent segment
 * (so adjacent fillets never overlap), optionally capped at `maxRadiusKm`.
 * Endpoints are preserved and lines with fewer than 3 points are returned
 * unchanged.
 */
export function roundedCornerPath(
  positions: LngLat[],
  opts?: { radiusFraction?: number; maxRadiusKm?: number; steps?: number },
): LngLat[] {
  const radiusFraction = opts?.radiusFraction ?? 0.25;
  const steps = Math.max(2, opts?.steps ?? 12);

  // Nothing to round without at least one interior corner.
  if (positions.length < 3) return positions.slice();

  // The first point is never moved.
  const rounded: LngLat[] = [positions[0]];

  // Round every interior corner; endpoints (i = 0 and i = last) are left as-is.
  for (let i = 1; i < positions.length - 1; i++) {
    const prev = positions[i - 1];
    const corner = positions[i];
    const next = positions[i + 1];

    const distToPrev = distanceKm(prev, corner);
    const distToNext = distanceKm(corner, next);

    // How far back from the corner to start rounding, along each leg. Using a
    // fraction of the *shorter* leg guarantees neighbouring fillets can't
    // overlap. `maxRadiusKm` optionally caps it to an absolute size.
    let cutBackKm = radiusFraction * Math.min(distToPrev, distToNext);
    if (opts?.maxRadiusKm != null) cutBackKm = Math.min(cutBackKm, opts.maxRadiusKm);

    // Collinear/degenerate corner, or a fillet too small to matter: keep the
    // sharp corner unchanged.
    if (cutBackKm <= 1e-9 || distToPrev <= 1e-9 || distToNext <= 1e-9) {
      rounded.push(corner);
      continue;
    }

    // Where the fillet leaves the incoming leg and where it rejoins the
    // outgoing leg. The corner itself is used as the Bézier control point, so
    // the arc stays tangent to both legs.
    const filletStart = lerpLngLat(corner, prev, cutBackKm / distToPrev);
    const filletEnd = lerpLngLat(corner, next, cutBackKm / distToNext);

    rounded.push(filletStart);
    for (let s = 1; s < steps; s++) {
      rounded.push(quadBezier(filletStart, corner, filletEnd, s / steps));
    }
    rounded.push(filletEnd);
  }

  // The last point is never moved.
  rounded.push(positions[positions.length - 1]);
  return rounded;
}

/**
 * Smooth curve that passes *through* every waypoint (a cardinal spline
 * evaluated as cubic Hermite segments). Unlike `roundedCornerPath`, the line
 * hits each waypoint exactly and curves on the approach so it arrives aligned
 * with the neighbouring legs. At the ends a phantom control point is reflected
 * across the endpoint, so the first and last segments curve too. Lines with
 * fewer than 3 points are returned unchanged.
 *
 * `tension` scales the tangents = how pronounced the curve is:
 *   0    → straight lines (no curve),
 *   0.5  → standard Catmull-Rom,
 *   >0.5 → progressively rounder / more visible curves (may overshoot past a
 *          waypoint on very sharp turns, which reads as a wider, obvious bend).
 * `steps` is the number of samples per segment (higher = smoother).
 */
export function splineThroughPath(
  positions: LngLat[],
  opts?: { steps?: number; tension?: number },
): LngLat[] {
  const steps = Math.max(2, opts?.steps ?? 16);
  const tangentScale = Math.max(0, opts?.tension ?? 0.5);
  const count = positions.length;
  if (count < 3) return positions.slice();

  // The first and last waypoints have no neighbour on one side. Invent one by
  // mirroring the real neighbour across the endpoint (2*pivot - neighbour) so
  // the end segments still get a real tangent and curve.
  const mirror = (pivot: LngLat, neighbour: LngLat): LngLat =>
    [2 * pivot[0] - neighbour[0], 2 * pivot[1] - neighbour[1]];

  const curve: LngLat[] = [positions[0]];

  // Build one cubic Hermite segment between each pair of adjacent waypoints.
  for (let i = 0; i < count - 1; i++) {
    const segStart = positions[i];
    const segEnd = positions[i + 1];
    const before = positions[i - 1] ?? mirror(segStart, segEnd);
    const after = positions[i + 2] ?? mirror(segEnd, segStart);

    // Cardinal-spline tangents: each point's tangent runs from its previous
    // neighbour toward its next neighbour. `tangentScale` sets how strong the
    // curve is (0 = straight, 0.5 = classic Catmull-Rom, higher = rounder).
    const startTangent: LngLat = [
      tangentScale * (segEnd[0] - before[0]),
      tangentScale * (segEnd[1] - before[1]),
    ];
    const endTangent: LngLat = [
      tangentScale * (after[0] - segStart[0]),
      tangentScale * (after[1] - segStart[1]),
    ];

    // Sample the segment. At u = 0 the point is exactly segStart and at u = 1
    // it is exactly segEnd, so the curve always passes through every waypoint.
    for (let s = 1; s <= steps; s++) {
      const u = s / steps;
      const u2 = u * u;
      const u3 = u2 * u;
      // Cubic Hermite basis weights for: start point, start tangent, end
      // point, end tangent.
      const startWeight = 2 * u3 - 3 * u2 + 1;
      const startTangentWeight = u3 - 2 * u2 + u;
      const endWeight = -2 * u3 + 3 * u2;
      const endTangentWeight = u3 - u2;
      curve.push([
        startWeight * segStart[0] +
          startTangentWeight * startTangent[0] +
          endWeight * segEnd[0] +
          endTangentWeight * endTangent[0],
        startWeight * segStart[1] +
          startTangentWeight * startTangent[1] +
          endWeight * segEnd[1] +
          endTangentWeight * endTangent[1],
      ]);
    }
  }
  return curve;
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
