import { IconLayer, PathLayer, PolygonLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import type { MapShape } from '../../stores/DrawingToolStore';
import { ellipseRing, sectorRing, roundedCornerPath, splineThroughPath, exitCurvePath, entryCurvePath } from '../../map/utils/geo';
import config from '../../../config.json';

/**
 * How much of each turn is rounded on a curved route, as a fraction of the
 * shorter adjacent segment. 0 = sharp corner, 0.5 = maximum rounding.
 * Configurable via `RouteCurveRadiusFraction` in config.json; clamped to a
 * safe range with a sensible fallback.
 */
const CURVE_RADIUS_FRACTION = (() => {
  const raw = (config as { RouteCurveRadiusFraction?: number }).RouteCurveRadiusFraction;
  return typeof raw === 'number' && Number.isFinite(raw)
    ? Math.min(0.5, Math.max(0, raw))
    : 0.25;
})();

/**
 * How pronounced the Smooth Route curve is. Multiplies the standard
 * Catmull-Rom tangent (so 1 = standard, 0 = straight, >1 = rounder / more
 * visible bends). Configurable via `SmoothRouteCurviness` in config.json;
 * clamped to a safe range with a sensible fallback.
 */
const SMOOTH_ROUTE_TENSION = (() => {
  const raw = (config as { SmoothRouteCurviness?: number }).SmoothRouteCurviness;
  const curviness =
    typeof raw === 'number' && Number.isFinite(raw) ? Math.min(3, Math.max(0, raw)) : 1.5;
  // Standard Catmull-Rom tangent scale is 0.5; `curviness` scales it.
  return 0.5 * curviness;
})();

/**
 * How far along the outgoing leg an Exit Curve Route takes to straighten out,
 * as a fraction of that leg (0 = no curve, 1 = the whole leg). Configurable
 * via `RouteExitCurveFraction` in config.json; clamped with a sensible
 * fallback.
 */
const EXIT_CURVE_FRACTION = (() => {
  const raw = (config as { RouteExitCurveFraction?: number }).RouteExitCurveFraction;
  return typeof raw === 'number' && Number.isFinite(raw)
    ? Math.min(1, Math.max(0, raw))
    : 0.3;
})();

/**
 * How far back along the incoming leg an Entry Curve Route starts bending, as
 * a fraction of that leg (0 = no curve, 1 = the whole leg). Configurable via
 * `RouteEntryCurveFraction` in config.json; clamped with a sensible fallback.
 */
const ENTRY_CURVE_FRACTION = (() => {
  const raw = (config as { RouteEntryCurveFraction?: number }).RouteEntryCurveFraction;
  return typeof raw === 'number' && Number.isFinite(raw)
    ? Math.min(1, Math.max(0, raw))
    : 0.3;
})();

/**
 * Map-pin marker for drawn points, inlined as an SVG data URL so there's no
 * atlas image to ship or load. `anchorY` (see below) puts the pin's tip on the
 * coordinate; the fill/stroke live in the SVG since IconLayer can't tint an
 * RGB icon without a mask.
 */
const PIN_ICON = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">` +
  `<path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" ` +
  `fill="rgb(0, 122, 255)" stroke="rgb(0, 70, 150)"  stroke-width="1.5"/>` +
  `<circle cx="12" cy="12" r="4.5" fill="rgb(135, 206, 255)"/>` +
  `</svg>`,
)}`;

/**
 * Deck.gl rendering for user-drawn shapes. The shape whose id equals
 * `selectedId` is skipped: while selected it's painted by the map engine as an
 * editable native feature, so rendering it here too would draw it twice.
 * Circle/ellipse/sector have no native geometry, so they're sampled into
 * polygon rings via the shared `geo.ts` helpers. Layers are `pickable` so
 * LayerManager can hit-test them and set the selection.
 */
export function createDrawnShapeLayers(
  shapes: readonly MapShape[],
  selectedId: string | null,
): Layer[] {
  const points: Extract<MapShape, { kind: 'point' }>[] = [];
  const lines: Extract<MapShape, { kind: 'line' | 'route' | 'curvedRoute' | 'splineRoute' | 'exitCurveRoute' | 'entryCurveRoute' }>[] = [];
  const polygons: Extract<MapShape, { kind: 'polygon' }>[] = [];
  const areas: Extract<MapShape, { kind: 'circle' | 'ellipse' | 'sector' }>[] = [];

  for (const s of shapes) {
    if (s.id === selectedId) continue;
    switch (s.kind) {
      case 'point':
        points.push(s);
        break;
      case 'line':
      case 'route':
      case 'curvedRoute':
      case 'splineRoute':
      case 'exitCurveRoute':
      case 'entryCurveRoute':
        lines.push(s);
        break;
      case 'polygon':
        polygons.push(s);
        break;
      case 'circle':
      case 'ellipse':
      case 'sector':
        areas.push(s);
        break;
    }
  }

  return [
    new PolygonLayer({
      id: 'drawn-polygons',
      data: polygons,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 80],
      getPolygon: (s) => s.positions,
      getFillColor: [0, 150, 255, 60],
      getLineColor: [0, 150, 255, 220],
      getLineWidth: 2,
      lineWidthUnits: 'pixels',
      lineWidthMinPixels: 2,
    }),
    new PolygonLayer({
      id: 'drawn-areas',
      data: areas,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 80],
      getPolygon: (s) => areaRing(s),
      getFillColor: [255, 170, 0, 55],
      getLineColor: [255, 170, 0, 220],
      getLineWidth: 2,
      lineWidthUnits: 'pixels',
      lineWidthMinPixels: 2,
    }),
    new PathLayer({
      id: 'drawn-lines',
      data: lines,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 120],
      getPath: (s) =>
        s.kind === 'curvedRoute'
          ? roundedCornerPath(s.positions, { radiusFraction: CURVE_RADIUS_FRACTION })
          : s.kind === 'splineRoute'
            ? splineThroughPath(s.positions, { tension: SMOOTH_ROUTE_TENSION })
            : s.kind === 'exitCurveRoute'
              ? exitCurvePath(s.positions, { fraction: EXIT_CURVE_FRACTION })
              : s.kind === 'entryCurveRoute'
                ? entryCurvePath(s.positions, { fraction: ENTRY_CURVE_FRACTION })
                : s.positions,
      getColor: [0, 200, 140, 230],
      getWidth: 3,
      widthUnits: 'pixels',
      widthMinPixels: 2,
      capRounded: true,
      jointRounded: true,
    }),
    new IconLayer({
      id: 'drawn-points',
      data: points,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 160],
      getPosition: (s) => s.position,
      getIcon: () => ({
        url: PIN_ICON,
        width: 24,
        height: 36,
        anchorY: 36, // pin tip sits exactly on the coordinate
      }),
      getSize: 36,
      sizeUnits: 'pixels',
    }),
  ];
}

/** Layer ids the picker hit-tests against (see LayerManager). */
export const DRAWN_SHAPE_LAYER_IDS = [
  'drawn-polygons',
  'drawn-areas',
  'drawn-lines',
  'drawn-points',
];

/** Sample a circle / ellipse / sector into a closed polygon ring. */
function areaRing(
  s: Extract<MapShape, { kind: 'circle' | 'ellipse' | 'sector' }>,
): [number, number][] {
  switch (s.kind) {
    case 'circle':
      return ellipseRing(s.center, s.radius, s.radius);
    case 'ellipse':
      return ellipseRing(s.center, s.radiusX, s.radiusY);
    case 'sector':
      return sectorRing(s.center, s.radius, s.startBearing, s.endBearing);
  }
}
