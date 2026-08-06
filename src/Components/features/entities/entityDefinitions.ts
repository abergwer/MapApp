import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import BlockIcon from '@mui/icons-material/Block';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import RouteIcon from '@mui/icons-material/Route';
import type { DrawTool } from '../../../stores/DrawingToolStore';

/** An entity icon: an image URL (data URL / asset) or a MUI icon component. */
export type EntityIconSource = string | ComponentType<SvgIconProps>;

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
export interface EntityDefinition {
  /** Stable id stored on shapes (`shape.defId`). Unique across the tree. */
  id: string;
  /** Human-readable name, also the fallback label for unnamed instances. */
  name: string;
  /** Display color, '#rrggbb' (layers, icon tint, UI swatches). */
  color: string;
  /** Icon: image URL or MUI icon component. Monochrome icons are tinted
   *  with `color`. */
  icon: EntityIconSource;
  /** Set false for full-color icons that must NOT be tinted (uploads). */
  iconMask?: boolean;
  /** Graphic presentations this type may be drawn as. */
  geometries: DrawTool[];
  /** Sub-entity types nested under this one. */
  children?: EntityDefinition[];
}

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
    geometries: ['route', 'line'],
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
  return defs.flatMap((def) => [def, ...flattenEntityDefs(def.children ?? [])]);
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

const iconUrlCache = new Map<EntityIconSource, string>();

/**
 * Resolve a definition's icon to an image URL for canvas/deck.gl consumers.
 * MUI icon components are rendered once to a white monochrome SVG data URL
 * (tintable via mask, like the built-ins) and cached.
 */
export function entityIconUrl(def: EntityDefinition): string {
  if (typeof def.icon === 'string') return def.icon;
  let url = iconUrlCache.get(def.icon);
  if (!url) {
    // MUI outputs no xmlns / size / fill (it styles via CSS classes, which
    // don't exist inside a data URL) — stamp them on the root element.
    const svg = renderToStaticMarkup(createElement(def.icon)).replace(
      '<svg',
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="#fff"',
    );
    url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    iconUrlCache.set(def.icon, url);
  }
  return url;
}

/**
 * Every drawable (definition, geometry) pair in a definition's subtree —
 * what the toolbar menu of a root type offers.
 */
export function drawOptions(
  def: EntityDefinition,
): { def: EntityDefinition; geometry: DrawTool }[] {
  return flattenEntityDefs([def]).flatMap((d) =>
    d.geometries.map((geometry) => ({ def: d, geometry })),
  );
}
