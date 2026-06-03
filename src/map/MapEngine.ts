export type MapEngineType = 'leaflet' | 'maplibre';

export interface MapEngineOptions {
  center: [number, number];
  zoom: number;
}

export interface MapEngine {
  initialize(container: HTMLElement, options: MapEngineOptions): void;
  resize?(): void;
  destroy(): void;
}
