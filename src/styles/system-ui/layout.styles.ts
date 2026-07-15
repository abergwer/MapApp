import type { SxProps, Theme } from '@mui/material/styles';
import { palette, fonts, microLabel } from './tokens';

/**
 * App-shell layout: full-viewport command-dashboard grid with a top bar,
 * side rails, the map in the center and a status strip at the bottom.
 */

/** Width of a rail when collapsed to an icon strip. */
const RAIL_COLLAPSED_W = '48px';
/** Left icon rail is always visible; the content column adds the rest. */
const LEFT_ICON_RAIL_W = 52;
const LEFT_CONTENT_W = 290;

export const appGrid = (leftCollapsed: boolean, rightCollapsed: boolean): SxProps<Theme> => ({
  height: '100svh',
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr) auto',
  gridTemplateColumns: `${
    leftCollapsed ? `${LEFT_ICON_RAIL_W}px` : `${LEFT_ICON_RAIL_W + LEFT_CONTENT_W}px`
  } minmax(0, 1fr) ${rightCollapsed ? RAIL_COLLAPSED_W : '320px'}`,
  gridTemplateAreas: `
    "top    top top"
    "left   map right"
    "status status status"
  `,
  bgcolor: 'background.default',
  overflow: 'hidden',
});

export const leftRail: SxProps<Theme> = {
  gridArea: 'left',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  p: 1,
  pr: 0,
  overflowY: 'auto',
};

export const rightRail: SxProps<Theme> = {
  gridArea: 'right',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  p: 1,
  pl: 0,
  overflowY: 'auto',
};

export const mapArea: SxProps<Theme> = {
  gridArea: 'map',
  position: 'relative',
  minWidth: 0,
  minHeight: 0,
  p: 1,
  display: 'flex',
};

/** Chevron row at the top of each rail (collapse/expand control). */
export const railToggleRow = (side: 'left' | 'right'): SxProps<Theme> => ({
  display: 'flex',
  justifyContent: side === 'left' ? 'flex-end' : 'flex-start',
  flexShrink: 0,
});

/** Vertical icon strip shown when a rail is collapsed. */
export const railIconStrip: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 0.5,
};

// ── Left icon-rail navigator ────────────────────────────────────────

export const leftNavRoot: SxProps<Theme> = {
  gridArea: 'left',
  minHeight: 0,
  display: 'flex',
  overflow: 'hidden',
};

export const iconRail: SxProps<Theme> = {
  width: 52,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 1,
  py: 1.5,
  borderRight: `1px solid ${palette.border}`,
};

/** Squared icon button with the blue border + glow when active (from the
 *  reference design). Also reused for the right rail's strip icons. */
export const railIcon = (active: boolean): SxProps<Theme> => ({
  width: 38,
  height: 38,
  borderRadius: 1.5,
  border: '1px solid transparent',
  color: 'text.secondary',
  ...(active && {
    color: palette.accentBright,
    border: `1px solid ${palette.accent}`,
    bgcolor: `color-mix(in srgb, ${palette.accent} 18%, transparent)`,
    boxShadow: `0 0 10px color-mix(in srgb, ${palette.accent} 50%, transparent)`,
  }),
});

export const navContent: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  p: 1.5,
  pt: 1,
};

export const navContentHeader: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 1,
  mb: 1,
};

export const viewTitle: SxProps<Theme> = {
  ...microLabel,
  fontSize: 14,
  color: 'text.primary',
  lineHeight: 1.3,
};

export const viewSubtitle: SxProps<Theme> = {
  fontSize: 12,
  color: 'text.secondary',
  lineHeight: 1.3,
};

/** Small squared collapse button («) at the top of the content column. */
export const navCollapseButton: SxProps<Theme> = {
  width: 30,
  height: 30,
  borderRadius: 1,
  border: `1px solid ${palette.border}`,
  bgcolor: palette.panel,
  flexShrink: 0,
};

// ── Top bar ────────────────────────────────────────────────────────────

export const topBar: SxProps<Theme> = {
  gridArea: 'top',
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  px: 2,
  py: 1,
  bgcolor: palette.panelHeader,
  borderBottom: `1px solid ${palette.border}`,
};

export const brandMark: SxProps<Theme> = {
  width: 34,
  height: 34,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 1,
  color: palette.accentBright,
  bgcolor: `color-mix(in srgb, ${palette.accent} 14%, transparent)`,
  border: `1px solid ${palette.borderBright}`,
};

export const brandTitle: SxProps<Theme> = {
  ...microLabel,
  fontSize: 15,
  color: 'text.primary',
  lineHeight: 1.2,
};

export const brandSubtitle: SxProps<Theme> = {
  fontSize: 11,
  color: 'text.secondary',
  lineHeight: 1.2,
};

/** Small bordered status chip; pass the dot color per state. */
export const topChip: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  px: 1.25,
  py: 0.5,
  borderRadius: 1,
  border: `1px solid ${palette.border}`,
  bgcolor: palette.panel,
  ...microLabel,
  fontSize: 10,
};

export const statusDot = (color: string): SxProps<Theme> => ({
  width: 7,
  height: 7,
  borderRadius: '50%',
  bgcolor: color,
  boxShadow: `0 0 6px ${color}`,
});

// ── Bottom status bar ──────────────────────────────────────────────────

export const statusBar: SxProps<Theme> = {
  gridArea: 'status',
  display: 'flex',
  alignItems: 'stretch',
  px: 1,
  bgcolor: palette.panelHeader,
  borderTop: `1px solid ${palette.border}`,
};

export const statusCell: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: 0.25,
  px: 2,
  py: 0.75,
  borderRight: `1px solid ${palette.border}`,
  '&:last-of-type': { borderRight: 'none' },
};

export const statusLabel: SxProps<Theme> = {
  ...microLabel,
  fontSize: 9,
  color: 'text.secondary',
};

export const statusValue: SxProps<Theme> = {
  fontFamily: fonts.mono,
  fontSize: 12,
  color: 'text.primary',
  whiteSpace: 'nowrap',
};
