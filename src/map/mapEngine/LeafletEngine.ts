import L from 'leaflet';
import type { MapEngine, MapEngineOptions, MapViewState } from './MapEngine';
import 'leaflet/dist/leaflet.css';
import config from '../../../config.json';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import {
  createLeafletEllipseTool,
  type LeafletEllipseTool,
} from '../utils/leafletEllipseTool';
import {
  createLeafletSectorTool,
  type LeafletSectorTool,
} from '../utils/leafletSectorTool';
import {
  distanceKm,
  formatArea,
  formatDistance,
  polygonAreaKm2,
  type LngLat,
} from '../utils/geo';

export class LeafletEngine implements MapEngine {
  private map?: L.Map;
  private viewChangeCallbacks = new Set<(viewState: MapViewState) => void>();
  private clickCallback?: (lat: number, lng: number) => void;
  private ellipseTool?: LeafletEllipseTool;
  private sectorTool?: LeafletSectorTool;
  private measureLayers: L.Layer[] = [];
  private baseLayer?: L.TileLayer;

  initialize(container: HTMLElement, options: MapEngineOptions): void {
    this.map = L.map(container, {
      center: options.center,
      zoom: options.zoom,
      zoomControl: false,
      zoomAnimation: false,
      worldCopyJump: false, // disable seamless horizontal panning/duplication at zooms where it would be enabled by default
      fadeAnimation: false,
      markerZoomAnimation: false,
      attributionControl: false,
       maxBounds: [
    [-85, -180],   // southwest corner of the world
    [85, 180]      // northeast corner of the world
  ],
      maxBoundsViscosity: 1.0,
    });

    L.control.scale({ position: 'bottomright' }).addTo(this.map);
    L.control.zoom({ position: 'topright' as L.ControlPosition }).addTo(this.map);

    this.baseLayer = L.tileLayer(config.LeafletTilesURL, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 17,
      minZoom: 3,
    }).addTo(this.map);

    let ticking = false;
    const emitViewChange = () => {
      const vs = this.getViewState();
      this.viewChangeCallbacks.forEach((cb) => cb(vs));
    };
    const syncView = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        emitViewChange();
        ticking = false;
      });
    };

    this.map.on('move', syncView);
    this.map.on('zoom', syncView);
    // Guarantee final state is synced after animations settle
    this.map.on('zoomend', emitViewChange);
    this.map.on('moveend', emitViewChange);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.clickCallback?.(e.latlng.lat, e.latlng.lng);
    });

    this.ellipseTool = createLeafletEllipseTool(this.map);
    this.sectorTool = createLeafletSectorTool(this.map);
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
    this.viewChangeCallbacks.add(callback);
    return () => {
      this.viewChangeCallbacks.delete(callback);
    };
  }

  onMapClick(callback: (lat: number, lng: number) => void): void {
    this.clickCallback = callback;
  }

  resize(): void {
    this.map?.invalidateSize();
  }

  destroy(): void {
    this.removeMeasurements();
    this.ellipseTool = undefined;
    this.sectorTool = undefined;
    this.map?.remove();
    this.map = undefined;
  }

  startDrawPoint(onComplete: (position: [number, number]) => void): void {
    // `continueDrawing: false` ensures the draw tool disables itself after the
    // first marker is placed, so the user gets exactly one point.
    this.map?.pm.enableDraw('Marker', { continueDrawing: false });

    const handler = (e: any) => {
      const { lat, lng } = e.layer.getLatLng();
      onComplete([lng, lat] as [number, number]);
      this.map?.off('pm:create', handler);
    };

    this.map?.on('pm:create', handler);
  }

  startDrawLine(onComplete: (positions: [number, number][]) => void): void {
    this.map?.pm.enableDraw('Line', { hideMiddleMarkers: true });

    const handler = (e: any) => {
      const coords = e.layer.getLatLngs().map((p: any) => [p.lng, p.lat]);
      onComplete(coords);
      this.map?.off('pm:create', handler);
    };

    this.map?.on('pm:create', handler);
  }

  startDrawPolygon(onComplete: (positions: [number, number][]) => void): void {
    this.map?.pm.enableDraw('Polygon');

    const handler = (e: any) => {
      const coords = e.layer.getLatLngs()[0].map((p: any) => [p.lng, p.lat]);
      onComplete(coords);
      this.map?.off('pm:create', handler);
    };

    this.map?.on('pm:create', handler);
  }

  startDrawCircle(onComplete: (center: [number, number], radius: number) => void): void {
    this.map?.pm.enableDraw('Circle');

    const handler = (e: any) => {
      const center = e.layer.getLatLng();
      onComplete([center.lng, center.lat], e.layer.getRadius());
      this.map?.off('pm:create', handler);
    };

    this.map?.on('pm:create', handler);
  }

  startDrawEllipse(
    onComplete: (center: [number, number], radiusX: number, radiusY: number) => void
  ): void {
    this.ellipseTool?.startDraw(({ center, radiusX, radiusY }) =>
      onComplete(center, radiusX, radiusY)
    );
  }

  startDrawSector(
    onComplete: (
      center: [number, number],
      radius: number,
      startBearing: number,
      endBearing: number
    ) => void
  ): void {
    this.sectorTool?.startDraw(({ center, radius, startBearing, endBearing }) =>
      onComplete(center, radius, startBearing, endBearing)
    );
  }

    startDrawRoute(
  onUpdate: (positions: [number, number][]) => void
): void {
  this.map?.pm.enableDraw('Line', { hideMiddleMarkers: true });

  const handler = (e: any) => {
    const layer = e.layer;

    // Initial route
    const coords = layer.getLatLngs().map((p: any) => [p.lng, p.lat]);
    onUpdate(coords);

    // Listen for vertex deletion
    layer.on('pm:vertexremoved', () => {
      const updated = layer.getLatLngs().map((p: any) => [p.lng, p.lat]);
      onUpdate(updated);
    });

    // Listen for dragging/editing vertices
    layer.on('pm:edit', () => {
      const updated = layer.getLatLngs().map((p: any) => [p.lng, p.lat]);
      onUpdate(updated);
    });

    // Stop listening for creation
    this.map?.off('pm:create', handler);
  };

  this.map?.on('pm:create', handler);
}

  startMeasureDistance(onComplete: (distanceKm: number) => void): void {
    this.map?.pm.enableDraw('Line');
    
    const handler = (e: any) => {
      const latlngs = e.layer.getLatLngs() as L.LatLng[];
      let total = 0;

      for (let i = 1; i < latlngs.length; i++) {
        const segKm = distanceKm(
          [latlngs[i - 1].lng, latlngs[i - 1].lat],
          [latlngs[i].lng, latlngs[i].lat],
        );
        total += segKm;
        const mid = L.latLng(
          (latlngs[i - 1].lat + latlngs[i].lat) / 2,
          (latlngs[i - 1].lng + latlngs[i].lng) / 2,
        );
        this.addMeasureLabel(mid, formatDistance(segKm));
      }

      e.layer
        .bindTooltip(`Total: ${formatDistance(total)}`, {
          permanent: true,
          direction: 'top',
        })
        .openTooltip();
      this.freezeAsMeasure(e.layer);
      onComplete(total);
      this.map?.off('pm:create', handler);
    };

    this.map?.on('pm:create', handler);
  }

  startMeasureArea(onComplete: (areaKm2: number) => void): void {
    this.map?.pm.enableDraw('Polygon');

    const handler = (e: any) => {
      const ring: LngLat[] = e.layer
        .getLatLngs()[0]
        .map((p: L.LatLng) => [p.lng, p.lat]);
      const km2 = polygonAreaKm2(ring);
      e.layer
        .bindTooltip(formatArea(km2), { permanent: true, direction: 'center' })
        .openTooltip();
      this.freezeAsMeasure(e.layer);
      onComplete(km2);
      this.map?.off('pm:create', handler);
    };

    this.map?.on('pm:create', handler);
  }

  removeMeasurements(): void {
    this.measureLayers.forEach((layer) => this.map?.removeLayer(layer));
    this.measureLayers = [];
  }

  /** Add a non-interactive text label and track it for removal. */
  private addMeasureLabel(at: L.LatLng, text: string): void {
    if (!this.map) return;
    const marker = L.marker(at, {
      icon: L.divIcon({ className: 'measure-label', html: text }),
      interactive: false,
      pmIgnore: true,
    }).addTo(this.map);
    this.measureLayers.push(marker);
  }

  /** Mark a drawn layer as non-editable and track it for removal. */
  private freezeAsMeasure(layer: L.Layer & { options: { pmIgnore?: boolean } }): void {
    layer.options.pmIgnore = true;
    L.PM.reInitLayer(layer);
    this.measureLayers.push(layer);
  }

  cancelDrawing(): void {
    this.ellipseTool?.cancelDraw();
    this.sectorTool?.cancelDraw();
    this.map?.pm.disableDraw();
  }

  /**
   * Toggle Geoman's global edit mode plus our custom ellipse editor. Cancels
   * any in-progress drawing first and freezes map panning so dragging edit
   * handles can't accidentally pan the basemap.
   */
  setEditMode(enabled: boolean): void {
    const map = this.map;
    if (!map) return;

    if (enabled) {
      this.ellipseTool?.cancelDraw();
      this.sectorTool?.cancelDraw();
      map.pm.disableDraw();
      map.dragging.disable();
      map.doubleClickZoom.disable();
      map.keyboard.disable();
      // Ellipse + sector polygons are tagged `pmIgnore`, so Geoman's global
      // edit skips them and only handles markers/lines/polygons/circles.
      this.ellipseTool?.enableEdit();
      this.sectorTool?.enableEdit();
      map.pm.enableGlobalEditMode({ allowSelfIntersection: false });
    } else {
      map.pm.disableGlobalEditMode();
      this.ellipseTool?.disableEdit();
      this.sectorTool?.disableEdit();
      map.dragging.enable();
      map.doubleClickZoom.enable();
      map.keyboard.enable();
    }
  }

  /** Swap the basemap tile source. */
  setBaseMap(url: string): void {
    if (!this.map) return;
    if (this.baseLayer) this.map.removeLayer(this.baseLayer);
    this.baseLayer = L.tileLayer(url, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      noWrap: true,
      bounds: L.latLngBounds([-90, -180], [90, 180]),
    }).addTo(this.map);
  }
}
