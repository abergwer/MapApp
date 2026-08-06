import { observer } from 'mobx-react-lite';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { MEASURE_TOOLS, startMeasure } from './toolDefs';
import { useStores } from '../../stores/StoreContext';
import type { MeasureTool } from '../../stores/DrawingToolStore';
import { toolButton } from '../../Components/common/styles/panel.styles';

/**
 * Measurement tools as an icon strip. Clicking a tool arms it; clicking the
 * armed tool again cancels. Only renders when the active map engine
 * implements the full measurement API on `MapEngine`.
 */
function MeasuringToolsImpl() {
  const { mapEngineStore, drawingToolStore } = useStores();
  const engine = mapEngineStore.engine;
  const activeTool = drawingToolStore.activeMeasureTool;

  const supported = Boolean(
    engine?.startMeasureDistance &&
      engine?.startMeasureArea &&
      engine?.removeMeasurements,
  );
  if (!supported) return null;

  const handleClick = (tool: MeasureTool) => {
    if (!engine) return;
    if (activeTool === tool) {
      engine.cancelDrawing();
      drawingToolStore.setActiveMeasureTool(null);
      return;
    }
    drawingToolStore.setActiveMeasureTool(tool);
    startMeasure(engine, tool, drawingToolStore);
  };

  const handleClear = () => {
    engine?.removeMeasurements?.();
    drawingToolStore.clearMeasurements();
  };

  return (
    <>
      {MEASURE_TOOLS.map(({ id, label, Icon }) => (
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
      <Tooltip title="Remove measurements" arrow>
        <span>
          <IconButton
            size="small"
            onClick={handleClear}
            sx={toolButton(false)}
            aria-label="Remove measurements"
          >
            <DeleteOutlinedIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
}

export default observer(MeasuringToolsImpl);
