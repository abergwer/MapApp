import { DroneStore } from './DroneStore';
import { AirCraftStore } from './AirCraftStore';
import { MissileStore } from './MissileStore';
import { PolygonStore } from './PolygonStore';
import { MapEngineStore } from './MapEngineStore';
import { DrawingToolStore } from './DrawingToolStore';
import { EntityService } from './EntityService';
import { MapStyleStore } from './MapStyleStore';
import { UIVisibilityStore } from './UIVisibilityStore';
import { ThemeStore } from './ThemeStore';

export class RootStore {
  droneStore = new DroneStore();
  airCraftStore = new AirCraftStore();
  missileStore = new MissileStore();
  polygonStore = new PolygonStore();
  mapEngineStore = new MapEngineStore();
  drawingToolStore = new DrawingToolStore();
  mapStyleStore = new MapStyleStore();
  uiVisibilityStore = new UIVisibilityStore();
  themeStore = new ThemeStore();

  // Single writer for drawn-entity CRUD. Every create / edit / delete goes
  // through here so external consumers can subscribe via `setHooks(...)` and
  // observe every change without touching the store directly.
  entityService = new EntityService(this.drawingToolStore);
}

export const rootStore = new RootStore();

if (import.meta.env.DEV) {
  // Expose for ad-hoc debugging in the browser console, e.g.
  // __stores.droneStore.upsert({ id: 't1', position: [...], icon: '...' })
  (window as unknown as { __stores: RootStore }).__stores = rootStore;
}
