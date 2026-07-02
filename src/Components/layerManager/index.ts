import type { Layer } from '@deck.gl/core';
import { createPolygonLayer } from '../Layers/PolygonLayer';
import { createMissilesLayer } from '../Layers/MissileLayer';
import { createDroneLayer } from '../Layers/DroneLayer';
import { createAirCraftLayer } from '../Layers/AirCraftLayer';
import { createRangeRingsLayer } from '../Layers/RangeRingsLayer';
import { createDrawnShapeLayers } from '../Layers/DrawnShapeLayers';
import type { RootStore } from '../../stores/RootStore';

/**
 * Build the array of Deck.gl layers from the current store state.
 *
 * To add a new layer: create a factory in `../Layers` and call it here.
 * MobX tracks the observable reads done inside this function — when wrapped
 * in a `reaction()` (see LayerManager) it will rerun automatically as the
 * underlying store collections change.
 */
export function buildLayers(stores: RootStore): Layer[] {
  return [
    // User-drawn shapes (render-only; the selected one is owned by the engine).
    ...createDrawnShapeLayers(
      stores.drawingToolStore.completedShapes,
      stores.drawingToolStore.selectedId,
    ),
    createPolygonLayer(stores.polygonStore.polygons),
    createMissilesLayer(stores.missileStore.missiles),
    createDroneLayer(stores.droneStore.targets),
    createAirCraftLayer(stores.airCraftStore.targets),
    createRangeRingsLayer(stores.droneStore.targets),
  ];
}

