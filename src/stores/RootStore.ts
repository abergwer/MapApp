import { DroneStore } from './DroneStore';
import { AirCraftStore } from './AirCraftStore';
import { MissileStore } from './MissileStore';
import { createMapStores, type BaseMap } from '@mapapp/map';
import { UIVisibilityStore } from './UIVisibilityStore';
import { ThemeStore } from './ThemeStore';
import { selectedMapEngine } from '../mapConfig';
import config from '../../config.json';

export class RootStore {
  droneStore = new DroneStore();
  airCraftStore = new AirCraftStore();
  missileStore = new MissileStore();

  // The map package's state handle (opaque trio created by its factory);
  // MapStoresProvider shares it with the package's internals.
  mapStores = createMapStores({
    engineType: selectedMapEngine,
    baseMapStyles: config.MapStyles as Partial<Record<BaseMap, string>>,
  });

  // Aliases for the package stores/services the host reads/writes directly.
  mapEngineStore = this.mapStores.mapEngineStore;
  drawingToolStore = this.mapStores.drawingToolStore;
  // Single writer for drawn-entity CRUD, created by the map package; every
  // create / edit / delete goes through it.
  entityService = this.mapStores.entityService;

  uiVisibilityStore = new UIVisibilityStore();
  themeStore = new ThemeStore();
}

export const rootStore = new RootStore();

if (import.meta.env.DEV) {
  // Expose for ad-hoc debugging in the browser console, e.g.
  // __stores.droneStore.upsert({ id: 't1', position: [...], icon: '...' })
  (window as unknown as { __stores: RootStore }).__stores = rootStore;
}
