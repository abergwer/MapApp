import maplibregl from 'maplibre-gl/dist/maplibre-gl.js';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapEngine, MapEngineOptions, MapViewState } from './MapEngine';
import type { MapShape } from '../../stores/DrawingToolStore';
import config from '../../../config.json';
import { MapLibreDrawingManager } from './maplibre/MapLibreDrawingManager';
import { MapLibreMeasureManager } from './maplibre/MapLibreMeasureManager';

/**
 * Thin orchestrator over `MapLibreDrawingManager` + `MapLibreMeasureManager`.
 *
 * Owns only engine-scoped concerns: map lifecycle, view-state
 * subscription, click forwarding, basemap source swapping. All drawing
 * and measurement complexity lives under `./maplibre/`.
 *
 * The drawing manager owns the (single) MapboxDraw instance and exposes
 * it via `getDraw()` so the measurement manager can reuse it.
 */
export class MapLibreEngine implements MapEngine {
  private map?: maplibregl.Map;
  private drawing?: MapLibreDrawingManager;
  private measure?: MapLibreMeasureManager;
  private viewChangeCallbacks = new Set<(vs: MapViewState) => void>();
  private clickCallback?: (lat: number, lng: number) => void;
  private homeView?: { center: [number, number]; zoom: number };

  // ── Lifecycle ────────────────────────────────────────────────────────

  initialize(container: HTMLElement, options: MapEngineOptions): void {
    const map = new maplibregl.Map({
      container,
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: [config.MapStyles.satellite],
            tileSize: 256,
            // Bound the pyramid so MapLibre won't request tiles outside
            // the provider's range — prevents 404 gaps when zoomed in far.
            minzoom: 0,
            maxzoom: 15,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          // Solid background fills areas not yet covered by a tile so
          // zoom-out gaps read as "loading" instead of broken black squares.
          { id: 'background', type: 'background', paint: { 'background-color': '#1f2937' } },
          { id: 'raster-layer', type: 'raster', source: 'raster-tiles' },
        ],
      },
      attributionControl: false,
      renderWorldCopies: false,
      // Make tile cross-fade snappy so freshly-arrived tiles replace stale
      // children/parents immediately instead of blending for 300ms.
      fadeDuration: 0,
      // Cap canvas pixel ratio. HiDPI displays render at devicePixelRatio
      // (often 2+), which quadruples fragment-shader cost vs 1x. 1.5
      // keeps text/lines crisp while ~halving GPU work on typical laptops.
      maxTileCacheSize: 256,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
      // MapLibre wants [lng, lat]; defaultOptions.center is [lat, lng].
      center: [options.center[1], options.center[0]],
      zoom: options.zoom,
    });
    this.map = map;
    this.homeView = {
      center: [options.center[1], options.center[0]],
      zoom: options.zoom,
    };

    // Custom MapNavControls in the React shell replaces the stock control.
    map.addControl(
      new maplibregl.ScaleControl({ maxWidth: 80, unit: 'metric' }),
      'bottom-right',
    );

    map.on('move', () => {
      const vs = this.getViewState();
      this.viewChangeCallbacks.forEach((cb) => cb(vs));
    });
    map.on('click', (e: maplibregl.MapMouseEvent) => {
      this.clickCallback?.(e.lngLat.lat, e.lngLat.lng);
    });

    this.drawing = new MapLibreDrawingManager(map);
    this.measure = new MapLibreMeasureManager(map, this.drawing.getDraw());
  }

  resize(): void {
    this.map?.resize();
  }

  destroy(): void {
    this.drawing?.dispose();
    this.map?.remove();
    this.drawing = undefined;
    this.measure = undefined;
    this.map = undefined;
  }

  // ── View state + clicks ──────────────────────────────────────────────

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

  startDrawRoute(onUpdate: (id: string, positions: [number, number][]) => void): void {
    this.drawing?.startDrawRoute(onUpdate);
  }

  cancelDrawing(): void {
    this.drawing?.cancelDrawing();
  }

  addShape(shape: MapShape): void {
    this.drawing?.addShape(shape);
  }

  beginEdit(shape: MapShape): void {
    this.drawing?.beginEdit(shape);
  }

  endEdit(id: string): void {
    this.drawing?.endEdit(id);
  }

  setOnShapeEdited(callback: (shape: MapShape) => void): void {
    this.drawing?.setOnShapeEdited(callback);
  }

  setOnShapeDeleted(callback: (id: string) => void): void {
    this.drawing?.setOnShapeDeleted(callback);
  }

  setOnDeselect(callback: () => void): void {
    this.drawing?.setOnDeselect(callback);
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

  /**
   * Swap the basemap tile source. We keep the raster layer underneath
   * all other layers (above the background fill) so user shapes and
   * draw controls always render on top.
   */
  setBaseMap(url: string): void {
    const map = this.map;
    if (!map) return;

    const apply = () => {
      if (!this.map) return;
      if (this.map.getLayer('raster-layer')) this.map.removeLayer('raster-layer');
      if (this.map.getSource('raster-tiles')) this.map.removeSource('raster-tiles');
      this.map.addSource('raster-tiles', {
        type: 'raster',
        tiles: [url],
        tileSize: 256,
        minzoom: 0,
        maxzoom: 15,
        attribution: '© OpenStreetMap contributors',
      });
      const firstLayerId = this.map.getStyle().layers?.[0]?.id;
      this.map.addLayer(
        { id: 'raster-layer', type: 'raster', source: 'raster-tiles' },
        firstLayerId === 'background' ? this.map.getStyle().layers?.[1]?.id : firstLayerId,
      );
    };

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once('load', apply);
    }
  }

  setMapInteractionEnabled(enabled: boolean): void {
    const map = this.map;
    if (!map) return;
    if (enabled) {
      map.dragPan.enable();
      map.scrollZoom.enable();
      map.boxZoom.enable();
      map.dragRotate.enable();
      map.keyboard.enable();
      map.doubleClickZoom.enable();
      map.touchZoomRotate.enable();
    } else {
      map.dragPan.disable();
      map.scrollZoom.disable();
      map.boxZoom.disable();
      map.dragRotate.disable();
      map.keyboard.disable();
      map.doubleClickZoom.disable();
      map.touchZoomRotate.disable();
    }
  }

  zoomBy(delta: number): void {
    const map = this.map;
    if (!map) return;
    map.easeTo({ zoom: map.getZoom() + delta, duration: 220 });
  }

  resetNorth(durationMs = 420): void {
    this.map?.easeTo({ bearing: 0, duration: durationMs });
  }

  togglePitch3d(tiltedPitch = 60): void {
    const map = this.map;
    if (!map) return;
    const next = map.getPitch() > 12 ? 0 : tiltedPitch;
    map.easeTo({ pitch: next, duration: 480 });
  }

  isPitch3d(): boolean {
    return (this.map?.getPitch() ?? 0) > 12;
  }

  resetHomeView(durationMs = 520): void {
    const map = this.map;
    const home = this.homeView;
    if (!map || !home) return;
    map.easeTo({
      center: home.center,
      zoom: home.zoom,
      bearing: 0,
      pitch: 0,
      duration: durationMs,
    });
  }

  resetOrientation(durationMs = 420): void {
    this.map?.easeTo({ bearing: 0, pitch: 0, duration: durationMs });
  }

  flyTo(lngLat: [number, number], options?: { zoom?: number; durationMs?: number }): void {
    const map = this.map;
    if (!map) return;
    const [lng, lat] = lngLat;
    map.easeTo({
      center: [lng, lat],
      zoom: options?.zoom ?? map.getZoom(),
      duration: options?.durationMs ?? 700,
    });
  }
}
