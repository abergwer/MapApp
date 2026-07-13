import { DroneStore } from './DroneStore';
import { AirCraftStore } from './AirCraftStore';
import { MissileStore } from './MissileStore';
import { PolygonStore } from './PolygonStore';
import { MapEngineStore } from './MapEngineStore';
import { DrawingToolStore } from './DrawingToolStore';
import { EntityService } from './EntityService';
import type { EditableEntitySource } from './EditableEntitySource';
import { DRAWN_SHAPE_LAYER_IDS } from '../Components/Layers/DrawnShapeLayers';
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
  entityService = new EntityService(this.drawingToolStore, DRAWN_SHAPE_LAYER_IDS);

  // The store driving map editing. LayerManager (pick → select) and
  // MapWrapper (select → engine beginEdit, engine round-trips) only talk to
  // this interface — point it at any other `EditableEntitySource` to swap
  // the editing store without touching the pipeline.
  editSource: EditableEntitySource = this.entityService;
}

export const rootStore = new RootStore();

if (import.meta.env.DEV) {
  // Expose for ad-hoc debugging in the browser console, e.g.
  // __stores.droneStore.upsert({ id: 't1', position: [...], icon: '...' })
  (window as unknown as { __stores: RootStore }).__stores = rootStore;
}
