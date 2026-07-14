import type { DrawTool } from '../../../../stores/DrawingToolStore';

export interface EntityToolItemConfig {
  id: DrawTool;
  label: string;
  iconPath: string;
  enabled: boolean;
}

export interface EntityCategoryConfig {
  kind: DrawTool;
  label: string;
  iconPath: string;
}

export interface EntityPanelActionConfig {
  id: 'cancel';
  label: string;
  iconPath: string;
}

export const entitiesPanelConfig = {
  header: {
    title: 'ENTITIES',
    subtitle: 'Manage map entities',
  },
  layout: {
    createToolsGridColumns: 4,
  },
  existingSection: {
    title: 'Existing Entities',
    emptyMessage: 'No entities yet',
    defaultExpanded: true,
  },
  createSection: {
    title: 'Create Entity',
    defaultExpanded: true,
  },
  categories: [
    { kind: 'point', label: 'Point', iconPath: '/svg/entities/point.svg' },
    { kind: 'line', label: 'Line', iconPath: '/svg/entities/line.svg' },
    { kind: 'polygon', label: 'Polygon', iconPath: '/svg/entities/polygon.svg' },
    { kind: 'circle', label: 'Circle', iconPath: '/svg/entities/circle.svg' },
    { kind: 'ellipse', label: 'Ellipse', iconPath: '/svg/entities/ellipse.svg' },
    { kind: 'sector', label: 'Sector', iconPath: '/svg/entities/sector.svg' },
    { kind: 'route', label: 'Route', iconPath: '/svg/entities/route.svg' },
  ] satisfies EntityCategoryConfig[],
  createTools: [
    { id: 'point', label: 'Point', iconPath: '/svg/entities/point.svg', enabled: true },
    { id: 'line', label: 'Line', iconPath: '/svg/entities/line.svg', enabled: true },
    { id: 'polygon', label: 'Polygon', iconPath: '/svg/entities/polygon.svg', enabled: true },
    { id: 'circle', label: 'Circle', iconPath: '/svg/entities/circle.svg', enabled: true },
    { id: 'ellipse', label: 'Ellipse', iconPath: '/svg/entities/ellipse.svg', enabled: true },
    { id: 'sector', label: 'Sector', iconPath: '/svg/entities/sector.svg', enabled: true },
    { id: 'route', label: 'Route', iconPath: '/svg/entities/route.svg', enabled: true },
  ] satisfies EntityToolItemConfig[],
  cancelAction: {
    id: 'cancel',
    label: 'Clear',
    iconPath: '/svg/entities/clear.svg',
  } satisfies EntityPanelActionConfig,
} as const;