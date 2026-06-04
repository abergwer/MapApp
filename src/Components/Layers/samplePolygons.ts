import { PolygonLayer } from '@deck.gl/layers';

export const samplePolygonsLayer = new PolygonLayer({
  id: 'sample-polygons',
  data: [
    // Tel Aviv
    {
      contour: [
        [34.77, 32.07],
        [34.80, 32.07],
        [34.80, 32.10],
        [34.77, 32.10],
      ] as [number, number][],
    },
    // New York (Times Square area)
    {
      contour: [
        [-73.9855, 40.7580],
        [-73.9900, 40.7520],
        [-73.9970, 40.7610],
        [-73.9890, 40.7660],
      ] as [number, number][],
    },
    // London
    {
      contour: [
        [-0.1278, 51.5074],
        [-0.1400, 51.5030],
        [-0.1450, 51.5150],
        [-0.1300, 51.5200],
      ] as [number, number][],
    },
    // Tokyo
    {
      contour: [
        [139.6917, 35.6895],
        [139.6800, 35.6800],
        [139.6700, 35.6950],
        [139.6900, 35.7050],
      ] as [number, number][],
    },
    // Sydney
    {
      contour: [
        [151.2093, -33.8688],
        [151.1900, -33.8750],
        [151.1800, -33.8600],
        [151.2050, -33.8500],
      ] as [number, number][],
    },
    // Cape Town
    {
      contour: [
        [18.4241, -33.9249],
        [18.4100, -33.9350],
        [18.3950, -33.9200],
        [18.4200, -33.9050],
      ] as [number, number][],
    },
    // Rio de Janeiro
    {
      contour: [
        [-43.1729, -22.9068],
        [-43.1900, -22.9200],
        [-43.2100, -22.9000],
        [-43.1800, -22.8850],
      ] as [number, number][],
    },
    // Reykjavik
    {
      contour: [
        [-21.9426, 64.1466],
        [-21.9700, 64.1400],
        [-21.9800, 64.1600],
        [-21.9500, 64.1700],
      ] as [number, number][],
    },
    // Israel triangle
    {
      contour: [
        [34.9896, 32.7940],
        [32.9896, 31.7940],
        [32.9896, 33.7940],
      ] as [number, number][],
    },
  ],
  getPolygon: (f) => f.contour,
  getFillColor: [255, 60, 60, 180],
  getLineColor: [200, 0, 0, 255],
  getLineWidth: 3,
  lineWidthUnits: 'pixels',
  lineWidthMinPixels: 2,
  filled: true,
  stroked: true,
});
