import type { Layer } from '@deck.gl/core';
import { samplePolygonsLayer } from './samplePolygons';

// Register layers here. Each entry is imported from its own file.
// To add a new layer: create src/layers/myLayer.ts and add it to this array.
const registeredLayers: Layer[] = [
  samplePolygonsLayer,
];

export default registeredLayers;
