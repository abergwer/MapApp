import { makeAutoObservable } from 'mobx';

export type BaseMap = 'dark' | 'satellite';

export class MapStyleStore {
  /** Basemap brightness, 0–120%. */
  brightness = 100;
  baseMap: BaseMap = 'dark';

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
