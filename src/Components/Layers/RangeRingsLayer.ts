import { ScatterplotLayer } from '@deck.gl/layers';
import { targets } from './DroneLayer';

export const RangeRingsLayer = new ScatterplotLayer({
  id: 'range-rings',
  data: targets.flatMap(target => [
    { ...target, radius: 100 },
    { ...target, radius: 200 },
    { ...target, radius: 500 },
    { ...target, radius: 750 },
  ]),

  getPosition: d => d.position,
  getRadius: d => d.radius,

  stroked: true,
  filled: false,

  getLineColor: [255, 0, 0, 180],
   getLineWidth: 10,
  lineWidthMinPixels: 5,
});