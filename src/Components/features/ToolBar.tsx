import { observer } from 'mobx-react-lite';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import TimelineIcon from '@mui/icons-material/Timeline';
import PentagonOutlinedIcon from '@mui/icons-material/PentagonOutlined';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PanoramaFishEyeIcon from '@mui/icons-material/PanoramaFishEye';
import PieChartOutlinedIcon from '@mui/icons-material/PieChartOutlined';
import RouteIcon from '@mui/icons-material/Route';
import type { MapEngine } from '../../map/mapEngine/MapEngine';
import { useStores } from '../../stores/StoreContext';
import type { DrawTool } from '../../stores/DrawingToolStore';
import type { EntityService } from '../../stores/EntityService';
import { toolButton } from '../../styles/common-ui/panel.styles';

const DRAW_TOOLS: { id: DrawTool; label: string; Icon: typeof FiberManualRecordIcon }[] = [
  { id: 'point', label: 'Draw point', Icon: FiberManualRecordIcon },
  { id: 'line', label: 'Draw line', Icon: TimelineIcon },
  { id: 'polygon', label: 'Draw polygon', Icon: PentagonOutlinedIcon },
  { id: 'circle', label: 'Draw circle', Icon: RadioButtonUncheckedIcon },
  { id: 'ellipse', label: 'Draw ellipse', Icon: PanoramaFishEyeIcon },
  { id: 'sector', label: 'Draw sector', Icon: PieChartOutlinedIcon },
  { id: 'route', label: 'Draw route', Icon: RouteIcon },
];

/**
 * Wire the engine's draw callback to the EntityService so completed shapes
 * are created through the single CRUD writer (and, in future, persisted to
 * the server) instead of being dropped to console.log.
 */
function startDraw(engine: MapEngine, tool: DrawTool, entities: EntityService) {
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

/**
 * Draw tools as an icon strip (reference-design style). Clicking a tool
 * arms it; clicking the armed tool again cancels. Esc still deselects.
 */
function ToolBarImpl() {
  const { mapEngineStore, drawingToolStore, entityService } = useStores();
  const engine = mapEngineStore.engine;
  const activeTool = drawingToolStore.activeDrawTool;

  const handleClick = (tool: DrawTool) => {
    if (!engine) return;
    if (activeTool === tool) {
      engine.cancelDrawing();
      drawingToolStore.setActiveDrawTool(null);
      drawingToolStore.setSelectedId(null);
      return;
    }
    drawingToolStore.setActiveDrawTool(tool);
    startDraw(engine, tool, entityService);
  };

  return (
    <>
      {DRAW_TOOLS.map(({ id, label, Icon }) => (
        <Tooltip key={id} title={activeTool === id ? `${label} (click to cancel)` : label} arrow>
          <span>
            <IconButton
              size="small"
              disabled={!engine}
              onClick={() => handleClick(id)}
              sx={toolButton(activeTool === id)}
              aria-label={label}
            >
              <Icon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      ))}
    </>
  );
}

export default observer(ToolBarImpl);