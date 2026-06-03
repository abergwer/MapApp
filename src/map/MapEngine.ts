export type MapEngineType = 'leaflet' | 'maplibre';

export interface MapEngineOptions {
  center: [number, number];
  zoom: number;
}

export interface PolygonOptions {
  coordinates: [number, number][]; // Array of [lng, lat] pairs
  color?: string;
  opacity?: number;
  fillOpacity?: number;
  weight?: number;
}

export interface MapEngine {
  initialize(container: HTMLElement, options: MapEngineOptions): void;
  resize?(): void;
  destroy(): void;
  addPolygon(options: PolygonOptions): void;
  startPolygonDraw(onFinish?: (coordinates: [number, number][]) => void): void;
  finishPolygonDraw(): [number, number][];
  cancelPolygonDraw(): void;
  isDrawing(): boolean;
}
