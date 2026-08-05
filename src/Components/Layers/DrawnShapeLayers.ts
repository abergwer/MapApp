import { IconLayer, PathLayer, PolygonLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import type { MapShape } from '../../stores/DrawingToolStore';
import { getEntityType } from '../../map/entities/entityTypes';
import { ellipseRing, sectorRing } from '../../map/utils/geo';

/**
 * Map-pin marker for drawn points, inlined as an SVG data URL so there's no
 * atlas image to ship or load. `anchorY` (see below) puts the pin's tip on the
 * coordinate; the fill/stroke live in the SVG since IconLayer can't tint an
 * RGB icon without a mask. Pins are generated per color (entity types color
 * their own points) and cached by color key.
 */
const pinIconCache = new Map<string, string>();
function pinIcon(rgb: [number, number, number]): string {
  const key = rgb.join(',');
  let url = pinIconCache.get(key);
  if (!url) {
    const [r, g, b] = rgb;
    const darker = `rgb(${Math.round(r * 0.55)}, ${Math.round(g * 0.55)}, ${Math.round(b * 0.55)})`;
    const lighter = `rgb(${Math.round(r + (255 - r) * 0.6)}, ${Math.round(g + (255 - g) * 0.6)}, ${Math.round(b + (255 - b) * 0.6)})`;
    url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">` +
      `<path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" ` +
      `fill="rgb(${r}, ${g}, ${b})" stroke="${darker}"  stroke-width="1.5"/>` +
      `<circle cx="12" cy="12" r="4.5" fill="${lighter}"/>` +
      `</svg>`,
    )}`;
    pinIconCache.set(key, url);
  }
  return url;
}

/** Entity-type color if the shape carries one, else the layer default. */
function shapeColor(s: MapShape, fallback: [number, number, number]): [number, number, number] {
  return getEntityType(s.entity?.typeId)?.color ?? fallback;
}

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
      getFillColor: (s) => [...shapeColor(s, [0, 150, 255]), 60],
      getLineColor: (s) => [...shapeColor(s, [0, 150, 255]), 220],
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
      getFillColor: (s) => [...shapeColor(s, [255, 170, 0]), 55],
      getLineColor: (s) => [...shapeColor(s, [255, 170, 0]), 220],
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
      getColor: (s) => [...shapeColor(s, [0, 200, 140]), 230],
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
      getIcon: (s) => ({
        url: pinIcon(shapeColor(s, [0, 122, 255])),
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
