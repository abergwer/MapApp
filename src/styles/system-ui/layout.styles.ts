import type { SxProps, Theme } from '@mui/material/styles';
import { palette, fonts, microLabel } from './tokens';

/**
 * App-shell layout: full-viewport command-dashboard grid with a top bar,
 * side rails, the map in the center and a status strip at the bottom.
 */

/** Width of a rail collapsed to just its arrow. */
const RAIL_COLLAPSED_W = '36px';
const LEFT_PANEL_W = '300px';
const RIGHT_DOCK_W = '620px';

export const appGrid = (leftCollapsed: boolean, rightCollapsed: boolean): SxProps<Theme> => ({
  height: '100svh',
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr) auto',
  gridTemplateColumns: `${leftCollapsed ? RAIL_COLLAPSED_W : LEFT_PANEL_W} minmax(0, 1fr) ${
    rightCollapsed ? RAIL_COLLAPSED_W : RIGHT_DOCK_W
  }`,
  gridTemplateAreas: `
    "top    top top"
    "left   map right"
    "status status status"
  `,
  bgcolor: 'background.default',
  overflow: 'hidden',
});

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

/** Collapsed rail: a thin column showing ONLY the expand arrow. */
export const collapsedRail = (side: 'left' | 'right'): SxProps<Theme> => ({
  gridArea: side,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  pt: 1,
  ...(side === 'left'
    ? { borderRight: `1px solid ${palette.border}` }
    : { borderLeft: `1px solid ${palette.border}` }),
});

// ── Left panel (tabbed) ──────────────────────────────────────────────

export const leftPanelRoot: SxProps<Theme> = {
  gridArea: 'left',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  borderRight: `1px solid ${palette.border}`,
  overflow: 'hidden',
};

/** Header row: view title left, pill tabs right (reference design). */
export const leftPanelHeader: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
  px: 1.5,
  py: 1,
  bgcolor: `color-mix(in srgb, ${palette.accent} 10%, ${palette.panelHeader})`,
  borderBottom: `1px solid ${palette.border}`,
};

export const leftPanelBody: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  p: 1.5,
};

/** Segmented pill tabs container. */
export const pillTabs: SxProps<Theme> = {
  display: 'flex',
  gap: 0.25,
  p: 0.25,
  borderRadius: 1,
  bgcolor: palette.bg,
  border: `1px solid ${palette.border}`,
};

export const pillTab = (active: boolean): SxProps<Theme> => ({
  px: 1,
  py: 0.4,
  borderRadius: 0.75,
  ...microLabel,
  fontSize: 9,
  cursor: 'pointer',
  color: active ? '#fff' : 'text.secondary',
  bgcolor: active ? palette.accent : 'transparent',
  '&:hover': { color: active ? '#fff' : 'text.primary' },
});

export const viewTitle: SxProps<Theme> = {
  ...microLabel,
  fontSize: 13,
  color: 'text.primary',
  lineHeight: 1.3,
};

/** Small squared collapse/expand arrow button. */
export const navCollapseButton: SxProps<Theme> = {
  width: 28,
  height: 28,
  borderRadius: 1,
  border: `1px solid ${palette.border}`,
  bgcolor: palette.panel,
  flexShrink: 0,
};

// ── Top bar clock chip ─────────────────────────────────────────────────

export const clockChip: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  px: 1.25,
  py: 0.5,
  borderRadius: 1,
  border: `1px solid ${palette.border}`,
  bgcolor: palette.panel,
};

export const clockTime: SxProps<Theme> = {
  fontFamily: fonts.mono,
  fontSize: 14,
  fontWeight: 700,
  color: 'text.primary',
};

export const clockUtc: SxProps<Theme> = {
  fontFamily: fonts.mono,
  fontSize: 10,
  color: 'text.secondary',
};

// ── Right dock (WORKSPACE) ─────────────────────────────────────────

export const dockRoot: SxProps<Theme> = {
  gridArea: 'right',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  borderLeft: `1px solid ${palette.border}`,
  overflow: 'hidden',
};

export const dockHeader: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  pl: 1.5,
  pr: 0.5,
  py: 0.25,
  borderBottom: `1px solid ${palette.border}`,
  ...microLabel,
  fontSize: 10,
  color: 'text.secondary',
};

/** 2-column panel grid like the reference workspace. */
export const dockGrid: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gridAutoRows: 'minmax(0, 1fr)',
  gap: 1,
  p: 1,
  overflowY: 'auto',
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
