import type { Layer } from '@deck.gl/core';
import { samplePolygonsLayer } from './samplePolygons';
import { createMissilesLayer } from './MissileLayer';
import { DroneLayer } from './DroneLayer';

// Register layers here. Each entry is imported from its own file.
// To add a new layer: create a file in this folder and add it to this array.
const registeredLayers: Layer[] = [
  samplePolygonsLayer,
  createMissilesLayer,
  DroneLayer,
];

export default registeredLayers;
