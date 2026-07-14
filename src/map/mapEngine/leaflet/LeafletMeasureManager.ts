import L from 'leaflet';
import {
  distanceKm,
  formatArea,
  formatDistance,
  polygonAreaKm2,
  type LngLat,
} from '../../utils/geo';

/**
 * Owns measurement drawing for the Leaflet engine: pulls a line or
 * polygon via Geoman, annotates it with permanent tooltips, and keeps a
 * list of overlay layers so they can all be cleared in one call.
 *
 * Measure overlays are marked `pmIgnore` after creation so Geoman's
 * global edit skips them — measurements are read-only annotations, not
 * editable shapes.
 */
export class LeafletMeasureManager {
  private overlays: L.Layer[] = [];
  /**
   * Active `pm:create` listener, tracked so `cancel()` can detach it when
   * the user switches to a draw tool without completing the measurement.
   * Otherwise the stale listener would fire on the next drawn shape and
   * corrupt it (e.g. calling `getLatLngs()` on an `L.Circle` throws).
   */
  private pendingCreate?: (e: { layer: L.Layer }) => void;

  private readonly map: L.Map;

  constructor(map: L.Map) {
    this.map = map;
  }

  startMeasureDistance(onComplete: (distanceKm: number) => void): void {
    this.cancel();
    this.map.pm.enableDraw('Line');
    this.onceCreate((layer: L.Polyline) => {
      const latlngs = layer.getLatLngs() as L.LatLng[];
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
        this.addLabel(mid, formatDistance(segKm));
      }

      layer
        .bindTooltip(`Total: ${formatDistance(total)}`, {
          permanent: true,
          direction: 'top',
        })
        .openTooltip();
      this.freeze(layer);
      onComplete(total);
    });
  }

  startMeasureArea(onComplete: (areaKm2: number) => void): void {
    this.cancel();
    this.map.pm.enableDraw('Polygon');
    this.onceCreate((layer: L.Polygon) => {
      const ring: LngLat[] = (layer.getLatLngs()[0] as L.LatLng[]).map((p) => [
        p.lng,
        p.lat,
      ]);
      const km2 = polygonAreaKm2(ring);
      layer
        .bindTooltip(formatArea(km2), { permanent: true, direction: 'center' })
        .openTooltip();
      this.freeze(layer);
      onComplete(km2);
    });
  }

  removeAll(): void {
    this.overlays.forEach((layer) => this.map.removeLayer(layer));
    this.overlays = [];
  }

  /**
   * Cancel a pending measure draw (disable Geoman's draw mode and detach
   * the pending `pm:create` listener). Frozen overlays are left alone —
   * use `removeAll` for those. Called by the engine's `cancelDrawing()` so
   * switching to a drawing tool mid-measure doesn't leave a stale listener
   * that would then fire on the next drawn shape.
   */
  cancel(): void {
    this.map.pm.disableDraw();
    if (this.pendingCreate) {
      this.map.off('pm:create', this.pendingCreate);
      this.pendingCreate = undefined;
    }
  }

  // ── Internals ────────────────────────────────────────────────────────

  private onceCreate<T extends L.Layer>(handler: (layer: T) => void): void {
    const wrapped = (e: any) => {
      this.pendingCreate = undefined;
      handler(e.layer as T);
      this.map.off('pm:create', wrapped);
    };
    this.pendingCreate = wrapped;
    this.map.on('pm:create', wrapped);
  }

  private addLabel(at: L.LatLng, text: string): void {
    const marker = L.marker(at, {
      icon: L.divIcon({ className: 'measure-label', html: text }),
      interactive: false,
    }).addTo(this.map);
    this.overlays.push(marker);
  }

  /** Tag a drawn layer as non-editable and track it for removal. */
  private freeze(layer: L.Layer & { options: { pmIgnore?: boolean } }): void {
    layer.options.pmIgnore = true;
    L.PM.reInitLayer(layer);
    this.overlays.push(layer);
  }
}
