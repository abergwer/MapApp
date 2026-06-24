import { IconLayer } from '@deck.gl/layers';
import airCraftIcon from '../../assets/aircraft.png';
import type { AirCraftTarget } from '../../stores/AirCraftStore';

export function createAirCraftLayer(targets: AirCraftTarget[]) {
  return new IconLayer<AirCraftTarget>({
    id: 'aircraft-layer',
    data: targets,
    getPosition: (d) => d.position,
    getIcon: () => ({
      url: airCraftIcon,
      width: 30,
      height: 30,
    }),
    getSize: 30,
    getColor: [255, 0, 0],
  });
}
