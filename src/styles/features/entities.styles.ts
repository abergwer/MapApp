import type { SxProps, Theme } from '@mui/material/styles';
import { palette, fonts } from '../system-ui/tokens';

/** Styles for the entities feature (existing-entities list + create grid). */

/** Row per shape kind: icon, label, count, expand chevron. */
export const kindRow: SxProps<Theme> = {
  width: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  px: 1.25,
  py: 0.75,
  mb: 0.75,
  borderRadius: 1.5,
  bgcolor: palette.panel,
  border: `1px solid ${palette.border}`,
  '&:hover': { borderColor: palette.borderBright },
};

export const kindLabel: SxProps<Theme> = {
  flex: 1,
  fontSize: 13,
  fontWeight: 600,
  color: 'text.primary',
  textAlign: 'center',
};

export const kindCount: SxProps<Theme> = {
  fontFamily: fonts.mono,
  fontSize: 11,
  fontStyle: 'italic',
  color: 'text.secondary',
};

/** Individual entity row inside an expanded kind group. */
export const entityRow = (selected: boolean): SxProps<Theme> => ({
  width: 'calc(100% - 24px)',
  ml: 3,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
  px: 1.25,
  py: 0.5,
  mb: 0.5,
  borderRadius: 1,
  bgcolor: `color-mix(in srgb, ${palette.panel} 55%, transparent)`,
  border: `1px solid ${palette.border}`,
  '&:hover': { borderColor: palette.borderBright },
  ...(selected && {
    border: `1px solid ${palette.accent}`,
    bgcolor: `color-mix(in srgb, ${palette.accent} 16%, transparent)`,
    boxShadow: `0 0 8px color-mix(in srgb, ${palette.accent} 40%, transparent)`,
  }),
});

export const entityLabel: SxProps<Theme> = {
  fontSize: 12,
  fontWeight: 600,
  color: 'text.primary',
};

export const entityId: SxProps<Theme> = {
  fontFamily: fonts.mono,
  fontSize: 10,
  color: 'text.secondary',
};

export const emptyText: SxProps<Theme> = {
  fontSize: 12,
  color: 'text.disabled',
  textAlign: 'center',
  py: 1,
};

/** Grid of draw-tool cards (4 per row like the reference design). */
export const createGrid: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 1,
  mb: 1,
};
