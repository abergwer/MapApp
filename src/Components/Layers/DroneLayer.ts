import { IconLayer, TextLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import droneIcon from '../../assets/drone.png';
import type { DroneTarget } from '../../stores/DroneStore';
import { layerColors, targetLabelProps } from '../../styles/features/layers.styles';

const label = (d: DroneTarget) =>
  `${d.id}\nALT ${d.altitudeFt} ft\nSPD ${d.speedKts} kts`;

export function createDroneLayer(targets: DroneTarget[]): Layer[] {
  return [
    new IconLayer<DroneTarget>({
      id: 'drone-layer',
      data: targets,
      getPosition: (d) => d.position,
      getIcon: () => ({ url: droneIcon, width: 24, height: 24, mask: true }),
      getSize: 28,
      getColor: layerColors.drone,
    }),
    new TextLayer<DroneTarget>({
      id: 'drone-labels',
      data: targets,
      getPosition: (d) => d.position,
      getText: label,
      ...targetLabelProps,
    }),
  ];
}
