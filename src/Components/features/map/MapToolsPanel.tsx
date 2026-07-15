import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import StraightenIcon from '@mui/icons-material/Straighten';
import CropFreeIcon from '@mui/icons-material/CropFree';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import MapIcon from '@mui/icons-material/Map';
import VideocamIcon from '@mui/icons-material/Videocam';
import { observer } from 'mobx-react-lite';
import SectionCard from '../../common/SectionCard';
import { startMeasure } from '../toolDefs';
import { useStores } from '../../../stores/StoreContext';
import type { MeasureTool } from '../../../stores/DrawingToolStore';
import type { BaseMap } from '../../../stores/MapStyleStore';
import * as common from '../../../styles/common-ui/panel.styles';
import config from '../../../../config.json';

const MAP_TYPES: { id: BaseMap; label: string; caption: string; Icon: typeof DarkModeIcon }[] = [
  { id: 'dark', label: 'Dark', caption: 'Carto dark', Icon: DarkModeIcon },
  { id: 'satellite', label: 'Satellite', caption: 'World imagery', Icon: SatelliteAltIcon },
];

/** MAP TOOLS view: measurements, basemap type, view controls. */
function MapToolsPanelImpl() {
  const { mapEngineStore, mapStyleStore, drawingToolStore, uiVisibilityStore: ui } = useStores();
  const engine = mapEngineStore.engine;
  const activeMeasure = drawingToolStore.activeMeasureTool;
  const supportsBaseMap = Boolean(engine?.setBaseMap);

  const handleMeasure = (tool: MeasureTool) => {
    if (!engine) return;
    if (activeMeasure === tool) {
      engine.cancelDrawing();
      drawingToolStore.setActiveMeasureTool(null);
      return;
    }
    drawingToolStore.setActiveMeasureTool(tool);
    startMeasure(engine, tool, drawingToolStore);
  };

  const handleClearMeasurements = () => {
    engine?.removeMeasurements?.();
    drawingToolStore.clearMeasurements();
  };

  const handleMapType = (type: BaseMap) => {
    if (!engine?.setBaseMap || mapStyleStore.baseMap === type) return;
    engine.setBaseMap(config.MapStyles[type]);
    mapStyleStore.setBaseMap(type);
  };

  return (
    <>
      <SectionCard title="Measurements">
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <ButtonBase
            sx={common.toolCard(activeMeasure === 'distance')}
            onClick={() => handleMeasure('distance')}
            disabled={!engine?.startMeasureDistance}
            aria-label="Measure distance"
          >
            <StraightenIcon fontSize="small" />
            Distance
          </ButtonBase>
          <ButtonBase
            sx={common.toolCard(activeMeasure === 'area')}
            onClick={() => handleMeasure('area')}
            disabled={!engine?.startMeasureArea}
            aria-label="Measure area"
          >
            <CropFreeIcon fontSize="small" />
            Area
          </ButtonBase>
        </Box>
        <ButtonBase
          sx={common.dangerButton}
          onClick={handleClearMeasurements}
          disabled={!engine?.removeMeasurements}
          aria-label="Clear measurements"
        >
          <DeleteOutlinedIcon fontSize="small" />
          Clear
        </ButtonBase>
      </SectionCard>

      <SectionCard title="Map Type">
        <Box sx={{ display: 'flex', gap: 1 }}>
          {MAP_TYPES.map(({ id, label, caption, Icon }) => (
            <ButtonBase
              key={id}
              sx={common.toolCard(mapStyleStore.baseMap === id)}
              onClick={() => handleMapType(id)}
              disabled={!supportsBaseMap}
              aria-label={`${label} basemap`}
            >
              <Icon fontSize="small" />
              {label}
              <Typography component="span" sx={common.toolCardCaption}>
                {caption}
              </Typography>
            </ButtonBase>
          ))}
        </Box>
      </SectionCard>

      <SectionCard title="View Controls">
        <Box sx={common.controlRow}>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Brightness</Typography>
          <Typography sx={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
            {mapStyleStore.brightness}%
          </Typography>
        </Box>
        <Slider
          size="small"
          value={mapStyleStore.brightness}
          min={0}
          max={120}
          step={1}
          onChange={(_, v) => mapStyleStore.setBrightness(v as number)}
          aria-label="Map brightness"
          sx={{ mx: 0.5, width: 'calc(100% - 8px)' }}
        />
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <ButtonBase
            sx={common.toolCard(ui.minimapVisible)}
            onClick={() => ui.toggleMinimap()}
            aria-label="Toggle minimap panel"
          >
            <MapIcon fontSize="small" />
            Minimap
          </ButtonBase>
          <ButtonBase
            sx={common.toolCard(ui.videoVisible)}
            onClick={() => ui.toggleVideo()}
            aria-label="Toggle video panel"
          >
            <VideocamIcon fontSize="small" />
            Video
          </ButtonBase>
        </Box>
        <Box sx={{ ...common.controlRow, mt: 1 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Map toolbar</Typography>
          <Switch
            size="small"
            checked={ui.toolbarVisible}
            onChange={(_, v) => ui.setToolbarVisible(v)}
            slotProps={{ input: { 'aria-label': 'Toggle floating map toolbar' } }}
          />
        </Box>
      </SectionCard>
    </>
  );
}

export default observer(MapToolsPanelImpl);
