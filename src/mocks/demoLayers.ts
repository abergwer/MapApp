import type { LayerGroupDef } from '../Components/layerManager';
import { DRAWN_SHAPES_GROUP } from '../Components/layerManager';
import { createPolygonLayer } from './Layers/PolygonLayer';
import { createMissilesLayer } from './Layers/MissileLayer';
import { createDroneLayer } from './Layers/DroneLayer';
import { createAirCraftLayer } from './Layers/AirCraftLayer';
import { createRangeRingsLayer } from './Layers/RangeRingsLayer';
import { palette } from '../Components/layout/styles/tokens';

/**
 * DEMO layer-group list: the single list App passes to BOTH
 * `<LayersPanel layers={...} />` (toggles) and `<LayersWrapper groups={...} />`
 * (deck.gl layers). Real projects declare their own list; this one is only
 * the reference composition used by the demo App.
 */
export const DEMO_LAYERS: LayerGroupDef[] = [
  DRAWN_SHAPES_GROUP,
  {
    id: 'polygons',
    label: 'Polygons',
    color: palette.area,
    build: (stores) => [createPolygonLayer(stores.polygonStore.polygons)],
  },
  {
    id: 'droneGroup',
    label: 'Drones + Rings',
    color: palette.drone,
    children: () => [
      {
        id: 'drones',
        label: 'Drones',
        color: palette.drone,
        count: (stores) => stores.droneStore.targets.length,
        build: (stores) => createDroneLayer(stores.droneStore.targets),
      },
      {
        id: 'rangeRings',
        label: 'Range Rings',
        color: palette.drone,
        build: (stores) => [createRangeRingsLayer(stores.droneStore.targets)],
      },
    ],
  },
  {
    id: 'missiles',
    label: 'Missiles',
    color: palette.missile,
    count: (stores) => stores.missileStore.missiles.length,
    build: (stores) =>
      createMissilesLayer(stores.missileStore.missiles, stores.missileStore.selectedId),
  },
  {
    id: 'aircraft',
    label: 'Aircraft',
    color: palette.aircraft,
    count: (stores) => stores.airCraftStore.targets.length,
    build: (stores) => createAirCraftLayer(stores.airCraftStore.targets),
  },
];
