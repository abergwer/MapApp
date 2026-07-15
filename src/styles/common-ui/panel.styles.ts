import type { SxProps, Theme } from '@mui/material/styles';
import { palette, microLabel } from '../system-ui/tokens';

/**
 * Shared building blocks reused by every feature: the bordered side-rail
 * panel (header + body) and the icon-button styling used by the floating
 * map tool strip.
 */

export const panelRoot: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
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
