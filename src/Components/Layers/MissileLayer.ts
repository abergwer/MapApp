import { IconLayer, PathLayer, TextLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import missileIcon from '../../assets/missile.png';
import type { Missile } from '../../stores/MissileStore';
import { layerColors, targetLabelProps } from '../../styles/features/layers.styles';

const head = (d: Missile) => d.path[d.path.length - 1];

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
    new IconLayer<Missile>({
      id: 'missile-heads',
      data: missiles,
      getPosition: head,
      getIcon: () => ({ url: missileIcon, width: 32, height: 32, mask: true }),
      getSize: (d) => (isSelected(d) ? 34 : 26),
      getColor: layerColors.missile,
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

