import { makeAutoObservable } from 'mobx';

export type DrawTool =
  | 'point'
  | 'line'
  | 'polygon'
  | 'circle'
  | 'ellipse'
  | 'sector'
  | 'route';

export type MeasureTool = 'distance' | 'area';

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
  | { id: string; kind: 'route'; positions: [number, number][] };

/** Generate a unique id for a shape. Uses native UUID if available. */
export const newShapeId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `shape-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export interface Measurement {
  kind: MeasureTool;
  /** Distance in km (kind === 'distance') or area in km² (kind === 'area'). */
  value: number;
  timestamp: number;
}

/**
 * Demo seed used during development — pretends a server pushed these
 * shapes on startup. Radii are kilometres (the store's canonical unit).
 * In a real app, swap for a websocket / fetch hook that calls
 * `recordShape` as messages arrive.
 */
const DEMO_SERVER_SHAPES: MapShape[] = [
  { id: newShapeId(), kind: 'point', position: [34.7818, 32.0853] },
  {
    id: newShapeId(),
    kind: 'polygon',
    positions: [
      [34.75, 32.05],
      [34.81, 32.05],
      [34.81, 32.1],
      [34.75, 32.1],
    ],
  },
  { id: newShapeId(), kind: 'circle', center: [34.85, 32.08], radius: 3 },
  { id: newShapeId(), kind: 'ellipse', center: [34.7, 32.12], radiusX: 4, radiusY: 2 },
  {
    id: newShapeId(),
    kind: 'sector',
    center: [34.78, 32.15],
    radius: 5,
    startBearing: 30,
    endBearing: 110,
  },
];

export class DrawingToolStore {
  activeDrawTool: DrawTool | null = null;
  activeMeasureTool: MeasureTool | null = null;
  isEditing = false;
  completedShapes: MapShape[] = [...DEMO_SERVER_SHAPES];
  measurements: Measurement[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  setActiveDrawTool(tool: DrawTool | null) {
    this.activeDrawTool = tool;
  }

  setActiveMeasureTool(tool: MeasureTool | null) {
    this.activeMeasureTool = tool;
  }

  setEditing(value: boolean) {
    this.isEditing = value;
  }

  recordShape(shape: MapShape) {
    this.completedShapes.push(shape);
    console.log('Recorded shape:', shape);
  }

  /** Replace a shape (matched by id). No-op if id isn't present. */
  updateShape(shape: MapShape) {
    const idx = this.completedShapes.findIndex((s) => s.id === shape.id);
    if (idx === -1) return;
    this.completedShapes[idx] = shape;
    console.log('Updated shape:', shape);
  }

  /** Remove a shape by id. No-op if not found. */
  removeShape(id: string) {
    const idx = this.completedShapes.findIndex((s) => s.id === id);
    if (idx === -1) return;
    this.completedShapes.splice(idx, 1);
    console.log('Removed shape:', id);
  }

  clearShapes() {
    this.completedShapes = [];
  }

  recordMeasurement(measurement: Omit<Measurement, 'timestamp'>) {
    this.measurements.push({ ...measurement, timestamp: Date.now() });
    console.log('Recorded measurement:', measurement);
  }

  clearMeasurements() {
    this.measurements = [];
  }
}
