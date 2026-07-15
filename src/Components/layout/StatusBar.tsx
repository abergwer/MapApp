import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { observer } from 'mobx-react-lite';
import { mapEngineLabel } from '../../map/mapConfig';
import { useStores } from '../../stores/StoreContext';
import { palette } from '../../styles/system-ui/tokens';
import * as layout from '../../styles/system-ui/layout.styles';

const pad = (n: number) => String(n).padStart(2, '0');

function Cell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box sx={layout.statusCell}>
      <Typography sx={layout.statusLabel}>{label}</Typography>
      <Typography sx={{ ...layout.statusValue, ...(color && { color }) }}>{value}</Typography>
    </Box>
  );
}

/** Bottom status strip: system state, clock, last-click coordinate. */
function StatusBarImpl() {
  const { mapEngineStore, mapStyleStore } = useStores();
  const [now, setNow] = useState(() => new Date());
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      clearInterval(t);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const engineReady = Boolean(mapEngineStore.engine);
  const vs = mapEngineStore.viewState;
  const click = mapEngineStore.lastClick;
  // Last map click, falling back to the live view center.
  const coordinate = click
    ? `${click.lat.toFixed(5)}, ${click.lng.toFixed(5)}`
    : vs
      ? `${vs.latitude.toFixed(5)}, ${vs.longitude.toFixed(5)}`
      : '—';

  const local = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const utc = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}`;

  return (
    <Box component="footer" sx={layout.statusBar}>
      <Cell
        label="Status"
        value={engineReady ? 'Ready' : 'Initializing…'}
        color={engineReady ? palette.ok : palette.warn}
      />
      <Cell label="Time" value={`${local} · ${utc} UTC`} />
      <Cell label="Coordinate" value={coordinate} />
      <Cell label="Engine" value={mapEngineLabel[mapEngineStore.selectedEngine]} />
      <Cell label="Basemap" value={mapStyleStore.baseMap.toUpperCase()} />
      <Cell label="System" value={online ? 'Online' : 'Offline'} color={online ? palette.ok : palette.danger} />
    </Box>
  );
}

export default observer(StatusBarImpl);
