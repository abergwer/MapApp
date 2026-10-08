import { useEffect, useRef, useState } from 'react';
import { observable, action } from 'mobx';
import { observer } from 'mobx-react-lite';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { createWebrtcViewer } from '../../../api/webrtcViewer';
import * as styles from './styles/video.styles';
import config from '../../../../config.json';

// Module-level so the tile and the window-header button (different React
// trees) share it without routing state through App. Starts muted —
// browsers block unmuted autoplay.
const videoMuted = observable.box(true);
const toggleVideoMuted = action(() => videoMuted.set(!videoMuted.get()));

/** Mute/unmute toggle for the video window header (see App's
 *  `floatHeaderAction`). Re-renders only itself and the video tile. */
export const VideoMuteButton = observer(function VideoMuteButton() {
  const muted = videoMuted.get();
  return (
    <Tooltip title={muted ? 'Unmute' : 'Mute'} arrow>
      <IconButton
        size="small"
        onClick={toggleVideoMuted}
        aria-label={muted ? 'Unmute video' : 'Mute video'}
      >
        {muted ? <VolumeOffIcon fontSize="inherit" /> : <VolumeUpIcon fontSize="inherit" />}
      </IconButton>
    </Tooltip>
  );
});

// --- Component ------------------------------------------------------------

interface MiniVideoProps {
  /** Optional close handler. When provided, a small "×" button is shown. */
  onClose?: () => void;
  /** Fill the parent height (floating window) instead of a fixed 4:3 tile. */
  fill?: boolean;
  /** Override the signaling server URL (defaults to config.VideoSignalingURL). */
  signalingUrl?: string;
}

/**
 * WebRTC video tile (fills the VIDEO FEED panel or the floating window).
 * All transport logic lives in `api/webrtcViewer` — this component just
 * attaches the produced stream to a `<video>` element and renders status /
 * error overlays.
 */
export default observer(function MiniVideo({
  onClose,
  fill = false,
  signalingUrl = config.VideoSignalingURL,
}: MiniVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'live'>('connecting');

  useEffect(() => {
    const viewer = createWebrtcViewer({
      signalingUrl,
      onTrack: (stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus('live');
      },
      onError: setError,
    });

    return () => {
      viewer.stop();
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [signalingUrl]);

  return (
    <Paper sx={styles.videoTile(fill)}>
      <Box
        component="video"
        ref={videoRef}
        autoPlay
        playsInline
        muted={videoMuted.get()}
        sx={styles.videoElement}
      />

      {status === 'live' && !error && <Box sx={styles.liveBadge}>Live</Box>}

      {(error || status === 'connecting') && (
        <Box sx={styles.videoOverlay}>
          <Typography
            variant="caption"
            sx={{ color: error ? 'error.light' : 'common.white' }}
          >
            {error ?? 'Connecting…'}
          </Typography>
        </Box>
      )}

      {onClose && (
        <IconButton
          size="small"
          onClick={onClose}
          aria-label="Close video"
          sx={(theme) => ({
            position: 'absolute',
            top: 4,
            right: 4,
            bgcolor: alpha(theme.palette.common.black, 0.45),
            color: 'common.white',
            '&:hover': { bgcolor: alpha(theme.palette.common.black, 0.65) },
          })}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      )}
    </Paper>
  );
});
