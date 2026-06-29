import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import {
  createLeafletEllipseTool,
  type EllipseLayer,
  type LeafletEllipseTool,
} from '../../utils/leafletEllipseTool';
import {
  createLeafletSectorTool,
  type LeafletSectorTool,
  type SectorLayer,
} from '../../utils/leafletSectorTool';
import type { MapShape } from '../../../stores/DrawingToolStore';
import { newShapeId } from '../../../stores/DrawingToolStore';

/** Leaflet primitives work in metres; the store is unit-canonical in km. */
const KM_TO_M = 1000;

/** Tags we stamp on every drawn layer so edit events can rebuild the shape. */
type TaggedLayer = L.Layer & {
  _shapeId?: string;
  _shapeKind?: MapShape['kind'];
};

/**
 * Owns every drawing concern for the Leaflet engine: Geoman draw modes,
 * custom ellipse + sector tools, layer tagging, edit-mode toggle, and the
 * edit/delete round-trip back to the engine's `onShapeEdited` /
 * `onShapeDeleted` callbacks.
 *
 * The engine itself is a thin orchestrator that creates this manager
 * during `initialize()` and delegates the `MapEngine` draw methods to it.
 */
export class LeafletDrawingManager {
  private readonly map: L.Map;
  private readonly ellipseTool: LeafletEllipseTool;
  private readonly sectorTool: LeafletSectorTool;
  private onShapeEdited?: (shape: MapShape) => void;
  private onShapeDeleted?: (id: string) => void;
  private selectedLayer?: TaggedLayer;
  private editMode = false;
  private readonly onKeyDown: (ev: KeyboardEvent) => void;

  constructor(map: L.Map) {
    this.map = map;
    this.ellipseTool = createLeafletEllipseTool(map);
    this.sectorTool = createLeafletSectorTool(map);

    // Geoman fires `pm:edit` on the layer with `propagate: false`, so it
    // never reaches the map. We attach the listener per-layer in
    // `stampTags` instead. `pm:remove`, by contrast, is fired on both
    // the layer AND the map by Geoman, so a single map-level listener
    // covers Geoman-managed deletions. The ellipse + sector tools fire
    // their own callback for their custom drag handles.
    map.on('pm:remove', (e: any) => this.emitDelete(e.layer as TaggedLayer));
    this.ellipseTool.setOnEdit((layer) => this.emitEdit(layer as TaggedLayer));
    this.sectorTool.setOnEdit((layer) => this.emitEdit(layer as TaggedLayer));

    // Delete/Backspace removes the selected shape. Geoman's edit mode has no
    // key-to-delete and `map.keyboard.disable()` kills Leaflet's own, so a
    // document listener is the only reliable hook — and ellipse/sector layers
    // are `pmIgnore` so removal mode skips them entirely. Only active in edit
    // mode (a layer must be selected by click via `stampTags`).
    this.onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key !== 'Delete' && ev.key !== 'Backspace') return;
      if (!this.selectedLayer) return;
      ev.preventDefault();
      this.deleteSelected();
    };
    document.addEventListener('keydown', this.onKeyDown);
  }

  /** Remove the document-level delete listener. Called on engine destroy. */
  dispose(): void {
    document.removeEventListener('keydown', this.onKeyDown);
  }

  // ── Draw flow ────────────────────────────────────────────────────────

  startDrawPoint(onComplete: (id: string, position: [number, number]) => void): void {
    // `continueDrawing: false` ensures the draw tool disables itself after
    // the first marker is placed, so the user gets exactly one point.
    this.map.pm.enableDraw('Marker', { continueDrawing: false });
    this.onceCreate((layer) => {
      const id = this.tag(layer, 'point');
      const { lat, lng } = (layer as L.Marker).getLatLng();
      onComplete(id, [lng, lat]);
    });
  }

  startDrawLine(onComplete: (id: string, positions: [number, number][]) => void): void {
    this.map.pm.enableDraw('Line', { hideMiddleMarkers: true });
    this.onceCreate((layer) => {
      const id = this.tag(layer, 'line');
      onComplete(id, latLngsToCoords(layer as L.Polyline));
    });
  }

  startDrawPolygon(onComplete: (id: string, positions: [number, number][]) => void): void {
    this.map.pm.enableDraw('Polygon');
    this.onceCreate((layer) => {
      const id = this.tag(layer, 'polygon');
      onComplete(id, polygonRingToCoords(layer as L.Polygon));
    });
  }

  startDrawCircle(
    onComplete: (id: string, center: [number, number], radius: number) => void,
  ): void {
    this.map.pm.enableDraw('Circle');
    this.onceCreate((layer) => {
      const id = this.tag(layer, 'circle');
      const c = (layer as L.Circle).getLatLng();
      // Leaflet circles return metres; the store is unit-canonical in km.
      onComplete(id, [c.lng, c.lat], (layer as L.Circle).getRadius() / KM_TO_M);
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
    // The custom tool commits a layer to the map BEFORE firing onComplete,
    // so we have to find that fresh layer (the only ellipse on the map
    // without a `_shapeId` yet) to tag it.
    this.ellipseTool.startDraw(({ center, radiusX, radiusY }) => {
      const layer = this.findUntaggedEllipseOrSector('ellipse');
      const id = layer ? this.tag(layer, 'ellipse') : newShapeId();
      onComplete(id, center, radiusX / KM_TO_M, radiusY / KM_TO_M);
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
    this.sectorTool.startDraw(({ center, radius, startBearing, endBearing }) => {
      const layer = this.findUntaggedEllipseOrSector('sector');
      const id = layer ? this.tag(layer, 'sector') : newShapeId();
      onComplete(id, center, radius / KM_TO_M, startBearing, endBearing);
    });
  }

  startDrawRoute(onUpdate: (id: string, positions: [number, number][]) => void): void {
    this.map.pm.enableDraw('Line', { hideMiddleMarkers: true });
    this.onceCreate((layer) => {
      const polyline = layer as L.Polyline;
      const id = this.tag(polyline, 'route');
      onUpdate(id, latLngsToCoords(polyline));
    });
  }

  cancelDrawing(): void {
    this.ellipseTool.cancelDraw();
    this.sectorTool.cancelDraw();
    this.map.pm.disableDraw();
  }

  // ── External shapes ──────────────────────────────────────────────────

  /**
   * Paint a shape produced outside the draw flow (server feed, persisted
   * state, demo seeds). Same primitives + tagging as drawn shapes — the
   * result is editable identically.
   */
  addShape(shape: MapShape): void {
    const layer = this.buildShapeLayer(shape);
    this.stampTags(layer, shape.id, shape.kind);
    layer.addTo(this.map);
  }

  // ── Edit mode ────────────────────────────────────────────────────────

  /**
   * Toggle Geoman's global edit plus our custom ellipse/sector editors.
   * Cancels any in-progress drawing first and freezes map panning so
   * dragging edit handles can't accidentally pan the basemap.
   */
  setEditMode(enabled: boolean): void {
    const map = this.map;
    this.editMode = enabled;
    if (enabled) {
      this.cancelDrawing();
      map.dragging.disable();
      map.doubleClickZoom.disable();
      map.keyboard.disable();
      this.ellipseTool.enableEdit();
      this.sectorTool.enableEdit();
      // Ellipse + sector polygons are tagged `pmIgnore`, so Geoman's
      // global edit skips them. `hideMiddleMarkers` suppresses the
      // "add-a-vertex" ghost handles between real vertices.
      map.pm.enableGlobalEditMode({
        allowSelfIntersection: false,
        hideMiddleMarkers: true,
      });
    } else {
      map.pm.disableGlobalEditMode();
      this.ellipseTool.disableEdit();
      this.sectorTool.disableEdit();
      this.selectedLayer = undefined;
      map.dragging.enable();
      map.doubleClickZoom.enable();
      map.keyboard.enable();
    }
  }

  // ── Round-trip callbacks ─────────────────────────────────────────────

  setOnShapeEdited(callback: (shape: MapShape) => void): void {
    this.onShapeEdited = callback;
  }

  setOnShapeDeleted(callback: (id: string) => void): void {
    this.onShapeDeleted = callback;
  }

  // ── Internals ────────────────────────────────────────────────────────

  /** Listen for the next `pm:create`, tag the layer, then detach. */
  private onceCreate(handler: (layer: L.Layer) => void): void {
    const wrapped = (e: any) => {
      handler(e.layer);
      this.map.off('pm:create', wrapped);
    };
    this.map.on('pm:create', wrapped);
  }

  /** Stamp a freshly-drawn layer with a new shape id + kind. Returns the id. */
  private tag(layer: L.Layer, kind: MapShape['kind']): string {
    const id = newShapeId();
    this.stampTags(layer, id, kind);
    return id;
  }

  private stampTags(layer: L.Layer, id: string, kind: MapShape['kind']): void {
    (layer as TaggedLayer)._shapeId = id;
    (layer as TaggedLayer)._shapeKind = kind;
    // Geoman fires `pm:edit` on the layer only (no map propagation),
    // so the per-layer listener is the only reliable hook for circle,
    // polygon, line, and marker edits.
    layer.on('pm:edit', () => this.emitEdit(layer as TaggedLayer));
    // Track click selection so Delete/Backspace knows which shape to remove.
    layer.on('click', () => { this.selectedLayer = layer as TaggedLayer; });
  }

  private findUntaggedEllipseOrSector(
    kind: 'ellipse' | 'sector',
  ): L.Layer | undefined {
    let found: L.Layer | undefined;
    this.map.eachLayer((layer) => {
      const meta =
        kind === 'ellipse'
          ? (layer as any)._ellipseMeta
          : (layer as any)._sectorMeta;
      if (meta && !(layer as TaggedLayer)._shapeId) found = layer;
    });
    return found;
  }

  private emitEdit(layer: TaggedLayer): void {
    if (!this.onShapeEdited) return;
    const shape = this.layerToShape(layer);
    if (shape) this.onShapeEdited(shape);
  }

  private emitDelete(layer: TaggedLayer): void {
    if (this.onShapeDeleted && layer._shapeId) {
      this.onShapeDeleted(layer._shapeId);
    }
  }

  /** Remove the selected shape from the map, store, and any custom handles. */
  private deleteSelected(): void {
    const layer = this.selectedLayer;
    if (!layer) return;
    this.selectedLayer = undefined;
    this.emitDelete(layer);
    layer.remove();
    // Ellipse/sector handles live in the tools, not on the layer, so the
    // polygon's removal leaves them stranded. Re-running edit mode rebuilds
    // handles only for the shapes that remain, clearing the orphans. Skip
    // when not editing, else this would switch edit handles back on.
    if (this.editMode && (layer._shapeKind === 'ellipse' || layer._shapeKind === 'sector')) {
      this.ellipseTool.disableEdit();
      this.sectorTool.disableEdit();
      this.ellipseTool.enableEdit();
      this.sectorTool.enableEdit();
    }
  }

  /** Reconstruct a `MapShape` from a tagged Leaflet layer. */
  private layerToShape(layer: TaggedLayer): MapShape | null {
    const id = layer._shapeId;
    const kind = layer._shapeKind;
    if (!id || !kind) return null;

    switch (kind) {
      case 'point': {
        const { lat, lng } = (layer as L.Marker).getLatLng();
        return { id, kind, position: [lng, lat] };
      }
      case 'line':
      case 'route':
        return { id, kind, positions: latLngsToCoords(layer as L.Polyline) };
      case 'polygon':
        return { id, kind, positions: polygonRingToCoords(layer as L.Polygon) };
      case 'circle': {
        const c = (layer as L.Circle).getLatLng();
        return {
          id,
          kind,
          center: [c.lng, c.lat],
          radius: (layer as L.Circle).getRadius() / KM_TO_M,
        };
      }
      case 'ellipse': {
        const meta = (layer as EllipseLayer)._ellipseMeta;
        return {
          id,
          kind,
          center: meta.center,
          radiusX: meta.radiusX / KM_TO_M,
          radiusY: meta.radiusY / KM_TO_M,
        };
      }
      case 'sector': {
        const meta = (layer as SectorLayer)._sectorMeta;
        return {
          id,
          kind,
          center: meta.center,
          radius: meta.radius / KM_TO_M,
          startBearing: meta.startBearing,
          endBearing: meta.endBearing,
        };
      }
    }
  }

  /** Build the Leaflet primitive for an external `MapShape`. */
  private buildShapeLayer(shape: MapShape): L.Layer {
    switch (shape.kind) {
      case 'point':
        return L.marker([shape.position[1], shape.position[0]]);

      case 'line':
      case 'route':
        return L.polyline(shape.positions.map(([lng, lat]) => [lat, lng]));

      case 'polygon':
        return L.polygon(shape.positions.map(([lng, lat]) => [lat, lng]));

      case 'circle':
        return L.circle([shape.center[1], shape.center[0]], {
          radius: shape.radius * KM_TO_M,
        });

      case 'ellipse':
        return this.ellipseTool.buildLayer({
          center: shape.center,
          radiusX: shape.radiusX * KM_TO_M,
          radiusY: shape.radiusY * KM_TO_M,
        });

      case 'sector':
        return this.sectorTool.buildLayer({
          center: shape.center,
          radius: shape.radius * KM_TO_M,
          startBearing: shape.startBearing,
          endBearing: shape.endBearing,
        });
    }
  }
}

// ── Pure helpers ───────────────────────────────────────────────────────

function latLngsToCoords(layer: L.Polyline): [number, number][] {
  return (layer.getLatLngs() as L.LatLng[]).map((p) => [p.lng, p.lat]);
}

function polygonRingToCoords(layer: L.Polygon): [number, number][] {
  const ring = layer.getLatLngs()[0] as L.LatLng[];
  return ring.map((p) => [p.lng, p.lat]);
}
