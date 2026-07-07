import { DroneStore } from './DroneStore';
import { AirCraftStore } from './AirCraftStore';
import { MissileStore } from './MissileStore';
import { PolygonStore } from './PolygonStore';
import { MapEngineStore } from './MapEngineStore';
import { DrawingToolStore } from './DrawingToolStore';
import { EntityService } from './EntityService';
import { MapStyleStore } from './MapStyleStore';
import { UIVisibilityStore } from './UIVisibilityStore';
import { LayerVisibilityStore } from './LayerVisibilityStore';

export class RootStore {
  droneStore = new DroneStore();
  airCraftStore = new AirCraftStore();
  missileStore = new MissileStore();
  polygonStore = new PolygonStore();
  mapEngineStore = new MapEngineStore();
  drawingToolStore = new DrawingToolStore();
  mapStyleStore = new MapStyleStore();
  uiVisibilityStore = new UIVisibilityStore();
  layerVisibilityStore = new LayerVisibilityStore();

  // Single writer for drawn-entity CRUD (create / edit / delete). The UI and
  // map engines mutate entities only through here; `drawingToolStore` stays
  // the single source of truth. This is the one seam a future server plugs into.
  entityService = new EntityService(this.drawingToolStore);
}

export const rootStore = new RootStore();

if (import.meta.env.DEV) {
  // Expose for ad-hoc debugging in the browser console, e.g.
  // __stores.droneStore.upsert({ id: 't1', position: [...], icon: '...' })
  (window as unknown as { __stores: RootStore }).__stores = rootStore;
}
