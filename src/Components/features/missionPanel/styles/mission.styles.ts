import type { SxProps, Theme } from '@mui/material/styles';
import { palette, fonts, microLabel } from '../../../layout/styles/tokens';

/** Styles for the missions feature (card list + schema form). */

export const root: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1.5,
  height: 1,
  minHeight: 0,
};

export const toolbar: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
};

export const count: SxProps<Theme> = {
  ...microLabel,
  fontSize: 10,
  color: 'text.secondary',
};

export const primaryButton: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  px: 1.5,
  py: 0.6,
  borderRadius: 1.5,
  fontSize: 12,
  fontWeight: 700,
  color: '#fff',
  bgcolor: palette.accent,
  boxShadow: `0 0 12px color-mix(in srgb, ${palette.accent} 45%, transparent)`,
  '&:hover': { bgcolor: palette.accentBright },
  '&.Mui-disabled': { opacity: 0.4 },
};

export const ghostButton: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  px: 1.5,
  py: 0.6,
  borderRadius: 1.5,
  fontSize: 12,
  fontWeight: 600,
  color: 'text.secondary',
  border: `1px solid ${palette.border}`,
  '&:hover': { borderColor: palette.borderBright, color: 'text.primary' },
};

export const field: SxProps<Theme> = {
  '& .MuiInputBase-root': { fontSize: 13 },
  '& .MuiInputLabel-root': { fontSize: 12 },
  '& .MuiFormHelperText-root': { mx: 0.5, fontSize: 10 },
};

// ── List ───────────────────────────────────────────────────────

export const list: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0.75,
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  pr: 0.25,
};

export const card: SxProps<Theme> = {
  width: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  pl: 1.5,
  pr: 0.5,
  py: 1,
  borderRadius: 1.5,
  textAlign: 'left',
  bgcolor: palette.panel,
  border: `1px solid ${palette.border}`,
  borderLeft: `3px solid ${palette.accent}`,
  '&:hover': { borderColor: palette.borderBright, borderLeftColor: palette.accentBright },
};

export const cardName: SxProps<Theme> = {
  fontSize: 13,
  fontWeight: 600,
  color: 'text.primary',
  lineHeight: 1.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export const cardDate: SxProps<Theme> = {
  fontFamily: fonts.mono,
  fontSize: 10,
  color: 'text.secondary',
  lineHeight: 1.3,
};

export const emptyState: SxProps<Theme> = {
  py: 4,
  px: 2,
  textAlign: 'center',
  color: 'text.disabled',
  fontSize: 12,
  border: `1px dashed ${palette.border}`,
  borderRadius: 1.5,
};

// ── Form ───────────────────────────────────────────────────────

export const formHeader: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  pb: 1,
  borderBottom: `1px solid ${palette.border}`,
};

export const formTitle: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
  fontSize: 13,
  fontWeight: 700,
  color: 'text.primary',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export const formBody: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 1.5,
  // Headroom for the first field's floating label.
  pt: 0.75,
  pr: 0.25,
};

export const formFooter: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
  pt: 1,
  borderTop: `1px solid ${palette.border}`,
};

export const formError: SxProps<Theme> = {
  fontSize: 11,
  color: palette.danger,
};
