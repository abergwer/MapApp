import type { LayerToggleDef } from '../Components/features/layers/LayersPanel';
import { palette } from '../styles/system-ui/tokens';

/**
 * DEMO layer toggles for the reference/demo layer set built by
 * `buildLayers`. Real projects inject their own layers and pass their own
 * toggle definitions to `<LayersPanel layers={...} />` — this file is only
 * used by the demo composition in App.tsx.
 */
export const DEMO_LAYER_TOGGLES: LayerToggleDef[] = [
  { id: 'polygons', label: 'Polygons', color: palette.area },
  {
    id: 'droneGroup',
    label: 'Drones + Rings',
    color: palette.drone,
    children: [
      { id: 'drones', label: 'Drones', color: palette.drone },
      { id: 'rangeRings', label: 'Range Rings', color: palette.drone },
    ],
  },
  { id: 'missiles', label: 'Missiles', color: palette.missile },
  { id: 'aircraft', label: 'Aircraft', color: palette.aircraft },
];
