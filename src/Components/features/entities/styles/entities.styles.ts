import type { SxProps, Theme } from '@mui/material/styles';
import { palette, fonts } from '../../../layout/styles/tokens';

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

/** Kind-row leading icon: accent color with a soft glow (reference). */
export const kindIcon: SxProps<Theme> = {
  fontSize: 18,
  color: palette.accent,
  filter: `drop-shadow(0 0 5px color-mix(in srgb, ${palette.accent} 75%, transparent))`,
};

export const kindLabel: SxProps<Theme> = {
  flex: 1,
  fontSize: 13,
  fontWeight: 600,
  color: 'text.primary',
  textAlign: 'center',
  // Reference design: entity titles glow softly.
  textShadow: '0 0 8px rgba(255, 255, 255, 0.35)',
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
  cursor: 'pointer',
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

// Shared search-input styling lives with the layers feature.
export { searchField } from '../../../systemUI/layers/styles/layers.styles';

/** Entity-type registry row: swatch, name, geometry draw buttons. */
export const typeRow: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  px: 1.25,
  py: 0.5,
  mb: 0.75,
  borderRadius: 1.5,
  bgcolor: palette.panel,
  border: `1px solid ${palette.border}`,
  '&:hover': { borderColor: palette.borderBright },
};

export const typeSwatch = (color: string): SxProps<Theme> => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  flex: 'none',
  bgcolor: color,
  boxShadow: `0 0 6px ${color}`,
});

export const typeName: SxProps<Theme> = {
  flex: 1,
  fontSize: 12.5,
  fontWeight: 600,
  color: 'text.primary',
};

/** Small geometry button inside a type row; lit while its draw is armed. */
export const geomButton = (active: boolean): SxProps<Theme> => ({
  p: 0.5,
  borderRadius: 1,
  color: active ? palette.accent : 'text.secondary',
  border: `1px solid ${active ? palette.accent : 'transparent'}`,
  ...(active && {
    bgcolor: `color-mix(in srgb, ${palette.accent} 14%, transparent)`,
    boxShadow: `0 0 8px color-mix(in srgb, ${palette.accent} 40%, transparent)`,
  }),
});

// ── Entity edit window (floating inspector over the map) ──────────────

/** Floating inspector card, absolutely positioned at (x, y). Above every
 *  other overlay (floating windows are 1300, tool strip 1100). */
export const editorCard = (x: number, y: number): SxProps<Theme> => ({
  position: 'absolute',
  zIndex: 1400,
  left: x,
  top: y,
  width: 324,
  maxHeight: 'calc(100% - 24px)',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 2,
  bgcolor: palette.panel,
  border: `1px solid ${palette.borderBright}`,
  boxShadow: '0 10px 32px rgba(0, 0, 0, 0.45)',
  overflow: 'hidden',
});

export const editorHeader: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  px: 1.25,
  py: 0.75,
  cursor: 'move',
  userSelect: 'none',
  borderBottom: `1px solid ${palette.border}`,
};

export const editorTitle: SxProps<Theme> = {
  flex: 1,
  fontSize: 13,
  fontWeight: 700,
  color: 'text.primary',
  textShadow: '0 0 8px rgba(255, 255, 255, 0.35)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export const editorBody: SxProps<Theme> = {
  p: 1.5,
  display: 'flex',
  flexDirection: 'column',
  // Roomy: MUI floating labels stick out above the outline — tight gaps
  // make consecutive fields overlap.
  gap: 1.75,
  overflowY: 'auto',
};

/** One labelled row of fields inside the inspector. */
export const editorRow: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

/** Leading label / row number in an editor row. */
export const editorRowLabel: SxProps<Theme> = {
  fontFamily: fonts.mono,
  fontSize: 10,
  color: 'text.secondary',
  width: 36,
  flex: 'none',
};

export const editorField: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
};

/** Scrollable geometry section (points table can get long). */
export const editorGeometry: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1.25,
  maxHeight: 240,
  overflowY: 'auto',
  // Leave headroom for the first row's floating labels.
  pt: 0.75,
};

/** Micro section label inside the inspector. */
export const dialogSectionLabel: SxProps<Theme> = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'text.secondary',
};

// ── Entity-type tree (panel) ────────────────────────────────────

/** Definition row: icon, name, one draw button per geometry; lit while armed. */
export const defRow = (active: boolean): SxProps<Theme> => ({
  display: 'flex',
  alignItems: 'center',
  // Rows with many geometries (e.g. the plain-graphic row) exceed the
  // ~300px panel column — let the draw buttons wrap instead of clipping.
  flexWrap: 'wrap',
  gap: 1,
  px: 1,
  py: 0.5,
  mb: 0.5,
  borderRadius: 1.5,
  bgcolor: palette.panel,
  border: `1px solid ${active ? palette.accent : palette.border}`,
  ...(active && {
    boxShadow: `0 0 8px color-mix(in srgb, ${palette.accent} 40%, transparent)`,
  }),
  '&:hover': { borderColor: active ? palette.accent : palette.borderBright },
});

export const defName: SxProps<Theme> = {
  flex: 1,
  fontSize: 12.5,
  fontWeight: 600,
  color: 'text.primary',
};

/** Micro section label inside the inspector. */
export const fieldLabel: SxProps<Theme> = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'text.secondary',
};

export const editInput: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  px: 1,
  py: 0.5,
  borderRadius: 1,
  bgcolor: palette.bg,
  border: `1px solid ${palette.border}`,
  '&:focus-within': { borderColor: palette.accent },
  '& input': {
    all: 'unset',
    flex: 1,
    minWidth: 0,
    fontSize: 12.5,
    color: palette.textPrimary,
    '&::placeholder': { color: palette.textDisabled },
  },
};

export const attrRow: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
};

export const attrKey: SxProps<Theme> = {
  fontFamily: fonts.mono,
  fontSize: 11,
  color: 'text.secondary',
  width: 86,
  flex: 'none',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

/** Row-number cell in the geometry points table. */
export const pointIndex: SxProps<Theme> = {
  fontFamily: fonts.mono,
  fontSize: 10,
  color: 'text.secondary',
  width: 16,
  flex: 'none',
  textAlign: 'right',
};

/** Tiny column header (LAT / LNG) above the points table. */
export const pointColHeader: SxProps<Theme> = {
  flex: 1,
  fontFamily: fonts.mono,
  fontSize: 9,
  letterSpacing: '0.08em',
  color: 'text.disabled',
  textAlign: 'center',
};

export const metaText: SxProps<Theme> = {
  fontFamily: fonts.mono,
  fontSize: 11,
  color: 'text.secondary',
};
