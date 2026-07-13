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
  const { drawingToolStore } = stores;
  return [
    // User-drawn shapes. The map engine's native edit tools drive the same
    // store via `entityService`; deck.gl only renders and picks here.
    ...createDrawnShapeLayers(
      drawingToolStore.completedShapes,
      drawingToolStore.selectedId,
    ),
    createPolygonLayer(stores.polygonStore.polygons),
    createMissilesLayer(stores.missileStore.missiles),
    createDroneLayer(stores.droneStore.targets),
    createAirCraftLayer(stores.airCraftStore.targets),
    createRangeRingsLayer(stores.droneStore.targets),
  ];
}
