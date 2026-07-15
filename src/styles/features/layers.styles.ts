import type { SxProps, Theme } from '@mui/material/styles';
import { palette, symbology, fonts, microLabel, hexToRgba, type Rgba } from '../system-ui/tokens';

/**
 * Styles for the layers feature: deck.gl entity symbology (colors + label
 * chips rendered on the map) and the LAYERS side panel rows.
 * deck.gl colors use the raw `symbology` tokens (canvas can't read CSS vars).
 */

// ── deck.gl symbology ──────────────────────────────────────────────────

export const layerColors = {
  aircraft: hexToRgba(symbology.aircraft),
  drone: hexToRgba(symbology.drone),
  missile: hexToRgba(symbology.missile),
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

export const groupTitle: SxProps<Theme> = {
  ...microLabel,
  fontSize: 9.5,
  color: 'text.secondary',
  px: 1,
  pt: 1,
  pb: 0.5,
};

export const layerRow: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  px: 1,
  py: 0.25,
  borderRadius: 0.75,
  cursor: 'pointer',
  '&:hover': { bgcolor: `color-mix(in srgb, ${palette.accent} 8%, transparent)` },
};

export const layerSwatch = (color: string): SxProps<Theme> => ({
  width: 9,
  height: 9,
  borderRadius: '2px',
  bgcolor: color,
  flexShrink: 0,
});

export const layerLabel: SxProps<Theme> = {
  flex: 1,
  fontSize: 13,
  color: 'text.primary',
};

export const layerCount: SxProps<Theme> = {
  fontFamily: fonts.mono,
  fontSize: 11,
  color: 'text.secondary',
};
