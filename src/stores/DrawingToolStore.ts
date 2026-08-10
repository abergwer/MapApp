import { makeAutoObservable } from 'mobx';
import { newShapeId, type MapShape } from './shapes';

// Re-exported so existing consumers can keep importing `MapShape` /
// `newShapeId` from `DrawingToolStore` without churn. New code should
// import from `./shapes` directly.
export { newShapeId };
export type { MapShape };

export type DrawTool =
  | 'point'
  | 'line'
  | 'polygon'
  | 'circle'
  | 'ellipse'
  | 'sector';

export type MeasureTool = 'distance' | 'area';

export interface Measurement {
  kind: MeasureTool;
  /** Distance in km (kind === 'distance') or area in km² (kind === 'area'). */
  value: number;
  timestamp: number;
}

export class DrawingToolStore {
  activeDrawTool: DrawTool | null = null;
  /** Entity-definition id being drawn (see `toolDefs.toggleDrawEntity`). */
  activeDefId: string | null = null;
  activeMeasureTool: MeasureTool | null = null;
  /**
   * The id of the shape currently selected for editing, or null. This is the
   * whole selection model: deck.gl renders every shape EXCEPT this one, and
   * the map engine paints exactly this one as an editable native feature.
   * One id ⇒ one editable shape ⇒ no double-render, no desync.
   */
  selectedId: string | null = null;
  completedShapes: MapShape[] = [];
  measurements: Measurement[] = [];

  /**
   * Undo/redo as whole-array snapshots. Shapes are treated as immutable
   * (every mutation replaces a shape object rather than editing it in place),
   * so a shallow `slice()` is a sound snapshot. `commit()` pushes the current
   * array onto `past` before a mutation; `undo`/`redo` swap between stacks.
   */
  private past: MapShape[][] = [];
  private future: MapShape[][] = [];
  private static readonly HISTORY_LIMIT = 50;

  constructor() {
    makeAutoObservable(this);
  }

  setActiveDrawTool(tool: DrawTool | null, defId: string | null = null) {
    // Activating a draw tool must clear any pending edit selection. Otherwise
    // the first click on the map (starting the new draw) is treated as a
    // background click by the engine's edit-mode click handler, which
    // deselects the old shape and calls `endEdit`, aborting the new draw.
    if (tool !== null) this.selectedId = null;
    this.activeDrawTool = tool;
    this.activeDefId = tool === null ? null : defId;
  }

  setActiveMeasureTool(tool: MeasureTool | null) {
    this.activeMeasureTool = tool;
  }

  setSelectedId(id: string | null) {
    this.selectedId = id;
  }

  /** The shape currently selected for editing, if any. */
  get selectedShape(): MapShape | undefined {
    return this.selectedId
      ? this.completedShapes.find((s) => s.id === this.selectedId)
      : undefined;
  }

  // ── Undo / redo ──────────────────────────────────────────────────────

  /** Snapshot the current geometry before a mutation. Called by EntityService. */
  commit() {
    this.past.push(this.completedShapes.slice());
    if (this.past.length > DrawingToolStore.HISTORY_LIMIT) this.past.shift();
    this.future = [];
  }

  undo() {
    const prev = this.past.pop();
    if (!prev) return;
    this.future.push(this.completedShapes.slice());
    this.completedShapes = prev;
    this.selectedId = null;
  }

  redo() {
    const next = this.future.pop();
    if (!next) return;
    this.past.push(this.completedShapes.slice());
    this.completedShapes = next;
    this.selectedId = null;
  }

  recordShape(shape: MapShape) {
    this.completedShapes.push(shape);
  }

  /** Replace a shape (matched by id). No-op if id isn't present. */
  updateShape(shape: MapShape) {
    const idx = this.completedShapes.findIndex((s) => s.id === shape.id);
    if (idx === -1) return;
    this.completedShapes[idx] = shape;
  }

  /** Remove a shape by id. No-op if not found. */
  removeShape(id: string) {
    const idx = this.completedShapes.findIndex((s) => s.id === id);
    if (idx === -1) return;
    this.completedShapes.splice(idx, 1);
  }

  /** Re-key a shape after the host assigns its authoritative id (e.g. a
   *  server-generated id returned by the create ack). Also rewrites the
   *  undo/redo snapshots so time-travel never resurrects the temp id. */
  replaceShapeId(oldId: string, newId: string) {
    const swap = (arr: MapShape[]) =>
      arr.map((s) => {
        if (s.id === oldId) return { ...s, id: newId };
        // Children keep pointing at the re-keyed parent.
        if (s.parentId === oldId) return { ...s, parentId: newId };
        return s;
      });
    this.completedShapes = swap(this.completedShapes);
    this.past = this.past.map(swap);
    this.future = this.future.map(swap);
    if (this.selectedId === oldId) this.selectedId = newId;
  }

  clearShapes() {
    this.completedShapes = [];
  }

    /**
   * Replace the entire shape array wholesale. Used for server-driven
   * hydration (initial payload or bulk resync). Clears selection + history
   * because a server-authoritative snapshot isn't part of the local
   * undo/redo timeline.
   */
  setShapes(shapes: MapShape[]) {
    this.completedShapes = shapes.slice();
    this.selectedId = null;
    this.past = [];
    this.future = [];
  }

  recordMeasurement(measurement: Omit<Measurement, 'timestamp'>) {
    this.measurements.push({ ...measurement, timestamp: Date.now() });
  }

  clearMeasurements() {
    this.measurements = [];
  }
}
