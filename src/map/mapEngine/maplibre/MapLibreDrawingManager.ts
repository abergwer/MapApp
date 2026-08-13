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
import type { MapShape } from '../../../stores/DrawingToolStore';

/**
 * Property name we stamp on every feature so edit events know which
 * `MapShape` variant to rebuild — MapboxDraw stores arbitrary
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
  private onShapeEdited?: (shape: MapShape) => void;
  private onShapeDeleted?: (id: string) => void;
  private onDeselect?: () => void;
  private currentCreateHandler?: (e: any) => void;
  /** Pending timer that arms the background-click deselect after edit starts. */
  private bgClickTimer?: ReturnType<typeof setTimeout>;
  private readonly onKeyDown: (ev: KeyboardEvent) => void;

  /**
   * Clicking empty map background exits edit mode. MapLibre fires `click` on
   * every canvas click, so we use MapboxDraw's `getFeatureIdsAt` to check
   * whether the click landed on a draw feature (the edited shape or a vertex
   * handle). Only a click that hits no draw feature counts as "background".
   */
  private readonly onBackgroundClick = (e: maplibregl.MapMouseEvent): void => {
    const ids = this.draw.getFeatureIdsAt(e.point);
    if (ids.length === 0) this.onDeselect?.();
  };

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
    // `draw.delete` on trash. We rebuild a `MapShape` from the
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

    // Persistent delete handler. MapboxDraw's own keybindings listen on the
    // (unfocused) map canvas, so Delete/Backspace never reaches them and
    // selected shapes can't be removed. Listen on `document` instead so a
    // selected feature trashes regardless of focus. Skip while a route draw
    // owns its own delete handler to avoid double-trash.
    this.onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key !== 'Delete' && ev.key !== 'Backspace') return;
      if (this.cancelCurrentDraw) return;
      const el = ev.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      const mode = this.draw.getMode();
      if (mode !== 'direct_select' && mode !== 'simple_select') return;
      const ids = this.draw.getSelectedIds();
      if (ids.length === 0) return;
      ev.preventDefault();
      // In `direct_select` (the mode a shape enters when selected for editing)
      // `trash()` deletes the selected *vertex*, not the whole feature — so
      // deleting an edited shape silently fails. Switch to `simple_select`,
      // keeping the same features selected, so `trash()` removes the entire
      // feature and fires the `draw.delete` round-trip.
      if (mode === 'direct_select') {
        this.draw.changeMode('simple_select', { featureIds: ids });
      }
      this.draw.trash();
    };
    document.addEventListener('keydown', this.onKeyDown);
  }

  /** Remove the document-level delete listener. Called on engine destroy. */
  dispose(): void {
    document.removeEventListener('keydown', this.onKeyDown);
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
    if (this.currentCreateHandler) {
    this.map.off('draw.create', this.currentCreateHandler);
    this.currentCreateHandler = undefined;
  }
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
  addShape(shape: MapShape): void {
    const feature = shapeToFeature(shape);
    if (!feature) return;
    feature.id = shape.id;
    feature.properties = { ...feature.properties, [KIND_PROP]: shape.kind };
    this.draw.add(feature as any);
  }

  // ── Edit handoff ──────────────────────────────────────────────

  /**
   * Paint the shape as a native feature and select it for editing. Vertex
   * drags / resizes fire `draw.update`, which round-trips back through
   * `onShapeEdited`. The custom `direct_select` (DirectMode) handles
   * circle / ellipse / sector resize.
   */
  beginEdit(shape: MapShape): void {
    this.addShape(shape);
    // `direct_select` edits vertices, so it only accepts vertex-based
    // features (line / polygon / circle / ellipse / sector). A point has no
    // vertices — it moves as a whole — so it uses `simple_select`, which
    // drags the entire feature. Passing a point to `direct_select` throws.
    if (shape.kind === 'point') {
      this.draw.changeMode('simple_select', { featureIds: [shape.id] });
    } else {
      this.draw.changeMode('direct_select', { featureId: shape.id });
    }

    // Arm "click background to exit edit" — deferred one tick so the very
    // click that selected this shape doesn't immediately deselect it.
    this.bgClickTimer = setTimeout(() => {
      this.map.on('click', this.onBackgroundClick);
    }, 0);
  }

  /**
   * Remove the editable native feature; Deck.gl resumes rendering the shape
   * from the store. `draw.delete` (the programmatic API) is silent, so this
   * does NOT fire the `draw.delete` event / `onShapeDeleted` round-trip.
   */
  endEdit(id: string): void {
    // Disarm the background-click deselect (whether armed or still pending).
    if (this.bgClickTimer !== undefined) {
      clearTimeout(this.bgClickTimer);
      this.bgClickTimer = undefined;
    }
    this.map.off('click', this.onBackgroundClick);
    if (this.draw.getMode() !== 'simple_select') {
      this.draw.changeMode('simple_select');
    }
    this.draw.delete(id);
  }

  // ── Round-trip callbacks ─────────────────────────────────────────────

  setOnShapeEdited(callback: (shape: MapShape) => void): void {
    this.onShapeEdited = callback;
  }

  setOnShapeDeleted(callback: (id: string) => void): void {
    this.onShapeDeleted = callback;
  }

  /** Called when the user clicks empty map background while editing. */
  setOnDeselect(callback: () => void): void {
    this.onDeselect = callback;
  }

  // ── Internals ────────────────────────────────────────────────────────

  /** Listen for the next `draw.create`, hand back the feature, then detach. */
  private onceCreate(handler: (feature: any) => void): void {
     if (this.currentCreateHandler) {
    this.map.off('draw.create', this.currentCreateHandler);
  }
    const wrapped = (e: any) => {
      const feature = e.features[0];
      handler(feature);
      this.map.off('draw.create', wrapped);
      this.currentCreateHandler = undefined;
      // In the deck-render-only model the engine keeps no native copy of a
      // finished shape — it now lives in the store and is painted by Deck.gl.
      // Remove MapboxDraw's copy, or the shape is drawn twice (native +
      // Deck.gl) and dragging it shows an "original" ghost at the pre-drag
      // position because the store only catches up on `draw.update` (mouseup).
      // `draw.delete(id)` is silent (no round-trip), so no onShapeDeleted fires.
      if (feature?.id != null) this.draw.delete(String(feature.id));
    };
      this.currentCreateHandler = wrapped;
    this.map.on('draw.create', wrapped);
  }

  /** Stamp a freshly-drawn feature with its `shapeKind`. Returns the id. */
  private tag(feature: any, kind: MapShape['kind']): string {
    const id = String(feature.id);
    this.draw.setFeatureProperty(id, KIND_PROP, kind);
    return id;
  }
}

// ── Pure conversion helpers ────────────────────────────────────────────

/**
 * Convert a `MapShape` into a GeoJSON feature MapboxDraw can
 * accept. Property names mirror the custom draw modes so features added
 * this way behave identically to drawn ones under `direct_select`.
 */
function shapeToFeature(shape: MapShape): GeoJSON.Feature | null {
  switch (shape.kind) {
    case 'point':
      return {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: shape.position },
      };

    case 'line':
    case 'route':
    case 'curvedRoute':
    case 'splineRoute':
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
 * back into a `MapShape`. Uses the `shapeKind` property we stamp
 * on every feature. Returns null for features without it (anything
 * painted outside the engine).
 */
function featureToShape(feature: any): MapShape | null {
  if (!feature) return null;
  const id = feature.id != null ? String(feature.id) : undefined;
  const kind: MapShape['kind'] | undefined = feature.properties?.[KIND_PROP];
  if (!id || !kind) return null;

  switch (kind) {
    case 'point':
      return { id, kind, position: feature.geometry.coordinates };
    case 'line':
    case 'route':
    case 'curvedRoute':
    case 'splineRoute':
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
