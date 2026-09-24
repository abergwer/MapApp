import type { SxProps, Theme } from '@mui/material/styles';
import { palette, fonts, microLabel } from '../../layout/styles/tokens';

/** Styles for FloatingPanelWindow: floating/maximized workspace windows. */

export const floatWindow = (rect: {
  x: number;
  y: number;
  width: number;
  height: number;
}): SxProps<Theme> => ({
  position: 'absolute',
  left: rect.x,
  top: rect.y,
  width: rect.width,
  height: rect.height,
  zIndex: 1300,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  bgcolor: palette.overlay,
  backdropFilter: 'blur(4px)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
});

/** Full-view variant: fills the map area (small inset margin). */
export const maximizedWindow: SxProps<Theme> = {
  position: 'absolute',
  inset: 12,
  zIndex: 1300,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  bgcolor: palette.overlay,
  backdropFilter: 'blur(4px)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
};

export const floatHeader: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
  pl: 1.5,
  pr: 0.5,
  py: 0.25,
  bgcolor: palette.panelHeader,
  borderBottom: `1px solid ${palette.border}`,
  cursor: 'move',
  userSelect: 'none',
  touchAction: 'none',
  flexShrink: 0,
};

export const floatTitle: SxProps<Theme> = {
  ...microLabel,
  fontSize: 10,
  fontFamily: fonts.ui,
  color: 'text.primary',
};

export const floatBody: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
};

export const resizeHandle: SxProps<Theme> = {
  position: 'absolute',
  right: 0,
  bottom: 0,
  width: 18,
  height: 18,
  cursor: 'nwse-resize',
  touchAction: 'none',
  zIndex: 1,
  '&::after': {
    content: '""',
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 8,
    height: 8,
    borderRight: `2px solid ${palette.textSecondary}`,
    borderBottom: `2px solid ${palette.textSecondary}`,
  },
};
