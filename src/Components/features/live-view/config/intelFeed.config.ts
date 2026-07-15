/**
 * Intel Feed — operational targets (aircraft / drones), not drawn map entities.
 * Data comes from AirCraftStore + DroneStore; icons/labels from this config.
 */
export type IntelTargetKind = 'aircraft' | 'drone';

export type IntelFeedFilterId = 'all' | IntelTargetKind;

export const intelFeedConfig = {
  header: {
    title: 'TARGETS',
    countLabelOne: 'target',
    countLabelMany: 'targets',
  },
  empty: {
    title: 'No targets',
    hint: 'Aircraft and drones on the map appear here.',
  },
  list: {
    ariaLabel: 'Operational targets',
    selectedHint: 'Selected',
  },
  /** Map camera when a target is selected in the list. */
  mapFocus: {
    zoom: 11,
    durationMs: 750,
  },
  filters: [
    { id: 'all' as const, label: 'All' },
    { id: 'aircraft' as const, label: 'Aircraft' },
    { id: 'drone' as const, label: 'Drones' },
  ],
  kinds: {
    aircraft: {
      id: 'aircraft' as const,
      label: 'Aircraft',
      shortLabel: 'AC',
      /** Fallback when a target has no icon on the store record. */
      iconPath: '/svg/layers/assets.svg',
      namePrefix: 'Aircraft',
    },
    drone: {
      id: 'drone' as const,
      label: 'Drone',
      shortLabel: 'DR',
      iconPath: '/svg/layers/threats.svg',
      namePrefix: 'Drone',
    },
  },
} as const;

export type IntelFeedConfig = typeof intelFeedConfig;
