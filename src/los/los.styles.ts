import type { SxProps, Theme } from '@mui/material/styles';
import { microLabel, palette, glass } from '../Components/layout/styles/tokens';

/**
 * Styles for the top-bar LOS popover panel — clear-glass surface (no
 * backdrop blur) with soft accent glows. The fill is dense enough that
 * text stays readable over any map, while translucency + edge highlights
 * keep the glassy look. Uses palette tokens so it adapts to light/dark.
 */

const glassBg = `color-mix(in srgb, ${palette.panel} 76%, transparent)`;
const glassLine = glass.line;
const glassLineBright = glass.lineBright;
const accentTint = glass.tint;

/** Halo that lifts text off the map — follows the theme backdrop color
 *  (dark halo under light text, light halo under dark text). */
const textHalo = `0 1px 2px color-mix(in srgb, ${palette.bg} 90%, transparent), 0 0 8px color-mix(in srgb, ${palette.bg} 60%, transparent)`;

/** Brighter secondary text — plain text.secondary washes out over the map. */
const mapSecondary = `color-mix(in srgb, ${palette.textPrimary} 55%, ${palette.textSecondary})`;

export const panel: SxProps<Theme> = {
  mt: 1.25,
  width: 332,
  borderRadius: 3,
  bgcolor: glassBg,
  // Glossy sheen instead of backdrop blur — reads as clear glass.
  backgroundImage: `linear-gradient(160deg, ${accentTint(8)} 0%, transparent 45%), linear-gradient(to bottom, color-mix(in srgb, ${palette.textPrimary} 6%, transparent) 0%, transparent 38%)`,
  border: `1px solid ${glassLineBright}`,
  boxShadow: `${glass.shadow}, 0 0 0 1px ${accentTint(12)} inset, 0 1px 0 ${glassLineBright} inset`,
  overflow: 'hidden',
};

export const header: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.25,
  px: 2,
  pt: 2,
  pb: 1.5,
};

export const headerMark: SxProps<Theme> = {
  width: 36,
  height: 36,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 2,
  color: '#fff',
  backgroundImage: `linear-gradient(135deg, ${palette.accentBright}, ${palette.accent})`,
  boxShadow: `0 6px 18px -6px ${accentTint(80)}`,
};

export const headerTitle: SxProps<Theme> = {
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: '-0.01em',
  color: 'text.primary',
  lineHeight: 1.2,
  textShadow: textHalo,
};

export const headerSubtitle: SxProps<Theme> = {
  fontSize: 11.5,
  color: mapSecondary,
  lineHeight: 1.3,
  textShadow: textHalo,
};

export const statusChip = (color: string): SxProps<Theme> => ({
  ml: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  px: 1.25,
  py: 0.5,
  borderRadius: 99,
  bgcolor: `color-mix(in srgb, ${color} 12%, transparent)`,
  border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: '0.02em',
  color,
  whiteSpace: 'nowrap',
});

export const body: SxProps<Theme> = {
  px: 1.5,
  pb: 1.5,
  display: 'flex',
  flexDirection: 'column',
  gap: 1.5,
};

export const sectionLabel: SxProps<Theme> = {
  ...microLabel,
  fontSize: 9.5,
  letterSpacing: '0.14em',
  color: mapSecondary,
  textShadow: textHalo,
  mb: 1,
  px: 0.5,
};

/** Frosted inner card that groups a section (tools, heights). */
export const glassCard: SxProps<Theme> = {
  p: 1,
  borderRadius: 2.5,
  bgcolor: `color-mix(in srgb, ${palette.textPrimary} 4%, transparent)`,
  border: `1px solid ${glassLine}`,
  display: 'flex',
  flexDirection: 'column',
  gap: 0.75,
};

/** Full-width tool row: icon tile + title/description + trailing action. */
export const toolRow = (active: boolean): SxProps<Theme> => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 1.25,
  px: 1.25,
  py: 1.1,
  textAlign: 'start',
  borderRadius: 2,
  border: `1px solid ${active ? accentTint(55) : 'transparent'}`,
  bgcolor: active ? accentTint(14) : 'transparent',
  boxShadow: active ? `0 0 0 3px ${accentTint(10)}, 0 8px 24px -12px ${accentTint(70)}` : 'none',
  transition: 'background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
  '&:hover': {
    bgcolor: active ? accentTint(18) : `color-mix(in srgb, ${palette.textPrimary} 6%, transparent)`,
    borderColor: active ? palette.accentBright : glassLine,
  },
  '&:active': { transform: 'scale(0.99)' },
});

export const toolIcon = (active: boolean): SxProps<Theme> => ({
  width: 36,
  height: 36,
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 2,
  color: active ? '#fff' : palette.accentBright,
  bgcolor: active ? 'transparent' : accentTint(12),
  backgroundImage: active
    ? `linear-gradient(135deg, ${palette.accentBright}, ${palette.accent})`
    : 'none',
  border: `1px solid ${active ? 'transparent' : accentTint(25)}`,
  boxShadow: active ? `0 6px 16px -6px ${accentTint(80)}` : 'none',
  transition: 'all 160ms ease',
});

export const toolTitle: SxProps<Theme> = {
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '-0.005em',
  lineHeight: 1.2,
  color: 'text.primary',
  textShadow: textHalo,
};

export const toolDesc: SxProps<Theme> = {
  fontSize: 11.5,
  lineHeight: 1.35,
  color: mapSecondary,
  textShadow: textHalo,
  mt: 0.25,
};

export const toolTrailing = (active: boolean): SxProps<Theme> => ({
  ml: 'auto',
  flexShrink: 0,
  width: 28,
  height: 28,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 99,
  color: active ? palette.accentBright : 'text.secondary',
  bgcolor: active ? accentTint(14) : 'transparent',
  border: `1px solid ${active ? accentTint(35) : 'transparent'}`,
  transition: 'all 160ms ease',
});

export const footerHint: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 0.75,
  fontSize: 11,
  color: mapSecondary,
  textShadow: textHalo,
};

/** Keyboard-key badge used in the footer hint. */
export const kbd: SxProps<Theme> = {
  px: 0.75,
  py: 0.1,
  borderRadius: 1,
  fontSize: 10,
  fontWeight: 600,
  fontFamily: 'inherit',
  color: 'text.primary',
  bgcolor: `color-mix(in srgb, ${palette.textPrimary} 8%, transparent)`,
  border: `1px solid ${glassLineBright}`,
  boxShadow: `0 1px 0 ${glassLineBright}`,
};

/** Glass text fields for the heights section. */
export const heightField: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: `color-mix(in srgb, ${palette.textPrimary} 4%, transparent)`,
    transition: 'box-shadow 160ms ease',
    '& fieldset': { borderColor: glassLine },
    '&:hover fieldset': { borderColor: glassLineBright },
    '&.Mui-focused': { boxShadow: `0 0 0 3px ${accentTint(18)}` },
    '&.Mui-focused fieldset': { borderColor: palette.accentBright, borderWidth: 1 },
  },
  '& .MuiInputAdornment-root .MuiTypography-root': {
    fontSize: 12,
    color: 'text.secondary',
  },
};
