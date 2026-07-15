import type { Layer } from '@deck.gl/core';
import { createPolygonLayer } from '../Layers/PolygonLayer';
import { createMissilesLayer } from '../Layers/MissileLayer';
import { createDroneLayers } from '../Layers/DroneLayer';
import { createAirCraftLayers } from '../Layers/AirCraftLayer';
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
      { id: 'drone-trails', label: 'Drone Trails' },
      { id: 'drone-trails-core', label: 'Drone Trail Core' },
      { id: 'drone-glow-bloom', label: 'Drone Glow' },
      { id: 'drone-glow-glass', label: 'Drone Glass' },
      { id: 'drone-glow-lamp', label: 'Drone Lamp' },
      { id: 'drone-glow-spark', label: 'Drone Spark' },
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
    layers: [
      { id: 'aircraft-trails', label: 'Aircraft Trails' },
      { id: 'aircraft-trails-core', label: 'Aircraft Trail Core' },
      { id: 'aircraft-glow-bloom', label: 'Aircraft Glow' },
      { id: 'aircraft-glow-glass', label: 'Aircraft Glass' },
      { id: 'aircraft-glow-lamp', label: 'Aircraft Lamp' },
      { id: 'aircraft-glow-spark', label: 'Aircraft Spark' },
      { id: 'aircraft-layer', label: 'Aircraft' },
    ],
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
  const selectedAircraft =
    stores.trackedTargetStore.selected?.kind === 'aircraft'
      ? stores.trackedTargetStore.selected.id
      : null;
  const selectedDrone =
    stores.trackedTargetStore.selected?.kind === 'drone'
      ? stores.trackedTargetStore.selected.id
      : null;

  return [
    ...createDrawnShapeLayers(
      stores.drawingToolStore.completedShapes,
      stores.drawingToolStore.selectedId,
    ),
    createPolygonLayer(stores.polygonStore.polygons),
    createMissilesLayer(stores.missileStore.missiles),
    ...createDroneLayers(stores.droneStore.targets, selectedDrone),
    ...createAirCraftLayers(stores.airCraftStore.targets, selectedAircraft),
    createRangeRingsLayer(stores.droneStore.targets),
  ];
}
