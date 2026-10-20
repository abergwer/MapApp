import type { SxProps, Theme } from '@mui/material/styles';
import { palette, fonts, microLabel, glass, glassBar } from './tokens';

/**
 * App-shell layout: full-viewport command-dashboard grid with a top bar,
 * side rails, the map in the center and a status strip at the bottom.
 */

/** Width of a rail collapsed to just its arrow. */
const RAIL_COLLAPSED_W = '36px';
/** Permanent left icon rail width. */
const LEFT_RAIL_W = 44;
/** Default right dock width; live value comes from UIVisibilityStore. */
export const RIGHT_DOCK_DEFAULT_W = 620;
/** The map never gives up more than this to the side columns. */
const MIN_MAP_W = 480;
/** Narrowest the open dock may be squeezed to on small windows. */
const DOCK_MIN_W = 220;

export const appGrid = (
  leftCollapsed: boolean,
  rightCollapsed: boolean,
  rightWidth: number = RIGHT_DOCK_DEFAULT_W,
): SxProps<Theme> => {
  const leftPx = leftCollapsed ? LEFT_RAIL_W : LEFT_RAIL_W + 300;
  // On small windows the stored dock width can swallow the whole map
  // (e.g. 1024px window: 344 + 620 left a 42px map sliver) — cap the dock
  // column so the map keeps MIN_MAP_W before the dock starts shrinking.
  const rightCol = rightCollapsed
    ? RAIL_COLLAPSED_W
    : `clamp(${DOCK_MIN_W}px, calc(100vw - ${leftPx}px - ${MIN_MAP_W}px), ${rightWidth}px)`;
  return {
    height: '100svh',
    display: 'grid',
    gridTemplateRows: 'auto minmax(0, 1fr)',
    gridTemplateColumns: `${leftPx}px minmax(0, 1fr) ${rightCol}`,
    gridTemplateAreas: `
    "top    top top"
    "left   map right"
  `,
    bgcolor: 'background.default',
    // Ambient accent glows behind the glass surfaces so the blur has
    // something to pick up (otherwise frosted panels read as flat).
    backgroundImage: `
      radial-gradient(900px 500px at 8% -10%, ${glass.tint(22)}, transparent 70%),
      radial-gradient(700px 420px at 100% 110%, ${glass.tint(14)}, transparent 70%)
    `,
    overflow: 'hidden',
  };
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

/** Collapsed rail: a thin column showing ONLY the expand arrow. */
export const collapsedRail = (side: 'left' | 'right'): SxProps<Theme> => ({
  gridArea: side,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 0.75,
  pt: 1,
  ...glassBar,
  ...(side === 'left'
    ? { borderRight: `1px solid ${glass.line}` }
    : { borderLeft: `1px solid ${glass.line}` }),
});

/** View icon inside the collapsed left rail (reference design): the active
 *  view glows in the accent color. */
export const railIcon = (active: boolean): SxProps<Theme> => ({
  width: 30,
  height: 30,
  borderRadius: 1,
  color: active ? palette.accentBright : 'text.secondary',
  ...(active && {
    bgcolor: `color-mix(in srgb, ${palette.accent} 18%, transparent)`,
    '& svg': {
      filter: `drop-shadow(0 0 6px color-mix(in srgb, ${palette.accent} 80%, transparent))`,
    },
  }),
  '&:hover': { color: active ? palette.accentBright : 'text.primary' },
});

// ── Left panel (tabbed) ──────────────────────────────────────────────

export const leftPanelRoot: SxProps<Theme> = {
  gridArea: 'left',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'row',
  ...glassBar,
  borderRight: `1px solid ${glass.line}`,
  overflow: 'hidden',
};

/** Permanent vertical icon rail (reference design): one icon per view,
 *  always visible; icons select the view / toggle the content column. */
export const leftIconRail: SxProps<Theme> = {
  width: 44,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 1.75,
  pt: 1,
  borderRight: `1px solid ${glass.line}`,
  bgcolor: glass.bgHeader,
};

/** Content column next to the rail (hidden while collapsed). */
export const leftPanelContent: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
};

/** Header row: active view title (reference design). */
export const leftPanelHeader: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
  px: 1.5,
  py: 1,
  bgcolor: glass.tint(8),
  borderBottom: `1px solid ${glass.line}`,
};

export const leftPanelBody: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  p: 1.5,
};

export const viewTitle: SxProps<Theme> = {
  ...microLabel,
  fontSize: 13,
  color: 'text.primary',
  lineHeight: 1.3,
  // Reference design: the active view title glows softly.
  textShadow: `0 0 10px color-mix(in srgb, ${palette.accent} 70%, transparent)`,
};

/** Small squared collapse/expand arrow button. */
export const navCollapseButton: SxProps<Theme> = {
  width: 28,
  height: 28,
  borderRadius: 1.5,
  border: `1px solid ${glass.line}`,
  bgcolor: `color-mix(in srgb, ${palette.textPrimary} 5%, transparent)`,
  flexShrink: 0,
  '&:hover': { borderColor: glass.lineBright },
};

// ── Top bar clock chip ─────────────────────────────────────────────────

export const clockChip: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  px: 1.25,
  py: 0.5,
  borderRadius: 99,
  border: `1px solid ${glass.line}`,
  bgcolor: `color-mix(in srgb, ${palette.textPrimary} 5%, transparent)`,
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
  ...glassBar,
  borderLeft: `1px solid ${glass.line}`,
  overflow: 'hidden',
  position: 'relative',
};

/** Invisible grab strip on the dock's left edge (drag = resize width). */
export const dockResizeHandle: SxProps<Theme> = {
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: 6,
  cursor: 'col-resize',
  touchAction: 'none',
  zIndex: 10,
  '&:hover': { bgcolor: `color-mix(in srgb, ${palette.accent} 35%, transparent)` },
};

export const dockHeader: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  pl: 1.5,
  pr: 0.5,
  py: 0.25,
  borderBottom: `1px solid ${glass.line}`,
  bgcolor: glass.bgHeader,
  ...microLabel,
  fontSize: 10,
  color: 'text.secondary',
};

/** Panel grid like the reference workspace: single column with ≤2 docked
 *  panels (2 panels stack half height each; the dock also shrinks — see
 *  LayoutManager's effective width), 2 columns for 3+. */
export const dockGrid = (singleColumn: boolean): SxProps<Theme> => ({
  flex: 1,
  minHeight: 0,
  display: 'grid',
  gridTemplateColumns: singleColumn ? '1fr' : '1fr 1fr',
  gridAutoRows: 'minmax(0, 1fr)',
  gap: 1,
  p: 1,
  overflowY: 'auto',
});

// ── Top bar ────────────────────────────────────────────────────────────

export const topBar: SxProps<Theme> = {
  gridArea: 'top',
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  px: 2,
  py: 1,
  ...glassBar,
  borderBottom: `1px solid ${glass.line}`,
  boxShadow: `0 1px 0 ${glass.lineBright} inset`,
  position: 'relative',
  zIndex: 2,
};

export const brandMark: SxProps<Theme> = {
  width: 34,
  height: 34,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 2,
  color: '#fff',
  backgroundImage: `linear-gradient(135deg, ${palette.accentBright}, ${palette.accent})`,
  boxShadow: `0 6px 18px -6px ${glass.tint(80)}`,
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
  borderRadius: 99,
  border: `1px solid ${glass.line}`,
  bgcolor: `color-mix(in srgb, ${palette.textPrimary} 5%, transparent)`,
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
  ...glassBar,
  borderTop: `1px solid ${glass.line}`,
};

export const statusCell: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: 0.25,
  px: 2,
  py: 0.75,
  borderRight: `1px solid ${glass.line}`,
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
