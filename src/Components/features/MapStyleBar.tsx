import { observer } from 'mobx-react-lite';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import MapIcon from '@mui/icons-material/Map';
import VideocamIcon from '@mui/icons-material/Videocam';
import { useStores } from '../../stores/StoreContext';
import type { BaseMap } from '../../stores/MapStyleStore';
import { toolButton } from '../../styles/common-ui/panel.styles';
import config from '../../../config.json';

const BASEMAPS: { id: BaseMap; label: string; Icon: typeof WbSunnyIcon }[] = [
  { id: 'light', label: 'Light basemap', Icon: WbSunnyIcon },
  { id: 'dark', label: 'Dark basemap', Icon: DarkModeIcon },
  { id: 'satellite', label: 'Satellite basemap', Icon: SatelliteAltIcon },
];

/**
 * Basemap + panel toggles for the map toolbar. State lives in
 * MapStyleStore + UIVisibilityStore; the brightness filter is applied by
 * MapWrapper (single owner of the map container).
 */
function MapStyleBarImpl() {
  const { mapEngineStore, mapStyleStore, uiVisibilityStore } = useStores();
  const engine = mapEngineStore.engine;
  const { baseMap } = mapStyleStore;
  const { minimapVisible, videoVisible } = uiVisibilityStore;
  const supportsBaseMap = Boolean(engine?.setBaseMap);

  const handleBaseMap = (next: BaseMap) => {
    if (!engine?.setBaseMap || baseMap === next) return;
    engine.setBaseMap(config.MapStyles[next]);
    mapStyleStore.setBaseMap(next);
  };

  return (
    <>
      {BASEMAPS.map(({ id, label, Icon }) => (
        <Tooltip key={id} title={supportsBaseMap ? label : 'Not supported by this engine'} arrow>
          {/* span wrapper so Tooltip still fires when the button is disabled */}
          <span>
            <IconButton
              size="small"
              onClick={() => handleBaseMap(id)}
              disabled={!supportsBaseMap}
              sx={toolButton(baseMap === id)}
              aria-label={label}
            >
              <Icon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      ))}

      <Tooltip title={minimapVisible ? 'Hide minimap panel' : 'Show minimap panel'} arrow>
        <IconButton
          size="small"
          onClick={() => uiVisibilityStore.toggleMinimap()}
          sx={toolButton(minimapVisible)}
          aria-label={minimapVisible ? 'Hide minimap panel' : 'Show minimap panel'}
        >
          <MapIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title={videoVisible ? 'Hide video panel' : 'Show video panel'} arrow>
        <IconButton
          size="small"
          onClick={() => uiVisibilityStore.toggleVideo()}
          sx={toolButton(videoVisible)}
          aria-label={videoVisible ? 'Hide video panel' : 'Show video panel'}
        >
          <VideocamIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );
}

export default observer(MapStyleBarImpl);

