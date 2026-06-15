import type { MapEngineType } from './mapEngine/MapEngine';

export const selectedMapEngine: MapEngineType = 'maplibre';

export const mapEngineLabel = {
  leaflet: 'Leaflet',
  maplibre: 'MapLibre',
  cesium: 'Cesium',
};
