/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DESIGN SYSTEM HUB — start here for look & feel across the whole app
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Change order (top → down):
 *
 * 1) THIS FILE
 *    - `mode`: `'dark' | 'light'` for the entire shell (menus, panels, chrome)
 *
 * 2) `src/Components/styles/tokens.css`
 *    - THE visual source of truth: colors, type, space, radius, shadows
 *    - Light overrides live under `[data-app-theme='light']`
 *    - Feature CSS modules and MUI variants must use `var(--app-*)`
 *
 * 3) `src/Components/styles/mui/createAppTheme.ts`
 *    - Material component variants (Button, Chip, ListItem, Avatar, …)
 *    - Palette literals come from `designTokens.ts` (MUI can't read CSS vars
 *      in `palette`); everything else uses `var(--app-*)`
 *
 * 4) `src/Components/styles/mapVisualTokens.ts`
 *    - Deck.gl / map RGBA (can't use CSS variables) — keep in sync with tokens
 *
 * Rules:
 * - Prefer Material UI components + theme variants over one-off CSS.
 * - Feature `*.module.css` = layout/structure only; no hardcoded colors.
 * - Per-feature `*.config.ts` = labels, sizes, behavior — not brand colors.
 */

export type AppThemeMode = 'dark' | 'light';

export const designSystemConfig = {
  /**
   * Global chrome theme. Applied as `data-app-theme` on <html>
   * and passed into MUI `createAppTheme(mode)`.
   */
  mode: 'dark' as AppThemeMode,

  /** Human pointers — edit these files, not random components. */
  sources: {
    tokens: 'src/Components/styles/tokens.css',
    muiTheme: 'src/Components/styles/mui/createAppTheme.ts',
    muiPaletteBridge: 'src/Components/styles/designTokens.ts',
    mapVisuals: 'src/Components/styles/mapVisualTokens.ts',
  },
} as const;

export type DesignSystemConfig = typeof designSystemConfig;

/** @deprecated Prefer `designSystemConfig` — kept so existing imports keep working. */
export const appThemeConfig = {
  mode: designSystemConfig.mode,
} as const;
