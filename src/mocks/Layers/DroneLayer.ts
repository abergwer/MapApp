import { IconLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import droneIcon from '../../assets/drone.png';
import type { DroneTarget } from '../../stores/DroneStore';
import { layerColors } from '../layers.styles';

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
    // new TextLayer<DroneTarget>({
    //   id: 'drone-labels',
    //   data: targets,
    //   getPosition: (d) => d.position,
    //   getText: label,
    //   ...targetLabelProps,
    // }),
  ];
}
