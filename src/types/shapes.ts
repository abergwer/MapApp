interface ShapeBase {
  id: string;
  /** Entity-definition id from the `stores/entityDefinitions` tree.
   *  Absent on plain graphics (measurements, ad-hoc drawings). */
  defId?: string;
  /** User-editable display name. */
  name?: string;
  /** Id of the parent entity INSTANCE this sub-entity belongs to. Only
   *  meaningful when this shape's def is a child in the definitions tree;
   *  the parent must be an instance of that child's parent definition. */
  parentId?: string;
  /** Values of the definition's `customFields`, keyed by field title. */
  customValues?: Record<string, string>;
}

/**
 * Shared entity geometry. Any store that wants to render into deck.gl's
 * drawn-shape layers and be edited via the map engine's native draw/edit
 * tools stores its entities as `MapShape`. This is the one type that spans
 * store ↔ deck.gl layers ↔ map engine.
 */
export type MapShape =
  | (ShapeBase & { kind: 'point'; position: [number, number] })
  | (ShapeBase & { kind: 'line'; positions: [number, number][] })
  | (ShapeBase & { kind: 'polygon'; positions: [number, number][] })
  | (ShapeBase & { kind: 'circle'; center: [number, number]; radius: number })
  | (ShapeBase & {
      kind: 'ellipse';
      center: [number, number];
      radiusX: number;
      radiusY: number;
    })
  | (ShapeBase & {
      kind: 'sector';
      center: [number, number];
      radius: number;
      startBearing: number;
      endBearing: number;
    });

/** A MapShape carrying entity identity. Same object at runtime — a type
 *  refinement, not a wrapper. Plain graphics (no defId) stay plain MapShapes. */
export type Entity = MapShape & { defId: string };

export const isEntity = (s: MapShape): s is Entity => s.defId !== undefined;

/** Generate a unique id for a shape. Uses native UUID if available. */
export const newShapeId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `shape-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
