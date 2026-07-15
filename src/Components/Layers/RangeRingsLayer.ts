import { ScatterplotLayer } from '@deck.gl/layers';
import type { DroneTarget } from '../../stores/DroneStore';
import { layerColors } from '../../styles/features/layers.styles';

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
    getLineColor: layerColors.rangeRing,
    getLineWidth: 2,
    lineWidthUnits: 'pixels',
    lineWidthMinPixels: 1,
  });
}
