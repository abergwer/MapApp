/**
 * External defaults for the right Workspace dock.
 * Consumed by WindowDockStore — UI labels stay in live-view/config.
 */
export const workspaceDefaults = {
  /** All operational views start open and docked. */
  openByDefault: true as const,
  dockOrder: ['view3d', 'video', 'minimap', 'intel'] as const,
  float: {
    width: 380,
    height: 280,
  },
} as const;
