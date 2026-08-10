import type { MapShape } from '../../stores/DrawingToolStore';

export type MapEngineType = 'leaflet' | 'maplibre' | 'cesium';

export interface MapEngineOptions {
  center: [number, number];
  zoom: number;
}

export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

export interface MapEngine {
  initialize(container: HTMLElement, options: MapEngineOptions): void;
  resize?(): void;
  destroy(): void;
  getViewState(): MapViewState;
  onViewChange(callback: (viewState: MapViewState) => void): () => void;
  onMapClick?(callback: (lat: number, lng: number) => void): void;
  /** Pan the view so the given coordinate is centered (keeps zoom). */
  setCenter?(lat: number, lng: number): void;

  /** Zoom in/out by `delta` levels (animated). Optional. */
  zoomBy?(delta: number): void;

  /** Animate the view bearing (degrees clockwise from north). Optional. */
  setBearing?(bearing: number): void;

  /** Animate the view pitch (degrees from top-down). Optional. */
  setPitch?(pitch: number): void;

  // Draw flows. The engine assigns a unique `id` to each freshly drawn
  // shape and surfaces it as the first arg of the onComplete callback,
  // so the caller can pair the geometry it builds with the same id the
  // engine used to tag the underlying layer. That id is what later
  // `onShapeEdited` / `onShapeDeleted` events refer to.

  startDrawPoint(
    onComplete: (id: string, position: [number, number]) => void
  ): void;

  startDrawLine(
    onComplete: (id: string, positions: [number, number][]) => void
  ): void;

  startDrawPolygon(
    onComplete: (id: string, positions: [number, number][]) => void
  ): void;

  startDrawCircle(
    onComplete: (id: string, center: [number, number], radius: number) => void
  ): void;

  startDrawEllipse(
    onComplete: (
      id: string,
      center: [number, number],
      radiusX: number,
      radiusY: number,
    ) => void
  ): void;

  /**
   * Three-click pie-slice sector: center → start arm → end arm. Optional —
   * engines that don't support it can omit the method and the UI hides it.
  */
  startDrawSector(
    onComplete: (
      id: string,
      center: [number, number],
      radius: number,
      startBearing: number,
      endBearing: number
    ) => void
  ): void;

  cancelDrawing(): void;

  /**
   * Add a shape to the map as if the user had drawn it — same paint
   * pipeline and same edit affordances. Used for shapes received from
   * outside the draw flow (server feed, persisted state, demo seeds).
   * The shape's `id` is used to tag the painted layer so later edit /
   * delete events round-trip the same id back to the caller. Optional:
   * engines without a draw pipeline (e.g. Cesium stub) can omit it.
   *
   * Note: this does NOT record the shape in `DrawingToolStore` — the
   * caller is responsible for `store.recordShape(shape)` if persistence
   * is desired. Keeps the engine free of store knowledge.
   */
  addShape?(shape: MapShape): void;

  /**
   * Fires whenever the user finishes editing an existing shape (vertex
   * drag, handle drag, geoman edit). The callback receives the full
   * updated shape with the same `id` it was painted with — pair it with
   * `DrawingToolStore.updateShape` to keep the store in sync. Optional.
   */
  setOnShapeEdited?(callback: (shape: MapShape) => void): void;

  /**
   * Fires when the user removes a shape via the engine's edit/delete UI.
   * Pair with `DrawingToolStore.removeShape` to keep the store in sync.
   * Optional.
   */
  setOnShapeDeleted?(callback: (id: string) => void): void;

  /**
   * Fires when the user clicks empty map background while a shape is being
   * edited. Pair with `DrawingToolStore.setSelectedId(null)` to exit edit
   * mode. Engine-specific (currently Leaflet). Optional.
   */
  setOnDeselect?(callback: () => void): void;

  /**
   * Draw a polyline and report its total great-circle length in kilometres.
   * The engine is also responsible for displaying the result on the map
   * (e.g. as a label at the line endpoint). Optional.
   */
  startMeasureDistance?(onComplete: (distanceKm: number) => void): void;

  /**
   * Draw a polygon and report its spherical area in km². The engine displays
   * the value on the map (e.g. as a label at the polygon centroid). Optional.
   */
  startMeasureArea?(onComplete: (areaKm2: number) => void): void;

  removeMeasurements?(): void;

  /**
   * Begin editing a single shape. The engine paints it as a native editable
   * feature (MapboxDraw / Geoman) and turns on its handles. Vertex drags /
   * resizes round-trip back through `setOnShapeEdited`. At most one shape is
   * ever in edit mode at a time — it's the store's `selectedId`. Optional:
   * engines without a draw pipeline (e.g. Cesium stub) can omit it.
   */
  beginEdit?(shape: MapShape): void;

  /**
   * End editing the shape with this id: disable handles and remove the
   * native editable feature. Deck.gl then resumes rendering it from the
   * store. Must NOT emit a delete round-trip (the shape still exists).
   */
  endEdit?(id: string): void;

  /**
   * Swap the basemap tile source at runtime. `url` is an XYZ tile template
   * (e.g. `https://.../{z}/{x}/{y}.png`). Optional — engines that don't
   * support it can omit the method and the UI hides the affordance.
   */
  setBaseMap?(url: string): void;
}
