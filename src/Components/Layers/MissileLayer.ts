import { IconLayer, PathLayer, TextLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import type { Missile } from '../../stores/MissileStore';
import { layerColors, targetLabelProps } from '../../styles/features/layers.styles';
import { hexToRgba, symbology } from '../../styles/system-ui/tokens';

const head = (d: Missile) => d.path[d.path.length - 1];

/**
 * Shahed-style delta-wing silhouette (nose up = heading 0°), inlined as an
 * SVG data URL. Rendered with `mask: true` so deck tints it per feature.
 */
const DELTA_ICON = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">` +
  `<path d="M32 2 L62 50 L38 44 L36 60 L28 60 L26 44 L2 50 Z" fill="#000"/>` +
  `</svg>`,
)}`;

export function createMissilesLayer(
  missiles: Missile[],
  selectedId: string | null = null,
): Layer[] {
  const isSelected = (d: Missile) => d.id === selectedId;
  return [
    new PathLayer<Missile>({
      id: 'missiles-layer',
      data: missiles,
      getPath: (d) => d.path,
      getColor: (d) => (isSelected(d) ? layerColors.missile : layerColors.missileTrack),
      getWidth: (d) => (isSelected(d) ? 5 : 2),
      widthUnits: 'pixels',
      capRounded: true,
      jointRounded: true,
    }),
    // Delta-wing icon at the track head, rotated along the flight direction.
    new IconLayer<Missile>({
      id: 'missile-heads',
      data: missiles,
      getPosition: head,
      getIcon: () => ({ url: DELTA_ICON, width: 64, height: 64, mask: true }),
      getSize: (d) => (isSelected(d) ? 34 : 24),
      getColor: (d) => (isSelected(d) ? layerColors.missile : hexToRgba(symbology.bg, 235)),
      getAngle: (d) => -d.heading,
    }),
    new TextLayer<Missile>({
      id: 'missile-labels',
      data: missiles,
      getPosition: head,
      getText: (d) => d.id,
      ...targetLabelProps,
    }),
  ];
}

