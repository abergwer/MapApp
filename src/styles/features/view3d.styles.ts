import type { SxProps, Theme } from '@mui/material/styles';
import { palette, fonts, microLabel } from '../system-ui/tokens';

/** Styles for the 3D View feature (selected-missile attitude panel). */

export const canvasWrap: SxProps<Theme> = {
  position: 'relative',
  width: 1,
  aspectRatio: '4 / 3',
  overflow: 'hidden',
  borderRadius: 0.5,
  bgcolor: palette.bg,
  border: `1px solid ${palette.border}`,
};

export const canvas: SxProps<Theme> = {
  width: 1,
  height: 1,
  display: 'block',
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
