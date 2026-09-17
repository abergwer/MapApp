import type { Mission } from './types';

/** Demo missions until the server list endpoint exists. */
export const DEMO_MISSIONS: Mission[] = [
  {
    id: 'msn-demo-1',
    name: 'Northern Corridor Surveillance',
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    values: {
      name: 'Northern Corridor Surveillance',
      description: 'Persistent ISR coverage over the northern approach corridor.',
      commander: 'Maj. R. Halvorsen',
      status: 'Active',
      startAt: new Date(Date.now() - 6 * 3_600_000).toISOString(),
    },
  },
  {
    id: 'msn-demo-2',
    name: 'Harbor Perimeter Sweep',
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    values: {
      name: 'Harbor Perimeter Sweep',
      commander: 'Capt. L. Okafor',
      status: 'Planned',
    },
  },
  {
    id: 'msn-demo-3',
    name: 'Coastal Patrol Rotation',
    createdAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    values: {
      name: 'Coastal Patrol Rotation',
      status: 'Completed',
    },
  },
];
