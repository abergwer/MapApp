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

export interface PolygonDrawHelpers {
  enableDrawing(onClick: (coordinates: [number, number]) => void): void;
  disableDrawing(): void;
  setCursor(cursor: string): void;
  updatePreview(coordinates: [number, number][]): void;
  clearPreview(): void;
}

export interface MapEngine {
  initialize(container: HTMLElement, options: MapEngineOptions): void;
  resize?(): void;
  destroy(): void;
  addPolygon(options: PolygonOptions): void;
  createPolygonDrawHelpers(): PolygonDrawHelpers;
  // Returns the underlying native map instance for advanced operations
  getNativeMap?(): any;
}
