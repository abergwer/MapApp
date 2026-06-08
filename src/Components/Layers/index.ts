import type { Layer } from '@deck.gl/core';
import { polygonLayer } from './PolygonLayer';
import { createMissilesLayer } from './MissileLayer';
import { DroneLayer } from './DroneLayer';
import { AirCraftLayer } from './AirCraftLayer';

// Register layers here. Each entry is imported from its own file.
// To add a new layer: create a file in this folder and add it to this array.
const registeredLayers: Layer[] = [
  polygonLayer,
  createMissilesLayer,
  DroneLayer,
  AirCraftLayer,
];

export default registeredLayers;
