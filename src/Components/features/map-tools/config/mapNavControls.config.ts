import type { TooltipProps } from '@mui/material/Tooltip';
import { appLayoutConfig } from '../../app-shell/config/appLayout.config';

export type MapNavActionId = 'zoomIn' | 'zoomOut' | 'pitch3d' | 'home';

/**
 * Compass + zoom stack on the map.
 * Position defaults from `appLayoutConfig.mapOverlay.nav` (single source).
 */
export const mapNavControlsConfig = {
  /** Absolute inset from map workspace edges (px). */
  position: {
    top: appLayoutConfig.mapOverlay.nav.top,
    right: appLayoutConfig.mapOverlay.nav.right,
  },

  tooltipPlacement: 'left' as TooltipProps['placement'],

  layout: {
    stackGap: 10,
    compassSize: 72,
    buttonSize: 42,
    iconSize: 18,
  },

  compass: {
    ariaLabel: 'Reset north',
    title: 'North',
    needleNorth: '#ef4444',
    needleSouth: '#60a5fa',
  },

  pitch3d: {
    /** Pitch above this (deg) counts as 3D active. */
    thresholdDeg: 12,
    label: '3D',
  },

  actions: [
    { id: 'zoomIn' as const, label: 'Zoom in', ariaLabel: 'Zoom in' },
    { id: 'zoomOut' as const, label: 'Zoom out', ariaLabel: 'Zoom out' },
    { id: 'pitch3d' as const, label: '3D view', ariaLabel: 'Toggle 3D pitch' },
    { id: 'home' as const, label: 'Reset view', ariaLabel: 'Reset map view' },
  ],
} as const;

export type MapNavControlsConfig = typeof mapNavControlsConfig;
