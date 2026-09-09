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
 * Planar unit direction from `a` to `b` in degree space, plus the raw length.
 * Returns `null` when the two points coincide (no meaningful direction). Kept
 * planar (not great-circle) because it is only used for short local curve
 * shaping where the difference is negligible.
 */
function unitDirection(
  a: LngLat,
  b: LngLat,
): { x: number; y: number; length: number } | null {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.hypot(dx, dy);
  if (length <= 1e-12) return null;
  return { x: dx / length, y: dy / length, length };
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
 * Point at parameter `t` (0..1) on the cubic Bézier curve with endpoints
 * `start`/`end` and control points `c1`/`c2`.
 */
function cubicBezier(start: LngLat, c1: LngLat, c2: LngLat, end: LngLat, t: number): LngLat {
  const inv = 1 - t;
  const w0 = inv * inv * inv; //     (1 - t)^3
  const w1 = 3 * inv * inv * t; //   3(1 - t)^2 t
  const w2 = 3 * inv * t * t; //     3(1 - t) t^2
  const w3 = t * t * t; //           t^3
  return [
    w0 * start[0] + w1 * c1[0] + w2 * c2[0] + w3 * end[0],
    w0 * start[1] + w1 * c1[1] + w2 * c2[1] + w3 * end[1],
  ];
}

// ── Route turn styles ────────────────────────────────────────────────────
//
// Every route type is just a rule applied at each interior waypoint. The
// per-corner builders below each return the points that *replace* one
// waypoint, so pieces can be concatenated and the gaps between them are
// straight segments.

/** How a route behaves at one interior waypoint. */
export type TurnStyle = 'sharp' | 'rounded' | 'exit' | 'entry';

/** All turn styles, in display order. */
export const TURN_STYLES: readonly TurnStyle[] = ['sharp', 'rounded', 'exit', 'entry'];

/** Resize a turn list to `count` entries, filling gaps with 'sharp'. */
export function fitTurns(turns: readonly TurnStyle[] | undefined, count: number): TurnStyle[] {
  return Array.from({ length: count }, (_, i) => turns?.[i] ?? 'sharp');
}

export interface TurnOptions {
  /** 'rounded': fillet size as a fraction of the shorter adjacent leg (0..0.5). */
  radiusFraction?: number;
  /** 'exit': how far along the outgoing leg the curve straightens out (0..1). */
  exitFraction?: number;
  /** 'entry': how far back along the incoming leg the curve begins (0..1). */
  entryFraction?: number;
  /** Samples per curve (higher = smoother). */
  steps?: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Fillet that cuts the corner. Backs off `cutIn` (fraction of the incoming
 * leg) and `cutOut` (fraction of the outgoing leg) from the corner and bridges
 * the gap with a quadratic Bézier whose control point is the corner, so the
 * arc is tangent to both legs.
 */
function roundedCorner(
  prev: LngLat,
  corner: LngLat,
  next: LngLat,
  cutIn: number,
  cutOut: number,
  steps: number,
): LngLat[] {
  if (cutIn <= 1e-9 || cutOut <= 1e-9) return [corner];
  const filletStart = lerpLngLat(corner, prev, cutIn);
  const filletEnd = lerpLngLat(corner, next, cutOut);
  const piece: LngLat[] = [filletStart];
  for (let s = 1; s < steps; s++) {
    piece.push(quadBezier(filletStart, corner, filletEnd, s / steps));
  }
  piece.push(filletEnd);
  return piece;
}

/**
 * Exit curve: perfectly straight *into* the corner, then a cubic Bézier that
 * leaves it along the arrival heading and eases onto the outgoing leg,
 * rejoining it `fraction` of the way to `next`. The waypoint is hit exactly.
 */
function exitCurveCorner(
  prev: LngLat,
  corner: LngLat,
  next: LngLat,
  fraction: number,
  steps: number,
): LngLat[] {
  const arrival = unitDirection(prev, corner); //   heading coming into the corner
  const departure = unitDirection(corner, next); // heading leaving the corner
  if (fraction <= 1e-9 || arrival === null || departure === null) return [corner];

  // Where the curve rejoins the outgoing leg. A larger fraction meets the next
  // line deeper and widens the turn instead of bulging further out.
  const curveEnd = lerpLngLat(corner, next, fraction);

  // Half the exit distance keeps the arc gentle so it doesn't arc higher as
  // the turn is widened.
  const handleLen = 0.5 * fraction * departure.length;

  // The entry handle continues the arrival heading, so the curve leaves the
  // corner straight (no kink on the way in). The exit handle sits back along
  // the outgoing heading, so the curve lands on the next leg tangentially.
  const entryHandle: LngLat = [
    corner[0] + handleLen * arrival.x,
    corner[1] + handleLen * arrival.y,
  ];
  const exitHandle: LngLat = [
    curveEnd[0] - handleLen * departure.x,
    curveEnd[1] - handleLen * departure.y,
  ];

  const piece: LngLat[] = [corner];
  for (let s = 1; s <= steps; s++) {
    piece.push(cubicBezier(corner, entryHandle, exitHandle, curveEnd, s / steps));
  }
  return piece;
}

/**
 * Entry curve: the mirror image of `exitCurveCorner` — curve *before* the
 * corner and leave it perfectly straight. Walking the exit curve backwards
 * (next → corner → prev) and reversing the points gives exactly that;
 * `fraction` then refers to the incoming leg.
 */
function entryCurveCorner(
  prev: LngLat,
  corner: LngLat,
  next: LngLat,
  fraction: number,
  steps: number,
): LngLat[] {
  return exitCurveCorner(next, corner, prev, fraction, steps).reverse();
}

/**
 * Route whose turn style can differ at every waypoint. `turns[i]` is the
 * style at `positions[i]`; missing entries default to 'sharp' and the first
 * and last waypoints are always plain endpoints.
 *
 * Neighbouring turns share the leg between them. If together they would use
 * more than the whole leg (e.g. a long exit curve followed by a long entry
 * curve) both are scaled back proportionally so the curves never cross.
 * Lines with fewer than 3 points are returned unchanged.
 */
export function mixedRoutePath(
  positions: LngLat[],
  turns: readonly TurnStyle[],
  opts?: TurnOptions,
): LngLat[] {
  const radiusFraction = clamp(opts?.radiusFraction ?? 0.25, 0, 0.5);
  const exitFraction = clamp(opts?.exitFraction ?? 0.3, 0, 1);
  const entryFraction = clamp(opts?.entryFraction ?? 0.3, 0, 1);
  const steps = Math.max(2, opts?.steps ?? 16);
  const lastIndex = positions.length - 1;
  if (positions.length < 3) return positions.slice();

  const styleAt = (i: number): TurnStyle => turns[i] ?? 'sharp';

  // How much of the legs on either side each corner wants, as fractions of
  // that leg: [share of the incoming leg, share of the outgoing leg].
  const demand: [number, number][] = positions.map((corner, i) => {
    if (i === 0 || i === lastIndex) return [0, 0];
    switch (styleAt(i)) {
      case 'rounded': {
        // A fraction of the *shorter* leg, expressed per leg.
        const legIn = distanceKm(positions[i - 1], corner);
        const legOut = distanceKm(corner, positions[i + 1]);
        if (legIn <= 1e-9 || legOut <= 1e-9) return [0, 0];
        const cutKm = radiusFraction * Math.min(legIn, legOut);
        return [cutKm / legIn, cutKm / legOut];
      }
      case 'exit':
        return [0, exitFraction];
      case 'entry':
        return [entryFraction, 0];
      default:
        return [0, 0];
    }
  });

  // Each leg is shared by the corner before it and the corner after it.
  for (let i = 0; i < lastIndex; i++) {
    const total = demand[i][1] + demand[i + 1][0];
    if (total > 1) {
      demand[i][1] /= total;
      demand[i + 1][0] /= total;
    }
  }

  // Endpoints are never moved; every interior corner is replaced by its piece.
  const path: LngLat[] = [positions[0]];
  for (let i = 1; i < lastIndex; i++) {
    const prev = positions[i - 1];
    const corner = positions[i];
    const next = positions[i + 1];
    const [shareIn, shareOut] = demand[i];
    switch (styleAt(i)) {
      case 'rounded':
        path.push(...roundedCorner(prev, corner, next, shareIn, shareOut, steps));
        break;
      case 'exit':
        path.push(...exitCurveCorner(prev, corner, next, shareOut, steps));
        break;
      case 'entry':
        path.push(...entryCurveCorner(prev, corner, next, shareIn, steps));
        break;
      default:
        path.push(corner);
    }
  }
  path.push(positions[lastIndex]);
  return path;
}

/** The same turn style at every waypoint. */
const uniformTurns = (positions: LngLat[], style: TurnStyle): TurnStyle[] =>
  positions.map(() => style);

/**
 * Round every turn of a polyline while keeping the legs straight (a fillet at
 * each interior waypoint, cutting the corner). `radiusFraction` is the fillet
 * size as a fraction of the shorter adjacent leg (0 = sharp, 0.5 = maximum).
 */
export function roundedCornerPath(
  positions: LngLat[],
  opts?: { radiusFraction?: number; steps?: number },
): LngLat[] {
  return mixedRoutePath(positions, uniformTurns(positions, 'rounded'), {
    radiusFraction: opts?.radiusFraction,
    steps: opts?.steps ?? 12,
  });
}

/**
 * Route that is straight *into* every waypoint and curves only *after* it,
 * straightening out `fraction` of the way along the next leg.
 */
export function exitCurvePath(
  positions: LngLat[],
  opts?: { fraction?: number; steps?: number },
): LngLat[] {
  return mixedRoutePath(positions, uniformTurns(positions, 'exit'), {
    exitFraction: opts?.fraction,
    steps: opts?.steps,
  });
}

/**
 * Route that curves *before* every waypoint (starting `fraction` of the way
 * back along the incoming leg) and leaves it perfectly straight.
 */
export function entryCurvePath(
  positions: LngLat[],
  opts?: { fraction?: number; steps?: number },
): LngLat[] {
  return mixedRoutePath(positions, uniformTurns(positions, 'entry'), {
    entryFraction: opts?.fraction,
    steps: opts?.steps,
  });
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
