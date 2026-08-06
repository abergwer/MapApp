/**
 * Design tokens — the single source of truth for the app's look.
 *
 * Two switchable themes share the same token keys:
 *  - 'dark'  — "Night Ops": near-black navy surfaces (the reference design)
 *  - 'light' — "Day Ops": bright steel surfaces with the same accents
 *
 * The `palette` export used by all sx/style files maps each token to a CSS
 * variable (`var(--ma-*)`). The active theme (see `theme.ts`) injects the
 * actual values on `:root`, so every style updates live when the user
 * switches themes — no style file needs to know about theming.
 *
 * deck.gl canvas symbology can't read CSS variables — it uses the raw hex
 * values from `symbology` (kept theme-independent so entity colors always
 * mean the same thing).
 */

const darkPalette = {
  // Surfaces
  bg: '#0a0e14',
  panel: '#101722',
  panelHeader: '#0c1119',
  overlay: 'rgba(13, 18, 26, 0.92)',

  // Lines
  border: '#1d2938',
  borderBright: '#2e415c',

  // Text
  textPrimary: '#d9e2ee',
  textSecondary: '#8294ab',
  textDisabled: '#55657a',

  // Brand / interaction accent (command blue)
  accent: '#3b82f6',
  accentBright: '#6db1ff',

  // Domain accents (entity symbology + status)
  aircraft: '#4da3ff',
  drone: '#22d3ee',
  missile: '#ff4d4d',
  area: '#b06cf7',
  ok: '#33d17a',
  warn: '#f5b043',
  danger: '#ff4d4d',
} as const;

const lightPalette: Palette = {
  // Surfaces
  bg: '#dde3ec',
  panel: '#f2f5f9',
  panelHeader: '#e3e9f1',
  overlay: 'rgba(242, 245, 249, 0.92)',

  // Lines
  border: '#c2cdda',
  borderBright: '#9fb0c6',

  // Text
  textPrimary: '#1b2634',
  textSecondary: '#54677e',
  textDisabled: '#8b9aac',

  // Brand / interaction accent (command blue)
  accent: '#2563eb',
  accentBright: '#1d4ed8',

  // Domain accents (entity symbology + status)
  aircraft: '#1d6fd8',
  drone: '#0891b2',
  missile: '#dc2626',
  area: '#7c3aed',
  ok: '#15803d',
  warn: '#b45309',
  danger: '#dc2626',
};

export type Palette = { -readonly [K in keyof typeof darkPalette]: string };
export type ThemeName = 'dark' | 'light';

export const PALETTES: Record<ThemeName, Palette> = {
  dark: darkPalette,
  light: lightPalette,
};

/** Raw hex tokens for canvas renderers (deck.gl layers / meshes) — CSS
 *  variables don't work there. Theme-independent by design. */
export const symbology: Palette = darkPalette;

/** CSS custom-property declarations for a theme, injected on `:root`. */
export const cssVars = (name: ThemeName): Record<string, string> =>
  Object.fromEntries(
    Object.entries(PALETTES[name]).map(([key, value]) => [`--ma-${key}`, value]),
  );

/**
 * The palette every style file consumes: each token resolves through the
 * active theme's CSS variable, so styles react to theme switches for free.
 */
export const palette: Palette = Object.fromEntries(
  Object.keys(darkPalette).map((key) => [key, `var(--ma-${key})`]),
) as Palette;

export const fonts = {
  ui: "'Segoe UI', system-ui, Roboto, Helvetica, Arial, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, Consolas, 'Courier New', monospace",
} as const;

export const radii = {
  panel: 4,
  control: 4,
} as const;

/** Uppercase micro-label used for panel headers / status-bar captions. */
export const microLabel = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
} as const;

export type Rgba = [number, number, number, number];

/** Convert a `#rrggbb` token into a deck.gl RGBA tuple. */
export function hexToRgba(hex: string, alpha = 255): Rgba {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff, alpha];
}
