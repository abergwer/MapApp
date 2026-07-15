import { makeAutoObservable } from 'mobx';

export type BaseMap = 'light' | 'satellite';

/** Default satellite look: dimmed, desaturated, slightly higher contrast. */
export const SATELLITE_DEFAULT_BRIGHTNESS = 58;

export class MapStyleStore {
  /** Basemap brightness, 0–120%. */
  brightness = SATELLITE_DEFAULT_BRIGHTNESS;
  baseMap: BaseMap = 'satellite';

  constructor() {
    makeAutoObservable(this);
  }

  setBrightness(value: number) {
    this.brightness = value;
  }

  setBaseMap(value: BaseMap) {
    this.baseMap = value;
  }
}
