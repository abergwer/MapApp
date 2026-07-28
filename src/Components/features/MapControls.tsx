import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../stores/StoreContext';
import { useMapContext } from '../../map/MapContext';
import * as styles from '../../styles/features/map.styles';

const TILT_PITCH = 60;

/**
 * Custom map navigation (reference design, top-right): compass whose needle
 * tracks the map bearing (click = reset north) and a control stack with
 * zoom in/out, 3D tilt toggle, and fullscreen. Uses the optional MapEngine
 * camera methods; buttons disable when the engine doesn't support them.
 */
function MapControlsImpl() {
  const { mapEngineStore } = useStores();
  const { containerRef } = useMapContext();
  const engine = mapEngineStore.engine;
  const bearing = mapEngineStore.viewState?.bearing ?? 0;
  const pitch = mapEngineStore.viewState?.pitch ?? 0;
  const tilted = pitch > 5;

  const toggleFullscreen = () => {
    const frame = containerRef.current?.parentElement;
    if (!frame) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frame.requestFullscreen();
  };

  return (
    <Box sx={styles.mapControlsWrap}>
      <Tooltip title="Reset north" arrow placement="left">
        <Box
          sx={styles.compassCircle}
          onClick={() => engine?.setBearing?.(0)}
          role="button"
          aria-label="Reset north"
        >
          <Typography sx={styles.compassLetter.n}>N</Typography>
          <Typography sx={styles.compassLetter.e}>E</Typography>
          <Typography sx={styles.compassLetter.s}>S</Typography>
          <Typography sx={styles.compassLetter.w}>W</Typography>
          <Box
            component="svg"
            viewBox="0 0 24 24"
            sx={{ width: 26, height: 26, transform: `rotate(${-bearing}deg)` }}
          >
            <polygon points="12,3 15,12 9,12" fill="#e04f4f" />
            <polygon points="12,21 15,12 9,12" fill="#8ab8e8" />
          </Box>
        </Box>
      </Tooltip>

      <Paper sx={styles.controlStack}>
        <Tooltip title="Zoom in" arrow placement="left">
          <IconButton
            size="small"
            sx={styles.controlButton()}
            onClick={() => engine?.zoomBy?.(1)}
            aria-label="Zoom in"
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom out" arrow placement="left">
          <IconButton
            size="small"
            sx={styles.controlButton()}
            onClick={() => engine?.zoomBy?.(-1)}
            aria-label="Zoom out"
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={tilted ? 'Reset tilt' : '3D tilt'} arrow placement="left">
          <IconButton
            size="small"
            sx={styles.controlButton(tilted)}
            onClick={() => engine?.setPitch?.(tilted ? 0 : TILT_PITCH)}
            aria-label={tilted ? 'Reset tilt' : '3D tilt'}
          >
            3D
          </IconButton>
        </Tooltip>
        <Tooltip title="Fullscreen map" arrow placement="left">
          <IconButton
            size="small"
            sx={styles.controlButton(Boolean(document.fullscreenElement))}
            onClick={toggleFullscreen}
            aria-label="Fullscreen map"
          >
            {document.fullscreenElement ? (
              <FullscreenExitIcon fontSize="small" />
            ) : (
              <FullscreenIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Paper>
    </Box>
  );
}

export default observer(MapControlsImpl);
