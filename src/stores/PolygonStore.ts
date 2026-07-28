import { makeAutoObservable } from 'mobx';
import { MOCK_POLYGONS } from '../mocks/mockData';

export interface PolygonFeature {
  contour: [number, number][];
}

export class PolygonStore {
  polygons: PolygonFeature[] = MOCK_POLYGONS;

  constructor() {
    makeAutoObservable(this);
  }

  setAll(polygons: PolygonFeature[]) {
    this.polygons = polygons;
  }

  add(polygon: PolygonFeature) {
    this.polygons.push(polygon);
  }

  clear() {
    this.polygons = [];
  }
}
