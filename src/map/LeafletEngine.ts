import L from 'leaflet';
import type { MapEngine, MapEngineOptions, PolygonOptions } from './MapEngine';
import 'leaflet/dist/leaflet.css';

export class LeafletEngine implements MapEngine {
  private map?: L.Map;
  private isDrawingMode = false;
  private drawCoordinates: [number, number][] = [];
  private drawMarkers: L.CircleMarker[] = [];
  private drawLine?: L.Polyline;
  private onDrawFinish?: (coordinates: [number, number][]) => void;

  initialize(container: HTMLElement, options: MapEngineOptions): void {
    this.map = L.map(container, {
      center: options.center,
      zoom: options.zoom,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);
  }

  resize(): void {
    this.map?.invalidateSize();
  }

  destroy(): void {
    this.cancelPolygonDraw();
    this.map?.remove();
    this.map = undefined;
  }

  addPolygon(options: PolygonOptions): void {
    if (!this.map) return;

    const polygon = L.polygon(options.coordinates, {
      color: options.color || '#3388ff',
      opacity: options.opacity ?? 1,
      fillOpacity: options.fillOpacity ?? 0.2,
      weight: options.weight ?? 2,
    });

    polygon.addTo(this.map);
  }

  startPolygonDraw(onFinish?: (coordinates: [number, number][]) => void): void {
    if (!this.map) return;

    this.isDrawingMode = true;
    this.drawCoordinates = [];
    this.drawMarkers = [];
    this.onDrawFinish = onFinish;

    this.map.on('click', this.handleMapClick);
    this.map.getContainer().style.cursor = 'crosshair';
  }

  finishPolygonDraw(): [number, number][] {
    if (this.drawCoordinates.length < 3) {
      console.warn('Polygon must have at least 3 coordinates');
      return [];
    }

    this.cancelPolygonDraw();

    if (this.onDrawFinish) {
      this.onDrawFinish(this.drawCoordinates);
    }

    const result = [...this.drawCoordinates];
    this.drawCoordinates = [];
    return result;
  }

  cancelPolygonDraw(): void {
    if (!this.map) return;

    this.isDrawingMode = false;
    this.map.off('click', this.handleMapClick);
    this.map.getContainer().style.cursor = '';

    this.drawMarkers.forEach((marker) => marker.remove());
    this.drawMarkers = [];

    if (this.drawLine) {
      this.drawLine.remove();
      this.drawLine = undefined;
    }

    this.drawCoordinates = [];
    this.onDrawFinish = undefined;
  }

  isDrawing(): boolean {
    return this.isDrawingMode;
  }

  private handleMapClick = (e: L.LeafletMouseEvent) => {
    if (!this.map) return;

    const lngLat: [number, number] = [e.latlng.lng, e.latlng.lat];
    this.drawCoordinates.push(lngLat);

    // Add marker for the vertex
    const marker = L.circleMarker(e.latlng, {
      radius: 5,
      fillColor: '#3388ff',
      color: '#003366',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    }).addTo(this.map);

    this.drawMarkers.push(marker);

    // Update preview line
    if (this.drawLine) {
      this.drawLine.remove();
    }

    const closedCoords = [...this.drawCoordinates, this.drawCoordinates[0]];
    this.drawLine = L.polyline(closedCoords, {
      color: '#3388ff',
      weight: 2,
      opacity: 0.7,
      dashArray: '5, 5',
    }).addTo(this.map);
  };
}
