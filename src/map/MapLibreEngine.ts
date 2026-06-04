import maplibregl from 'maplibre-gl/dist/maplibre-gl.js';
import type { MapEngine, MapEngineOptions, MapViewState } from './MapEngine';
import 'maplibre-gl/dist/maplibre-gl.css';
import config from "../../config.json";

export class MapLibreEngine implements MapEngine {
  private map?: maplibregl.Map;
  private viewChangeCallback?: (viewState: MapViewState) => void;

  initialize(container: HTMLElement, options: MapEngineOptions): void {
    this.map = new maplibregl.Map({
      container,
      style: config.MapLibreTilesURL,
      // MapLibre uses [lng, lat]; defaultOptions.center is [lat, lng] → swap
      center: [options.center[1], options.center[0]],
      zoom: options.zoom,
    });

    this.map.on('move', () => {
      this.viewChangeCallback?.(this.getViewState());
    });
  }

  getViewState(): MapViewState {
    const center = this.map?.getCenter();
    return {
      longitude: center?.lng ?? 0,
      latitude: center?.lat ?? 0,
      zoom: this.map?.getZoom() ?? 13,
      pitch: this.map?.getPitch() ?? 0,
      bearing: this.map?.getBearing() ?? 0,
    };
  }

  onViewChange(callback: (viewState: MapViewState) => void): void {
    this.viewChangeCallback = callback;
  }

  resize(): void {
    this.map?.resize();
  }

  destroy(): void {
    this.map?.remove();
    this.map = undefined;
  }
}
