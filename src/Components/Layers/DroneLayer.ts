import { IconLayer } from '@deck.gl/layers';
import droneIcon from '../../assets/drone.png';
import type { DroneTarget } from '../../stores/DroneStore';

export function createDroneLayer(targets: DroneTarget[]) {
  return new IconLayer<DroneTarget>({
    id: 'drone-layer',
    data: targets,
    getPosition: (d) => d.position,
    getIcon: () => ({
      url: droneIcon,
      width: 24,
      height: 24,
    }),
    getSize: 28,
    getColor: [255, 0, 0],
  });
}
