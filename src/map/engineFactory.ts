import { selectedMapEngine } from './mapConfig';
import type { MapEngine } from './MapEngine';

// Engines are loaded on demand so that a heavy engine (e.g. Cesium) is only
// downloaded when it is actually selected, keeping it out of the main bundle.
export async function createMapEngine(): Promise<MapEngine> {
  switch (selectedMapEngine) {
    case 'maplibre': {
      const { MapLibreEngine } = await import('./MapLibreEngine');
      return new MapLibreEngine();
    }
    case 'cesium': {
      const { CesiumEngine } = await import('./CesiumEngine');
      return new CesiumEngine();
    }
    case 'leaflet':
    default: {
      const { LeafletEngine } = await import('./LeafletEngine');
      return new LeafletEngine();
    }
  }
}
