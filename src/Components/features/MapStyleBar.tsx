import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import MapIcon from '@mui/icons-material/Map';
import VideocamIcon from '@mui/icons-material/Videocam';
import { useMapContext } from '../../map/MapContext';
import { useStores } from '../../stores/StoreContext';
import { toolButton } from '../../styles/common-ui/panel.styles';
import { brightnessPopover } from '../../styles/features/map.styles';
import config from '../../../config.json';

/**
 * Map style controls as an icon strip: brightness (popover slider),
 * dark/satellite basemap toggle and the minimap/video panel toggles.
 * State lives in MapStyleStore + UIVisibilityStore.
 */
function MapStyleBarImpl() {
  const { containerRef } = useMapContext();
  const { mapEngineStore, mapStyleStore, uiVisibilityStore } = useStores();
  const engine = mapEngineStore.engine;
  const { brightness, baseMap } = mapStyleStore;
  const { minimapVisible, videoVisible } = uiVisibilityStore;
  const [brightnessAnchor, setBrightnessAnchor] = useState<HTMLElement | null>(null);

  // Dim the basemap when the slider goes down. Overlays (deck.gl, Leaflet
  // draws) are left alone so they stay readable on a darker map.
  // On MapLibre/Cesium, draw shapes share the basemap canvas and dim with it.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const basemap = container.querySelector<HTMLElement>(
      '.leaflet-tile-pane, .maplibregl-canvas, .cesium-widget canvas',
    );
    const deck = container.querySelector<HTMLElement>('.deck-overlay');

    if (basemap) basemap.style.filter = `brightness(${brightness / 100})`;

    return () => {
      if (basemap) basemap.style.filter = '';
      if (deck) deck.style.filter = '';
    };
  }, [containerRef, brightness]);

  const toggleSatellite = () => {
    if (!engine?.setBaseMap) return;
    const next = baseMap === 'satellite' ? 'dark' : 'satellite';
    engine.setBaseMap(config.MapStyles[next]);
    mapStyleStore.setBaseMap(next);
  };

  const supportsBaseMap = Boolean(engine?.setBaseMap);
  const isSatellite = baseMap === 'satellite';

  return (
    <>
      <Tooltip title={`Map brightness (${brightness}%)`} arrow>
        <span>
          <IconButton
            size="small"
            onClick={(e) => setBrightnessAnchor(e.currentTarget)}
            sx={toolButton(Boolean(brightnessAnchor))}
            aria-label="Map brightness"
          >
            <WbSunnyIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Popover
        open={Boolean(brightnessAnchor)}
        anchorEl={brightnessAnchor}
        onClose={() => setBrightnessAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Box sx={brightnessPopover}>
          <WbSunnyIcon fontSize="small" sx={{ opacity: 0.85 }} />
          <Slider
            size="small"
            value={brightness}
            min={0}
            max={120}
            step={1}
            onChange={(_, v) => mapStyleStore.setBrightness(v as number)}
            aria-label="Map brightness"
          />
          <Typography
            variant="caption"
            sx={{ minWidth: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
          >
            {brightness}%
          </Typography>
        </Box>
      </Popover>

      <Tooltip
        title={supportsBaseMap ? 'Toggle satellite basemap' : 'Not supported by this engine'}
        arrow
      >
        {/* span wrapper so Tooltip still fires when the button is disabled */}
        <span>
          <IconButton
            size="small"
            onClick={toggleSatellite}
            disabled={!supportsBaseMap}
            sx={toolButton(isSatellite)}
            aria-label="Toggle satellite basemap"
          >
            <SatelliteAltIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

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

