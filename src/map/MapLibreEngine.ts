import maplibregl from 'maplibre-gl/dist/maplibre-gl.js';
import type { MapEngine, MapEngineOptions, PolygonOptions } from './MapEngine';
import 'maplibre-gl/dist/maplibre-gl.css';

export class MapLibreEngine implements MapEngine {
  private map?: maplibregl.Map;
  private polygonCounter = 0;
  private isDrawingMode = false;
  private drawCoordinates: [number, number][] = [];
  private drawSourceId = 'draw-source';
  private drawLineLayerId = 'draw-line-layer';
  private drawPointsLayerId = 'draw-points-layer';
  private onDrawFinish?: (coordinates: [number, number][]) => void;

  initialize(container: HTMLElement, options: MapEngineOptions): void {
    this.map = new maplibregl.Map({
      container,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [34.7818, 32.0853],
      zoom: options.zoom,
    });
  }

  resize(): void {
    this.map?.resize();
  }

  destroy(): void {
    this.cancelPolygonDraw();
    this.map?.remove();
    this.map = undefined;
  }

  addPolygon(options: PolygonOptions): void {
    if (!this.map) return;

    const sourceId = `polygon-source-${this.polygonCounter}`;
    const layerId = `polygon-layer-${this.polygonCounter}`;
    this.polygonCounter++;

    const closedCoordinates = [
      ...options.coordinates,
      options.coordinates[0],
    ];

    const geojsonSource = {
      type: 'geojson' as const,
      data: {
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [closedCoordinates],
        },
        properties: {},
      },
    };

    this.map.addSource(sourceId, geojsonSource);

    this.map.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': options.color || '#3388ff',
        'fill-opacity': options.fillOpacity ?? 0.2,
        'fill-outline-color': options.color || '#3388ff',
      },
    });

    if (options.weight) {
      const outlineLayerId = `polygon-outline-${this.polygonCounter}`;
      this.map.addLayer({
        id: outlineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': options.color || '#3388ff',
          'line-width': options.weight,
          'line-opacity': options.opacity ?? 1,
        },
      });
    }
  }

  startPolygonDraw(onFinish?: (coordinates: [number, number][]) => void): void {
    if (!this.map || this.isDrawingMode) return;

    this.isDrawingMode = true;
    this.drawCoordinates = [];
    this.onDrawFinish = onFinish;

    this.map.getCanvas().style.cursor = 'crosshair';

    // Create drawing source and layers if not exists
    if (!this.map.getSource(this.drawSourceId)) {
      this.map.addSource(this.drawSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      this.map.addLayer({
        id: this.drawLineLayerId,
        type: 'line',
        source: this.drawSourceId,
        paint: {
          'line-color': '#3388ff',
          'line-width': 2,
          'line-dasharray': [5, 5],
        },
      });

      this.map.addLayer({
        id: this.drawPointsLayerId,
        type: 'circle',
        source: this.drawSourceId,
        paint: {
          'circle-radius': 5,
          'circle-color': '#3388ff',
          'circle-stroke-color': '#003366',
          'circle-stroke-width': 2,
        },
      });
    }

    this.map.on('click', this.handleMapClick);
  }

  finishPolygonDraw(): [number, number][] {
    if (this.drawCoordinates.length < 3) {
      console.warn('Polygon must have at least 3 coordinates');
      return [];
    }

    const result = [...this.drawCoordinates];
    this.cancelPolygonDraw();

    if (this.onDrawFinish) {
      this.onDrawFinish(result);
    }

    return result;
  }

  cancelPolygonDraw(): void {
    if (!this.map) return;

    this.isDrawingMode = false;
    this.map.off('click', this.handleMapClick);
    this.map.getCanvas().style.cursor = '';

    if (this.map.getSource(this.drawSourceId)) {
      this.map.removeLayer(this.drawLineLayerId);
      this.map.removeLayer(this.drawPointsLayerId);
      this.map.removeSource(this.drawSourceId);
    }

    this.drawCoordinates = [];
    this.onDrawFinish = undefined;
  }

  isDrawing(): boolean {
    return this.isDrawingMode;
  }

  private handleMapClick = (e: maplibregl.MapMouseEvent) => {
    if (!this.map || !this.isDrawingMode) return;

    const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    this.drawCoordinates.push(lngLat);

    // Update GeoJSON features
    const closedCoords = [...this.drawCoordinates, this.drawCoordinates[0]];

    const features = [
      {
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: closedCoords,
        },
        properties: {},
      },
      {
        type: 'Feature' as const,
        geometry: {
          type: 'MultiPoint' as const,
          coordinates: this.drawCoordinates,
        },
        properties: {},
      },
    ];

    const source = this.map.getSource(this.drawSourceId) as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features,
      });
    }
  };
}
