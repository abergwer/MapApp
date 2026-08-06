interface ShapeBase {
  id: string;
  /** Entity-definition id from the `Components/features/entities/entityDefinitions` tree.
   *  Absent on plain graphics (measurements, ad-hoc drawings). */
  defId?: string;
  /** User-editable display name. */
  name?: string;
  /** Id of the parent entity this shape is attached to, if any. */
  parentId?: string;
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
    })
  | (ShapeBase & { kind: 'route'; positions: [number, number][] });

/** Generate a unique id for a shape. Uses native UUID if available. */
export const newShapeId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `shape-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
