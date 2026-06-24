import { makeAutoObservable } from 'mobx';

export type BaseMap = 'light' | 'satellite';

export class MapStyleStore {
  /** Basemap brightness, 0–120%. */
  brightness = 100;
  baseMap: BaseMap = 'light';

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
