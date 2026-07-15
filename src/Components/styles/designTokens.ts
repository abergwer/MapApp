/**
 * TypeScript bridge for MUI palette — values must stay in sync with tokens.css.
 * MUI palette requires literal colors (#, rgb, rgba); CSS vars break at createTheme().
 * For CSS modules and styleOverrides, prefer var(--app-*) from tokens.css.
 */
import type { AppThemeMode } from '../../config/appTheme.config';

const darkColors = {
  bgApp: '#0f1115',
  bgSurface: 'rgba(20, 24, 32, 0.95)',
  bgSurfaceHover: 'rgba(35, 40, 50, 0.95)',
  borderDefault: 'rgba(255, 255, 255, 0.08)',
  primary: '#2f8cff',
  primaryMui: '#2563eb',
  danger: '#f87171',
  live: '#34d399',
  textPrimary: '#f8fafc',
  textMuted: 'rgba(203, 213, 225, 0.62)',
} as const;

const lightColors = {
  bgApp: '#dce3ee',
  bgSurface: '#ffffff',
  bgSurfaceHover: '#f3f6fa',
  borderDefault: '#d5dee9',
  primary: '#1d4ed8',
  primaryMui: '#1d4ed8',
  danger: '#dc2626',
  live: '#047857',
  textPrimary: '#152033',
  textMuted: '#5b6b82',
} as const;

export function getDesignTokens(mode: AppThemeMode = 'dark') {
  return {
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
    fontFamilyMono: "'JetBrains Mono', ui-monospace, Consolas, monospace",
    colors: mode === 'light' ? lightColors : darkColors,
    shape: {
      borderRadius: 8,
    },
  } as const;
}

/** @deprecated Prefer getDesignTokens(designSystemConfig.mode) */
export const designTokens = getDesignTokens('dark');
