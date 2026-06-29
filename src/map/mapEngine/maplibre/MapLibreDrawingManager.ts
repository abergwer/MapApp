import type maplibregl from 'maplibre-gl/dist/maplibre-gl.js';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import {
  CircleMode,
  DragCircleMode,
  DirectMode,
  SimpleSelectMode,
} from 'maplibre-gl-draw-circle';
import { DragEllipseMode } from '../../utils/MaplibreEllipseMath';
import { DragSectorMode } from '../../utils/MaplibreSectorMath';
import { startMaplibreRouteDraw } from '../../utils/MaplibreRouteTool';
import { drawStyles } from '../../drawStyles';
import { ellipseRing, sectorRing } from '../../utils/geo';
import type { CompletedShape } from '../../../stores/DrawingToolStore';

/**
 * Property name we stamp on every feature so edit events know which
 * `CompletedShape` variant to rebuild — MapboxDraw stores arbitrary
 * properties alongside its features, so we piggyback on that.
 */
const KIND_PROP = 'shapeKind';

/**
 * Owns every drawing concern for the MapLibre engine: the MapboxDraw
 * instance, all draw modes (built-in + custom ellipse/sector/circle),
 * route tool, the `addShape` pipeline for external shapes, and the
 * `draw.update` / `draw.delete` round-trip back to the engine.
 *
 * Exposes a `getDraw()` accessor so the engine's measurement manager
 * can reuse the same MapboxDraw instance — MapLibre allows only one.
 */
export class MapLibreDrawingManager {
  private readonly map: maplibregl.Map;
  private readonly draw: MapboxDraw;
  private cancelCurrentDraw?: () => void;
  private onShapeEdited?: (shape: CompletedShape) => void;
  private onShapeDeleted?: (id: string) => void;

  constructor(map: maplibregl.Map) {
    this.map = map;
    this.draw = new MapboxDraw({
      defaultMode: 'simple_select',
      userProperties: true,
      modes: {
        ...MapboxDraw.modes,
        draw_polygon: MapboxDraw.modes.draw_polygon,
        draw_circle: CircleMode,
        drag_circle: DragCircleMode,
        direct_select: DirectMode,
        simple_select: SimpleSelectMode,
        drag_ellipse: DragEllipseMode,
        drag_sector: DragSectorMode,
      },
      displayControlsDefault: false,
      styles: drawStyles,
    });
    map.addControl(this.draw as any);

    // MapboxDraw fires `draw.update` after every vertex drag / resize and
    // `draw.delete` on trash. We rebuild a `CompletedShape` from the
    // feature's tagged `shapeKind` + geometry and forward to the engine.
    map.on('draw.update', (e: any) => {
      for (const feature of e.features ?? []) {
        const shape = featureToShape(feature);
        if (shape) this.onShapeEdited?.(shape);
      }
    });
    map.on('draw.delete', (e: any) => {
      for (const feature of e.features ?? []) {
        if (feature?.id != null) this.onShapeDeleted?.(String(feature.id));
      }
    });
  }

  /** Shared with the measurement manager; MapLibre allows only one Draw. */
  getDraw(): MapboxDraw {
    return this.draw;
  }

  // ── Draw flow ────────────────────────────────────────────────────────

  startDrawPoint(onComplete: (id: string, position: [number, number]) => void): void {
    this.draw.changeMode('draw_point');
    this.onceCreate((feature) => {
      const id = this.tag(feature, 'point');
      onComplete(id, feature.geometry.coordinates as [number, number]);
    });
  }

  startDrawLine(onComplete: (id: string, positions: [number, number][]) => void): void {
    this.draw.changeMode('draw_line_string');
    this.onceCreate((feature) => {
      const id = this.tag(feature, 'line');
      onComplete(id, feature.geometry.coordinates as [number, number][]);
    });
  }

  startDrawPolygon(onComplete: (id: string, positions: [number, number][]) => void): void {
    this.draw.changeMode('draw_polygon');
    this.onceCreate((feature) => {
      const id = this.tag(feature, 'polygon');
      onComplete(id, feature.geometry.coordinates[0] as [number, number][]);
    });
  }

  startDrawCircle(
    onComplete: (id: string, center: [number, number], radius: number) => void,
  ): void {
    this.draw.changeMode('draw_circle', { initialRadiusInKm: 5 });
    this.onceCreate((feature) => {
      const id = this.tag(feature, 'circle');
      onComplete(id, feature.properties.center, feature.properties.radiusInKm);
    });
  }

  startDrawEllipse(
    onComplete: (
      id: string,
      center: [number, number],
      radiusX: number,
      radiusY: number,
    ) => void,
  ): void {
    this.draw.changeMode('drag_ellipse' as any);
    this.onceCreate((feature) => {
      const id = this.tag(feature, 'ellipse');
      onComplete(
        id,
        feature.properties.center,
        feature.properties.radiusXInKm,
        feature.properties.radiusYInKm,
      );
    });
  }

  startDrawSector(
    onComplete: (
      id: string,
      center: [number, number],
      radius: number,
      startBearing: number,
      endBearing: number,
    ) => void,
  ): void {
    this.draw.changeMode('drag_sector' as any);
    this.onceCreate((feature) => {
      const id = this.tag(feature, 'sector');
      onComplete(
        id,
        feature.properties.center,
        feature.properties.radiusInKm,
        feature.properties.startBearing,
        feature.properties.endBearing,
      );
    });
  }

  startDrawRoute(onComplete: (id: string, positions: [number, number][]) => void): void {
    // Tear down any prior route draw first — otherwise its document keydown
    // listener lingers and every route stacks another `draw.trash()` on
    // Delete, firing `draw.update` once per route still alive.
    this.cancelCurrentDraw?.();
    this.cancelCurrentDraw = startMaplibreRouteDraw(this.map, this.draw, (id, positions) => {
      this.draw.setFeatureProperty(id, KIND_PROP, 'route');
      onComplete(id, positions);
    });
  }

  cancelDrawing(): void {
    this.cancelCurrentDraw?.();
    this.cancelCurrentDraw = undefined;
    if (this.draw.getMode() !== 'simple_select') {
      this.draw.changeMode('simple_select');
    }
  }

  // ── External shapes ──────────────────────────────────────────────────

  /**
   * Paint a shape produced outside the draw flow. Handed straight to
   * MapboxDraw, the same source the draw modes write into — so it
   * paints, selects, and edits with the identical pipeline as a
   * user-drawn shape.
   *
   * For non-GeoJSON-native kinds (circle / ellipse / sector) we set the
   * same `isCircle`/`isEllipse`/`isSector` + radius properties the
   * custom draw modes set, which keeps the patched `direct_select`
   * resize/rotate handlers working.
   */
  addShape(shape: CompletedShape): void {
    const feature = shapeToFeature(shape);
    if (!feature) return;
    feature.id = shape.id;
    feature.properties = { ...feature.properties, [KIND_PROP]: shape.kind };
    this.draw.add(feature as any);
  }

  // ── Round-trip callbacks ─────────────────────────────────────────────

  setOnShapeEdited(callback: (shape: CompletedShape) => void): void {
    this.onShapeEdited = callback;
  }

  setOnShapeDeleted(callback: (id: string) => void): void {
    this.onShapeDeleted = callback;
  }

  // ── Internals ────────────────────────────────────────────────────────

  /** Listen for the next `draw.create`, hand back the feature, then detach. */
  private onceCreate(handler: (feature: any) => void): void {
    const wrapped = (e: any) => {
      handler(e.features[0]);
      this.map.off('draw.create', wrapped);
    };
    this.map.on('draw.create', wrapped);
  }

  /** Stamp a freshly-drawn feature with its `shapeKind`. Returns the id. */
  private tag(feature: any, kind: CompletedShape['kind']): string {
    const id = String(feature.id);
    this.draw.setFeatureProperty(id, KIND_PROP, kind);
    return id;
  }
}

// ── Pure conversion helpers ────────────────────────────────────────────

/**
 * Convert a `CompletedShape` into a GeoJSON feature MapboxDraw can
 * accept. Property names mirror the custom draw modes so features added
 * this way behave identically to drawn ones under `direct_select`.
 */
function shapeToFeature(shape: CompletedShape): GeoJSON.Feature | null {
  switch (shape.kind) {
    case 'point':
      return {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: shape.position },
      };

    case 'line':
    case 'route':
      return {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: shape.positions },
      };

    case 'polygon': {
      // GeoJSON polygon rings must be closed.
      const ring = shape.positions;
      const closed =
        ring.length > 0 &&
        (ring[0][0] !== ring[ring.length - 1][0] ||
          ring[0][1] !== ring[ring.length - 1][1])
          ? [...ring, ring[0]]
          : ring;
      return {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [closed] },
      };
    }

    case 'circle':
      return {
        type: 'Feature',
        properties: {
          isCircle: true,
          center: shape.center,
          radiusInKm: shape.radius,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [ellipseRing(shape.center, shape.radius, shape.radius)],
        },
      };

    case 'ellipse':
      return {
        type: 'Feature',
        properties: {
          isEllipse: true,
          center: shape.center,
          radiusXInKm: shape.radiusX,
          radiusYInKm: shape.radiusY,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [ellipseRing(shape.center, shape.radiusX, shape.radiusY)],
        },
      };

    case 'sector':
      return {
        type: 'Feature',
        properties: {
          isSector: true,
          center: shape.center,
          radiusInKm: shape.radius,
          startBearing: shape.startBearing,
          endBearing: shape.endBearing,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            sectorRing(shape.center, shape.radius, shape.startBearing, shape.endBearing),
          ],
        },
      };
  }
}

/**
 * Inverse of `shapeToFeature`: read a MapboxDraw feature (post-edit)
 * back into a `CompletedShape`. Uses the `shapeKind` property we stamp
 * on every feature. Returns null for features without it (anything
 * painted outside the engine).
 */
function featureToShape(feature: any): CompletedShape | null {
  if (!feature) return null;
  const id = feature.id != null ? String(feature.id) : undefined;
  const kind: CompletedShape['kind'] | undefined = feature.properties?.[KIND_PROP];
  if (!id || !kind) return null;

  switch (kind) {
    case 'point':
      return { id, kind, position: feature.geometry.coordinates };
    case 'line':
    case 'route':
      return { id, kind, positions: feature.geometry.coordinates };
    case 'polygon':
      return { id, kind, positions: feature.geometry.coordinates[0] };
    case 'circle':
      return {
        id,
        kind,
        center: feature.properties.center,
        radius: feature.properties.radiusInKm,
      };
    case 'ellipse':
      return {
        id,
        kind,
        center: feature.properties.center,
        radiusX: feature.properties.radiusXInKm,
        radiusY: feature.properties.radiusYInKm,
      };
    case 'sector':
      return {
        id,
        kind,
        center: feature.properties.center,
        radius: feature.properties.radiusInKm,
        startBearing: feature.properties.startBearing,
        endBearing: feature.properties.endBearing,
      };
  }
}
