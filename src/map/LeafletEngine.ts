import L from 'leaflet';
import type { MapEngine, MapEngineOptions, MapViewState } from './MapEngine';
import 'leaflet/dist/leaflet.css';
import config from '../../config.json';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

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

    L.control.scale({ position: 'bottomright' }).addTo(this.map);

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
    this.map?.invalidateSize();
  }

  destroy(): void {
    this.map?.remove();
    this.map = undefined;
  }

  startDrawPoint(onComplete: (position: [number, number]) => void): void {
    throw new Error('Method not implemented.');
  }

  startDrawLine(onComplete: (positions: [number, number][]) => void): void {
    this.map?.pm.enableDraw('Line');

    const handler = (e: any) => {
      const coords = e.layer
        .getLatLngs()
        .map((p: any) => [p.lng, p.lat]);

      onComplete(coords);

      this.map?.off('pm:create', handler);
    };

    this.map?.on('pm:create', handler);
  }

  startDrawPolygon(onComplete: (positions: [number, number][]) => void): void {
    this.map?.pm.enableDraw('Polygon');

    const handler = (e: any) => {
      const coords = e.layer
        .getLatLngs()[0]
        .map((p: any) => [p.lng, p.lat]);

      onComplete(coords);

      this.map?.off('pm:create', handler);
    };

    this.map?.on('pm:create', handler);
  }

  startDrawCircle(onComplete: (center: [number, number], radius: number) => void): void {
    this.map?.pm.enableDraw('Circle');

    const handler = (e: any) => {
      const center = e.layer.getLatLng();
      const radius = e.layer.getRadius();

      onComplete(
        [center.lng, center.lat],
        radius
      );

      this.map?.off('pm:create', handler);
    };

    this.map?.on('pm:create', handler);
  }
  cancelDrawing(): void {
    throw new Error('Method not implemented.');
  }
}
