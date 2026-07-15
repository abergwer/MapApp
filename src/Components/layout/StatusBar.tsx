import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { observer } from 'mobx-react-lite';
import { mapEngineLabel } from '../../map/mapConfig';
import { useStores } from '../../stores/StoreContext';
import { palette } from '../../styles/system-ui/tokens';
import * as layout from '../../styles/system-ui/layout.styles';

function Cell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box sx={layout.statusCell}>
      <Typography sx={layout.statusLabel}>{label}</Typography>
      <Typography sx={{ ...layout.statusValue, ...(color && { color }) }}>{value}</Typography>
    </Box>
  );
}

/** Bottom status strip: system state, UTC clock and live map view state. */
function StatusBarImpl() {
  const { mapEngineStore, mapStyleStore } = useStores();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const engineReady = Boolean(mapEngineStore.engine);
  const vs = mapEngineStore.viewState;
  const center = vs
    ? `${vs.latitude.toFixed(4)}° N, ${vs.longitude.toFixed(4)}° E`
    : '—';

  return (
    <Box component="footer" sx={layout.statusBar}>
      <Cell
        label="Status"
        value={engineReady ? 'All Systems Operational' : 'Initializing…'}
        color={engineReady ? palette.ok : palette.warn}
      />
      <Cell label="Time" value={`${now.toISOString().slice(11, 19)} UTC`} />
      <Cell label="Center" value={center} />
      <Cell label="Zoom" value={vs ? vs.zoom.toFixed(1) : '—'} />
      <Cell label="Engine" value={mapEngineLabel[mapEngineStore.selectedEngine]} />
      <Cell label="Basemap" value={mapStyleStore.baseMap.toUpperCase()} />
    </Box>
  );
}

export default observer(StatusBarImpl);
