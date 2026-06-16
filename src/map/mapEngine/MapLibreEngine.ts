import maplibregl from 'maplibre-gl/dist/maplibre-gl.js';
import type { MapEngine, MapEngineOptions, MapViewState } from './MapEngine';
import 'maplibre-gl/dist/maplibre-gl.css';
import config from "../../../config.json";
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { drawStyles } from '../../shared/styles/drawStyles';
import {
  CircleMode,
  DragCircleMode,
  DirectMode,
  SimpleSelectMode
} from 'maplibre-gl-draw-circle';
import {DragEllipseMode} from '../utils/MaplibreEllipseMath';
import {DragSectorMode} from '../utils/MaplibreSectorMath';
import {
  centroidOf,
  distanceKm,
  formatArea,
  formatDistance,
  polygonAreaKm2,
  type LngLat,
} from '../utils/geo';

export class MapLibreEngine implements MapEngine {
  private map: maplibregl.Map | undefined;
  private viewChangeCallback?: (viewState: MapViewState) => void;
  private clickCallback?: (lat: number, lng: number) => void;
  private draw: MapboxDraw | undefined;
  private cancelCurrentDraw?: () => void;
  private measureLabels: maplibregl.Marker[] = [];
  private measureLayerIds: string[] = [];
  private measureCounter = 0;

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
      defaultMode: 'simple_select',
      userProperties: true,
      modes: {
        ...MapboxDraw.modes,
        draw_polygon: MapboxDraw.modes.draw_polygon,
        draw_circle: CircleMode,
        drag_circle: DragCircleMode,
        direct_select: DirectMode,
        simple_select: SimpleSelectMode,
        drag_ellipse: DragEllipseMode,
        drag_sector: DragSectorMode,
      },
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
    this.measureLabels.forEach((m) => m.remove());
    this.measureLabels = [];
    this.measureLayerIds.forEach((id) => {
      if (this.map?.getLayer(id)) this.map.removeLayer(id);
      if (this.map?.getSource(id)) this.map.removeSource(id);
    });
    this.measureLayerIds = [];
    this.map?.remove();
    this.map = undefined;
  }

  /**
   * Move a feature from the editable MapboxDraw layer onto a plain,
   * non-interactive source so the user can't drag/reshape it afterward.
   */
  private freezeAsMeasure(
    feature: GeoJSON.Feature,
    paint: 'line' | 'fill',
  ): void {
    if (!this.map || !feature.id) return;
    this.draw?.delete(String(feature.id));
    const id = `measure-${paint}-${this.measureCounter++}`;
    this.map.addSource(id, { type: 'geojson', data: feature });
    if (paint === 'line') {
      this.map.addLayer({
        id,
        type: 'line',
        source: id,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#2563eb', 'line-width': 3 },
      });
    } else {
      this.map.addLayer({
        id,
        type: 'fill',
        source: id,
        paint: {
          'fill-color': '#2563eb',
          'fill-opacity': 0.2,
          'fill-outline-color': '#2563eb',
        },
      });
    }
    this.measureLayerIds.push(id);
  }

  private addMeasureLabel(text: string, position: LngLat): void {
    if (!this.map) return;
    const el = document.createElement('div');
    el.className = 'measure-label';
    el.textContent = text;
    const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat(position)
      .addTo(this.map);
    this.measureLabels.push(marker);
  }

  startDrawPoint(onComplete: (position: [number, number]) => void): void {
    this.draw?.changeMode('draw_point');
    const handler = (e: any) => {
      const feature = e.features[0];

      onComplete(feature);


      this.map?.off('draw.create', handler);
    };

    this.map?.on('draw.create', handler);
  }
  startDrawLine(onComplete: (positions: [number, number][]) => void): void {
    this.draw?.changeMode('draw_line_string');
    const handler = (e: any) => {
      const feature = e.features[0];

      onComplete(feature);


      this.map?.off('draw.create', handler);
    };

    this.map?.on('draw.create', handler);

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
    this.draw?.changeMode('draw_circle', { initialRadiusInKm: 5 });
    const handler = (e: any) => {
      const feature = e.features[0];

      onComplete(feature.geometry.coordinates, feature.properties.radiusInKm);


      this.map?.off('draw.create', handler);
    };

    this.map?.on('draw.create', handler);
  }

 startDrawEllipse(onComplete: (center: [number, number], radiusX: number, radiusY: number) => void): void {
    this.draw?.changeMode('drag_ellipse' as any);
    
    const handler = (e: any) => {
      const feature = e.features[0];

      onComplete(
        feature.properties.center,
        feature.properties.radiusXInKm,
        feature.properties.radiusYInKm
      );

      this.map?.off('draw.create', handler);
    };

    this.map?.on('draw.create', handler);
  }

  startDrawSector(
    onComplete: (
      center: [number, number],
      radius: number,
      startBearing: number,
      endBearing: number
    ) => void
  ): void {
    this.draw?.changeMode('drag_sector' as any);

    const handler = (e: any) => {
      const feature = e.features[0];

      onComplete(
        feature.properties.center,
        feature.properties.radiusInKm,
        feature.properties.startBearing,
        feature.properties.endBearing
      );

      this.map?.off('draw.create', handler);
    };

    this.map?.on('draw.create', handler);
  }

  startMeasureDistance(onComplete: (distanceKm: number) => void): void {
    this.draw?.changeMode('draw_line_string');
    const handler = (e: any) => {
      const feature = e.features[0];
      const coords = feature.geometry.coordinates as LngLat[];
      let total = 0;
      for (let i = 1; i < coords.length; i++) {
        const segKm = distanceKm(coords[i - 1], coords[i]);
        total += segKm;
        this.addMeasureLabel(formatDistance(segKm), centroidOf([coords[i - 1], coords[i]]));
      }
      this.addMeasureLabel(`Total: ${formatDistance(total)}`, coords[coords.length - 1]);
      this.freezeAsMeasure(feature, 'line');
      onComplete(total);
      this.map?.off('draw.create', handler);
    };
    this.map?.on('draw.create', handler);
  }

  startMeasureArea(onComplete: (areaKm2: number) => void): void {
    this.draw?.changeMode('draw_polygon');
    const handler = (e: any) => {
      const feature = e.features[0];
      const ring = feature.geometry.coordinates[0] as LngLat[];
      const km2 = polygonAreaKm2(ring);
      this.addMeasureLabel(formatArea(km2), centroidOf(ring));
      this.freezeAsMeasure(feature, 'fill');
      onComplete(km2);
      this.map?.off('draw.create', handler);
    };
    this.map?.on('draw.create', handler);
  }

  removeMeasurements(): void {
    this.measureLabels.forEach((m) => m.remove());
    this.measureLabels = [];
    this.measureLayerIds.forEach((id) => {
      if (this.map?.getLayer(id)) this.map.removeLayer(id);
      if (this.map?.getSource(id)) this.map.removeSource(id);
    });
    this.measureLayerIds = [];
  }

  cancelDrawing(): void {
    this.cancelCurrentDraw?.();
    if (this.draw?.getMode() !== 'simple_select') {
      this.draw?.changeMode('simple_select');
    }
  }
}
