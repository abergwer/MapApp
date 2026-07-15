import { useRef } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import PictureInPictureIcon from '@mui/icons-material/PictureInPicture';
import { observer } from 'mobx-react-lite';
import MissileView3D from './MissileView3D';
import { useStores } from '../../../stores/StoreContext';
import * as styles from '../../../styles/features/video.styles';

const MIN_W = 260;
const MIN_H = 220;

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));

/**
 * Floating 3D chase-view window over the map area: draggable by its header,
 * resizable by the bottom-right handle (same interaction model as the
 * floating video window). Position/size persist in UIVisibilityStore.
 */
function Floating3DWindowImpl() {
  const { uiVisibilityStore: ui } = useStores();
  const rootRef = useRef<HTMLDivElement>(null);

  /** Shared pointer-tracking for drag + resize (no external dependency). */
  const track = (
    e: React.PointerEvent,
    onDelta: (dx: number, dy: number, bounds: DOMRect) => void,
  ) => {
    e.preventDefault();
    const parent = rootRef.current?.parentElement;
    if (!parent) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const onMove = (ev: PointerEvent) =>
      onDelta(ev.clientX - startX, ev.clientY - startY, parent.getBoundingClientRect());
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const startDrag = (e: React.PointerEvent) => {
    const start = ui.view3dFloatRect;
    track(e, (dx, dy, bounds) => {
      ui.setView3dFloatRect({
        ...start,
        x: clamp(start.x + dx, 0, bounds.width - start.width),
        y: clamp(start.y + dy, 0, bounds.height - start.height),
      });
    });
  };

  const startResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    const start = ui.view3dFloatRect;
    track(e, (dx, dy, bounds) => {
      ui.setView3dFloatRect({
        ...start,
        width: clamp(start.width + dx, MIN_W, bounds.width - start.x),
        height: clamp(start.height + dy, MIN_H, bounds.height - start.y),
      });
    });
  };

  return (
    <Paper ref={rootRef} sx={styles.floatWindow(ui.view3dFloatRect)}>
      <Box sx={styles.floatHeader} onPointerDown={startDrag}>
        <Typography sx={styles.floatTitle}>3D View</Typography>
        <Box sx={{ display: 'flex' }} onPointerDown={(e) => e.stopPropagation()}>
          <Tooltip title="Dock to panel" arrow>
            <IconButton
              size="small"
              onClick={() => ui.setView3dMode('docked')}
              aria-label="Dock 3D view to panel"
            >
              <PictureInPictureIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={styles.floatBody}>
        <MissileView3D fill />
      </Box>

      <Box sx={styles.resizeHandle} onPointerDown={startResize} aria-label="Resize 3D window" />
    </Paper>
  );
}

export default observer(Floating3DWindowImpl);
