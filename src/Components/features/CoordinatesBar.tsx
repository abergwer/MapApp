import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useStores } from '../../stores/StoreContext';

function CoordinatesBarImpl() {
  const { mapEngineStore, mapCursorStore } = useStores();
  const engine = mapEngineStore.engine;

  useEffect(() => {
    if (!engine?.onMapClick) return;
    engine.onMapClick((lat, lng) => mapCursorStore.setCoordinate(lat, lng));
  }, [engine, mapCursorStore]);

  const coords =
    mapCursorStore.lat != null && mapCursorStore.lng != null
      ? { lat: mapCursorStore.lat, lng: mapCursorStore.lng }
      : null;

  return (
    <Paper
      sx={{
        px: 1.75,
        py: 0.75,
        fontFamily: "'JetBrains Mono', ui-monospace, Consolas, monospace",
        fontSize: '0.78rem',
        letterSpacing: '0.01em',
        pointerEvents: 'none',
        userSelect: 'none',
        width: 'fit-content',
      }}
    >
      {coords ? (
        <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center' }}>
          <span>
            Lat:{' '}
            <Box component="strong" sx={{ color: 'success.light' }}>
              {coords.lat.toFixed(5)}
            </Box>
          </span>
          <span>
            Lng:{' '}
            <Box component="strong" sx={{ color: 'success.light' }}>
              {coords.lng.toFixed(5)}
            </Box>
          </span>
        </Stack>
      ) : (
        <Typography component="span" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
          Click on the map to see coordinates
        </Typography>
      )}
    </Paper>
  );
}

export default observer(CoordinatesBarImpl);
