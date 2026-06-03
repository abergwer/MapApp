import maplibregl from 'maplibre-gl/dist/maplibre-gl.js';
import type { MapEngine, MapEngineOptions } from './MapEngine';
import 'maplibre-gl/dist/maplibre-gl.css';

export class MapLibreEngine implements MapEngine {
  private map?: maplibregl.Map;

  initialize(container: HTMLElement, options: MapEngineOptions): void {
    this.map = new maplibregl.Map({
      container,
      style: 'https://demotiles.maplibre.org/style.json',
      center:  [34.7818, 32.0853],//options.center,
      zoom: options.zoom,
    });
  }

  resize(): void {
    this.map?.resize();
  }

  destroy(): void {
    this.map?.remove();
    this.map = undefined;
  }
}
