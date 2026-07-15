import type { TooltipProps } from '@mui/material/Tooltip';

export type MapToolbarToolId =
  | 'select'
  | 'distance'
  | 'area'
  | 'clear'
  | 'polygon'
  | 'line'
  | 'marker'
  | 'mapStyle'
  | 'brightness'
  | 'minimap'
  | 'video'
  | 'view3d'
  | 'intel';

export type MapToolbarGroupId = 'measure' | 'draw' | 'view' | 'windows';

export interface MapToolbarItemConfig {
  id: MapToolbarToolId;
  label: string;
  iconPath: string;
  group: MapToolbarGroupId;
}

/**
 * Map floating toolbar — content, order, chrome sizes, brightness slider.
 * Position comes from `appLayoutConfig.mapOverlay.toolbar` (CSS vars).
 */
export const mapToolbarConfig = {
  /** Render order of tool groups left → right. */
  groupOrder: ['measure', 'draw', 'view', 'windows'] as const satisfies readonly MapToolbarGroupId[],

  tooltipPlacement: 'bottom' as TooltipProps['placement'],

  layout: {
    buttonSize: 34,
    iconSize: 18,
    gap: 2,
    padding: 4,
    separatorHeight: 22,
    separatorMargin: 3,
  },

  brightness: {
    label: 'Brightness',
    min: 0,
    max: 120,
    step: 1,
    popoverWidth: 180,
    popoverOffsetY: 6,
  },

  items: [
    { id: 'select', label: 'Select', iconPath: '/c2_icons_png/tool_marker.png', group: 'measure' },
    { id: 'distance', label: 'Distance', iconPath: '/svg/measurement/distance.svg', group: 'measure' },
    { id: 'area', label: 'Area', iconPath: '/svg/measurement/area.svg', group: 'measure' },
    { id: 'clear', label: 'Clear', iconPath: '/svg/entities/clear.svg', group: 'measure' },
    { id: 'polygon', label: 'Polygon', iconPath: '/svg/entities/polygon.svg', group: 'draw' },
    { id: 'line', label: 'Line', iconPath: '/svg/entities/line.svg', group: 'draw' },
    { id: 'marker', label: 'Marker', iconPath: '/svg/entities/point.svg', group: 'draw' },
    { id: 'mapStyle', label: 'Map style', iconPath: '/svg/map/moon.svg', group: 'view' },
    { id: 'brightness', label: 'Brightness', iconPath: '/svg/map/sun.svg', group: 'view' },
    { id: 'minimap', label: 'Mini Map', iconPath: '/svg/video-svg-icons/minimap.svg', group: 'windows' },
    { id: 'video', label: 'Video', iconPath: '/svg/video-svg-icons/video.svg', group: 'windows' },
    { id: 'view3d', label: '3D', iconPath: '/svg/layers/terrain.svg', group: 'windows' },
    { id: 'intel', label: 'Intel', iconPath: '/svg/layers/labels.svg', group: 'windows' },
  ] satisfies MapToolbarItemConfig[],
} as const;

export type MapToolbarConfig = typeof mapToolbarConfig;
