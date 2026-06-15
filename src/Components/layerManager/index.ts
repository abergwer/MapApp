import type { Layer } from '@deck.gl/core';
import { polygonLayer } from '../Layers/PolygonLayer';
import { createMissilesLayer } from '../Layers/MissileLayer';
import { DroneLayer } from '../Layers/DroneLayer';
import { AirCraftLayer } from '../Layers/AirCraftLayer';

// Register layers here. Each entry is imported from its own file.
// To add a new layer: create a file in this folder and add it to this array.
const registeredLayers: Layer[] = [
  polygonLayer,
  createMissilesLayer,
  DroneLayer,
  AirCraftLayer,
];

export default registeredLayers;
