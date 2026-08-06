import type { SxProps, Theme } from '@mui/material/styles';
import { palette, fonts } from '../../../Components/layout/styles/tokens';

/** Styles for the map feature: map frame, toolbar clusters, brightness card. */

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
  left: 12,
  zIndex: 1100,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 1,
  maxWidth: 'calc(100% - 110px)',
};

/** Coordinate readout chip overlaid on the map (bottom-center). */
export const coordChip: SxProps<Theme> = {
  position: 'absolute',
  bottom: 10,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1050,
  pointerEvents: 'none',
  px: 1.5,
  py: 0.4,
  borderRadius: 1,
  bgcolor: palette.overlay,
  border: `1px solid ${palette.border}`,
  backdropFilter: 'blur(4px)',
  fontFamily: fonts.mono,
  fontSize: 12,
  color: 'text.primary',
  whiteSpace: 'nowrap',
};

/** Row of bordered tool clusters (reference design groups). */
export const toolStrip: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 0.75,
};

/** One bordered cluster of icon buttons inside the toolbar. */
export const toolCluster: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.25,
  px: 0.5,
  py: 0.4,
  borderRadius: 1.5,
  bgcolor: palette.overlay,
  border: `1px solid ${palette.borderBright}`,
  backdropFilter: 'blur(4px)',
};

/** Always-visible brightness card under the toolbar. */
export const brightnessCard: SxProps<Theme> = {
  width: 220,
  px: 1.5,
  py: 1,
  borderRadius: 1.5,
  bgcolor: palette.overlay,
  border: `1px solid ${palette.borderBright}`,
  backdropFilter: 'blur(4px)',
};

export const brightnessHeader: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: 0.25,
};

// ── Map controls (compass + zoom/3D/fullscreen stack, top-right) ───────

export const mapControlsWrap: SxProps<Theme> = {
  position: 'absolute',
  top: 12,
  right: 12,
  zIndex: 1100,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 1,
};

/** Circular compass: N/E/S/W ring + needle that tracks the map bearing. */
export const compassCircle: SxProps<Theme> = {
  position: 'relative',
  width: 64,
  height: 64,
  borderRadius: '50%',
  bgcolor: palette.overlay,
  border: `1px solid ${palette.borderBright}`,
  backdropFilter: 'blur(4px)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
  '&:hover': { borderColor: palette.accent },
};

const compassLetterBase = {
  position: 'absolute' as const,
  fontSize: 9,
  fontWeight: 700,
  lineHeight: 1,
  color: 'text.secondary',
  pointerEvents: 'none' as const,
};

export const compassLetter: Record<'n' | 'e' | 's' | 'w', SxProps<Theme>> = {
  n: { ...compassLetterBase, top: 5, left: '50%', transform: 'translateX(-50%)', color: 'text.primary' },
  e: { ...compassLetterBase, right: 6, top: '50%', transform: 'translateY(-50%)' },
  s: { ...compassLetterBase, bottom: 5, left: '50%', transform: 'translateX(-50%)' },
  w: { ...compassLetterBase, left: 5, top: '50%', transform: 'translateY(-50%)' },
};

/** Vertical stack of square control buttons under the compass. */
export const controlStack: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0.5,
  borderRadius: 1.5,
  p: 0.5,
  bgcolor: palette.overlay,
  border: `1px solid ${palette.borderBright}`,
  backdropFilter: 'blur(4px)',
};

export const controlButton = (active = false): SxProps<Theme> => ({
  width: 30,
  height: 30,
  borderRadius: 1,
  fontSize: 11,
  fontWeight: 700,
  color: active ? palette.accentBright : 'text.primary',
  border: `1px solid ${active ? palette.accent : palette.border}`,
  bgcolor: active ? `color-mix(in srgb, ${palette.accent} 20%, transparent)` : 'transparent',
  '&:hover': { borderColor: palette.accent },
});
