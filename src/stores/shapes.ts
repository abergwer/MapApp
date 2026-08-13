/**
 * Shared entity geometry. Any store that wants to render into deck.gl's
 * drawn-shape layers and be edited via the map engine's native draw/edit
 * tools stores its entities as `MapShape`. This is the one type that spans
 * store ↔ deck.gl layers ↔ map engine.
 */
export type MapShape =
  | { id: string; kind: 'point'; position: [number, number] }
  | { id: string; kind: 'line'; positions: [number, number][] }
  | { id: string; kind: 'polygon'; positions: [number, number][] }
  | { id: string; kind: 'circle'; center: [number, number]; radius: number }
  | {
      id: string;
      kind: 'ellipse';
      center: [number, number];
      radiusX: number;
      radiusY: number;
    }
  | {
      id: string;
      kind: 'sector';
      center: [number, number];
      radius: number;
      startBearing: number;
      endBearing: number;
    }
  | { id: string; kind: 'route'; positions: [number, number][] }
  | { id: string; kind: 'curvedRoute'; positions: [number, number][] }
  | { id: string; kind: 'splineRoute'; positions: [number, number][] };

/** Generate a unique id for a shape. Uses native UUID if available. */
export const newShapeId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `shape-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
