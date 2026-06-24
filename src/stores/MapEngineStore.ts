import { makeAutoObservable } from 'mobx';
import type { MapEngine, MapEngineType, MapViewState } from '../map/mapEngine/MapEngine';
import { selectedMapEngine as initialEngine } from '../map/mapConfig';

export class MapEngineStore {
  // Fixed at construction from mapConfig — not user-changeable.
  readonly selectedEngine: MapEngineType = initialEngine;
  engine: MapEngine | null = null;
  viewState: MapViewState | null = null;

  constructor() {
    makeAutoObservable(this, { selectedEngine: false });
  }

  setEngine(engine: MapEngine | null) {
    this.engine = engine;
    if (!engine) {
      this.viewState = null;
    }
  }

  setViewState(vs: MapViewState) {
    this.viewState = vs;
  }
}
