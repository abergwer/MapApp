import type { SxProps, Theme } from '@mui/material/styles';
import { palette, fonts } from '../system-ui/tokens';

/** Styles for the map feature: map frame, floating tool strip, coords chip. */

export const mapFrame: SxProps<Theme> = {
  position: 'relative',
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  borderRadius: 1,
  overflow: 'hidden',
  border: `1px solid ${palette.border}`,
  display: 'flex',
};

/**
 * The engine container. Sized with width/height (NOT absolute inset) because
 * map engines override `position` on this element.
 */
export const engineContainer: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
};

export const toolStripWrap: SxProps<Theme> = {
  position: 'absolute',
  top: 10,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1100,
  // Shrink-wrap to content: with `left: 50%` the box would otherwise cap at
  // half the map width and wrap early.
  width: 'max-content',
  maxWidth: 'calc(100% - 110px)',
};

export const toolStrip: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 0.5,
  px: 0.75,
  py: 0.5,
  bgcolor: palette.overlay,
  backdropFilter: 'blur(4px)',
};

export const toolStripDivider: SxProps<Theme> = {
  mx: 0.5,
  my: 0.5,
  alignSelf: 'stretch',
};

export const coordsWrap: SxProps<Theme> = {
  position: 'absolute',
  bottom: 12,
  left: 12,
  zIndex: 1100,
};

export const coordsChip: SxProps<Theme> = {
  px: 1.5,
  py: 0.75,
  fontFamily: fonts.mono,
  fontSize: '0.75rem',
  letterSpacing: '0.02em',
  bgcolor: palette.overlay,
  pointerEvents: 'none',
  userSelect: 'none',
  width: 'fit-content',
};

/** Popover body for the brightness slider. */
export const brightnessPopover: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  px: 2,
  py: 1,
  width: 220,
};
