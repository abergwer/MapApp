import type { Layer } from '@deck.gl/core';
import { createPolygonLayer } from '../Layers/PolygonLayer';
import { createMissilesLayer } from '../Layers/MissileLayer';
import { createDroneLayer } from '../Layers/DroneLayer';
import { createAirCraftLayer } from '../Layers/AirCraftLayer';
import { createRangeRingsLayer } from '../Layers/RangeRingsLayer';
import { createDrawnShapeLayers } from '../Layers/DrawnShapeLayers';
import { createLOSLayers, createAreaLOSLayers } from '../../los/LOSLayers';
import type { RootStore } from '../../stores/RootStore';

/**
 * DEMO/TESTING layer set. The base project treats layers as an injection
 * point: real projects build their own deck.gl layer array and pass it to
 * `<LayerManager layers={...} />` — this builder (and the entity stores it
 * reads) is the reference composition used by the demo App only.
 *
 * To add a layer here: create a factory in `../Layers` and call it below.
 * Visibility ids are free-form strings checked against
 * `uiVisibilityStore.isLayerVisible` (pair them with the toggle defs the
 * host passes to LayersPanel — see mocks/demoLayerToggles.ts).
 */
export function buildLayers(stores: RootStore): Layer[] {
  const { drawingToolStore, uiVisibilityStore: vis } = stores;
  const layers: Layer[] = [];

  // Line-of-sight coverage. Bottom of the stack: large area fills that
  // everything else should render above.
  layers.push(...createAreaLOSLayers(stores.areaLOSStore));
  layers.push(...createLOSLayers(stores.losStore));

  // User-drawn shapes. The map engine's native edit tools drive the same
  // store via `entityService`; deck.gl only renders and picks here.
  // Per-kind visibility: LayersPanel writes `drawnShapes:<kind>` keys
  // (unknown keys default to visible).
  if (vis.isLayerVisible('drawnShapes')) {
    const visibleShapes = drawingToolStore.completedShapes.filter((s) =>
      vis.isLayerVisible(`drawnShapes:${s.kind}`),
    );
    layers.push(...createDrawnShapeLayers(visibleShapes, drawingToolStore.selectedId));
  }
  if (vis.isLayerVisible('polygons')) {
    layers.push(createPolygonLayer(stores.polygonStore.polygons));
  }
  if (vis.isLayerVisible('rangeRings')) {
    layers.push(createRangeRingsLayer(stores.droneStore.targets));
  }
  if (vis.isLayerVisible('missiles')) {
    layers.push(
      ...createMissilesLayer(stores.missileStore.missiles, stores.missileStore.selectedId),
    );
  }
  if (vis.isLayerVisible('drones')) {
    layers.push(...createDroneLayer(stores.droneStore.targets));
  }
  if (vis.isLayerVisible('aircraft')) {
    layers.push(...createAirCraftLayer(stores.airCraftStore.targets));
  }
  return layers;
}

/**
 * Adapter for LayerManager's `buildLayers` prop. Create it once (e.g. with
 * `useMemo`); LayerManager calls it inside a MobX reaction so observable
 * reads in `buildLayers` are tracked without React re-renders.
 */
export function createLayerBuilder(stores: RootStore): () => Layer[] {
  return () => buildLayers(stores);
}

