import type { SxProps, Theme } from '@mui/material/styles';
import { palette, fonts, microLabel } from '../../../layout/styles/tokens';

/** Styles for the intel feed (live targets list in the workspace dock). */

export const header: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
  mb: 1,
};

export const targetsLabel: SxProps<Theme> = {
  ...microLabel,
  fontSize: 10,
  color: palette.accentBright,
};

export const countChip: SxProps<Theme> = {
  minWidth: 26,
  height: 22,
  display: 'grid',
  placeItems: 'center',
  px: 0.75,
  borderRadius: '11px',
  fontFamily: fonts.mono,
  fontSize: 11,
  fontWeight: 700,
  color: '#fff',
  bgcolor: palette.accent,
};

export const filterRow: SxProps<Theme> = {
  display: 'flex',
  gap: 0.5,
  mb: 1,
};

export const filterPill = (active: boolean): SxProps<Theme> => ({
  px: 1,
  py: 0.3,
  borderRadius: 0.75,
  fontSize: 11,
  cursor: 'pointer',
  color: active ? '#fff' : 'text.secondary',
  bgcolor: active ? palette.accent : palette.panel,
  border: `1px solid ${active ? palette.accent : palette.border}`,
  '&:hover': { color: active ? '#fff' : 'text.primary' },
});

export const list: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
};

/** Rows are absolutely positioned inside the virtualized list spacer. */
export const row = (selected: boolean): SxProps<Theme> => ({
  position: 'absolute',
  left: 0,
  height: 44,
  width: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  px: 1,
  py: 0.75,
  borderRadius: 1.5,
  bgcolor: palette.panel,
  border: `1px solid ${palette.border}`,
  '&:hover': { borderColor: palette.borderBright },
  ...(selected && {
    border: `1px solid ${palette.accent}`,
    bgcolor: `color-mix(in srgb, ${palette.accent} 14%, transparent)`,
    boxShadow: `0 0 8px color-mix(in srgb, ${palette.accent} 40%, transparent)`,
  }),
});

export const rowIcon = (color: string): SxProps<Theme> => ({
  width: 30,
  height: 30,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 1,
  color,
  bgcolor: `color-mix(in srgb, ${color} 14%, transparent)`,
  border: `1px solid color-mix(in srgb, ${color} 45%, transparent)`,
  flexShrink: 0,
});

export const rowId: SxProps<Theme> = {
  fontSize: 13,
  fontWeight: 700,
  color: 'text.primary',
  lineHeight: 1.3,
  textAlign: 'left',
};

export const rowMeta: SxProps<Theme> = {
  fontFamily: fonts.mono,
  fontSize: 10.5,
  fontStyle: 'italic',
  color: 'text.secondary',
  lineHeight: 1.3,
  textAlign: 'left',
};

/** The panel body must be a column so the list can scroll. */
export const root: SxProps<Theme> = {
  height: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
};
