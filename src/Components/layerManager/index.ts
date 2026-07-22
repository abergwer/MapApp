import { computed, type IComputedValue } from 'mobx';
import type { Layer } from '@deck.gl/core';
import { createPolygonLayer } from '../Layers/PolygonLayer';
import { createMissilesLayer } from '../Layers/MissileLayer';
import { createDroneLayer } from '../Layers/DroneLayer';
import { createAirCraftLayer } from '../Layers/AirCraftLayer';
import { createRangeRingsLayer } from '../Layers/RangeRingsLayer';
import { createDrawnShapeLayers } from '../Layers/DrawnShapeLayers';
import { createLOSLayers, createAreaLOSLayers } from '../Layers/LOSLayer';
import type { RootStore } from '../../stores/RootStore';

/**
 * Create a layer-builder function for the given stores.
 *
 * Each layer group is wrapped in a MobX `computed`, so a group is only
 * rebuilt when an observable *it* reads changes. Groups whose stores
 * didn't change return their cached array — same `Layer` references —
 * and deck.gl skips them entirely when diffing.
 *
 * Example: a stress-missile tick recomputes ONLY the stress-missile
 * group; drawn shapes, drones, aircraft, etc. come from cache.
 *
 * To add a new layer: create a factory in `../Layers` and add a
 * `computed(...)` entry below (array order = z-order, first is bottom).
 */
export function createLayerBuilder(stores: RootStore): () => Layer[] {
  const { drawingToolStore } = stores;

  const groups: IComputedValue<Layer[]>[] = [
    // Line-of-sight coverage polygons. Bottom of the stack: large area
    // fills that everything else should render above.
    computed(() => createAreaLOSLayers(stores.areaLOSStore)),
    computed(() => createLOSLayers(stores.losStore)),
    // User-drawn shapes. The map engine's native edit tools drive the same
    // store via `entityService`; deck.gl only renders and picks here.
    computed(() =>
      createDrawnShapeLayers(
        drawingToolStore.completedShapes,
        drawingToolStore.selectedId,
      ),
    ),
    computed(() => [createPolygonLayer(stores.polygonStore.polygons)]),
    computed(() => [createMissilesLayer(stores.missileStore.missiles)]),
    computed(() => [createDroneLayer(stores.droneStore.targets)]),
    computed(() => [createAirCraftLayer(stores.airCraftStore.targets)]),
    computed(() => [createRangeRingsLayer(stores.droneStore.targets)]),
  ];

  // Calling `.get()` inside a reaction (see LayerManager) keeps the
  // computeds tracked, so the reaction re-fires when any group's
  // underlying observables change.
  return () => groups.flatMap((group) => group.get());
}

