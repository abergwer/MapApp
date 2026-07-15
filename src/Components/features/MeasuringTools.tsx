import { observer } from 'mobx-react-lite';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import StraightenIcon from '@mui/icons-material/Straighten';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import type { MapEngine } from '../../map/mapEngine/MapEngine';
import { useStores } from '../../stores/StoreContext';
import type { DrawingToolStore, MeasureTool } from '../../stores/DrawingToolStore';
import { toolButton } from '../../styles/common-ui/panel.styles';

const MEASURE_TOOLS: { id: MeasureTool; label: string; Icon: typeof StraightenIcon }[] = [
  { id: 'distance', label: 'Measure distance', Icon: StraightenIcon },
  { id: 'area', label: 'Measure area', Icon: SquareFootIcon },
];

function startMeasure(engine: MapEngine, tool: MeasureTool, store: DrawingToolStore) {
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
