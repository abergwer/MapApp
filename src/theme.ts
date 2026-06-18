import { createTheme } from '@mui/material/styles';

/**
 * Global Material UI theme.
 *
 * Most UI sits as a translucent overlay on top of the basemap, so the theme
 * pre-configures `Paper` and the toolbar `Button`s with that look. Components
 * only need to add layout `sx`, not repeat the overlay colors.
 */

// Single source of truth for the overlay look. If you tweak the dark tone,
// every Paper / Button / ToggleButton in the app picks it up automatically.
const OVERLAY_BG = 'rgba(20, 24, 32, 0.92)';
const OVERLAY_BG_HOVER = 'rgba(35, 40, 50, 0.95)';
const OVERLAY_BORDER = '1px solid rgba(255, 255, 255, 0.08)';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#2563eb' },
    background: {
      default: '#0f1115',
      paper: OVERLAY_BG,
    },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    MuiPaper: {
      defaultProps: { elevation: 3 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: OVERLAY_BORDER,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: 'none' },
      },
      // Make `variant="contained" color="inherit"` the "overlay" button —
      // used by the toolbars on top of the map.
      variants: [
        {
          props: { variant: 'contained', color: 'inherit' },
          style: {
            backgroundColor: OVERLAY_BG,
            color: '#fff',
            border: OVERLAY_BORDER,
            '&:hover': { backgroundColor: OVERLAY_BG_HOVER },
          },
        },
      ],
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          color: '#fff',
          border: OVERLAY_BORDER,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: { minWidth: 200 },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: { color: 'inherit' },
      },
    },
  },
});

export default theme;
