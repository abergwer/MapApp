import type { SxProps, Theme } from '@mui/material/styles';
import { palette, fonts } from '../../../layout/styles/tokens';

/** Styles for the missiles feature (selection list panel). */

export const missileRow = (selected: boolean): SxProps<Theme> => ({
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  px: 1,
  py: 0.75,
  borderRadius: 0.75,
  cursor: 'pointer',
  border: '1px solid transparent',
  '&:hover': { bgcolor: `color-mix(in srgb, ${palette.missile} 8%, transparent)` },
  ...(selected && {
    bgcolor: `color-mix(in srgb, ${palette.missile} 12%, transparent)`,
    border: `1px solid ${palette.missile}`,
  }),
});

export const missileDot: SxProps<Theme> = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  bgcolor: palette.missile,
  boxShadow: `0 0 6px ${palette.missile}`,
  flexShrink: 0,
};

export const missileId: SxProps<Theme> = {
  fontFamily: fonts.mono,
  fontSize: 12,
  fontWeight: 700,
  color: 'text.primary',
  lineHeight: 1.3,
};

export const missileMeta: SxProps<Theme> = {
  fontFamily: fonts.mono,
  fontSize: 10,
  color: 'text.secondary',
  lineHeight: 1.3,
  whiteSpace: 'nowrap',
};

export const missileAlt: SxProps<Theme> = {
  fontFamily: fonts.mono,
  fontSize: 11,
  color: palette.warn,
  whiteSpace: 'nowrap',
};
