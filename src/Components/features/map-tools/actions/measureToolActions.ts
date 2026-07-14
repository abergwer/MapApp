import type { MapEngine } from '../../../../map/mapEngine/MapEngine';
import type { DrawingToolStore, MeasureTool } from '../../../../stores/DrawingToolStore';

/** Shared measurement wiring used by MeasuringTools and MapToolsPanel. */
export function startMeasure(
  engine: MapEngine,
  tool: MeasureTool,
  store: DrawingToolStore,
): void {
  switch (tool) {
    case 'distance':
      engine.startMeasureDistance?.((km) =>
        store.recordMeasurement({ kind: 'distance', value: km }),
      );
      break;
    case 'area':
      engine.startMeasureArea?.((km2) =>
        store.recordMeasurement({ kind: 'area', value: km2 }),
      );
      break;
  }
}

export function selectMeasureTool(
  engine: MapEngine | null,
  store: DrawingToolStore,
  tool: MeasureTool,
): void {
  if (!engine) return;
  store.setActiveMeasureTool(tool);
  startMeasure(engine, tool, store);
}

export function clearMeasurements(
  engine: MapEngine | null,
  store: DrawingToolStore,
): void {
  engine?.removeMeasurements?.();
  store.clearMeasurements();
}

export function isMeasureSupported(engine: MapEngine | null): boolean {
  return Boolean(
    engine?.startMeasureDistance &&
      engine?.startMeasureArea &&
      engine?.removeMeasurements,
  );
}
