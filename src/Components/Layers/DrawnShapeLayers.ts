import { PathLayer, PolygonLayer, ScatterplotLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import type { MapShape } from '../../stores/DrawingToolStore';
import { ellipseRing, sectorRing } from '../../map/utils/geo';

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
  const lines: Extract<MapShape, { kind: 'line' | 'route' }>[] = [];
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
      getPath: (s) => s.positions,
      getColor: [0, 200, 140, 230],
      getWidth: 3,
      widthUnits: 'pixels',
      widthMinPixels: 2,
      capRounded: true,
      jointRounded: true,
    }),
    new ScatterplotLayer({
      id: 'drawn-points',
      data: points,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 160],
      getPosition: (s) => s.position,
      getRadius: 6,
      radiusUnits: 'pixels',
      getFillColor: [255, 80, 80, 230],
      getLineColor: [120, 0, 0, 255],
      getLineWidth: 1,
      lineWidthUnits: 'pixels',
      stroked: true,
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
