import type { SxProps, Theme } from '@mui/material/styles';
import { palette, microLabel } from '../../layout/styles/tokens';

/**
 * Shared building blocks reused by every feature: the bordered side-rail
 * panel (header + body) and the icon-button styling used by the floating
 * map tool strip.
 */

export const panelRoot: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  // Fill the dock grid cell so every section uses all the space it has.
  height: 1,
  minHeight: 0,
};

export const panelHeader: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
  px: 1.5,
  py: 0.75,
  bgcolor: palette.panelHeader,
  borderBottom: `1px solid ${palette.border}`,
};

export const panelTitle: SxProps<Theme> = {
  ...microLabel,
  color: 'text.primary',
};

export const panelBody: SxProps<Theme> = {
  p: 1,
  minHeight: 0,
  // Stretch the content to the full section height (single-child bodies).
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  '& > *': { flex: 1, minHeight: 0 },
};

/** Icon button inside a tool strip; highlighted while its tool is active.
 *  `color-mix` instead of MUI `alpha()` because the token is a CSS var. */
export const toolButton = (active: boolean): SxProps<Theme> => ({
  borderRadius: 0.75,
  p: 0.75,
  ...(active && {
    color: palette.accentBright,
    bgcolor: `color-mix(in srgb, ${palette.accent} 22%, transparent)`,
    '&:hover': { bgcolor: `color-mix(in srgb, ${palette.accent} 30%, transparent)` },
  }),
});

// ── Section card (collapsible content block inside a nav view) ─────────

export const sectionCard: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: 1.5,
  mb: 1.5,
};

export const sectionHeader: SxProps<Theme> = {
  px: 1.5,
  py: 0.75,
  bgcolor: palette.panelHeader,
  borderBottom: `1px solid ${palette.border}`,
  ...microLabel,
  fontSize: 10,
  // Reference design: section titles glow in the accent color.
  color: palette.accentBright,
  textShadow: `0 0 8px color-mix(in srgb, ${palette.accent} 80%, transparent)`,
};

/** Centered chevron row that expands/collapses the section body. */
export const sectionChevron: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'center',
  py: 0,
};

export const sectionBody: SxProps<Theme> = {
  px: 1,
  pb: 1,
};

// ── Large selectable tool card (Distance/Area, map type, view toggles) ─

export const toolCard = (selected: boolean): SxProps<Theme> => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 0.5,
  px: 1,
  py: 1.25,
  borderRadius: 1.5,
  cursor: 'pointer',
  textTransform: 'none',
  fontSize: 12,
  fontWeight: 600,
  color: 'text.primary',
  // Reference design: card icons + labels glow.
  textShadow: '0 0 8px rgba(255, 255, 255, 0.35)',
  '& svg': {
    color: palette.accent,
    filter: `drop-shadow(0 0 5px color-mix(in srgb, ${palette.accent} 75%, transparent))`,
  },
  bgcolor: palette.panel,
  border: `1px solid ${palette.border}`,
  '&:hover': { borderColor: palette.borderBright },
  ...(selected && {
    color: palette.accentBright,
    bgcolor: `color-mix(in srgb, ${palette.accent} 22%, ${palette.panel})`,
    border: `1px solid ${palette.accent}`,
    boxShadow: `0 0 10px color-mix(in srgb, ${palette.accent} 45%, transparent)`,
    '&:hover': { borderColor: palette.accentBright },
  }),
  '&.Mui-disabled': { opacity: 0.45 },
});

/** Muted sub-caption inside a tool card. */
export const toolCardCaption: SxProps<Theme> = {
  fontSize: 11,
  fontStyle: 'italic',
  fontWeight: 400,
  color: 'text.secondary',
};

/** Full-width red action (Clear buttons). */
export const dangerButton: SxProps<Theme> = {
  width: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 0.75,
  py: 0.75,
  borderRadius: 1.5,
  textTransform: 'none',
  fontSize: 13,
  color: palette.danger,
  bgcolor: `color-mix(in srgb, ${palette.danger} 8%, transparent)`,
  border: `1px solid color-mix(in srgb, ${palette.danger} 45%, transparent)`,
  '&:hover': { bgcolor: `color-mix(in srgb, ${palette.danger} 16%, transparent)` },
};

/** Label + control row (switch rows, slider rows). */
export const controlRow: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
  px: 0.5,
  py: 0.5,
};
