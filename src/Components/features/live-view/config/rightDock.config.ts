import type { DockWindowId } from '../../../../stores/WindowDockStore';

export interface RightDockWindowConfig {
  id: DockWindowId;
  label: string;
  title: string;
  iconPath: string;
  enabled: boolean;
  /** Allow undock → floating over the map. */
  canFloat: boolean;
  order: number;
  showLiveBadge?: boolean;
  showCrosshair?: boolean;
  showCornerFrame?: boolean;
}

export const rightDockConfig = {
  header: {
    title: 'WINDOWS',
    subtitle: 'Docked views — undock to float over the map',
  },
  toolbar: {
    title: 'Open',
  },
  labels: {
    live: 'LIVE',
    undock: 'Undock to map',
    dock: 'Return to dock',
    close: 'Hide window',
    collapse: 'Collapse',
    expand: 'Expand',
  },
  floating: {
    minWidth: 220,
    minHeight: 160,
    defaultWidth: 320,
    defaultHeight: 220,
  },
  windows: [
    {
      id: 'video',
      label: 'Video',
      title: 'VIDEO FEED',
      iconPath: '/svg/video-svg-icons/video.svg',
      enabled: true,
      canFloat: true,
      order: 1,
      showLiveBadge: true,
      showCrosshair: true,
      showCornerFrame: true,
    },
    {
      id: 'minimap',
      label: 'Minimap',
      title: 'MINIMAP',
      iconPath: '/svg/video-svg-icons/minimap.svg',
      enabled: true,
      canFloat: true,
      order: 2,
    },
  ] satisfies RightDockWindowConfig[],
} as const;

export function getDockWindowConfig(id: DockWindowId): RightDockWindowConfig | undefined {
  return rightDockConfig.windows.find((w) => w.id === id);
}
