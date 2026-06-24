import { ScatterplotLayer } from '@deck.gl/layers';
import type { DroneTarget } from '../../stores/DroneStore';

interface RangeRing extends DroneTarget {
  radius: number;
}

const RING_RADII = [100, 200, 500, 750];

export function createRangeRingsLayer(targets: DroneTarget[]) {
  const data: RangeRing[] = targets.flatMap((target) =>
    RING_RADII.map((radius) => ({ ...target, radius })),
  );

  return new ScatterplotLayer<RangeRing>({
    id: 'range-rings',
    data,
    getPosition: (d) => d.position,
    getRadius: (d) => d.radius,
    stroked: true,
    filled: false,
    getLineColor: [255, 0, 0, 180],
    getLineWidth: 10,
    lineWidthMinPixels: 5,
  });
}
