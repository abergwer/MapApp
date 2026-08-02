import { makeAutoObservable, reaction, runInAction } from 'mobx';
import type { FeatureCollection } from 'geojson';
import { computeAreaLOS } from './LOSService';
import type { LOSPoint } from './types';
import type { LOSStore, LOSStatus } from './LOSStore';

/**
 * Area line-of-sight (viewshed): one click places the observer, then the
 * user draws a polygon around it; the server fills the polygon with
 * visible (green) / shadow (red) sectors based on the terrain elevation.
 * Observer/target heights are shared with the line feature via `losStore`.
 */
export class AreaLOSStore {
  observer: LOSPoint | null = null;
  /** [lng, lat] ring the user drew around the observer. */
  polygon: [number, number][] | null = null;
  status: LOSStatus = 'idle';
  visibleGeoJSON: FeatureCollection | null = null;
  shadowGeoJSON: FeatureCollection | null = null;

  /** Stage 1: waiting for the observer click. */
  placing = false;
  /** Stage 2: observer placed, waiting for the polygon draw. */
  drawingPolygon = false;

  private losStore: LOSStore;
  private requestSeq = 0;

  constructor(losStore: LOSStore) {
    this.losStore = losStore;
    makeAutoObservable(this, {}, { autoBind: true });

    // Heights live in the shared LOS panel (losStore). When either one
    // changes while a viewshed is on screen, recompute it with the new
    // values — same live behavior as the sightline.
    reaction(
      () => [losStore.observerHeightM, losStore.targetHeightM],
      this.applyHeights,
    );
  }

  private applyHeights() {
    if (!this.observer || !this.polygon) return;
    this.observer.heightM = this.losStore.observerHeightM;
    void this.compute();
  }

  beginPlacement() {
    this.clear();
    this.placing = true;
  }

  cancelPlacement() {
    this.placing = false;
    this.drawingPolygon = false;
    // An observer without a polygon is an unfinished flow — drop it.
    if (!this.polygon) this.observer = null;
  }

  /** Stage 1 map click: place the observer, then ask for the polygon. */
  placeObserver(position: LOSPoint) {
    this.placing = false;
    this.observer = { ...position, heightM: this.losStore.observerHeightM };
    this.drawingPolygon = true;
  }

  /** Stage 2 draw-complete: store the ring and compute the viewshed. */
  setPolygon(positions: [number, number][]) {
    if (!this.observer || positions.length < 3) return;
    this.drawingPolygon = false;
    this.polygon = positions;
    void this.compute();
  }

  clear() {
    this.requestSeq += 1; // invalidate any in-flight response
    this.placing = false;
    this.drawingPolygon = false;
    this.observer = null;
    this.polygon = null;
    this.status = 'idle';
    this.visibleGeoJSON = null;
    this.shadowGeoJSON = null;
  }

  async compute() {
    const observer = this.observer;
    const polygon = this.polygon;
    if (!observer || !polygon) return;

    const seq = ++this.requestSeq;
    this.status = 'computing';

    try {
      const result = await computeAreaLOS({
        observer,
        polygon,
        targetHeightM: this.losStore.targetHeightM,
      });
      runInAction(() => {
        if (seq !== this.requestSeq) return;
        this.visibleGeoJSON = result.visibleGeoJSON;
        this.shadowGeoJSON = result.shadowGeoJSON;
        this.status = 'ready';
      });
    } catch (err) {
      console.error('[AreaLOS] compute failed:', err);
      runInAction(() => {
        if (seq !== this.requestSeq) return;
        this.status = 'error';
      });
    }
  }
}
