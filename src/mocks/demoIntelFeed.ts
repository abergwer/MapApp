import type { ComponentType } from 'react';
import FlightIcon from '@mui/icons-material/Flight';
import SensorsIcon from '@mui/icons-material/Sensors';
import type { IntelKindDef, IntelTarget } from '../Components/systemUI/intel/IntelFeedPanel';
import type { RootStore } from '../stores/RootStore';
import { palette } from '../Components/layout/styles/tokens';

/**
 * DEMO intel-feed wiring for the reference/demo entity stores. Real
 * projects inject their own kind definitions and target getter into
 * `<IntelFeedPanel />` — this file is only used by the demo App.
 */
export const DEMO_INTEL_KINDS: IntelKindDef[] = [
  { id: 'aircraft', label: 'Aircraft', color: palette.aircraft, Icon: FlightIcon as ComponentType },
  { id: 'drone', label: 'Drones', color: palette.drone, Icon: SensorsIcon as ComponentType },
];

/**
 * Target getter factory. The returned function is called INSIDE the
 * panel's observer render, so the tick subscriptions belong to the panel
 * component — App itself never re-renders on entity updates.
 */
export function demoIntelTargets(stores: RootStore): () => IntelTarget[] {
  return () => [
    ...stores.airCraftStore.targets.map((t) => ({ ...t, kind: 'aircraft' })),
    ...stores.droneStore.targets.map((t) => ({ ...t, kind: 'drone' })),
  ];
}
