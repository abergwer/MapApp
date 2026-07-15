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
import { WindowDockStore } from './WindowDockStore';
import { MapCursorStore } from './MapCursorStore';
import { TrackedTargetStore } from './TrackedTargetStore';
import { TargetMotionService } from './TargetMotionService';
import { targetMotionConfig } from '../config/targetMotion.config';

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
  windowDockStore = new WindowDockStore();
  mapCursorStore = new MapCursorStore();
  trackedTargetStore = new TrackedTargetStore();

  // Single writer for drawn-entity CRUD (create / edit / delete). The UI and
  // map engines mutate entities only through here; `drawingToolStore` stays
  // the single source of truth. This is the one seam a future server plugs into.
  entityService = new EntityService(this.drawingToolStore);

  /** Live target motion — writes only via AirCraftStore / DroneStore upsert. */
  targetMotionService = new TargetMotionService(this);

  constructor() {
    // Default focus: first aircraft so 3D has a real track immediately.
    const first = this.airCraftStore.targets[0];
    if (first) {
      this.trackedTargetStore.select({ kind: 'aircraft', id: first.id });
    }
    if (targetMotionConfig.enabled) {
      this.targetMotionService.start();
    }
  }
}

export const rootStore = new RootStore();

if (import.meta.env.DEV) {
  // Expose for ad-hoc debugging in the browser console, e.g.
  // __stores.droneStore.upsert({ id: 't1', position: [...], icon: '...' })
  (window as unknown as { __stores: RootStore }).__stores = rootStore;
}
