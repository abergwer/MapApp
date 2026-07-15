import type { DockWindowId } from '../../../../stores/WindowDockStore';
import { workspaceDefaults } from '../../../../config/workspaceDefaults';

export interface RightDockWindowConfig {
  id: DockWindowId;
  label: string;
  title: string;
  iconPath: string;
  enabled: boolean;
  canFloat: boolean;
  showLiveBadge?: boolean;
  showCrosshair?: boolean;
  showCornerFrame?: boolean;
}

export const rightDockConfig = {
  /** Open/dock defaults — applied by WindowDockStore via workspaceDefaults. */
  defaults: workspaceDefaults,
  header: {
    title: 'WORKSPACE',
    subtitle: 'Operational views',
  },
  labels: {
    live: 'LIVE',
    undock: 'Undock to map',
    dock: 'Return to dock',
    close: 'Hide window',
    reopen: 'Reopen',
  },
  floating: {
    minWidth: 240,
    minHeight: 180,
    defaultWidth: workspaceDefaults.float.width,
    defaultHeight: workspaceDefaults.float.height,
  },
  layout: {
    workspacePadding: 6,
    gridGap: 6,
  },
  card: {
    headerHeight: 28,
    actionSize: 22,
  },
  overlays: {
    crosshairSize: 22,
    cornerInset: 10,
    bracketSize: 14,
  },
  windows: [
    {
      id: 'view3d',
      label: '3D View',
      title: '3D VIEW',
      iconPath: '/svg/layers/terrain.svg',
      enabled: true,
      canFloat: true,
    },
    {
      id: 'video',
      label: 'Video',
      title: 'VIDEO FEED',
      iconPath: '/svg/video-svg-icons/video.svg',
      enabled: true,
      canFloat: true,
      showLiveBadge: true,
      showCrosshair: true,
      showCornerFrame: true,
    },
    {
      id: 'minimap',
      label: 'Minimap',
      title: 'MINI MAP',
      iconPath: '/svg/video-svg-icons/minimap.svg',
      enabled: true,
      canFloat: true,
    },
    {
      id: 'intel',
      label: 'Intel',
      title: 'INTEL FEED',
      iconPath: '/svg/layers/labels.svg',
      enabled: true,
      canFloat: true,
    },
  ] satisfies RightDockWindowConfig[],
} as const;

export function getDockWindowConfig(id: DockWindowId): RightDockWindowConfig | undefined {
  return rightDockConfig.windows.find((w) => w.id === id);
}
