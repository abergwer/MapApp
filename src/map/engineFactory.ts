import { selectedMapEngine } from './mapConfig';
import type { MapEngine } from './MapEngine';
import { LeafletEngine } from './LeafletEngine';
import { MapLibreEngine } from './MapLibreEngine';

export function createMapEngine(): MapEngine {
  switch (selectedMapEngine) {
    case 'maplibre':
      return new MapLibreEngine();
    case 'leaflet':
    default:
      return new LeafletEngine();
  }
}
