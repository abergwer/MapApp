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
import type { EntityService } from '../../stores/EntityService';

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
 */
export function startDraw(engine: MapEngine, tool: DrawTool, entities: EntityService) {
  switch (tool) {
    case 'point':
      return engine.startDrawPoint((id, position) =>
        entities.create({ id, kind: 'point', position }),
      );
    case 'line':
      return engine.startDrawLine((id, positions) =>
        entities.create({ id, kind: 'line', positions }),
      );
    case 'polygon':
      return engine.startDrawPolygon((id, positions) =>
        entities.create({ id, kind: 'polygon', positions }),
      );
    case 'circle':
      return engine.startDrawCircle((id, center, radius) =>
        entities.create({ id, kind: 'circle', center, radius }),
      );
    case 'ellipse':
      return engine.startDrawEllipse?.((id, center, radiusX, radiusY) =>
        entities.create({ id, kind: 'ellipse', center, radiusX, radiusY }),
      );
    case 'sector':
      return engine.startDrawSector?.((id, center, radius, startBearing, endBearing) =>
        entities.create({ id, kind: 'sector', center, radius, startBearing, endBearing }),
      );
    case 'route':
      return engine.startDrawRoute?.((id, positions) =>
        entities.create({ id, kind: 'route', positions }),
      );
  }
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
