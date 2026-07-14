/**
 * External layout configuration for AppShell.
 * Adjust dimensions, visibility, and stacking here — no hardcoded layout values in components.
 */
export const appLayoutConfig = {
  branding: {
    appIconPath: '/c2_icons_png/treasure-map.png',
  },
  topBar: {
    enabled: true,
    height: 48,
  },
  bottomBar: {
    enabled: true,
    height: 36,
  },
  leftRail: {
    enabled: true,
    width: 52,
  },
  leftPanel: {
    enabled: true,
    width: 304,
    defaultOpen: true,
  },
  rightPanel: {
    enabled: true,
    width: 280,
    defaultOpen: false,
  },
  spacing: {
    gap: 0,
  },
  borderRadius: {
    panel: 8,
  },
  zIndex: {
    topBar: 100,
    leftRail: 90,
    leftPanel: 85,
    rightPanel: 85,
    bottomBar: 100,
    mapOverlay: 1100,
    floatingWindow: 1200,
  },
  mapOverlay: {
    coordinates: {
      bottom: 12,
      left: 12,
    },
  },
} as const;

export type AppLayoutConfig = typeof appLayoutConfig;