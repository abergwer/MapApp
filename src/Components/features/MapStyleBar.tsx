import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Slider from '@mui/material/Slider';
import ToggleButton from '@mui/material/ToggleButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import MapIcon from '@mui/icons-material/Map';
import VideocamIcon from '@mui/icons-material/Videocam';
import { useMapContext } from '../../map/MapContext';
import { useStores } from '../../stores/StoreContext';
import config from '../../../config.json';

/**
 * Map style controls bar. Reads brightness/baseMap from MapStyleStore and
 * minimap/video visibility from UIVisibilityStore — all four pieces of state
 * can now be driven by other components (or devtools) without prop drilling.
 */
function MapStyleBarImpl() {
  const { containerRef } = useMapContext();
  const { mapEngineStore, mapStyleStore, uiVisibilityStore } = useStores();
  const engine = mapEngineStore.engine;
  const { brightness, baseMap } = mapStyleStore;
  const { minimapVisible, videoVisible } = uiVisibilityStore;

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
    // Below 40%, flip deck icons to white silhouettes so they don't get lost.
    if (deck) deck.style.filter = brightness < 40 ? 'brightness(0) invert(1)' : '';

    return () => {
      if (basemap) basemap.style.filter = '';
      if (deck) deck.style.filter = '';
    };
  }, [containerRef, brightness]);

  const toggleSatellite = () => {
    if (!engine?.setBaseMap) return;
    const next = baseMap === 'satellite' ? 'light' : 'satellite';
    engine.setBaseMap(config.MapStyles[next]);
    mapStyleStore.setBaseMap(next);
  };

  const supportsBaseMap = Boolean(engine?.setBaseMap);
  const isSatellite = baseMap === 'satellite';

  return (
    <Paper sx={{ px: 1.25, py: 0.75 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', px: 0.75 }}>
          <WbSunnyIcon fontSize="small" sx={{ opacity: 0.85 }} />
          <Slider
            size="small"
            value={brightness}
            min={0}
            max={120}
            step={1}
            onChange={(_, v) => mapStyleStore.setBrightness(v as number)}
            aria-label="Map brightness"
            sx={{ width: 110 }}
          />
          <Typography
            variant="caption"
            sx={{ minWidth: 36, textAlign: 'right', opacity: 0.75, fontVariantNumeric: 'tabular-nums' }}
          >
            {brightness}%
          </Typography>
        </Stack>

        <Tooltip
          title={supportsBaseMap ? 'Toggle satellite view' : 'Not supported by this engine'}
          arrow
        >
          {/* span wrapper so Tooltip still fires when the button is disabled */}
          <span>
            <ToggleButton
              value="satellite"
              size="small"
              color="primary"
              selected={isSatellite}
              onChange={toggleSatellite}
              disabled={!supportsBaseMap}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <SatelliteAltIcon fontSize="small" />
                <span>{isSatellite ? 'Satellite' : 'Light'}</span>
              </Stack>
            </ToggleButton>
          </span>
        </Tooltip>

        <Tooltip title={minimapVisible ? 'Hide minimap' : 'Show minimap'} arrow>
          <ToggleButton
            value="minimap"
            size="small"
            color="primary"
            selected={minimapVisible}
            onChange={() => uiVisibilityStore.toggleMinimap()}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <MapIcon fontSize="small" />
              <span>Minimap</span>
            </Stack>
          </ToggleButton>
        </Tooltip>

        <Tooltip title={videoVisible ? 'Hide video' : 'Show video'} arrow>
          <ToggleButton
            value="video"
            size="small"
            color="primary"
            selected={videoVisible}
            onChange={() => uiVisibilityStore.toggleVideo()}
            aria-label={videoVisible ? 'Hide video' : 'Show video'}
          >
            <span>Video</span>
            <VideocamIcon fontSize="small" />
          </ToggleButton>
        </Tooltip>
      </Stack>
    </Paper>
  );
}

export default observer(MapStyleBarImpl);

