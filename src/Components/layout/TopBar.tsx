import { Fragment, useEffect, useState, type ReactNode } from 'react';
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
import { palette } from './styles/tokens';
import * as layout from './styles/layout.styles';

const pad = (n: number) => String(n).padStart(2, '0');

/** One top-bar entry. The host declares the full item list (see App.tsx);
 *  the bar itself renders whatever it's given, in order. */
export interface TopBarItem {
  id: string;
  /** 'start' renders before the flexible spacer; default 'end'. */
  align?: 'start' | 'end';
  node: ReactNode;
}

interface TopBarProps {
  items: TopBarItem[];
}

// ── Ready-made items (compose these into the `items` prop) ─────────────────

/** Brand block: logo mark + product title/subtitle. */
export function TopBarBrand({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <Box sx={layout.brandMark}>
        <RadarIcon fontSize="small" />
      </Box>
      <Box>
        <Typography sx={layout.brandTitle}>{title}</Typography>
        <Typography sx={layout.brandSubtitle}>{subtitle}</Typography>
      </Box>
    </>
  );
}

/** Engine-readiness chip. */
export const SystemStatusChip = observer(function SystemStatusChip() {
  const { mapEngineStore } = useStores();
  const engineReady = Boolean(mapEngineStore.engine);
  return (
    <Box sx={{ ...layout.topChip, color: engineReady ? palette.ok : palette.warn, border: 'none', bgcolor: 'transparent' }}>
      <Box sx={layout.statusDot(engineReady ? palette.ok : palette.warn)} />
      {engineReady ? 'System Operational' : 'Initializing'}
    </Box>
  );
});

/** Shows/hides the map's floating tool strip. */
export const ToolbarToggleButton = observer(function ToolbarToggleButton() {
  const { uiVisibilityStore: ui } = useStores();
  return (
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
  );
});

/** Dark/light theme switch. */
export const ThemeToggleButton = observer(function ThemeToggleButton() {
  const { themeStore } = useStores();
  const isDark = themeStore.theme === 'dark';
  return (
    <Tooltip title={isDark ? 'Switch to light theme' : 'Switch to dark theme'} arrow>
      <IconButton
        size="small"
        onClick={() => themeStore.toggle()}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
});

/** Local + UTC clock chip (owns its own 1 s tick). */
export function TopBarClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const local = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const utc = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}`;

  return (
    <Box sx={layout.clockChip}>
      <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
      <Typography sx={layout.clockTime}>{local}</Typography>
      <Typography sx={layout.clockUtc}>{utc} UTC</Typography>
    </Box>
  );
}

/** Top command bar: renders the host-declared items around a spacer. */
function TopBarImpl({ items }: TopBarProps) {
  const start = items.filter((i) => i.align === 'start');
  const end = items.filter((i) => i.align !== 'start');
  return (
    <Box component="header" sx={layout.topBar}>
      {start.map((i) => (
        <Fragment key={i.id}>{i.node}</Fragment>
      ))}
      <Box sx={{ flex: 1 }} />
      {end.map((i) => (
        <Fragment key={i.id}>{i.node}</Fragment>
      ))}
    </Box>
  );
}

export default TopBarImpl;
