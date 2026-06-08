import type { MapEngineType } from './MapEngine';

export const selectedMapEngine: MapEngineType = 'maplibre'; // Change this value to switch engines (e.g. 'leaflet', 'cesium')

export const mapEngineLabel = {
  leaflet: 'Leaflet',
  maplibre: 'MapLibre',
  cesium: 'Cesium',
};
