import { observer } from 'mobx-react-lite';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { DRAW_TOOLS, startDraw } from './toolDefs';
import { useStores } from '../../stores/StoreContext';
import type { DrawTool } from '../../stores/DrawingToolStore';
import { toolButton } from '../../styles/common-ui/panel.styles';

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