import maplibregl from 'maplibre-gl/dist/maplibre-gl.js';
import 'maplibre-gl/dist/maplibre-gl.css';
import MeasuresControl from 'maplibre-gl-measures';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapEngine, MapEngineOptions, MapViewState } from './MapEngine';
import config from "../../config.json";

export class MapLibreEngine implements MapEngine {
  private map?: maplibregl.Map;
  private viewChangeCallback?: (viewState: MapViewState) => void;
  private clickCallback?: (lat: number, lng: number) => void;

  initialize(container: HTMLElement, options: MapEngineOptions): void {
    this.map = new maplibregl.Map({
      container,
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: [config.MapLibreTilesURL],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'raster-layer', type: 'raster', source: 'raster-tiles' }],
      },
      // MapLibre uses [lng, lat]; defaultOptions.center is [lat, lng] → swap
      attributionControl: false,
      center: [options.center[1], options.center[0]],
      zoom: options.zoom,
      
    });

            // 2. Add Ruler Control
    const measures = new MeasuresControl({
      units: 'metric', // Options: 'metric', 'imperial'
      style: {
        // Optional custom styling
        text: { color: '#FF0000' },
      },
    });

    this.map.addControl(measures, 'top-left');    

       // 2. Add your Scale Control
    const scale = new maplibregl.ScaleControl({
      maxWidth: 80,         // Maximum width of the control in pixels
      unit: 'metric'        // Options: 'metric', 'imperial', 'nautical'
    });

    this.map.addControl(scale, 'bottom-right');

    // 3. Optional: Add zoom controls to easily test the scale changes
    const nav = new maplibregl.NavigationControl();
    this.map.addControl(nav, 'top-right');

    this.map.on('move', () => {
      this.viewChangeCallback?.(this.getViewState());
    });

    this.map.on('click', (e: maplibregl.MapMouseEvent) => {
      this.clickCallback?.(e.lngLat.lat, e.lngLat.lng);
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

  onMapClick(callback: (lat: number, lng: number) => void): void {
    this.clickCallback = callback;
  }

  resize(): void {
    this.map?.resize();
  }

  destroy(): void {
    this.map?.remove();
    this.map = undefined;
  }
}
