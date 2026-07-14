/**
 * Left rail item definitions — icons, labels, and panel slot ids.
 * Change icons or order here; components render from this config only.
 */
export type LeftRailItemId = 'entities' | 'mapTools' | 'layers';

export interface LeftRailItemConfig {
  id: LeftRailItemId;
  label: string;
  tooltip: string;
  iconPath: string;
  enabled: boolean;
}

export const leftRailItems: LeftRailItemConfig[] = [
  {
    id: 'entities',
    label: 'Entities',
    tooltip: 'Entities / Draw tools',
    iconPath: '/svg/entities/marker.svg',
    enabled: true,
  },
  {
    id: 'mapTools',
    label: 'Map Tools',
    tooltip: 'Map tools / measurements / view',
    iconPath: '/svg/layers/terrain.svg',
    enabled: true,
  },
  {
    id: 'layers',
    label: 'Layers',
    tooltip: 'Map layers visibility',
    iconPath: '/svg/layers/overlays.svg',
    enabled: true,
  },
];

/** Which rail item is selected on first load (panel opens if slot exists). */
export const defaultSelectedRailItem: LeftRailItemId = 'entities';
