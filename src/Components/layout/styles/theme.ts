import { createTheme, alpha } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import { PALETTES, cssVars, fonts, radii, type ThemeName } from './tokens';

/**
 * MUI theme factory, built entirely from the design tokens of the given
 * theme name. Also injects the `--ma-*` CSS variables on `:root` (via
 * CssBaseline) so every sx/style file that reads `tokens.palette` follows
 * the active theme automatically.
 *
 * Components should not hardcode colors — they read from the theme palette
 * or from the sx factories in `styles/common-ui` / `styles/features`.
 */
export function buildTheme(name: ThemeName): Theme {
  const p = PALETTES[name];

  return createTheme({
    palette: {
      mode: name,
      primary: { main: p.accent, light: p.accentBright },
      success: { main: p.ok },
      warning: { main: p.warn },
      error: { main: p.danger },
      background: {
        default: p.bg,
        paper: p.panel,
      },
      text: {
        primary: p.textPrimary,
        secondary: p.textSecondary,
        disabled: p.textDisabled,
      },
      divider: p.border,
    },
    shape: { borderRadius: radii.panel },
    typography: {
      fontFamily: fonts.ui,
      caption: { letterSpacing: '0.03em' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': cssVars(name),
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${p.border}`,
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { textTransform: 'none' },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: radii.control,
            color: p.textSecondary,
            '&:hover': {
              color: p.textPrimary,
              backgroundColor: alpha(p.accent, 0.12),
            },
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            color: p.textSecondary,
            border: `1px solid ${p.border}`,
            '&.Mui-selected': {
              color: p.accentBright,
              backgroundColor: alpha(p.accent, 0.18),
            },
          },
        },
      },
      MuiCheckbox: {
        defaultProps: { size: 'small', disableRipple: true },
        styleOverrides: {
          root: {
            color: p.textSecondary,
            padding: 4,
            '&.Mui-checked': { color: p.accent },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: p.panelHeader,
            color: p.textPrimary,
            border: `1px solid ${p.border}`,
            fontSize: 11,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: { minWidth: 200, backgroundColor: p.panel },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: { color: 'inherit' },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: p.border },
        },
      },
    },
  });
}

/** Prebuilt theme per name — stable references for the ThemeProvider. */
export const THEMES: Record<ThemeName, Theme> = {
  dark: buildTheme('dark'),
  light: buildTheme('light'),
};
