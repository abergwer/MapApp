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

/** Shape kinds that support whole-body drag via Geoman's `enableLayerDrag`. */
const DRAGGABLE_KINDS: ReadonlySet<MapShape['kind']> = new Set([
  'polygon',
  'line',
]);

/** Tags we stamp on every drawn layer so edit events can rebuild the shape. */
type TaggedLayer = L.Layer & {
  _shapeId?: string;
  _shapeKind?: MapShape['kind'];
};

/**
 * Geoman injects a `.pm` property on every layer it manages. We only touch
 * a handful of methods; typing them locally avoids a global augmentation.
 */
type GeomanLayer = L.Layer & {
  pm?: {
    enable?(opts: object): void;
    disable?(): void;
    enableLayerDrag?(): void;
    disableLayerDrag?(): void;
    _initMarkers?(): void;
  };
};

/**
 * Owns every drawing concern for the Leaflet engine:
 *  • Geoman draw modes (marker / line / polygon / circle)
 *  • Custom ellipse + sector tools
 *  • Layer tagging (shape id + kind)
 *  • Edit-mode toggle (`beginEdit` / `endEdit`)
 *  • Round-trip `pm:edit` / `pm:remove` back to the engine's callbacks
 *
 * The engine itself is a thin orchestrator that delegates every `MapEngine`
 * draw method to this class.
 */
export class LeafletDrawingManager {
  private readonly map: L.Map;
  private readonly ellipseTool: LeafletEllipseTool;
  private readonly sectorTool: LeafletSectorTool;

  // ── Callbacks wired by the engine ───────────────────────────────
  private onShapeEdited?: (shape: MapShape) => void;
  private onShapeDeleted?: (id: string) => void;
  private onDeselect?: () => void;

  // ── Edit-mode state ─────────────────────────────────────────────
  private selectedLayer?: TaggedLayer;
  /** Cleanup for drag listeners wired inside `enableGeomanEdit`. */
  private dragCleanup?: () => void;
  /**
   * True while a whole-shape body drag is in flight. Leaflet fires a spurious
   * map `click` on the mouseup that ends a drag; this flag lets
   * `onBackgroundClick` swallow that one click so a drag doesn't deselect.
   */
  private justDragged = false;
  /** Deferred timer that arms `onBackgroundClick` one tick after edit starts. */
  private bgClickTimer?: ReturnType<typeof setTimeout>;

  // ── Draw-flow state ─────────────────────────────────────────────
  /** Active `pm:create` handler, tracked so `cancelDrawing` can detach it. */
  private pendingCreate?: (e: { layer: L.Layer }) => void;

  private readonly onKeyDown: (ev: KeyboardEvent) => void;

  constructor(map: L.Map) {
    this.map = map;
    this.ellipseTool = createLeafletEllipseTool(map);
    this.sectorTool = createLeafletSectorTool(map);

    // Geoman fires `pm:edit` on the layer only (see `stampTags`). It fires
    // `pm:remove` on both layer and map, so a map-level listener suffices.
    // Ellipse + sector edits emit through the tools' own callback.
    map.on('pm:remove', (e: any) => this.emitDelete(e.layer as TaggedLayer));
    this.ellipseTool.setOnEdit((layer) => this.emitEdit(layer as TaggedLayer));
    this.sectorTool.setOnEdit((layer) => this.emitEdit(layer as TaggedLayer));

    // Delete/Backspace removes the selected shape. Geoman's edit mode has no
    // key-to-delete and `map.keyboard.disable()` kills Leaflet's own, so a
    // document listener is the only reliable hook — and ellipse/sector
    // layers are `pmIgnore`, so Geoman removal mode would skip them anyway.
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
    this.cancelDrawing();
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
    this.cancelDrawing();
    this.map.pm.enableDraw('Line', { hideMiddleMarkers: true });
    this.onceCreate((layer) => {
      const id = this.tag(layer, 'line');
      onComplete(id, latLngsToCoords(layer as L.Polyline));
    });
  }

  startDrawPolygon(onComplete: (id: string, positions: [number, number][]) => void): void {
    this.cancelDrawing();
    this.map.pm.enableDraw('Polygon');
    this.onceCreate((layer) => {
      const id = this.tag(layer, 'polygon');
      onComplete(id, polygonRingToCoords(layer as L.Polygon));
    });
  }

  startDrawCircle(
    onComplete: (id: string, center: [number, number], radius: number) => void,
  ): void {
    this.cancelDrawing();
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
    this.cancelDrawing();
    // The tool commits the layer to the map and hands it back so we can
    // stamp our id/kind tags on it before releasing it to Deck.gl.
    this.ellipseTool.startDraw(({ center, radiusX, radiusY }, layer) => {
      const id = this.tag(layer, 'ellipse');
      onComplete(id, center, radiusX / KM_TO_M, radiusY / KM_TO_M);
      // Hand off to Deck.gl: the shape is in the store now, so drop the
      // engine's native copy to avoid a double-render (see onceCreate).
      layer.remove();
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
    this.cancelDrawing();
    this.sectorTool.startDraw(({ center, radius, startBearing, endBearing }, layer) => {
      const id = this.tag(layer, 'sector');
      onComplete(id, center, radius / KM_TO_M, startBearing, endBearing);
      // Hand off to Deck.gl: the shape is in the store now, so drop the
      // engine's native copy to avoid a double-render (see onceCreate).
      layer.remove();
    });
  }

  cancelDrawing(): void {
    this.ellipseTool.cancelDraw();
    this.sectorTool.cancelDraw();
    this.map.pm.disableDraw();
    // Detach any pending one-shot create listener from an unfinished draw so
    // switching tools mid-draw doesn't leave it firing on the next shape.
    if (this.pendingCreate) {
      this.map.off('pm:create', this.pendingCreate);
      this.pendingCreate = undefined;
    }
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

  // ── Edit handoff ─────────────────────────────────────────────────────

  /**
   * Paint one shape and enable its edit handles. Vertex/handle drags
   * round-trip back through `onShapeEdited`. At most one shape is edited
   * at a time (the store's `selectedId`).
   */
  beginEdit(shape: MapShape): void {
    this.cancelDrawing();
    this.addShape(shape);
    const layer = this.findLayerById(shape.id);
    if (!layer) return;

    this.selectedLayer = layer;
    // Wheel zoom stays on — handles are lat/lng-anchored and reposition fine.
    // Double-click zoom would fire on rapid vertex-handle clicks, so park it.
    this.map.doubleClickZoom.disable();

    if (shape.kind === 'ellipse') {
      this.ellipseTool.enableEdit();
    } else if (shape.kind === 'sector') {
      this.sectorTool.enableEdit();
    } else {
      this.enableGeomanEdit(layer, shape.kind);
    }

    this.armBackgroundClickDeselect();
  }

  /** Disable handles and remove the editable layer; Deck.gl resumes drawing it. */
  endEdit(id: string): void {
    this.disarmBackgroundClickDeselect();
    this.ellipseTool.disableEdit();
    this.sectorTool.disableEdit();
    this.map.doubleClickZoom.enable();

    this.dragCleanup?.();
    this.dragCleanup = undefined;
    this.justDragged = false;

    const layer = this.findLayerById(id);
    if (!layer) return;
    const pm = (layer as GeomanLayer).pm;
    // `disable()` alone leaves the layer-drag mousedown handler attached for
    // polygons/lines, so drop it explicitly before releasing the layer.
    pm?.disableLayerDrag?.();
    pm?.disable?.();
    if (this.selectedLayer === layer) this.selectedLayer = undefined;
    layer.remove();

    // Manual `_initMarkers` resyncs (and Geoman itself) can leave vertex
    // markers stranded on the map after edit ends. Sweep every Geoman temp
    // layer so no orphaned handles remain.
    this.sweepGeomanTempLayers();
  }

  /** Remove every leftover Geoman temp layer (vertex/edit markers). */
  private sweepGeomanTempLayers(): void {
    this.map.eachLayer((layer) => {
      if ((layer as { _pmTempLayer?: boolean })._pmTempLayer) layer.remove();
    });
  }

  /** Find a tagged layer currently on the map by its shape id. */
  private findLayerById(id: string): TaggedLayer | undefined {
    let found: TaggedLayer | undefined;
    this.map.eachLayer((layer) => {
      if ((layer as TaggedLayer)._shapeId === id) found = layer as TaggedLayer;
    });
    return found;
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

  // ── Background-click deselect ────────────────────────────────────────
  //
  // Leaflet only fires `click` on the map when no interactive layer is under
  // the cursor — the edited path and its Geoman vertex handles are all
  // interactive, so only a genuine background click reaches this handler.

  private readonly onBackgroundClick = (): void => {
    // A whole-shape body drag ends with a spurious Leaflet map `click` on
    // mouseup. Swallow that one click: deselecting here would remove the
    // native editable layer and briefly re-draw the shape in Deck.gl at its
    // pre-drag geometry (Geoman defers the `pm:edit` store update ~10ms),
    // producing a "reflection" flicker at the old position.
    if (this.justDragged) {
      this.justDragged = false;
      return;
    }
    this.onDeselect?.();
  };

  /** Arm after a one-tick delay so the selecting click doesn't self-deselect. */
  private armBackgroundClickDeselect(): void {
    this.bgClickTimer = setTimeout(() => {
      this.map.on('click', this.onBackgroundClick);
    }, 0);
  }

  private disarmBackgroundClickDeselect(): void {
    if (this.bgClickTimer !== undefined) {
      clearTimeout(this.bgClickTimer);
      this.bgClickTimer = undefined;
    }
    this.map.off('click', this.onBackgroundClick);
  }

  // ── Geoman edit wiring ───────────────────────────────────────────────

  private enableGeomanEdit(layer: TaggedLayer, kind: MapShape['kind']): void {
    const pm = (layer as GeomanLayer).pm;
    if (!pm) return;

    if (DRAGGABLE_KINDS.has(kind)) pm.enableLayerDrag?.();
    // `hideMiddleMarkers: false` shows the midpoint "add-a-vertex" handles:
    // clicking one splits the edge and inserts a real vertex, which the
    // existing `pm:edit` round-trip picks up automatically.
    pm.enable?.({
      allowSelfIntersection: false,
      hideMiddleMarkers: false,
      preventMarkerRemoval: kind === 'line',
    });

    // Resync vertex handles after each drag so they follow the shape, and
    // track body-drag state so the spurious drag-end click is swallowed
    // (see `onBackgroundClick`).
    const resyncHandles = () => pm._initMarkers?.();
    const markDragging = () => { this.justDragged = true; };
    const clearDragging = () => { this.justDragged = false; };
    layer.on('pm:drag', resyncHandles);
    layer.on('pm:dragstart', markDragging);
    layer.on('pm:dragend', clearDragging);
    this.dragCleanup = () => {
      layer.off('pm:drag', resyncHandles);
      layer.off('pm:dragstart', markDragging);
      layer.off('pm:dragend', clearDragging);
    };
  }

  // ── Internals ────────────────────────────────────────────────────────

  /** Listen for the next `pm:create`, tag the layer, then detach. */
  private onceCreate(handler: (layer: L.Layer) => void): void {
    const wrapped = (e: { layer: L.Layer }) => {
      const layer = e.layer;
      this.pendingCreate = undefined;
      handler(layer);
      this.map.off('pm:create', wrapped);
      // In the deck-render-only model the engine keeps no native copy of a
      // finished shape — it now lives in the store and is painted by Deck.gl.
      // Remove Geoman's layer, or the shape is drawn twice and edit/delete
      // act on a stale duplicate.
      layer.remove();
    };
    this.pendingCreate = wrapped;
    this.map.on('pm:create', wrapped);
  }

  /** Stamp a freshly-drawn layer with a new shape id + kind. Returns the id. */
  private tag(layer: L.Layer, kind: MapShape['kind']): string {
    const id = newShapeId();
    this.stampTags(layer, id, kind);
    return id;
  }

  private stampTags(layer: L.Layer, id: string, kind: MapShape['kind']): void {
    const tagged = layer as TaggedLayer;
    tagged._shapeId = id;
    tagged._shapeKind = kind;
    // Geoman fires `pm:edit` on the layer only (no map propagation), so the
    // per-layer listener is the only reliable hook for polygon/line/circle
    // vertex edits.
    layer.on('pm:edit', () => this.emitEdit(tagged));
  }

  private emitEdit(layer: TaggedLayer): void {
    if (!this.onShapeEdited) return;
    const shape = this.layerToShape(layer);
    if (shape) this.onShapeEdited(shape);
  }

  private emitDelete(layer: TaggedLayer): void {
    if (!this.onShapeDeleted || !layer._shapeId) return;
    this.onShapeDeleted(layer._shapeId);
  }

  /** Remove the selected shape from the map, store, and any custom handles. */
  private deleteSelected(): void {
    const layer = this.selectedLayer;
    if (!layer) return;
    this.selectedLayer = undefined;
    this.emitDelete(layer);
    layer.remove();
    // Ellipse/sector handles live in the tools, not on the layer, so removing
    // the layer leaves them stranded. Recycling edit mode rebuilds handles
    // only for the shapes that remain.
    if (layer._shapeKind === 'ellipse' || layer._shapeKind === 'sector') {
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