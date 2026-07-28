import type { SxProps, Theme } from '@mui/material/styles';
import { palette, fonts, microLabel } from '../system-ui/tokens';

/** Styles for the 3D View feature (selected-missile attitude panel). */

export const canvasWrap = (fill: boolean): SxProps<Theme> => ({
  position: 'relative',
  width: 1,
  // Docked: fixed 4:3 tile. Floating: stretch to the window body.
  ...(fill ? { height: 1 } : { aspectRatio: '4 / 3' }),
  overflow: 'hidden',
  borderRadius: 0.5,
  bgcolor: palette.bg,
  border: `1px solid ${palette.border}`,
  // Drag horizontally to orbit the chase camera.
  cursor: 'grab',
  touchAction: 'none',
  userSelect: 'none',
  '&:active': { cursor: 'grabbing' },
});

export const canvas: SxProps<Theme> = {
  width: 1,
  height: 1,
  display: 'block',
  // Sky above the horizon: deck's canvas is transparent where no tiles are
  // drawn, so at high camera pitch this gradient reads as the sky band.
  background: 'linear-gradient(180deg, #79b8e8 0%, #a8cfe8 42%, #26405a 58%, #0a0e14 100%)',
};

/** Live telemetry readout overlaid on the 3D canvas. */
export const telemetry: SxProps<Theme> = {
  position: 'absolute',
  top: 8,
  left: 10,
  fontFamily: fonts.mono,
  fontSize: 10,
  lineHeight: 1.6,
  color: 'text.primary',
  pointerEvents: 'none',
  textShadow: '0 1px 3px rgba(0, 0, 0, 0.9)',
  whiteSpace: 'pre',
};

export const telemetryId: SxProps<Theme> = {
  fontFamily: fonts.mono,
  fontSize: 12,
  fontWeight: 700,
  color: palette.missile,
  lineHeight: 1.6,
};

// ── Chase view overlays (reference screenshot) ─────────────────────────

/** Top-left "MISSILE MSL-091" chip. */
export const chaseChip: SxProps<Theme> = {
  position: 'absolute',
  top: 8,
  left: 8,
  display: 'flex',
  alignItems: 'center',
  overflow: 'hidden',
  borderRadius: 1,
  border: `1px solid ${palette.borderBright}`,
  bgcolor: 'rgba(10, 14, 20, 0.85)',
  pointerEvents: 'none',
};

export const chaseChipBadge: SxProps<Theme> = {
  ...microLabel,
  fontSize: 9,
  px: 0.75,
  py: 0.4,
  color: '#fff',
  bgcolor: palette.accent,
};

export const chaseChipId: SxProps<Theme> = {
  fontFamily: fonts.mono,
  fontSize: 11,
  fontWeight: 700,
  px: 0.75,
  color: '#e6edf6',
};

/** Bottom telemetry bar: LAT · LNG · ALT · TRAIL. */
export const chaseBar: SxProps<Theme> = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
  px: 1.25,
  py: 0.6,
  bgcolor: 'rgba(10, 14, 20, 0.85)',
  borderTop: `1px solid ${palette.border}`,
  pointerEvents: 'none',
};

export const chaseBarCell: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 0.5,
  whiteSpace: 'nowrap',
};

export const chaseBarLabel: SxProps<Theme> = {
  ...microLabel,
  fontSize: 8.5,
  color: '#8294ab',
};

export const chaseBarValue: SxProps<Theme> = {
  fontFamily: fonts.mono,
  fontSize: 11,
  fontWeight: 700,
  color: '#e6edf6',
};

export const emptyState: SxProps<Theme> = {
  width: 1,
  aspectRatio: '4 / 3',
  display: 'grid',
  placeItems: 'center',
  border: `1px dashed ${palette.border}`,
  borderRadius: 0.5,
  ...microLabel,
  fontSize: 10,
  color: 'text.disabled',
};
