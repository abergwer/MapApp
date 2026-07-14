import config from '../../../../../config.json';
import type { MapEngine } from '../../../../map/mapEngine/MapEngine';
import type { BaseMap, MapStyleStore } from '../../../../stores/MapStyleStore';

/** Apply a basemap style using the existing engine + store path. */
export function setBaseMapStyle(
  engine: MapEngine | null,
  store: MapStyleStore,
  baseMap: BaseMap,
): void {
  if (!engine?.setBaseMap) return;
  engine.setBaseMap(config.MapStyles[baseMap]);
  store.setBaseMap(baseMap);
}

export function supportsBaseMapSwitch(engine: MapEngine | null): boolean {
  return Boolean(engine?.setBaseMap);
}
