import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import TimelineIcon from '@mui/icons-material/Timeline';
import PentagonOutlinedIcon from '@mui/icons-material/PentagonOutlined';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PanoramaFishEyeIcon from '@mui/icons-material/PanoramaFishEye';
import PieChartOutlinedIcon from '@mui/icons-material/PieChartOutlined';
import RouteIcon from '@mui/icons-material/Route';
import StraightenIcon from '@mui/icons-material/Straighten';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import type { MapEngine } from '../../map/mapEngine/MapEngine';
import type { DrawTool, DrawingToolStore, MeasureTool } from '../../stores/DrawingToolStore';
import type { EntityService } from '../../map/entities/EntityService';
import type { EntityTypeDef } from '../../map/entities/entityTypes';
import type { MapShape } from '../../stores/shapes';

/**
 * Shared draw/measure tool definitions + engine wiring, used by both the
 * floating map tool strip and the left-panel views (single source so the
 * two UIs can never diverge).
 */

export const DRAW_TOOLS: { id: DrawTool; label: string; Icon: typeof FiberManualRecordIcon }[] = [
  { id: 'point', label: 'Draw point', Icon: FiberManualRecordIcon },
  { id: 'line', label: 'Draw line', Icon: TimelineIcon },
  { id: 'polygon', label: 'Draw polygon', Icon: PentagonOutlinedIcon },
  { id: 'circle', label: 'Draw circle', Icon: RadioButtonUncheckedIcon },
  { id: 'ellipse', label: 'Draw ellipse', Icon: PanoramaFishEyeIcon },
  { id: 'sector', label: 'Draw sector', Icon: PieChartOutlinedIcon },
  { id: 'route', label: 'Draw route', Icon: RouteIcon },
];

export const MEASURE_TOOLS: { id: MeasureTool; label: string; Icon: typeof StraightenIcon }[] = [
  { id: 'distance', label: 'Measure distance', Icon: StraightenIcon },
  { id: 'area', label: 'Measure area', Icon: SquareFootIcon },
];

/**
 * Wire the engine's draw callback to the EntityService so completed shapes
 * are created through the single CRUD writer (and, in future, persisted to
 * the server) instead of being dropped to console.log.
 *
 * `decorate` lets callers enrich the finished shape (e.g. attach entity
 * data) before it is committed.
 */
export function startDraw(
  engine: MapEngine,
  tool: DrawTool,
  entities: EntityService,
  decorate: (shape: MapShape) => MapShape = (shape) => shape,
) {
  const create = (shape: MapShape) => entities.create(decorate(shape));
  switch (tool) {
    case 'point':
      return engine.startDrawPoint((id, position) => create({ id, kind: 'point', position }));
    case 'line':
      return engine.startDrawLine((id, positions) => create({ id, kind: 'line', positions }));
    case 'polygon':
      return engine.startDrawPolygon((id, positions) =>
        create({ id, kind: 'polygon', positions }),
      );
    case 'circle':
      return engine.startDrawCircle((id, center, radius) =>
        create({ id, kind: 'circle', center, radius }),
      );
    case 'ellipse':
      return engine.startDrawEllipse?.((id, center, radiusX, radiusY) =>
        create({ id, kind: 'ellipse', center, radiusX, radiusY }),
      );
    case 'sector':
      return engine.startDrawSector?.((id, center, radius, startBearing, endBearing) =>
        create({ id, kind: 'sector', center, radius, startBearing, endBearing }),
      );
    case 'route':
      return engine.startDrawRoute?.((id, positions) => create({ id, kind: 'route', positions }));
  }
}

/**
 * Start drawing a configurable entity: same engine flow as `startDraw`,
 * but the finished shape is stamped with the type's entity data (auto
 * name + seeded default attributes).
 */
export function startDrawEntity(
  engine: MapEngine,
  geometry: DrawTool,
  entities: EntityService,
  type: EntityTypeDef,
) {
  return startDraw(engine, geometry, entities, (shape) => ({
    ...shape,
    entity: {
      typeId: type.id,
      name: entities.nextEntityName(type.id, type.name),
      attributes: { ...type.defaultAttributes },
    },
  }));
}

export function startMeasure(engine: MapEngine, tool: MeasureTool, store: DrawingToolStore) {
  switch (tool) {
    case 'distance':
      return engine.startMeasureDistance?.((km) =>
        store.recordMeasurement({ kind: 'distance', value: km }),
      );
    case 'area':
      return engine.startMeasureArea?.((km2) =>
        store.recordMeasurement({ kind: 'area', value: km2 }),
      );
  }
}
