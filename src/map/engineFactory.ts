import { selectedMapEngine } from './mapConfig';
import type { MapEngine } from './mapEngine/MapEngine';

// Engines are loaded on demand so that a heavy engine (e.g. Cesium) is only
// downloaded when it is actually selected, keeping it out of the main bundle.
export async function createMapEngine(): Promise<MapEngine> {
  switch (selectedMapEngine) {
    case 'maplibre': {
      const { MapLibreEngine } = await import('./mapEngine/MapLibreEngine');
      return new MapLibreEngine();
    }
    case 'cesium': {
      const { CesiumEngine } = await import('./mapEngine/CesiumEngine');
      return new CesiumEngine();
    }
    case 'leaflet':
    default: {
      const { LeafletEngine } = await import('./mapEngine/LeafletEngine');
      return new LeafletEngine();
    }
  }
}
