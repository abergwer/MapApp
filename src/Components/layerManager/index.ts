import type { Layer } from '@deck.gl/core';
import { createPolygonLayer } from '../Layers/PolygonLayer';
import { createMissilesLayer } from '../Layers/MissileLayer';
import { createDroneLayer } from '../Layers/DroneLayer';
import { createAirCraftLayer } from '../Layers/AirCraftLayer';
import { createRangeRingsLayer } from '../Layers/RangeRingsLayer';
import { createDrawnShapeLayers } from '../Layers/DrawnShapeLayers';
import type { RootStore } from '../../stores/RootStore';
import type { LayerGroup } from '../../stores/LayerVisibilityStore';

/**
 * Groups shown in the LayersPanel. Each entry bundles the Deck.gl layer ids
 * backed by the same store — or derived from the same data — so the user
 * gets one switch per concept, with an expandable list of per-layer toggles
 * for fine-tuning.
 *
 * Keep the sub-layer ids in sync with the `id:` strings in the layer
 * factories under `../Layers/*.ts`.
 */
export const LAYER_GROUPS: readonly LayerGroup[] = [
  {
    id: 'drawn-shapes',
    label: 'Drawn Shapes',
    layers: [
      { id: 'drawn-polygons', label: 'Polygons' },
      { id: 'drawn-areas', label: 'Circles / Ellipses / Sectors' },
      { id: 'drawn-lines', label: 'Lines & Routes' },
      { id: 'drawn-points', label: 'Points' },
    ],
  },
  {
    id: 'polygons',
    label: 'Polygons',
    layers: [{ id: 'sample-polygons', label: 'Sample Polygons' }],
  },
  {
    id: 'drones',
    label: 'Drones + Rings',
    layers: [
      { id: 'drone-layer', label: 'Drones' },
      { id: 'range-rings', label: 'Range Rings' },
    ],
  },
  {
    id: 'missiles',
    label: 'Missiles',
    layers: [{ id: 'missiles-layer', label: 'Missiles' }],
  },
  {
    id: 'aircraft',
    label: 'Aircraft',
    layers: [{ id: 'aircraft-layer', label: 'Aircraft' }],
  },
];

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

