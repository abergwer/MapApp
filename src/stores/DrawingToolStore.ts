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

export type CompletedShape =
  | { kind: 'point'; position: [number, number] }
  | { kind: 'line'; positions: [number, number][] }
  | { kind: 'polygon'; positions: [number, number][] }
  | { kind: 'circle'; center: [number, number]; radius: number }
  | { kind: 'ellipse'; center: [number, number]; radiusX: number; radiusY: number }
  | {
      kind: 'sector';
      center: [number, number];
      radius: number;
      startBearing: number;
      endBearing: number;
    }
  | { kind: 'route'; positions: [number, number][] };

export interface Measurement {
  kind: MeasureTool;
  /** Distance in km (kind === 'distance') or area in km² (kind === 'area'). */
  value: number;
  timestamp: number;
}

export class DrawingToolStore {
  activeDrawTool: DrawTool | null = null;
  activeMeasureTool: MeasureTool | null = null;
  isEditing = false;
  completedShapes: CompletedShape[] = [];
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

  recordShape(shape: CompletedShape) {
    this.completedShapes.push(shape);
    console.log('Recorded shape:', shape);
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
