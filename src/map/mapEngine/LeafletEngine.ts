import L from 'leaflet';
import type { MapEngine, MapEngineOptions, MapViewState } from './MapEngine';
import type { CompletedShape } from '../../stores/DrawingToolStore';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import config from '../../../config.json';
import { LeafletDrawingManager } from './leaflet/LeafletDrawingManager';
import { LeafletMeasureManager } from './leaflet/LeafletMeasureManager';

/**
 * Thin orchestrator over `LeafletDrawingManager` + `LeafletMeasureManager`.
 *
 * Owns only what's truly engine-scoped: map lifecycle, view-state
 * subscription, click forwarding, basemap source. All drawing /
 * measurement complexity lives in the managers under `./leaflet/`.
 */
export class LeafletEngine implements MapEngine {
  private map?: L.Map;
  private drawing?: LeafletDrawingManager;
  private measure?: LeafletMeasureManager;
  private baseLayer?: L.TileLayer;
  private viewChangeCallbacks = new Set<(vs: MapViewState) => void>();
  private clickCallback?: (lat: number, lng: number) => void;

  // ── Lifecycle ────────────────────────────────────────────────────────

  initialize(container: HTMLElement, options: MapEngineOptions): void {
    const map = L.map(container, {
      center: options.center,
      zoom: options.zoom,
      zoomControl: false,
      zoomAnimation: false,
      worldCopyJump: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
      attributionControl: false,
      maxBounds: [
        [-85, -180],
        [85, 180],
      ],
      maxBoundsViscosity: 1.0,
    });
    this.map = map;

    L.control.scale({ position: 'bottomright' }).addTo(map);
    L.control.zoom({ position: 'topright' as L.ControlPosition }).addTo(map);

    this.baseLayer = L.tileLayer(config.LeafletTilesURL, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 17,
      minZoom: 3,
    }).addTo(map);

    this.wireViewChange(map);
    map.on('click', (e: L.LeafletMouseEvent) => {
      this.clickCallback?.(e.latlng.lat, e.latlng.lng);
    });

    this.drawing = new LeafletDrawingManager(map);
    this.measure = new LeafletMeasureManager(map);
  }

  resize(): void {
    this.map?.invalidateSize();
  }

  destroy(): void {
    this.measure?.removeAll();
    this.drawing = undefined;
    this.measure = undefined;
    this.map?.remove();
    this.map = undefined;
  }

  // ── View state + clicks ──────────────────────────────────────────────

  getViewState(): MapViewState {
    const center = this.map?.getCenter();
    return {
      longitude: center?.lng ?? 0,
      latitude: center?.lat ?? 0,
      // Deck.gl WebMercator uses 512px tile math; Leaflet uses 256px → offset by -1.
      zoom: (this.map?.getZoom() ?? 13) - 1,
      pitch: 0,
      bearing: 0,
    };
  }

  onViewChange(callback: (vs: MapViewState) => void): () => void {
    this.viewChangeCallbacks.add(callback);
    return () => {
      this.viewChangeCallbacks.delete(callback);
    };
  }

  onMapClick(callback: (lat: number, lng: number) => void): void {
    this.clickCallback = callback;
  }

  // ── Drawing (delegated) ──────────────────────────────────────────────

  startDrawPoint(onComplete: (id: string, position: [number, number]) => void): void {
    this.drawing?.startDrawPoint(onComplete);
  }

  startDrawLine(onComplete: (id: string, positions: [number, number][]) => void): void {
    this.drawing?.startDrawLine(onComplete);
  }

  startDrawPolygon(onComplete: (id: string, positions: [number, number][]) => void): void {
    this.drawing?.startDrawPolygon(onComplete);
  }

  startDrawCircle(
    onComplete: (id: string, center: [number, number], radius: number) => void,
  ): void {
    this.drawing?.startDrawCircle(onComplete);
  }

  startDrawEllipse(
    onComplete: (
      id: string,
      center: [number, number],
      radiusX: number,
      radiusY: number,
    ) => void,
  ): void {
    this.drawing?.startDrawEllipse(onComplete);
  }

  startDrawSector(
    onComplete: (
      id: string,
      center: [number, number],
      radius: number,
      startBearing: number,
      endBearing: number,
    ) => void,
  ): void {
    this.drawing?.startDrawSector(onComplete);
  }

  startDrawRoute(onComplete: (id: string, positions: [number, number][]) => void): void {
    this.drawing?.startDrawRoute(onComplete);
  }

  cancelDrawing(): void {
    this.drawing?.cancelDrawing();
  }

  addShape(shape: CompletedShape): void {
    this.drawing?.addShape(shape);
  }

  setEditMode(enabled: boolean): void {
    this.drawing?.setEditMode(enabled);
  }

  setOnShapeEdited(callback: (shape: CompletedShape) => void): void {
    this.drawing?.setOnShapeEdited(callback);
  }

  setOnShapeDeleted(callback: (id: string) => void): void {
    this.drawing?.setOnShapeDeleted(callback);
  }

  // ── Measurement (delegated) ──────────────────────────────────────────

  startMeasureDistance(onComplete: (distanceKm: number) => void): void {
    this.measure?.startMeasureDistance(onComplete);
  }

  startMeasureArea(onComplete: (areaKm2: number) => void): void {
    this.measure?.startMeasureArea(onComplete);
  }

  removeMeasurements(): void {
    this.measure?.removeAll();
  }

  // ── Basemap ──────────────────────────────────────────────────────────

  setBaseMap(url: string): void {
    const map = this.map;
    if (!map) return;
    if (this.baseLayer) map.removeLayer(this.baseLayer);
    this.baseLayer = L.tileLayer(url, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      noWrap: true,
      bounds: L.latLngBounds([-90, -180], [90, 180]),
    }).addTo(map);
  }

  // ── Internals ────────────────────────────────────────────────────────

  /**
   * Coalesce Leaflet's many movement events into one rAF-throttled view
   * update, plus a guaranteed final emit on `moveend` / `zoomend` so the
   * settled state is always synced even if the rAF was dropped.
   */
  private wireViewChange(map: L.Map): void {
    let ticking = false;
    const emit = () => {
      const vs = this.getViewState();
      this.viewChangeCallbacks.forEach((cb) => cb(vs));
    };
    const sync = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        emit();
        ticking = false;
      });
    };
    map.on('move', sync);
    map.on('zoom', sync);
    map.on('moveend', emit);
    map.on('zoomend', emit);
  }
}
