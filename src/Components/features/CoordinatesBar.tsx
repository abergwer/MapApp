import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useStores } from '../../stores/StoreContext';

function CoordinatesBarImpl() {
  const { mapEngineStore } = useStores();
  const engine = mapEngineStore.engine;
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!engine?.onMapClick) return;
    engine.onMapClick((lat, lng) => setCoords({ lat, lng }));
  }, [engine]);

  return (
    <Paper
      sx={{
        px: 1.75,
        py: 0.75,
        fontFamily: 'ui-monospace, Consolas, monospace',
        fontSize: '0.82rem',
        backdropFilter: 'blur(4px)',
        pointerEvents: 'none',
        userSelect: 'none',
        width: 'fit-content',
      }}
    >
      {coords ? (
        <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center' }}>
          <span>Lat: <strong style={{ color: '#a3e6a3' }}>{coords.lat.toFixed(5)}</strong></span>
          <span>Lng: <strong style={{ color: '#a3e6a3' }}>{coords.lng.toFixed(5)}</strong></span>
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
