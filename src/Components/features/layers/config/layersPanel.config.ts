/**
 * Layers panel copy.
 * Group ids come from LAYER_GROUPS in Components/layerManager/index.ts.
 */
export const layersPanelConfig = {
  header: {
    title: 'LAYERS',
    subtitle: 'Toggle map layer visibility',
  },
  emptyMessage: 'No layers registered yet',
  groupsSection: {
    title: 'Visibility',
    defaultExpanded: true,
  },
} as const;
