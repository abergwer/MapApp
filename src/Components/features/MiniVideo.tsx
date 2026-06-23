import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { createWebrtcViewer } from '../../api/webrtcViewer';
import config from '../../../config.json';

// --- Tunables -------------------------------------------------------------

/** Fixed thumbnail dimensions, in CSS pixels. Matches MiniMap proportions. */
const SIZE = { width: 200, height: 150 } as const;

// --- Component ------------------------------------------------------------

interface MiniVideoProps {
  /** Optional close handler. When provided, a small "×" button is shown. */
  onClose?: () => void;
  /** Override the signaling server URL (defaults to config.VideoSignalingURL). */
  signalingUrl?: string;
}

/**
 * Small WebRTC preview tile. All transport logic lives in
 * `api/webrtcViewer` — this component just attaches the produced stream
 * to a `<video>` element and renders status / error overlays.
 */
export default function MiniVideo({
  onClose,
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
    <Paper
      elevation={6}
      sx={{
        ...SIZE,
        position: 'relative',
        borderRadius: 1.5,
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
        bgcolor: 'common.black',
      }}
    >
      <Box
        component="video"
        ref={videoRef}
        autoPlay
        playsInline
        muted
        sx={{ width: 1, height: 1, objectFit: 'cover', display: 'block' }}
      />

      {(error || status === 'connecting') && (
        <Box
          sx={(theme) => ({
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 1.5,
            textAlign: 'center',
            bgcolor: alpha(theme.palette.common.black, 0.55),
          })}
        >
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
