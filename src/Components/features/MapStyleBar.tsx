import { observer } from 'mobx-react-lite';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import MapIcon from '@mui/icons-material/Map';
import VideocamIcon from '@mui/icons-material/Videocam';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import Brightness6Icon from '@mui/icons-material/Brightness6';
import { useStores } from '../../stores/StoreContext';
import type { BaseMap } from '../../stores/MapStyleStore';
import type { WorkspacePanelId } from '../../stores/UIVisibilityStore';
import { toolButton } from '../../styles/common-ui/panel.styles';
import config from '../../../config.json';

const BASEMAPS: { id: BaseMap; label: string; Icon: typeof WbSunnyIcon }[] = [
  { id: 'light', label: 'Light basemap', Icon: WbSunnyIcon },
  { id: 'dark', label: 'Dark basemap', Icon: DarkModeIcon },
  { id: 'satellite', label: 'Satellite basemap', Icon: SatelliteAltIcon },
];

/** Workspace panel toggles shown in the map toolbar (reference design). */
const PANEL_TOGGLES: { id: WorkspacePanelId; label: string; Icon: typeof MapIcon }[] = [
  { id: 'minimap', label: 'minimap panel', Icon: MapIcon },
  { id: 'video', label: 'video panel', Icon: VideocamIcon },
  { id: 'view3d', label: '3D view panel', Icon: ViewInArIcon },
  { id: 'intel', label: 'intel feed panel', Icon: RssFeedIcon },
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

      {PANEL_TOGGLES.map(({ id, label, Icon }) => {
        const visible = uiVisibilityStore.isPanelVisible(id);
        const title = `${visible ? 'Hide' : 'Show'} ${label}`;
        return (
          <Tooltip key={id} title={title} arrow>
            <IconButton
              size="small"
              onClick={() => uiVisibilityStore.togglePanel(id)}
              sx={toolButton(visible)}
              aria-label={title}
            >
              <Icon fontSize="small" />
            </IconButton>
          </Tooltip>
        );
      })}

      <Tooltip
        title={uiVisibilityStore.brightnessCardVisible ? 'Hide brightness control' : 'Show brightness control'}
        arrow
      >
        <IconButton
          size="small"
          onClick={() => uiVisibilityStore.toggleBrightnessCard()}
          sx={toolButton(uiVisibilityStore.brightnessCardVisible)}
          aria-label={
            uiVisibilityStore.brightnessCardVisible ? 'Hide brightness control' : 'Show brightness control'
          }
        >
          <Brightness6Icon fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );
}

export default observer(MapStyleBarImpl);

