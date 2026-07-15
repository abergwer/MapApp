export type TopNavItemId =
  | 'dashboard'
  | 'map'
  | 'view3d'
  | 'video'
  | 'intel'
  | 'alerts'
  | 'settings';

export interface TopNavItem {
  id: TopNavItemId;
  label: string;
}

export const topNavItems: readonly TopNavItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'map', label: 'Map' },
  { id: 'view3d', label: '3D View' },
  { id: 'video', label: 'Video' },
  { id: 'intel', label: 'Intel' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'settings', label: 'Settings' },
] as const;

export const defaultActiveTopNavItem: TopNavItemId = 'map';
