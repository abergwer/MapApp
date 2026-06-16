import type { MapEngineType } from './mapEngine/MapEngine';

export const selectedMapEngine: MapEngineType = 'leaflet';

export const mapEngineLabel = {
  leaflet: 'Leaflet',
  maplibre: 'MapLibre',
  cesium: 'Cesium',
};
