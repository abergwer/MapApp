import maplibregl from 'maplibre-gl/dist/maplibre-gl.js';
import type { MapEngine, MapEngineOptions, MapViewState } from './MapEngine';
import 'maplibre-gl/dist/maplibre-gl.css';
import config from "../../config.json";
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

export class MapLibreEngine implements MapEngine {
  private map: maplibregl.Map | undefined;
  private viewChangeCallback?: (viewState: MapViewState) => void;
  private clickCallback?: (lat: number, lng: number) => void;
  private draw: MapboxDraw | undefined;
  private cancelCurrentDraw?: () => void;

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
      attributionControl: false,
      // MapLibre uses [lng, lat]; defaultOptions.center is [lat, lng] → swap
      center: [options.center[1], options.center[0]],
      zoom: options.zoom,
    });

    this.draw = new MapboxDraw({
      displayControlsDefault: false,
      styles: drawStyles
    });

    this.map.addControl(this.draw as any);

    // 1. Add your Scale Control
    const scale = new maplibregl.ScaleControl({
      maxWidth: 80,         // Maximum width of the control in pixels
      unit: 'metric'        // Options: 'metric', 'imperial', 'nautical'
    });

    // 2. Add the Navigation Control (zoom and rotation controls)
    const nav = new maplibregl.NavigationControl();
    this.map.addControl(nav, 'top-right');


    this.map.addControl(scale, 'bottom-right');

    this.map.on('move', () => {
      this.viewChangeCallback?.(this.getViewState());
    });

    this.map.on('click', (e: maplibregl.MapMouseEvent) => {
      this.clickCallback?.(e.lngLat.lat, e.lngLat.lng);
    });

    this.map.on('load', () => {
      this.map?.setPaintProperty('gl-draw-polygon-fill', 'fill-color', '#ff0000');
      this.map?.setPaintProperty('gl-draw-polygon-fill', 'fill-opacity', 0.3);

      this.map?.setPaintProperty('gl-draw-polygon-stroke', 'line-color', '#00ff00');
      this.map?.setPaintProperty('gl-draw-polygon-stroke', 'line-width', 3);
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

  onViewChange(callback: (viewState: MapViewState) => void): () => void {
    this.viewChangeCallback = callback;
    return () => {
      if (this.viewChangeCallback === callback) this.viewChangeCallback = undefined;
    };
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

  startDrawPoint(onComplete: (position: [number, number]) => void): void {
    throw new Error('Method not implemented.');
  }
  startDrawLine(onComplete: (positions: [number, number][]) => void): void {
    throw new Error('Method not implemented.');
  }
  startDrawPolygon(onComplete: (positions: [number, number][]) => void): void {
    this.draw?.changeMode('draw_polygon');

    const handler = (e: any) => {
      const feature = e.features[0];

      onComplete(feature);


      this.map?.off('draw.create', handler);
    };

    this.map?.on('draw.create', handler);
  }
  startDrawCircle(onComplete: (center: [number, number], radius: number) => void): void {
    throw new Error('Method not implemented.');
  }
  cancelDrawing(): void {
    this.cancelCurrentDraw?.();
    if (this.draw?.getMode() !== 'simple_select') {
      this.draw?.changeMode('simple_select');
    }
  }
}
