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
  onViewChange(callback: (viewState: MapViewState) => void): void;
  onMapClick?(callback: (lat: number, lng: number) => void): void;
}
