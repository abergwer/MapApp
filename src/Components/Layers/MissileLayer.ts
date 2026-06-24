import { PathLayer } from '@deck.gl/layers';
import type { Missile } from '../../stores/MissileStore';

export function createMissilesLayer(missiles: Missile[]) {
  return new PathLayer<Missile>({
    id: 'missiles-layer',
    data: missiles,
    getPath: (d) => d.path,
    getColor: [255, 80, 0],
    widthMinPixels: 4,
    widthMaxPixels: 14,
    capRounded: true,
    jointRounded: true,
  });
}

