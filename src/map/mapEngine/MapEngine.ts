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

   startDrawPoint(
    onComplete: (position: [number, number]) => void
  ): void;

  startDrawLine(
    onComplete: (positions: [number, number][]) => void
  ): void;

  startDrawPolygon(
    onComplete: (positions: [number, number][]) => void
  ): void;

  startDrawCircle(
    onComplete: (center: [number, number], radius: number) => void
  ): void;

  startDrawEllipse(
    onComplete: (center: [number, number], radiusX: number, radiusY: number) => void
  ): void;

  /**
   * Three-click pie-slice sector: center → start arm → end arm. Optional —
   * engines that don't support it can omit the method and the UI hides it.
   */
  startDrawSector(
    onComplete: (
      center: [number, number],
      radius: number,
      startBearing: number,
      endBearing: number
    ) => void
  ): void;

  cancelDrawing(): void;

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

  startDrawRoute?(onUpdate: (positions: [number, number][]) => void): void;

  removeMeasurements?(): void;

  /**
   * Toggle a "modify" mode where the user can drag/reshape every previously
   * drawn feature on the map. Optional — engines that don't support it can
   * omit the method and the UI will hide the affordance.
   */
  setEditMode?(enabled: boolean): void;

  //addEntity(entity: MapEntity): string;
  //removeEntity(id: string): void;
}
