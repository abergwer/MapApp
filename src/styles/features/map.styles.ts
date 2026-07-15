import type { SxProps, Theme } from '@mui/material/styles';
import { palette } from '../system-ui/tokens';

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
