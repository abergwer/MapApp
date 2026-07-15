/**
 * Left ops sidebar — tab shell only.
 * Layer tree config: features/layers/config
 * Entities content: features/entities/config
 */
export type LeftSidebarTabId = 'entities' | 'layers';

export const leftSidebarConfig = {
  ariaLabel: 'Operations sidebar',
  /** Default open tab on cold start. */
  defaultTab: 'entities' as LeftSidebarTabId,
  /** Tab strip order (Entities first — matches default). */
  tabs: [
    { id: 'entities' as const, label: 'Entities' },
    { id: 'layers' as const, label: 'Layers' },
  ],
  titles: {
    entities: 'ENTITIES',
    layers: 'LAYERS',
  },
} as const;
