import { PolygonLayer } from '@deck.gl/layers';
import type { PolygonFeature } from '../../stores/PolygonStore';
import { layerColors } from '../layers.styles';

export function createPolygonLayer(polygons: PolygonFeature[]) {
  return new PolygonLayer<PolygonFeature>({
    id: 'sample-polygons',
    data: polygons,
    getPolygon: (f) => f.contour,
    getFillColor: layerColors.areaFill,
    getLineColor: layerColors.areaLine,
    getLineWidth: 2,
    lineWidthUnits: 'pixels',
    lineWidthMinPixels: 2,
    filled: true,
    stroked: true,
  });
}
