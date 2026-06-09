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

  cancelDrawing(): void;

  //addEntity(entity: MapEntity): string;
  //removeEntity(id: string): void;
}
