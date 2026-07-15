import type { BaseMap } from '../../../../stores/MapStyleStore';
import type { MeasureTool } from '../../../../stores/DrawingToolStore';
import { mapToolbarConfig } from './mapToolbar.config';

export interface MeasurementToolItemConfig {
  id: MeasureTool;
  label: string;
  iconPath: string;
  enabled: boolean;
}

export interface MapTypeItemConfig {
  id: BaseMap;
  label: string;
  description: string;
  iconPath: string;
  enabled: boolean;
}

export interface LiveToggleItemConfig {
  id: 'minimap' | 'video';
  label: string;
  iconPath: string;
  enabled: boolean;
}

export const mapToolsPanelConfig = {
  header: {
    title: 'MAP TOOLS',
    subtitle: 'Map controls and view tools',
  },
  layout: {
    measurementGridColumns: 2,
    mapTypeGridColumns: 2,
    liveToggleGridColumns: 2,
  },
  measurementsSection: {
    title: 'Measurements',
    defaultExpanded: true,
  },
  mapTypeSection: {
    title: 'Map Type',
    defaultExpanded: true,
  },
  viewControlsSection: {
    title: 'View Controls',
    defaultExpanded: true,
    /** Shared with map floating toolbar brightness slider. */
    brightness: {
      label: mapToolbarConfig.brightness.label,
      min: mapToolbarConfig.brightness.min,
      max: mapToolbarConfig.brightness.max,
      step: mapToolbarConfig.brightness.step,
    },
  },
  measurementTools: [
    {
      id: 'distance',
      label: 'Distance',
      iconPath: '/svg/measurement/distance.svg',
      enabled: true,
    },
    {
      id: 'area',
      label: 'Area',
      iconPath: '/svg/measurement/area.svg',
      enabled: true,
    },
  ] satisfies MeasurementToolItemConfig[],
  clearAction: {
    id: 'clear' as const,
    label: 'Clear',
    iconPath: '/svg/entities/clear.svg',
  },
  mapTypes: [
    {
      id: 'light',
      label: 'Light',
      description: 'OpenStreetMap',
      iconPath: '/svg/map/sun.svg',
      enabled: true,
    },
    {
      id: 'satellite',
      label: 'Satellite',
      description: 'World imagery',
      iconPath: '/svg/map/moon.svg',
      enabled: true,
    },
  ] satisfies MapTypeItemConfig[],
  liveToggles: [
    {
      id: 'minimap',
      label: 'Minimap',
      iconPath: '/svg/video-svg-icons/minimap.svg',
      enabled: true,
    },
    {
      id: 'video',
      label: 'Video',
      iconPath: '/svg/video-svg-icons/video.svg',
      enabled: true,
    },
  ] satisfies LiveToggleItemConfig[],
} as const;
