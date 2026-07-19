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

  // ── Lifecycle ────────────────────────────────────────────────────────

  initialize(container: HTMLElement, options: MapEngineOptions): void {
    const map = new maplibregl.Map({
      container,
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: [config.MapLibreTilesURL],
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

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
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
  //
  // Each `startDraw*` first cancels any pending measure listener so
  // switching from a measure tool to a draw tool doesn't leave a stale
  // `draw.create` handler that would fire on — and corrupt — the next
  // drawn feature (see `MapLibreMeasureManager.cancel`).

  startDrawPoint(onComplete: (id: string, position: [number, number]) => void): void {
    this.measure?.cancel();
    this.drawing?.startDrawPoint(onComplete);
  }

  startDrawLine(onComplete: (id: string, positions: [number, number][]) => void): void {
    this.measure?.cancel();
    this.drawing?.startDrawLine(onComplete);
  }

  startDrawPolygon(onComplete: (id: string, positions: [number, number][]) => void): void {
    this.measure?.cancel();
    this.drawing?.startDrawPolygon(onComplete);
  }

  startDrawCircle(
    onComplete: (id: string, center: [number, number], radius: number) => void,
  ): void {
    this.measure?.cancel();
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
    this.measure?.cancel();
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
    this.measure?.cancel();
    this.drawing?.startDrawSector(onComplete);
  }

  startDrawRoute(onUpdate: (id: string, positions: [number, number][]) => void): void {
    this.measure?.cancel();
    this.drawing?.startDrawRoute(onUpdate);
  }

  cancelDrawing(): void {
    this.drawing?.cancelDrawing();
    this.measure?.cancel();
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
  //
  // Each `startMeasure*` first cancels any pending draw listener so
  // switching from a draw tool to a measure tool doesn't leave a stale
  // `draw.create` handler attached to the next drawn feature.

  startMeasureDistance(onComplete: (distanceKm: number) => void): void {
    this.drawing?.cancelDrawing();
    this.measure?.startMeasureDistance(onComplete);
  }

  startMeasureArea(onComplete: (areaKm2: number) => void): void {
    this.drawing?.cancelDrawing();
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

    // MapLibre throws "Cannot read properties of undefined (reading 'getLayer')"
    // if the style isn't loaded yet — getLayer/getSource/getStyle() all reach
    // into `map.style` which is only populated after the `load` event. Defer
    // the swap until the style is ready.
    if (!map.isStyleLoaded()) {
      map.once('load', () => this.setBaseMap(url));
      return;
    }

    if (map.getLayer('raster-layer')) map.removeLayer('raster-layer');
    if (map.getSource('raster-tiles')) map.removeSource('raster-tiles');
    map.addSource('raster-tiles', {
      type: 'raster',
      tiles: [url],
      tileSize: 256,
      minzoom: 0,
      maxzoom: 15,
      attribution: '© OpenStreetMap contributors',
    });
    const layers = map.getStyle().layers ?? [];
    const firstLayerId = layers[0]?.id;
    map.addLayer(
      { id: 'raster-layer', type: 'raster', source: 'raster-tiles' },
      firstLayerId === 'background' ? layers[1]?.id : firstLayerId,
    );
  }
}
