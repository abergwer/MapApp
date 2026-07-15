import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import RadarIcon from '@mui/icons-material/Radar';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { observer } from 'mobx-react-lite';
import { mapEngineLabel } from '../../map/mapConfig';
import { useStores } from '../../stores/StoreContext';
import { palette } from '../../styles/system-ui/tokens';
import * as layout from '../../styles/system-ui/layout.styles';

/** Top command bar: brand block + theme switch + live engine/system status chips. */
function TopBarImpl() {
  const { mapEngineStore, themeStore } = useStores();
  const engineReady = Boolean(mapEngineStore.engine);
  const isDark = themeStore.theme === 'dark';

  return (
    <Box component="header" sx={layout.topBar}>
      <Box sx={layout.brandMark}>
        <RadarIcon fontSize="small" />
      </Box>
      <Box>
        <Typography sx={layout.brandTitle}>MapApp</Typography>
        <Typography sx={layout.brandSubtitle}>Integrated Map Operations</Typography>
      </Box>

      <Box sx={{ flex: 1 }} />

      <Tooltip title={isDark ? 'Switch to light theme' : 'Switch to dark theme'} arrow>
        <IconButton
          size="small"
          onClick={() => themeStore.toggle()}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
      <Box sx={{ ...layout.topChip, color: 'text.secondary' }}>
        ENGINE&nbsp;
        <Box component="span" sx={{ color: 'text.primary' }}>
          {mapEngineLabel[mapEngineStore.selectedEngine]}
        </Box>
      </Box>
      <Box sx={{ ...layout.topChip, color: engineReady ? palette.ok : palette.warn }}>
        <Box sx={layout.statusDot(engineReady ? palette.ok : palette.warn)} />
        {engineReady ? 'System Operational' : 'Initializing'}
      </Box>
    </Box>
  );
}

export default observer(TopBarImpl);
