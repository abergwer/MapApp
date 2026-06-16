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
  private viewChangeCallback?: (viewState: MapViewState) => void;
  private clickCallback?: (lat: number, lng: number) => void;
  private ellipseTool?: LeafletEllipseTool;
  private sectorTool?: LeafletSectorTool;
  private measureLayers: L.Layer[] = [];

  initialize(container: HTMLElement, options: MapEngineOptions): void {
    this.map = L.map(container, {
      center: options.center,
      zoom: options.zoom,
      zoomControl: false,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
      attributionControl: false,
    });

    L.control.scale({ position: 'bottomright' }).addTo(this.map);
    L.control.zoom({ position: 'topright' as L.ControlPosition }).addTo(this.map);

    L.tileLayer(config.LeafletTilesURL, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 17,
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
    this.removeMeasurements();
    this.ellipseTool = undefined;
    this.sectorTool = undefined;
    this.map?.remove();
    this.map = undefined;
  }

  startDrawPoint(onComplete: (position: [number, number]) => void): void {
    this.map?.pm.enableDraw('Marker');

    const handler = (e: any) => {
      const { lat, lng } = e.layer.getLatLng();
      onComplete([lng, lat] as [number, number]);
      this.map?.off('pm:create', handler);
    };

    this.map?.on('pm:create', handler);
  }

  startDrawLine(onComplete: (positions: [number, number][]) => void): void {
    this.map?.pm.enableDraw('Line');

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

  startMeasureDistance(onComplete: (distanceKm: number) => void): void {
    this.map?.pm.enableDraw('Line');

    const handler = (e: any) => {
      const latlngs = e.layer.getLatLngs() as L.LatLng[];
      const coords: LngLat[] = latlngs.map((p) => [p.lng, p.lat]);

      let total = 0;
      for (let i = 1; i < coords.length; i++) {
        const segKm = distanceKm(coords[i - 1], coords[i]);
        total += segKm;
        const mid = L.latLng(
          (latlngs[i - 1].lat + latlngs[i].lat) / 2,
          (latlngs[i - 1].lng + latlngs[i].lng) / 2,
        );
        const segLabel = L.marker(mid, {
          icon: L.divIcon({
            className: 'measure-label measure-label--segment',
            html: formatDistance(segKm),
          }),
          interactive: false,
          pmIgnore: true,
        }).addTo(this.map!);
        this.measureLayers.push(segLabel);
      }

      e.layer
        .bindTooltip(`Total: ${formatDistance(total)}`, {
          permanent: true,
          direction: 'top',
        })
        .openTooltip();
      e.layer.options.pmIgnore = true;
      L.PM.reInitLayer(e.layer);
      this.measureLayers.push(e.layer);
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
      e.layer.options.pmIgnore = true;
      L.PM.reInitLayer(e.layer);
      this.measureLayers.push(e.layer);
      onComplete(km2);
      this.map?.off('pm:create', handler);
    };

    this.map?.on('pm:create', handler);
  }

  removeMeasurements(): void {
    this.measureLayers.forEach((layer) => this.map?.removeLayer(layer));
    this.measureLayers = [];
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
}
