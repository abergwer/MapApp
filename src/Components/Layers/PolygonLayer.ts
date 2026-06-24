import { PolygonLayer } from '@deck.gl/layers';
import type { PolygonFeature } from '../../stores/PolygonStore';

export function createPolygonLayer(polygons: PolygonFeature[]) {
  return new PolygonLayer<PolygonFeature>({
    id: 'sample-polygons',
    data: polygons,
    getPolygon: (f) => f.contour,
    getFillColor: [255, 60, 60, 180],
    getLineColor: [200, 0, 0, 255],
    getLineWidth: 3,
    lineWidthUnits: 'pixels',
    lineWidthMinPixels: 2,
    filled: true,
    stroked: true,
  });
}
