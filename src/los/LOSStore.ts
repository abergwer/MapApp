import { makeAutoObservable, runInAction } from 'mobx';
import type { FeatureCollection } from 'geojson';
import { computeLOS } from './LOSService';
import type { LOSPoint, LOSProfileSample } from './types';

export type LOSStatus = 'idle' | 'computing' | 'ready' | 'error';

/**
 * Line-of-sight state. Click observer, click target, paint the segment
 * green (visible) / red (shadow). Talks only to `computeLOS`.
 */
export class LOSStore {
  observer: LOSPoint | null = null;
  target: LOSPoint | null = null;
  status: LOSStatus = 'idle';
  /** Server/network explanation when `status === 'error'`. */
  errorMessage: string | null = null;
  visibleGeoJSON: FeatureCollection | null = null;
  shadowGeoJSON: FeatureCollection | null = null;
  /** Elevation samples along the sightline (empty until server sends them). */
  profile: LOSProfileSample[] = [];

  /** Two-click placement flow is active (observer, then target). */
  placing = false;

  /** Observer height above ground (m). Stamped on the observer at placement. */
  observerHeightM = 2;

  /** Target height above ground (m). 0 = ground point. */
  targetHeightM = 0;

  private requestSeq = 0;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  beginPlacement() {
    this.clear();
    this.placing = true;
  }

  cancelPlacement() {
    this.placing = false;
  }

  placeObserver(position: LOSPoint) {
    this.observer = { ...position, heightM: this.observerHeightM };
  }

  completePlacement(target: LOSPoint) {
    this.placing = false;
    this.target = { ...target, heightM: this.targetHeightM };
    void this.compute();
  }

  setObserverHeight(heightM: number) {
    this.observerHeightM = heightM;
    if (this.observer) {
      this.observer.heightM = heightM;
      void this.compute();
    }
  }

  setTargetHeight(heightM: number) {
    this.targetHeightM = heightM;
    if (this.target) {
      this.target.heightM = heightM;
      void this.compute();
    }
  }

  clear() {
    this.requestSeq += 1; // invalidate any in-flight response
    this.placing = false;
    this.observer = null;
    this.target = null;
    this.status = 'idle';
    this.errorMessage = null;
    this.visibleGeoJSON = null;
    this.shadowGeoJSON = null;
    this.profile = [];
  }

  async compute() {
    const observer = this.observer;
    const target = this.target;
    if (!observer || !target) return;

    const seq = ++this.requestSeq;
    this.status = 'computing';

    try {
      const result = await computeLOS({ observer, target });
      runInAction(() => {
        if (seq !== this.requestSeq) return;
        this.visibleGeoJSON = result.visibleGeoJSON;
        this.shadowGeoJSON = result.shadowGeoJSON;
        this.profile = result.profile ?? [];
        this.status = 'ready';
        this.errorMessage = null;
      });
    } catch (err) {
      console.error('[LOS] compute failed:', err);
      runInAction(() => {
        if (seq !== this.requestSeq) return;
        this.status = 'error';
        this.errorMessage = err instanceof Error ? err.message : String(err);
      });
    }
  }
}
