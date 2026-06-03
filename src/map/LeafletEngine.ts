import L from 'leaflet';
import type { MapEngine, MapEngineOptions, PolygonOptions, PolygonDrawHelpers } from './MapEngine';
import 'leaflet/dist/leaflet.css';

export class LeafletEngine implements MapEngine {
  private map?: L.Map;
  // drawing handled by LayerManager now

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
    this.map?.off();
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

  createPolygonDrawHelpers(): PolygonDrawHelpers {
    const map = this.map;
    let markers: L.CircleMarker[] = [];
    let previewLine: L.Polyline | undefined;
    let clickCallback: (coordinates: [number, number]) => void = () => {};

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      clickCallback([e.latlng.lng, e.latlng.lat]);
    };

    return {
      enableDrawing(onClick) {
        if (!map) return;
        clickCallback = onClick;
        map.on('click', handleMapClick);
      },
      disableDrawing() {
        if (!map) return;
        map.off('click', handleMapClick);
      },
      setCursor(cursor) {
        if (!map) return;
        map.getContainer().style.cursor = cursor;
      },
      updatePreview(coordinates) {
        if (!map) return;

        markers.forEach((marker) => marker.remove());
        markers = [];
        if (previewLine) {
          previewLine.remove();
          previewLine = undefined;
        }

        if (coordinates.length === 0) return;

        coordinates.forEach(([lng, lat]) => {
          const marker = L.circleMarker([lat, lng], {
            radius: 5,
            fillColor: '#3388ff',
            color: '#003366',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
          }).addTo(map);
          markers.push(marker);
        });

        if (coordinates.length >= 2) {
          const closedCoords = [...coordinates, coordinates[0]];
          previewLine = L.polyline(closedCoords.map(([lng, lat]) => [lat, lng] as [number, number]), {
            color: '#3388ff',
            weight: 2,
            opacity: 0.7,
            dashArray: '5,5',
          }).addTo(map);
        }
      },
      clearPreview() {
        markers.forEach((marker) => marker.remove());
        markers = [];
        if (previewLine) {
          previewLine.remove();
          previewLine = undefined;
        }
      },
    };
  }

  getNativeMap() {
    return this.map;
  }
}
