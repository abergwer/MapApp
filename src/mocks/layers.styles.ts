import type { SxProps, Theme } from '@mui/material/styles';
import { palette, symbology, fonts, microLabel, hexToRgba, type Rgba } from '../Components/layout/styles/tokens';

/**
 * Styles for the layers feature: deck.gl entity symbology (colors + label
 * chips rendered on the map) and the LAYERS side panel rows.
 * deck.gl colors use the raw `symbology` tokens (canvas can't read CSS vars).
 */

// ── deck.gl symbology ──────────────────────────────────────────────────

export const layerColors = {
  aircraft: hexToRgba(symbology.danger),
  drone: hexToRgba(symbology.danger),
  missile: hexToRgba(symbology.missile),
  missileSelected: hexToRgba(symbology.accent),
  missileTrack: hexToRgba(symbology.missile, 200),
  areaFill: hexToRgba(symbology.area, 36),
  areaLine: hexToRgba(symbology.area, 210),
  rangeRing: hexToRgba(symbology.drone, 70),
} as const;

/**
 * Shared props for the dark label chips next to each live target
 * (ID + ALT/SPD lines, like the reference design's map callouts).
 */
export const targetLabelProps = {
  getSize: 11,
  getColor: hexToRgba(symbology.textPrimary) as Rgba,
  getTextAnchor: 'start' as const,
  getAlignmentBaseline: 'top' as const,
  getPixelOffset: [16, 4] as [number, number],
  background: true,
  getBackgroundColor: hexToRgba(symbology.panelHeader, 220) as Rgba,
  getBorderColor: hexToRgba(symbology.border) as Rgba,
  getBorderWidth: 1,
  backgroundPadding: [6, 4, 6, 4] as [number, number, number, number],
  fontFamily: 'Consolas, monospace',
  lineHeight: 1.3,
  billboard: true,
};

// ── LAYERS panel ───────────────────────────────────────────────────────
/** "Search layers" input (reference design). */
export const searchField: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  px: 1.25,
  py: 0.6,
  mb: 1.25,
  borderRadius: 1.5,
  bgcolor: palette.bg,
  border: `1px solid ${palette.border}`,
  '& input': {
    all: 'unset',
    flex: 1,
    fontSize: 13,
    color: palette.textPrimary,
    '&::placeholder': { color: palette.textDisabled },
  },
};
export const groupTitle: SxProps<Theme> = {
  ...microLabel,
  fontSize: 9.5,
  color: 'text.secondary',
  px: 1,
  pt: 1,
  pb: 0.5,
};

/** Visibility row card: dot + label + count + switch (reference design). */
export const layerRow: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  pl: 0.75,
  pr: 0.5,
  py: 0.25,
  mb: 0.75,
  borderRadius: 1.5,
  bgcolor: palette.panel,
  border: `1px solid ${palette.border}`,
  '&:hover': { borderColor: palette.borderBright },
};

/** Indented sub-row inside an expanded group. */
export const layerSubRow: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  ml: 3,
  pl: 0.75,
  pr: 0.5,
  py: 0.125,
  mb: 0.5,
  borderRadius: 1,
  bgcolor: `color-mix(in srgb, ${palette.panel} 55%, transparent)`,
  border: `1px solid ${palette.border}`,
};

/** Dot colored per layer (reference design shows a round blue dot). */
export const layerSwatch = (color: string): SxProps<Theme> => ({
  width: 9,
  height: 9,
  borderRadius: '50%',
  bgcolor: color,
  boxShadow: `0 0 5px ${color}`,
  flexShrink: 0,
});

export const layerLabel: SxProps<Theme> = {
  flex: 1,
  fontSize: 13,
  fontWeight: 600,
  color: 'text.primary',
  textAlign: 'center',
};

export const layerCount: SxProps<Theme> = {
  fontFamily: fonts.mono,
  fontSize: 11,
  fontStyle: 'italic',
  color: 'text.secondary',
};

/** Fixed-size slot so rows without an expand chevron still line up. */
export const expandSlot: SxProps<Theme> = {
  width: 26,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};
