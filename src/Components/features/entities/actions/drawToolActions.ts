import type { MapEngine } from '../../../../map/mapEngine/MapEngine';
import type { DrawingToolStore, DrawTool } from '../../../../stores/DrawingToolStore';
import type { EntityService } from '../../../../stores/EntityService';

/**
 * Draw-tool wiring for EntitiesPanel.
 * Completions go through EntityService (single CRUD writer) — not store.recordShape directly.
 */
export function startDraw(
  engine: MapEngine,
  tool: DrawTool,
  entities: EntityService,
): void {
  switch (tool) {
    case 'point':
      engine.startDrawPoint((id, position) =>
        entities.create({ id, kind: 'point', position }),
      );
      break;
    case 'line':
      engine.startDrawLine((id, positions) =>
        entities.create({ id, kind: 'line', positions }),
      );
      break;
    case 'polygon':
      engine.startDrawPolygon((id, positions) =>
        entities.create({ id, kind: 'polygon', positions }),
      );
      break;
    case 'circle':
      engine.startDrawCircle((id, center, radius) =>
        entities.create({ id, kind: 'circle', center, radius }),
      );
      break;
    case 'ellipse':
      engine.startDrawEllipse?.((id, center, radiusX, radiusY) =>
        entities.create({ id, kind: 'ellipse', center, radiusX, radiusY }),
      );
      break;
    case 'sector':
      engine.startDrawSector?.((id, center, radius, startBearing, endBearing) =>
        entities.create({
          id,
          kind: 'sector',
          center,
          radius,
          startBearing,
          endBearing,
        }),
      );
      break;
    case 'route':
      engine.startDrawRoute?.((id, positions) =>
        entities.create({ id, kind: 'route', positions }),
      );
      break;
  }
}

export function cancelDrawSession(
  engine: MapEngine | null,
  store: DrawingToolStore,
): void {
  engine?.cancelDrawing();
  store.setActiveDrawTool(null);
  store.setSelectedId(null);
}

export function selectDrawTool(
  engine: MapEngine | null,
  store: DrawingToolStore,
  entities: EntityService,
  tool: DrawTool,
): void {
  if (!engine) return;
  store.setActiveDrawTool(tool);
  startDraw(engine, tool, entities);
}

export function isDrawToolSupported(
  engine: MapEngine | null,
  tool: DrawTool,
): boolean {
  if (!engine) return false;
  switch (tool) {
    case 'ellipse':
      return Boolean(engine.startDrawEllipse);
    case 'sector':
      return Boolean(engine.startDrawSector);
    case 'route':
      return Boolean(engine.startDrawRoute);
    default:
      return true;
  }
}
