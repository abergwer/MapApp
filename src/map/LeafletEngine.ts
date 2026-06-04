import L from 'leaflet';
import type { MapEngine, MapEngineOptions, MapViewState } from './MapEngine';
import 'leaflet/dist/leaflet.css';
import config from '../../config.json';

export class LeafletEngine implements MapEngine {
  private map?: L.Map;
  private viewChangeCallback?: (viewState: MapViewState) => void;

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

    this.map.on('move', () => {
      this.viewChangeCallback?.(this.getViewState());
    });
  }

  getViewState(): MapViewState {
    const center = this.map?.getCenter();
    return {
      longitude: center?.lng ?? 0,
      latitude: center?.lat ?? 0,
      // Deck.gl WebMercator uses 512px tile math; Leaflet uses 256px → offset by -1
      zoom: (this.map?.getZoom() ?? 13) - 1,
      pitch: 0,
      bearing: 0,
    };
  }

  onViewChange(callback: (viewState: MapViewState) => void): void {
    this.viewChangeCallback = callback;
  }

  resize(): void {
    this.map?.invalidateSize();
  }

  destroy(): void {
    this.map?.remove();
    this.map = undefined;
  }
}
