import { createTheme } from '@mui/material/styles';
import { designTokens } from '../designTokens';

/**
 * Central MUI theme — all component look & feel is defined here.
 * Components use variants only (no sx). Visual tokens: features/styles/tokens.css
 * Palette literals: designTokens.ts (MUI cannot parse CSS variables in palette).
 */
export function createAppTheme() {
  const { colors, shape } = designTokens;

  return createTheme({
    palette: {
      mode: 'dark',
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
        color: 'var(--app-color-text-muted)',
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
              backgroundColor: 'rgba(10, 16, 26, 0.72)',
              border: '1px solid rgba(96, 130, 170, 0.18)',
              borderRadius: 'calc(var(--app-radius-lg) - 1px)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
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
              border: '2px solid rgba(96, 130, 170, 0.16)',
              borderRadius: 'var(--app-radius-lg)',
              backgroundColor: 'rgba(10, 16, 26, 0.88)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
              color: 'var(--app-color-text-muted)',
              transition: 'background var(--app-transition-fast), border-color var(--app-transition-fast), color var(--app-transition-fast), box-shadow var(--app-transition-fast)',
              '&[aria-pressed="true"]': {
                position: 'relative',
                zIndex: 2,
                background: 'var(--app-color-primary-active-bg)',
                borderColor: 'var(--app-color-primary-border)',
                boxShadow: 'var(--app-color-primary-glow)',
                color: '#ffffff',
              },
              '&:hover': {
                position: 'relative',
                zIndex: 3,
              },
              '&:hover:not([aria-pressed="true"])': {
                backgroundColor: 'var(--app-color-primary-hover-bg)',
                borderColor: 'var(--app-color-primary-border-soft)',
                color: 'var(--app-color-text-primary)',
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
                backgroundColor: 'rgba(127, 29, 29, 0.34)',
                borderColor: 'rgba(248, 113, 113, 0.62)',
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
              backgroundColor: 'rgba(10, 16, 26, 0.88)',
              border: '2px solid rgba(96, 130, 170, 0.16)',
              borderRadius: 'var(--app-radius-lg)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
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
        ],
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
            backgroundColor: 'rgba(96, 130, 170, 0.28)',
            opacity: 1,
            border: '1px solid rgba(96, 130, 170, 0.22)',
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
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            color: 'var(--app-color-text-secondary)',
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
