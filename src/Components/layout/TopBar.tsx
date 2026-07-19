import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import RadarIcon from '@mui/icons-material/Radar';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../stores/StoreContext';
import { palette } from '../../styles/system-ui/tokens';
import * as layout from '../../styles/system-ui/layout.styles';

const pad = (n: number) => String(n).padStart(2, '0');

/** Top command bar: brand block + system status + theme switch + clock. */
function TopBarImpl() {
  const { mapEngineStore, themeStore, uiVisibilityStore: ui } = useStores();
  const engineReady = Boolean(mapEngineStore.engine);
  const isDark = themeStore.theme === 'dark';
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const local = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const utc = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}`;

  return (
    <Box component="header" sx={layout.topBar}>
      <Box sx={layout.brandMark}>
        <RadarIcon fontSize="small" />
      </Box>
      <Box>
        <Typography sx={layout.brandTitle}>Map Engine Orchestrator</Typography>
        <Typography sx={layout.brandSubtitle}>INTEGRATED OPERATIONS SYSTEM</Typography>
      </Box>

      <Box sx={{ flex: 1 }} />

      <Box sx={{ ...layout.topChip, color: engineReady ? palette.ok : palette.warn, border: 'none', bgcolor: 'transparent' }}>
        <Box sx={layout.statusDot(engineReady ? palette.ok : palette.warn)} />
        {engineReady ? 'System Operational' : 'Initializing'}
      </Box>

      <Tooltip title={ui.toolbarVisible ? 'Hide map toolbar' : 'Show map toolbar'} arrow>
        <IconButton
          size="small"
          onClick={() => ui.toggleToolbar()}
          aria-label={ui.toolbarVisible ? 'Hide map toolbar' : 'Show map toolbar'}
          sx={{ color: ui.toolbarVisible ? palette.accentBright : 'text.secondary' }}
        >
          <HandymanOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title={isDark ? 'Switch to light theme' : 'Switch to dark theme'} arrow>
        <IconButton
          size="small"
          onClick={() => themeStore.toggle()}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
        </IconButton>
      </Tooltip>

      <Box sx={layout.clockChip}>
        <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography sx={layout.clockTime}>{local}</Typography>
        <Typography sx={layout.clockUtc}>{utc} UTC</Typography>
      </Box>
    </Box>
  );
}

export default observer(TopBarImpl);
