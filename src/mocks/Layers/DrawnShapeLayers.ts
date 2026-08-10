import { IconLayer, PathLayer, PolygonLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import type { MapShape } from '../../stores/DrawingToolStore';
import {
  entityIconUrl,
  type EntityDefinition,
} from '../../Components/features/entities/entityDefinitions';
import { ellipseRing, sectorRing } from '../../map/utils/geo';

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

/** Resolves a shape's entity-type definition, when it has one. */
export type GetEntityDefinition = (defId: string | undefined) => EntityDefinition | undefined;

/** '#rrggbb' → [r, g, b, alpha]. */
function hexToRgba(hex: string, alpha: number): [number, number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
    alpha,
  ];
}

// Fallback styling for shapes without an entity-type definition.
const POLYGON_COLOR = '#0096ff';
const AREA_COLOR = '#ffaa00';
const LINE_COLOR = '#00c88c';

/**
 * Deck.gl rendering for user-drawn shapes. The shape whose id equals
 * `selectedId` is skipped: while selected it's painted by the map engine as an
 * editable native feature, so rendering it here too would draw it twice.
 * Circle/ellipse/sector have no native geometry, so they're sampled into
 * polygon rings via the shared `geo.ts` helpers. Layers are `pickable` so
 * LayerManager can hit-test them and set the selection.
 *
 * Shapes tagged with a `defId` render with their entity-type's graphic:
 * points show the definition's icon (tinted when it's a mask), other
 * geometry strokes/fills with the definition's color.
 */
export function createDrawnShapeLayers(
  shapes: readonly MapShape[],
  selectedId: string | null,
  getDef: GetEntityDefinition = () => undefined,
): Layer[] {
  const points: Extract<MapShape, { kind: 'point' }>[] = [];
  const lines: Extract<MapShape, { kind: 'line' }>[] = [];
  const polygons: Extract<MapShape, { kind: 'polygon' }>[] = [];
  const areas: Extract<MapShape, { kind: 'circle' | 'ellipse' | 'sector' }>[] = [];

  for (const s of shapes) {
    if (s.id === selectedId) continue;
    switch (s.kind) {
      case 'point':
        points.push(s);
        break;
      case 'line':
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

  const fillColor = (s: MapShape, fallback: string, alpha: number) =>
    hexToRgba(getDef(s.defId)?.color ?? fallback, alpha);

  return [
    new PolygonLayer({
      id: 'drawn-polygons',
      data: polygons,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 80],
      getPolygon: (s) => s.positions,
      getFillColor: (s) => fillColor(s, POLYGON_COLOR, 60),
      getLineColor: (s) => fillColor(s, POLYGON_COLOR, 220),
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
      getFillColor: (s) => fillColor(s, AREA_COLOR, 55),
      getLineColor: (s) => fillColor(s, AREA_COLOR, 220),
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
      getColor: (s) => fillColor(s, LINE_COLOR, 230),
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
      getIcon: (s) => {
        const def = getDef(s.defId);
        if (def) {
          // Entity icons are centered on the coordinate; monochrome
          // built-ins get tinted via mask, uploads keep their colors.
          return { url: entityIconUrl(def), width: 64, height: 64, mask: def.iconMask !== false };
        }
        return {
          url: PIN_ICON,
          width: 24,
          height: 36,
          anchorY: 36, // pin tip sits exactly on the coordinate
        };
      },
      getColor: (s) => {
        const def = getDef(s.defId);
        return def && def.iconMask !== false ? hexToRgba(def.color, 255) : [255, 255, 255, 255];
      },
      getSize: (s) => (getDef(s.defId) ? 28 : 36),
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
