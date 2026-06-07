import { selectedMapEngine } from './mapConfig';
import type { MapEngine } from './MapEngine';
import { LeafletEngine } from './LeafletEngine';
import { MapLibreEngine } from './MapLibreEngine';
import { CesiumEngine } from './CesiumEngine';

export function createMapEngine(): MapEngine {
  switch (selectedMapEngine) {
    case 'maplibre':
      return new MapLibreEngine();
    case 'cesium':
      return new CesiumEngine();
    case 'leaflet':
    default:
      return new LeafletEngine();
  }
}
