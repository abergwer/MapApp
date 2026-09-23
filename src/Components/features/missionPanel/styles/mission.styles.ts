import type { SxProps, Theme } from '@mui/material/styles';
import { palette, fonts, microLabel } from '../../../layout/styles/tokens';

/** Styles for the missions feature (card list + schema form). */

const ease = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

/** Tinted translucent surface used by cards, fields and chips. */
const glass = (strength = 55) => `color-mix(in srgb, ${palette.panelHeader} ${strength}%, transparent)`;

/** Slim, theme-aware scrollbar for scrolling regions. */
const slimScrollbar = {
  scrollbarWidth: 'thin',
  scrollbarColor: `${palette.borderBright} transparent`,
  '&::-webkit-scrollbar': { width: 6 },
  '&::-webkit-scrollbar-thumb': {
    borderRadius: 99,
    bgcolor: palette.border,
    '&:hover': { bgcolor: palette.borderBright },
  },
} as const;

/** Keyboard focus ring shared by all interactive controls. */
const focusRing = {
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 2px ${palette.panel}, 0 0 0 4px ${palette.accent}`,
  },
} as const;

export const root: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1.5,
  height: 1,
  minHeight: 0,
};

// ── Toolbar / buttons ──────────────────────────────────────────

export const toolbar: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
};

export const count: SxProps<Theme> = {
  ...microLabel,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.75,
  fontSize: 10,
  color: 'text.secondary',
  px: 1.25,
  py: 0.5,
  borderRadius: 99,
  border: `1px solid ${palette.border}`,
  bgcolor: glass(45),
  '& b': {
    fontFamily: fonts.mono,
    fontWeight: 700,
    color: 'text.primary',
  },
};

export const primaryButton: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  px: 1.75,
  py: 0.8,
  borderRadius: 99,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 0.2,
  color: '#fff',
  background: `linear-gradient(135deg, ${palette.accent}, color-mix(in srgb, ${palette.accent} 55%, ${palette.accentBright}))`,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.22), 0 4px 14px color-mix(in srgb, ${palette.accent} 40%, transparent)`,
  transition: `box-shadow 180ms ${ease}, transform 180ms ${ease}, filter 180ms ${ease}`,
  '&:hover': {
    filter: 'brightness(1.1) saturate(1.1)',
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 8px 22px color-mix(in srgb, ${palette.accent} 50%, transparent)`,
    transform: 'translateY(-1px)',
  },
  '&:active': { transform: 'translateY(0) scale(0.98)' },
  '&.Mui-disabled': { opacity: 0.4 },
  ...focusRing,
};

export const ghostButton: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  px: 1.75,
  py: 0.8,
  borderRadius: 99,
  fontSize: 12,
  fontWeight: 600,
  color: 'text.secondary',
  border: `1px solid ${palette.border}`,
  bgcolor: glass(35),
  transition: `border-color 180ms ${ease}, color 180ms ${ease}, background-color 180ms ${ease}`,
  '&:hover': {
    borderColor: palette.borderBright,
    color: 'text.primary',
    bgcolor: `color-mix(in srgb, ${palette.borderBright} 14%, transparent)`,
  },
  '&:active': { transform: 'scale(0.98)' },
  ...focusRing,
};

/** Round icon button used for "back" and inline row actions. */
export const iconButton: SxProps<Theme> = {
  width: 30,
  height: 30,
  color: 'text.secondary',
  border: `1px solid ${palette.border}`,
  bgcolor: glass(35),
  transition: `border-color 180ms ${ease}, color 180ms ${ease}, background-color 180ms ${ease}`,
  '&:hover': {
    color: 'text.primary',
    borderColor: palette.borderBright,
    bgcolor: `color-mix(in srgb, ${palette.borderBright} 14%, transparent)`,
  },
};

// ── Fields ─────────────────────────────────────────────────────

/** Shared input look (plain object so variants below can spread it). */
const fieldBase = {
  '& .MuiInputBase-root': {
    fontSize: 13,
    borderRadius: 2.5,
    bgcolor: glass(55),
    transition: `background-color 180ms ${ease}, box-shadow 180ms ${ease}`,
    '&.Mui-focused': { bgcolor: glass(25) },
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: palette.border,
    transition: `border-color 180ms ${ease}`,
  },
  '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: palette.borderBright },
  '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: palette.accent,
    borderWidth: 1,
  },
  '& .MuiInputBase-root.Mui-focused': {
    boxShadow: `0 0 0 3px color-mix(in srgb, ${palette.accent} 18%, transparent)`,
  },
  '& .MuiInputBase-root.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: palette.danger },
  '& .MuiInputBase-root.Mui-error.Mui-focused': {
    boxShadow: `0 0 0 3px color-mix(in srgb, ${palette.danger} 18%, transparent)`,
  },
  '& .MuiInputAdornment-root': { color: 'text.secondary' },
  '& .MuiInputLabel-root': { fontSize: 12, letterSpacing: 0.2 },
  '& .MuiInputLabel-root.Mui-focused': { color: palette.accentBright },
  '& .MuiFormHelperText-root': { mx: 0.75, mt: 0.5, fontSize: 10.5 },
} as const;

export const field: SxProps<Theme> = fieldBase;

/** Pill-shaped variant for the list filter. */
export const searchField: SxProps<Theme> = {
  ...fieldBase,
  '& .MuiInputBase-root': {
    ...fieldBase['& .MuiInputBase-root'],
    borderRadius: 99,
    pl: 0.5,
  },
};

// ── List ───────────────────────────────────────────────────────

export const list: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  pr: 0.5,
  py: 0.25,
  ...slimScrollbar,
};

export const card: SxProps<Theme> = {
  width: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 1.25,
  pl: 1.25,
  pr: 1,
  py: 1.1,
  borderRadius: 3,
  textAlign: 'left',
  position: 'relative',
  overflow: 'hidden',
  isolation: 'isolate',
  bgcolor: glass(60),
  border: `1px solid ${palette.border}`,
  // Hairline top highlight gives the surface a subtle "lit" edge.
  boxShadow: `inset 0 1px 0 color-mix(in srgb, ${palette.textPrimary} 6%, transparent)`,
  transition: `border-color 200ms ${ease}, transform 200ms ${ease}, box-shadow 200ms ${ease}, background-color 200ms ${ease}`,
  // Soft accent wash that fades in on hover.
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    zIndex: -1,
    background: `radial-gradient(120% 140% at 0% 50%, color-mix(in srgb, ${palette.accent} 16%, transparent), transparent 60%)`,
    opacity: 0,
    transition: `opacity 220ms ${ease}`,
  },
  '&:hover, &:focus-visible, &:focus-within': {
    borderColor: `color-mix(in srgb, ${palette.accent} 45%, ${palette.borderBright})`,
    transform: 'translateY(-1px)',
    boxShadow: `inset 0 1px 0 color-mix(in srgb, ${palette.textPrimary} 8%, transparent), 0 10px 24px -8px color-mix(in srgb, ${palette.bg} 90%, transparent)`,
    '&::before': { opacity: 1 },
    '& .msn-card-actions': { opacity: 1, transform: 'translateX(0)' },
    '& .msn-card-chevron': { color: palette.accentBright, transform: 'translateX(2px)' },
    '& .msn-card-avatar': { transform: 'scale(1.04)' },
  },
  '&:active': { transform: 'translateY(0)' },
  ...focusRing,
};

/** Gradient monogram tile at the left of each card. */
export const cardAvatar: SxProps<Theme> = {
  flexShrink: 0,
  width: 36,
  height: 36,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 2.25,
  fontFamily: fonts.display,
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: '-0.02em',
  lineHeight: 1,
  color: '#fff',
  textTransform: 'uppercase',
  textShadow: '0 1px 1px rgba(0,0,0,0.25)',
  background: `linear-gradient(145deg, ${palette.accent}, color-mix(in srgb, ${palette.accent} 45%, ${palette.area}))`,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 10px color-mix(in srgb, ${palette.accent} 35%, transparent)`,
  transition: `transform 200ms ${ease}`,
};

export const cardBody: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 0.35,
};

export const cardName: SxProps<Theme> = {
  fontFamily: fonts.display,
  fontSize: 16,
  fontWeight: 600,
  letterSpacing: 0,
  color: 'text.primary',
  lineHeight: 1.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  // Hebrew names render right-to-left while staying left-aligned in the card.
  unicodeBidi: 'plaintext',
};

export const cardDate: SxProps<Theme> = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
  fontFamily: fonts.mono,
  fontSize: 10,
  letterSpacing: 0.2,
  color: 'text.secondary',
  lineHeight: 1.4,
  '& svg': { fontSize: 11, opacity: 0.8 },
};

/** Row actions: hidden until the card is hovered / focused. */
export const cardActions: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.25,
  opacity: 0,
  transform: 'translateX(4px)',
  transition: `opacity 180ms ${ease}, transform 180ms ${ease}`,
  '@media (hover: none)': { opacity: 1, transform: 'none' },
};

export const deleteButton: SxProps<Theme> = {
  color: 'text.secondary',
  transition: `color 160ms ${ease}, background-color 160ms ${ease}`,
  '&:hover': {
    color: palette.danger,
    bgcolor: `color-mix(in srgb, ${palette.danger} 14%, transparent)`,
  },
};

export const cardChevron: SxProps<Theme> = {
  fontSize: 18,
  color: 'text.disabled',
  transition: `color 180ms ${ease}, transform 180ms ${ease}`,
};

export const emptyState: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 0.75,
  py: 5,
  px: 2,
  textAlign: 'center',
  border: `1px dashed ${palette.borderBright}`,
  borderRadius: 3,
  bgcolor: glass(30),
};

export const emptyIcon: SxProps<Theme> = {
  width: 44,
  height: 44,
  display: 'grid',
  placeItems: 'center',
  borderRadius: '50%',
  mb: 0.5,
  color: palette.accentBright,
  bgcolor: `color-mix(in srgb, ${palette.accent} 14%, transparent)`,
  border: `1px solid color-mix(in srgb, ${palette.accent} 30%, transparent)`,
  '& svg': { fontSize: 22 },
};

export const emptyTitle: SxProps<Theme> = {
  fontSize: 13,
  fontWeight: 600,
  color: 'text.primary',
};

export const emptyHint: SxProps<Theme> = {
  fontSize: 11.5,
  color: 'text.secondary',
  maxWidth: 240,
  lineHeight: 1.5,
};

// ── Form ───────────────────────────────────────────────────────

export const formHeader: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.25,
  pb: 1.25,
  borderBottom: `1px solid color-mix(in srgb, ${palette.border} 70%, transparent)`,
};

export const formHeading: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 0.25,
};

export const formEyebrow: SxProps<Theme> = {
  ...microLabel,
  fontSize: 9.5,
  color: palette.accentBright,
};

export const formTitle: SxProps<Theme> = {
  fontFamily: fonts.display,
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: 0,
  color: 'text.primary',
  lineHeight: 1.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  unicodeBidi: 'plaintext',
};

export const formBody: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  // Headroom for the first field's floating label.
  pt: 1,
  pr: 0.5,
  ...slimScrollbar,
};

export const formFooter: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
  pt: 1.25,
  borderTop: `1px solid color-mix(in srgb, ${palette.border} 70%, transparent)`,
};

export const formActions: SxProps<Theme> = {
  display: 'flex',
  gap: 1,
};

/** Inline validation banner shown in the footer. */
export const formError: SxProps<Theme> = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.75,
  px: 1.25,
  py: 0.5,
  borderRadius: 99,
  fontSize: 11,
  fontWeight: 600,
  color: palette.danger,
  bgcolor: `color-mix(in srgb, ${palette.danger} 12%, transparent)`,
  border: `1px solid color-mix(in srgb, ${palette.danger} 30%, transparent)`,
  '& svg': { fontSize: 14 },
};
