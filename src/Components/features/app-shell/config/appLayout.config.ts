/**
 * External layout configuration for AppShell + map overlay chrome.
 * Theme (light/dark): `src/config/appTheme.config.ts` → `mode`.
 * Adjust positions/dimensions here — components read via CSS vars / config imports.
 */
export const appLayoutConfig = {
  branding: {
    appIconPath: '/c2_icons_png/treasure-map.png',
    appTitle: 'Map Engine Orchestrator',
    appSubtitle: 'Integrated Operations System',
  },
  topBar: {
    enabled: true,
    height: 52,
  },
  bottomBar: {
    enabled: true,
    height: 48,
  },
  leftSidebar: {
    enabled: true,
    width: 300,
    defaultOpen: true,
  },
  /** @deprecated Kept for compatibility; rail is no longer shown by default. */
  leftRail: {
    enabled: false,
    width: 52,
  },
  /** @deprecated Replaced by leftSidebar. */
  leftPanel: {
    enabled: false,
    width: 304,
    defaultOpen: false,
  },
  rightPanel: {
    enabled: true,
    widthDouble: 'clamp(580px, 36vw, 720px)',
    widthSingle: 'clamp(340px, 24vw, 430px)',
    collapsedWidth: 32,
    defaultOpen: true,
  },
  spacing: {
    gap: 0,
  },
  borderRadius: {
    panel: 4,
  },
  zIndex: {
    topBar: 100,
    leftRail: 90,
    leftPanel: 85,
    rightPanel: 85,
    bottomBar: 100,
    mapOverlay: 1100,
    floatingWindow: 1200,
    mapToolbar: 1300,
    mapNav: 1300,
  },
  /**
   * Absolute positions for chrome floating over the map workspace.
   * Injected as CSS vars by AppShell (`--layout-map-toolbar-*`, `--layout-map-nav-*`).
   */
  mapOverlay: {
    toolbar: {
      top: 12,
      left: 12,
    },
    nav: {
      top: 16,
      right: 16,
    },
    coordinates: {
      bottom: 12,
      left: 12,
    },
  },
  labels: {
    expandSidebar: 'Expand sidebar',
    collapseSidebar: 'Collapse sidebar',
    expandWorkspace: 'Expand workspace',
    collapseWorkspace: 'Collapse workspace',
  },
} as const;

export type AppLayoutConfig = typeof appLayoutConfig;
