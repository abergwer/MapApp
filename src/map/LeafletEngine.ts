import L from 'leaflet';
import type { MapEngine, MapEngineOptions, MapViewState } from './MapEngine';
import 'leaflet/dist/leaflet.css';
import config from '../../config.json';

export class LeafletEngine implements MapEngine {
  private map?: L.Map;
  private viewChangeCallback?: (viewState: MapViewState) => void;
  private clickCallback?: (lat: number, lng: number) => void;

  initialize(container: HTMLElement, options: MapEngineOptions): void {
    this.map = L.map(container, {
      center: options.center,
      zoom: options.zoom,
      zoomControl: true,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
    });

    L.tileLayer(config.LeafletTilesURL, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    let ticking = false;

    const syncView = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        this.viewChangeCallback?.(this.getViewState());
        ticking = false;
      });
    };

    this.map.on('move', syncView);
    this.map.on('zoom', syncView);
    // Guarantee final state is synced after animations settle
    this.map.on('zoomend', () => this.viewChangeCallback?.(this.getViewState()));
    this.map.on('moveend', () => this.viewChangeCallback?.(this.getViewState()));

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.clickCallback?.(e.latlng.lat, e.latlng.lng);
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

  onMapClick(callback: (lat: number, lng: number) => void): void {
    this.clickCallback = callback;
  }

  resize(): void {
    this.map?.invalidateSize();
  }

  destroy(): void {
    this.map?.remove();
    this.map = undefined;
  }
}
