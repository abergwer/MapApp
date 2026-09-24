import BlockIcon from '@mui/icons-material/Block';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import RouteIcon from '@mui/icons-material/Route';
import {
  flattenEntityDefs as flattenDefs,
  type EntityDefinition,
} from '@mapapp/map';

// The definition CONTRACT (types + generic helpers) is owned by the map
// package; this module owns the app's concrete definition TREE + lookups.
export type {
  EntityIconSource,
  CustomFieldDef,
  EntityDefinition,
} from '@mapapp/map';
export { entityIconUrl, drawOptions } from '@mapapp/map';

/** Monochrome 24×24 SVG body → data URL (tintable via mask). */
const svgIcon = (body: string): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24">${body}</svg>`,
  )}`;

const ICONS = {
  targetZone: svgIcon(
    '<path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12z" fill="#fff"/>' +
      '<circle cx="12" cy="12" r="2.5" fill="#fff"/>',
  ),
  radarSite: svgIcon(
    '<circle cx="12" cy="14" r="2.25" fill="#fff"/>' +
      '<path d="M12 8a6 6 0 0 1 6 6h-2.5A3.5 3.5 0 0 0 12 10.5V8z" fill="#fff"/>' +
      '<path d="M12 3a11 11 0 0 1 11 11h-2.5A8.5 8.5 0 0 0 12 5.5V3z" fill="#fff"/>',
  ),
  launchSite: svgIcon(
    '<path d="M12 2c2.5 2 4 5.5 4 9v5H8v-5c0-3.5 1.5-7 4-9z" fill="#fff"/>' +
      '<path d="M8 14l-3 4h4zM16 14l3 4h-4zM10.75 19h2.5v3h-2.5z" fill="#fff"/>',
  ),
};

/**
 * Code-declared entity-definition TREE.
 *
 * A definition binds a domain concept ("Target") to the graphic
 * presentations it may be drawn as, its icon and display color. Definitions
 * nest: a definition with `children` has sub-entity types (e.g. Target →
 * Radar Site), which render indented in the Entities panel and appear in
 * the toolbar menu of their root. To add a type — root or sub — add ONE
 * node below; toolbar buttons, panel tree, edit-window type picker and
 * layer colors all derive from this tree.
 */
export const ENTITY_DEFINITIONS: EntityDefinition[] = [
  {
    id: 'targetZone',
    name: 'Target Zone',
    color: '#ff5252',
    icon: ICONS.targetZone,
    geometries: ['ellipse', 'sector', 'polygon'],
  },
  {
    id: 'target',
    name: 'Target',
    color: '#ffaa00',
    icon: GpsFixedIcon,
    geometries: ['point', 'circle'],
    customFields: [
      { title: 'Priority (1-5)', validator: (v) => /^[1-5]$/.test(v) },
    ],
    children: [
      {
        id: 'radarSite',
        name: 'Radar Site',
        color: '#ff8a65',
        icon: ICONS.radarSite,
        geometries: ['point', 'circle'],
      },
      {
        id: 'launchSite',
        name: 'Launch Site',
        color: '#ffd54f',
        icon: ICONS.launchSite,
        geometries: ['point', 'polygon'],
      },
    ],
  },
  {
    id: 'attackRoute',
    name: 'Attack Route',
    color: '#40c4ff',
    icon: RouteIcon,
    geometries: ['line'],
  },
  {
    id: 'noFlyZone',
    name: 'No-Fly Zone',
    color: '#ba68c8',
    icon: BlockIcon,
    geometries: ['circle', 'ellipse', 'polygon'],
  },
];

/** Depth-first flatten of a definition subtree (defaults to the whole tree). */
export function flattenEntityDefs(
  defs: EntityDefinition[] = ENTITY_DEFINITIONS,
): EntityDefinition[] {
  return flattenDefs(defs);
}

const byId = new Map(flattenEntityDefs().map((d) => [d.id, d]));

const parentOf = new Map<string, EntityDefinition>();
for (const def of flattenEntityDefs()) {
  for (const child of def.children ?? []) parentOf.set(child.id, def);
}

/** Look up a definition anywhere in the tree; `undefined` for unknown ids. */
export const getEntityDef = (id?: string): EntityDefinition | undefined =>
  id ? byId.get(id) : undefined;

/** The parent definition of a sub-entity type; `undefined` for roots. */
export const getParentEntityDef = (id?: string): EntityDefinition | undefined =>
  id ? parentOf.get(id) : undefined;
