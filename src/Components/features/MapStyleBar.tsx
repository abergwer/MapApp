import { useEffect, useState } from 'react';
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
import config from '../../../config.json';

type BaseMap = 'light' | 'satellite';

interface MapStyleBarProps {
  /** Current minimap visibility. */
  minimapVisible?: boolean;
  /** Toggle handler. When omitted, the minimap toggle button is hidden. */
  onToggleMinimap?: () => void;
  /** Current mini-video visibility. */
  videoVisible?: boolean;
  /** Toggle handler. When omitted, the video toggle button is hidden. */
  onToggleVideo?: () => void;
}

export default function MapStyleBar({
  minimapVisible,
  onToggleMinimap,
  videoVisible,
  onToggleVideo,
}: MapStyleBarProps = {}) {
  const { engine, containerRef } = useMapContext();
  const [brightness, setBrightness] = useState(100);
  const [baseMap, setBaseMap] = useState<BaseMap>('light');

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
    const next: BaseMap = baseMap === 'satellite' ? 'light' : 'satellite';
    engine.setBaseMap(config.MapStyles[next]);
    setBaseMap(next);
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
            onChange={(_, v) => setBrightness(v as number)}
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

        {onToggleMinimap && (
          <Tooltip title={minimapVisible ? 'Hide minimap' : 'Show minimap'} arrow>
            <ToggleButton
              value="minimap"
              size="small"
              color="primary"
              selected={Boolean(minimapVisible)}
              onChange={onToggleMinimap}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <MapIcon fontSize="small" />
                <span>Minimap</span>
              </Stack>
            </ToggleButton>
          </Tooltip>
        )}

        {onToggleVideo && (
          <Tooltip title={videoVisible ? 'Hide video' : 'Show video'} arrow>
            
            <ToggleButton
              value="video"
              size="small"
              color="primary"
              selected={Boolean(videoVisible)}
              onChange={onToggleVideo}
              aria-label={videoVisible ? 'Hide video' : 'Show video'}
            >
              <span>Video</span>
              <VideocamIcon fontSize="small" />
            </ToggleButton>
          </Tooltip>
        )}
        
      </Stack>
    </Paper>
  );
}
