import { createTheme } from '@mui/material/styles';
import type { AppThemeMode } from '../../../config/appTheme.config';
import { getDesignTokens } from '../designTokens';

/**
 * Central MUI theme — component variants live here.
 * Hub: `src/config/designSystem.config.ts`
 * Visual tokens: `tokens.css` via `var(--app-*)`
 * Palette literals: `designTokens.ts` (MUI cannot parse CSS vars in palette)
 */
export function createAppTheme(mode: AppThemeMode = 'dark') {
  const { colors, shape } = getDesignTokens(mode);

  return createTheme({
    palette: {
      mode,
      primary: { main: colors.primaryMui },
      error: { main: colors.danger },
      success: { main: colors.live },
      background: {
        default: colors.bgApp,
        paper: colors.bgSurface,
      },
      text: {
        primary: colors.textPrimary,
        secondary: colors.textMuted,
      },
    },
    shape: { borderRadius: shape.borderRadius },
    typography: {
      fontFamily: 'var(--app-font-family)',
      panelTitle: {
        fontSize: 'var(--app-font-size-xs)',
        fontWeight: 'var(--app-font-weight-bold)',
        letterSpacing: 'var(--app-letter-spacing-panel-title)',
        color: 'var(--app-color-text-primary)',
        textTransform: 'uppercase',
      },
      panelSubtitle: {
        fontSize: 'var(--app-font-size-xs)',
        color: 'var(--app-color-text-muted)',
      },
      sectionTitle: {
        fontSize: 'var(--app-font-size-tiny)',
        fontWeight: 'var(--app-font-weight-bold)',
        letterSpacing: 'var(--app-letter-spacing-section-title)',
        textTransform: 'uppercase',
        color: 'var(--app-color-sidebar-accent, var(--app-color-text-muted))',
        textShadow: 'var(--app-color-sidebar-title-glow)',
      },
      toolTileLabel: {
        fontSize: 'var(--app-font-size-xs)',
        fontWeight: 500,
        lineHeight: 1.15,
        letterSpacing: '0.01em',
        textAlign: 'center',
      },
      mutedCaption: {
        fontSize: 'var(--app-font-size-label)',
        color: 'var(--app-color-text-muted)',
        fontStyle: 'italic',
      },
      entityCategoryName: {
        fontSize: 'var(--app-font-size-label)',
        fontWeight: 500,
        flex: 1,
      },
      entityItem: {
        fontSize: 'var(--app-font-size-xs)',
        color: 'var(--app-color-text-muted)',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontFamily: 'var(--app-font-family)',
            fontSize: 'var(--app-font-size-sm)',
            color: 'var(--app-color-text-primary)',
            backgroundColor: 'var(--app-color-bg-app)',
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
        variants: [
          {
            props: { variant: 'panelSection' },
            style: {
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--app-color-bg-card)',
              border: '1px solid var(--app-color-border-card)',
              borderRadius: 'var(--app-radius-lg)',
              boxShadow: 'var(--app-shadow-card)',
              overflow: 'visible',
              minWidth: 0,
            },
          },
          {
            props: { variant: 'entityCategory' },
            style: {
              backgroundColor: 'var(--app-color-bg-entity-category)',
              border: '1px solid var(--app-color-border-entity-category)',
              borderRadius: 'calc(var(--app-radius-lg) - 1px)',
              boxShadow: 'var(--app-shadow-entity-category)',
              overflow: 'hidden',
            },
          },
          {
            props: { variant: 'mediaFrame' },
            style: {
              position: 'relative',
              width: '100%',
              aspectRatio: 'var(--app-media-aspect-ratio)',
              borderRadius: 'var(--app-radius-md)',
              overflow: 'hidden',
              border: '1px solid var(--app-color-border-control)',
              backgroundColor: 'var(--app-color-bg-media)',
            },
          },
        ],
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: 'var(--app-section-body-padding)',
            '&:last-child': { paddingBottom: 'var(--app-section-body-padding)' },
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { textTransform: 'none' },
        },
        variants: [
          {
            props: { variant: 'toolTile' },
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--app-space-2)',
              minHeight: 58,
              padding: 'var(--app-space-4) var(--app-space-2)',
              border: '2px solid var(--app-color-border-tool-tile)',
              borderRadius: 'var(--app-radius-lg)',
              backgroundColor: 'var(--app-color-bg-tool-tile)',
              boxShadow: 'var(--app-shadow-tool-tile)',
              color: 'var(--app-color-text-tool-tile)',
              transition:
                'background var(--app-transition-fast), border-color var(--app-transition-fast), color var(--app-transition-fast), box-shadow var(--app-transition-fast)',
              '&[aria-pressed="true"]': {
                position: 'relative',
                zIndex: 2,
                background: 'var(--app-color-primary-active-bg)',
                borderColor: 'var(--app-color-entity-glow)',
                boxShadow: 'var(--app-color-entity-glow-lamp)',
                color: 'var(--app-color-text-primary)',
                textShadow: 'var(--app-color-sidebar-title-glow)',
              },
              '&:hover': {
                position: 'relative',
                zIndex: 3,
              },
              '&:hover:not([aria-pressed="true"])': {
                backgroundColor: 'var(--app-color-bg-tool-tile-hover)',
                borderColor: 'var(--app-color-sidebar-accent-border)',
                boxShadow: 'var(--app-color-primary-glow)',
                color: 'var(--app-color-text-tool-tile-hover)',
              },
              '&:disabled': { opacity: 0.35 },
            },
          },
          {
            props: { variant: 'toolDanger' },
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--app-space-3)',
              width: '100%',
              minHeight: 36,
              marginTop: 'var(--app-space-3)',
              padding: 'var(--app-space-4) var(--app-space-5)',
              border: '1px solid var(--app-color-danger-border)',
              borderRadius: 'var(--app-radius-lg)',
              backgroundColor: 'var(--app-color-danger-bg)',
              color: 'var(--app-color-danger)',
              '&:hover': {
                backgroundColor: 'var(--app-color-danger-hover-bg)',
                borderColor: 'var(--app-color-danger-border)',
              },
              '&:disabled': { opacity: 0.35 },
            },
          },
          {
            props: { variant: 'sectionHeader' },
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: 'var(--app-section-header-padding)',
              borderRadius: 0,
              border: 'none',
              borderBottom: '1px solid var(--app-color-border-section)',
              backgroundColor: 'var(--app-color-bg-card-header)',
              color: 'var(--app-color-text-muted)',
              '&:hover': { backgroundColor: 'var(--app-color-bg-card-header-hover)' },
            },
          },
          {
            props: { variant: 'entityCategory' },
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--app-space-4)',
              width: '100%',
              padding: '7px 9px',
              borderRadius: 0,
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--app-color-text-primary)',
              justifyContent: 'flex-start',
              '&:hover': { backgroundColor: 'var(--app-color-primary-hover-bg)' },
            },
          },
          {
            props: { variant: 'mapType' },
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 'var(--app-space-2)',
              padding: 'var(--app-space-5)',
              textAlign: 'left',
              backgroundColor: 'var(--app-color-bg-map-type)',
              border: '2px solid var(--app-color-border-map-type)',
              borderRadius: 'var(--app-radius-lg)',
              boxShadow: 'var(--app-shadow-tool-tile)',
              '&[aria-pressed="true"]': {
                position: 'relative',
                zIndex: 2,
                background: 'var(--app-color-primary-active-bg)',
                borderColor: 'var(--app-color-primary-border)',
                boxShadow: 'var(--app-color-primary-glow)',
              },
              '&:hover': {
                position: 'relative',
                zIndex: 3,
              },
              '&:disabled': { opacity: 0.35 },
            },
          },
        ],
      },
      MuiChip: {
        variants: [
          {
            props: { variant: 'live' },
            style: {
              height: 'auto',
              padding: '1px 6px',
              borderRadius: 'var(--app-radius-pill)',
              border: '1px solid var(--app-color-live-border)',
              backgroundColor: 'var(--app-color-live-bg)',
              color: 'var(--app-color-live)',
              fontSize: 'var(--app-font-size-2xs)',
              fontWeight: 'var(--app-font-weight-bold)',
              letterSpacing: 'var(--app-letter-spacing-live)',
            },
          },
          {
            props: { variant: 'countBadge' },
            style: {
              height: 28,
              minWidth: 28,
              borderRadius: 'var(--app-radius-pill)',
              border: '1px solid var(--app-color-primary-border-faint)',
              backgroundColor: 'var(--app-color-bg-nav-active)',
              color: 'var(--app-color-primary)',
              fontFamily: 'var(--app-font-family-mono)',
              fontSize: 'var(--app-font-size-xs)',
              fontWeight: 'var(--app-font-weight-bold)',
              fontVariantNumeric: 'tabular-nums',
            },
          },
        ],
      },
      MuiList: {
        styleOverrides: {
          root: {
            padding: 'var(--app-space-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--app-space-2)',
          },
        },
      },
      MuiListItemButton: {
        variants: [
          {
            props: { intelTarget: true },
            style: {
              display: 'grid',
              gridTemplateColumns: '42px minmax(0, 1fr) auto',
              alignItems: 'center',
              gap: 'var(--app-space-4)',
              minHeight: 52,
              padding: 'var(--app-space-3) var(--app-space-4)',
              border: '1px solid var(--app-color-border-subtle)',
              borderRadius: 'var(--app-radius-md)',
              backgroundColor: 'var(--app-color-bg-surface-muted)',
              transition:
                'background var(--app-transition-fast), border-color var(--app-transition-fast), box-shadow var(--app-transition-fast)',
              '&:hover': {
                backgroundColor: 'var(--app-color-bg-nav-hover)',
                borderColor:
                  'var(--app-color-border-row-hover, var(--app-color-primary-border-faint))',
              },
              '&.Mui-selected': {
                backgroundColor: 'var(--app-color-bg-nav-active)',
                borderColor: 'var(--app-color-primary-border-soft)',
                boxShadow: 'var(--app-color-primary-glow)',
                '&:hover': {
                  backgroundColor: 'var(--app-color-bg-nav-active)',
                },
              },
            },
          },
        ],
      },
      MuiAvatar: {
        variants: [
          {
            props: { variant: 'intelAircraft' },
            style: {
              width: 'var(--app-intel-avatar-size)',
              height: 'var(--app-intel-avatar-size)',
              borderRadius: 'var(--app-intel-avatar-radius)',
              border: '1px solid var(--app-intel-aircraft-border)',
              background: 'var(--app-intel-aircraft-bg)',
              boxShadow: 'var(--app-intel-aircraft-shadow)',
              '& img': {
                width: 'var(--app-intel-avatar-icon-size)',
                height: 'var(--app-intel-avatar-icon-size)',
                objectFit: 'contain',
                filter: 'var(--app-intel-aircraft-icon-filter)',
              },
            },
          },
          {
            props: { variant: 'intelDrone' },
            style: {
              width: 'var(--app-intel-avatar-size)',
              height: 'var(--app-intel-avatar-size)',
              borderRadius: 'var(--app-intel-avatar-radius)',
              border: '1px solid var(--app-intel-drone-border)',
              background: 'var(--app-intel-drone-bg)',
              boxShadow: 'var(--app-intel-drone-shadow)',
              '& img': {
                width: 'var(--app-intel-avatar-icon-size)',
                height: 'var(--app-intel-avatar-icon-size)',
                objectFit: 'contain',
                filter: 'var(--app-intel-drone-icon-filter)',
              },
            },
          },
        ],
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            gap: 2,
            padding: 'var(--app-space-3) var(--app-space-4)',
            borderBottom: '1px solid var(--app-color-border-subtle)',
            flexShrink: 0,
          },
          grouped: {
            border: '1px solid transparent !important',
            borderRadius: 'var(--app-radius-sm) !important',
            marginLeft: '0 !important',
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            color: 'var(--app-color-text-muted)',
            border: '1px solid var(--app-color-border-default)',
            height: 24,
            padding: '0 var(--app-space-3)',
            fontSize: 'var(--app-font-size-2xs)',
            fontWeight: 'var(--app-font-weight-semibold)',
            '&.Mui-selected': {
              backgroundColor: 'var(--app-color-bg-nav-active)',
              borderColor: 'var(--app-color-primary-border-faint)',
              color: 'var(--app-color-text-primary)',
              '&:hover': {
                backgroundColor: 'var(--app-color-bg-nav-active)',
              },
            },
            '&:hover': {
              backgroundColor: 'var(--app-color-bg-nav-hover)',
              color: 'var(--app-color-text-secondary)',
            },
          },
        },
      },
      MuiSlider: {
        styleOverrides: {
          root: { color: 'var(--app-color-primary)' },
          rail: { opacity: 0.28 },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            width: 36,
            height: 22,
            padding: 0,
          },
          switchBase: {
            padding: 2,
            '&.Mui-checked': {
              color: '#fff',
              transform: 'translateX(14px)',
              '& + .MuiSwitch-track': {
                backgroundColor: 'var(--app-color-primary)',
                opacity: 1,
                border: 'none',
              },
            },
          },
          thumb: {
            width: 18,
            height: 18,
            boxShadow: '0 1px 2px rgba(0,0,0,0.35)',
          },
          track: {
            borderRadius: 11,
            backgroundColor: 'var(--app-color-border-control)',
            opacity: 1,
            border: '1px solid var(--app-color-border-control)',
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: 'var(--app-color-bg-surface)',
            border: '1px solid var(--app-color-border-default)',
          },
        },
      },
      MuiTooltip: {
        defaultProps: { arrow: true },
      },
    },
  });
}

export default createAppTheme;
