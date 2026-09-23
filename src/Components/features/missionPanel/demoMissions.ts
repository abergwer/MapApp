import type { Mission } from './types';

/** Demo missions until the server list endpoint exists. */
export const DEMO_MISSIONS: Mission[] = [
  {
    id: 'msn-demo-1',
    name: 'Northern Corridor Surveillance',
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86_400_000).toISOString(),
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
    updatedAt: new Date(Date.now() - 43_200_000).toISOString(),
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
  {
    id: 'msn-demo-4',
    name: 'Eastern Flank Recon',
    createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    values: {
      name: 'Eastern Flank Recon',
      areaOfOperation: 'Eastern Flank',
      status: 'Planned',
    },
  },
  {
    id: 'msn-demo-5',
    name: 'Supply Line Monitoring',
    createdAt: new Date(Date.now() - 14 * 86_400_000).toISOString(),
    values: {
      name: 'Supply Line Monitoring',
      description: 'Monitor and report on supply line activity.',
      commander: 'Lt. Col. S. Brandt',
    },
  },
];
