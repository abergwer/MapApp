/**
 * TypeScript bridge for MUI palette — values must stay in sync with tokens.css.
 * MUI palette requires literal colors (#, rgb, rgba); CSS vars break at createTheme().
 * For CSS modules and styleOverrides, prefer var(--app-*) from tokens.css.
 */
export const designTokens = {
  fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
  fontFamilyMono: "'JetBrains Mono', ui-monospace, Consolas, monospace",
  colors: {
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
  },
  shape: {
    borderRadius: 8,
  },
} as const;
