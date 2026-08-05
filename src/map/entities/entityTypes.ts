import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import RouteIcon from '@mui/icons-material/Route';
import BlockIcon from '@mui/icons-material/Block';
import type { DrawTool } from '../../stores/DrawingToolStore';

/**
 * Static registry of the entity types this system knows about.
 *
 * An entity type binds a domain concept ("Target Zone") to the graphic
 * presentations it may be drawn as on the map, plus its icon, display color
 * and the attribute keys new instances start with. To add a new entity type
 * to the system, add ONE entry to `ENTITY_TYPES` below — the toolbar
 * buttons, panel grouping, layer toggles and rendering colors all derive
 * from this list.
 */
export interface EntityTypeDef {
  /** Stable id stored on shapes (`shape.entity.typeId`). Never reuse. */
  id: string;
  /** Human-readable name, also the prefix for auto-generated instance names. */
  name: string;
  /** Toolbar / panel icon. */
  Icon: typeof TrackChangesIcon;
  /** Display color, RGB 0-255 (deck.gl layers + panel swatches). */
  color: [number, number, number];
  /** Graphic presentations this entity may be drawn as. */
  geometries: DrawTool[];
  /** Attribute keys (with default values) seeded onto new instances. */
  defaultAttributes?: Record<string, string>;
}

export const ENTITY_TYPES: EntityTypeDef[] = [
  {
    id: 'targetZone',
    name: 'Target Zone',
    Icon: TrackChangesIcon,
    color: [255, 82, 82],
    geometries: ['ellipse', 'sector', 'polygon'],
    defaultAttributes: { priority: 'medium', status: 'planned' },
  },
  {
    id: 'target',
    name: 'Target',
    Icon: GpsFixedIcon,
    color: [255, 170, 0],
    geometries: ['point', 'circle'],
    defaultAttributes: { priority: 'medium' },
  },
  {
    id: 'attackRoute',
    name: 'Attack Route',
    Icon: RouteIcon,
    color: [64, 196, 255],
    geometries: ['route', 'line'],
    defaultAttributes: { status: 'planned' },
  },
  {
    id: 'noFlyZone',
    name: 'No-Fly Zone',
    Icon: BlockIcon,
    color: [186, 104, 200],
    geometries: ['circle', 'ellipse', 'polygon'],
    defaultAttributes: { altitudeCeilingFt: '10000' },
  },
];

const byId = new Map(ENTITY_TYPES.map((t) => [t.id, t]));

/** Look up a type by id; `undefined` for plain graphics / unknown ids. */
export const getEntityType = (id?: string): EntityTypeDef | undefined =>
  id ? byId.get(id) : undefined;

/** CSS color string for panel swatches / UI chrome. */
export const entityTypeCss = (def: EntityTypeDef): string =>
  `rgb(${def.color[0]}, ${def.color[1]}, ${def.color[2]})`;
