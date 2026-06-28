import maplibregl from 'maplibre-gl/dist/maplibre-gl.js';
import type MapboxDraw from '@mapbox/mapbox-gl-draw';
import {
  centroidOf,
  distanceKm,
  formatArea,
  formatDistance,
  polygonAreaKm2,
  type LngLat,
} from '../../utils/geo';

/**
 * Owns measurement drawing for the MapLibre engine. Reuses the
 * engine's MapboxDraw instance for line/polygon authoring, then
 * "freezes" the resulting feature onto a plain GeoJSON source so the
 * user can't accidentally drag/reshape it after measuring.
 *
 * Tracks every overlay (label markers + frozen layers/sources) so
 * `removeAll` can wipe the whole measurement layer cleanly.
 */
export class MapLibreMeasureManager {
  private readonly map: maplibregl.Map;
  private readonly draw: MapboxDraw;
  private labels: maplibregl.Marker[] = [];
  private layerIds: string[] = [];
  private counter = 0;

  constructor(map: maplibregl.Map, draw: MapboxDraw) {
    this.map = map;
    this.draw = draw;
  }

  startMeasureDistance(onComplete: (distanceKm: number) => void): void {
    this.draw.changeMode('draw_line_string');
    this.onceCreate((feature) => {
      const coords = feature.geometry.coordinates as LngLat[];
      let total = 0;

      for (let i = 1; i < coords.length; i++) {
        const segKm = distanceKm(coords[i - 1], coords[i]);
        total += segKm;
        this.addLabel(formatDistance(segKm), centroidOf([coords[i - 1], coords[i]]));
      }
      this.addLabel(`Total: ${formatDistance(total)}`, coords[coords.length - 1]);
      this.freeze(feature, 'line');
      onComplete(total);
    });
  }

  startMeasureArea(onComplete: (areaKm2: number) => void): void {
    this.draw.changeMode('draw_polygon');
    this.onceCreate((feature) => {
      const ring = feature.geometry.coordinates[0] as LngLat[];
      const km2 = polygonAreaKm2(ring);
      this.addLabel(formatArea(km2), centroidOf(ring));
      this.freeze(feature, 'fill');
      onComplete(km2);
    });
  }

  removeAll(): void {
    this.labels.forEach((m) => m.remove());
    this.labels = [];
    this.layerIds.forEach((id) => {
      if (this.map.getLayer(id)) this.map.removeLayer(id);
      if (this.map.getSource(id)) this.map.removeSource(id);
    });
    this.layerIds = [];
  }

  // ── Internals ────────────────────────────────────────────────────────

  private onceCreate(handler: (feature: any) => void): void {
    const wrapped = (e: any) => {
      handler(e.features[0]);
      this.map.off('draw.create', wrapped);
    };
    this.map.on('draw.create', wrapped);
  }

  /**
   * Move a feature off the editable MapboxDraw layer and onto a plain,
   * non-interactive GeoJSON source so the user can't reshape it.
   */
  private freeze(feature: GeoJSON.Feature, paint: 'line' | 'fill'): void {
    if (!feature.id) return;
    this.draw.delete(String(feature.id));
    const id = `measure-${paint}-${this.counter++}`;
    this.map.addSource(id, { type: 'geojson', data: feature });
    if (paint === 'line') {
      this.map.addLayer({
        id,
        type: 'line',
        source: id,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#2563eb', 'line-width': 3 },
      });
    } else {
      this.map.addLayer({
        id,
        type: 'fill',
        source: id,
        paint: {
          'fill-color': '#2563eb',
          'fill-opacity': 0.2,
          'fill-outline-color': '#2563eb',
        },
      });
    }
    this.layerIds.push(id);
  }

  private addLabel(text: string, position: LngLat): void {
    const el = document.createElement('div');
    el.className = 'measure-label';
    el.textContent = text;
    const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat(position)
      .addTo(this.map);
    this.labels.push(marker);
  }
}
