import { ScatterplotLayer } from '@deck.gl/layers';
import type { DroneTarget } from '../../stores/DroneStore';
import { layerColors } from '../../styles/features/layers.styles';

interface RangeRing {
  position: [number, number];
  radius: number;
}

const RING_RADII = [100, 200, 500, 750];

/**
 * Ring data derived per targets-array reference. `buildLayers` runs on every
 * fast tick (missiles, 100 ms) but drones update ~1 Hz — rebuilding
 * targets×4 ring objects each tick churned GC and, because the `data` ref
 * changed, forced deck.gl to re-upload the layer's attributes every tick.
 * Caching on the array ref keeps `data` stable until drones really move.
 */
let ringCacheKey: DroneTarget[] | undefined;
let ringCache: RangeRing[] = [];

function ringData(targets: DroneTarget[]): RangeRing[] {
  if (targets !== ringCacheKey) {
    ringCacheKey = targets;
    ringCache = targets.flatMap((target) =>
      RING_RADII.map((radius) => ({ position: target.position, radius })),
    );
  }
  return ringCache;
}

export function createRangeRingsLayer(targets: DroneTarget[]) {
  return new ScatterplotLayer<RangeRing>({
    id: 'range-rings',
    data: ringData(targets),
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
