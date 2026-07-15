export const layersSidebarConfig = {
  /** Layer tree + alerts copy (tab shell lives in left-sidebar). */
  searchPlaceholder: 'Search layers',
  alerts: {
    title: 'ALERTS',
    emptyMessage: 'No active alerts',
  },
  emptyGroups: 'No layers registered',
  /** Presentation categories — ids match LayerVisibilityStore group ids where possible. */
  categories: [
    {
      id: 'air-units',
      label: 'AIR UNITS',
      groups: ['aircraft', 'drones', 'missiles'],
    },
    {
      id: 'overlays',
      label: 'OVERLAYS',
      groups: ['polygons', 'drawn-shapes'],
    },
  ],
  groupIcons: {
    aircraft: '/svg/layers/assets.svg',
    drones: '/svg/layers/threats.svg',
    missiles: '/svg/layers/threats.svg',
    polygons: '/svg/layers/overlays.svg',
    'drawn-shapes': '/svg/layers/borders.svg',
  } as Record<string, string>,
} as const;
