import { useEffect, useState } from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Slider from '@mui/material/Slider';
import ToggleButton from '@mui/material/ToggleButton';
import Typography from '@mui/material/Typography';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import { useMapContext } from '../../map/MapContext';
import config from '../../../config.json';

type BaseMap = 'light' | 'satellite';

export default function MapStyleBar() {
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

        <ToggleButton
          value="satellite"
          size="small"
          color="primary"
          selected={isSatellite}
          onChange={toggleSatellite}
          disabled={!supportsBaseMap}
          title={supportsBaseMap ? 'Toggle satellite view' : 'Not supported by this engine'}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <SatelliteAltIcon fontSize="small" />
            <span>{isSatellite ? 'Satellite' : 'Light'}</span>
          </Stack>
        </ToggleButton>
      </Stack>
    </Paper>
  );
}
