import type { MapEngineType } from './mapEngine/MapEngine';

export const selectedMapEngine: MapEngineType = 'maplibre';  // default engine; can be changed at runtime via the MapStyleBar

export const mapEngineLabel = {
  leaflet: 'Leaflet',
  maplibre: 'MapLibre',
  cesium: 'Cesium',
};
