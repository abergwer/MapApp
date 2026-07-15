import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { createWebrtcViewer } from '../../api/webrtcViewer';
import * as styles from '../../styles/features/video.styles';
import config from '../../../config.json';

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
export default function MiniVideo({
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
        muted
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
}
