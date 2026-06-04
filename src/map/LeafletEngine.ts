import L from 'leaflet';
import type { MapEngine, MapEngineOptions } from './MapEngine';
import 'leaflet/dist/leaflet.css';
import config from '../../config.json';

export class LeafletEngine implements MapEngine {
  private map?: L.Map;

  initialize(container: HTMLElement, options: MapEngineOptions): void {
    this.map = L.map(container, {
      center: options.center,
      zoom: options.zoom,
      zoomControl: true,
    });

    L.tileLayer(config.LeafletTilesURL, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);
  }

  resize(): void {
    this.map?.invalidateSize();
  }

  destroy(): void {
    this.map?.remove();
    this.map = undefined;
  }
}
