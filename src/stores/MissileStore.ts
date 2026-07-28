import { makeAutoObservable, observable } from 'mobx';
import { MOCK_MISSILES } from '../mocks/mockData';

export interface Missile {
  id: string;
  path: [number, number][];
  /** Degrees clockwise from north (derived from the trajectory). */
  heading: number;
  /** Attitude, degrees. */
  pitch: number;
  roll: number;
  speedKts: number;
  altitudeFt: number;
}

export class MissileStore {
  missiles: Missile[] = MOCK_MISSILES;
  /** Missile selected in the panel (drives map highlight + 3D view). */
  selectedId: string | null = null;

  constructor() {
    // The live feed replaces the whole array at 10Hz — shallow tracking
    // avoids deep-proxying every missile (path arrays included) per tick.
    makeAutoObservable(this, { missiles: observable.shallow });
  }

  setSelectedId(id: string | null) {
    this.selectedId = id;
  }

  get selected(): Missile | undefined {
    return this.missiles.find((m) => m.id === this.selectedId);
  }

  setAll(missiles: Missile[]) {
    this.missiles = missiles;
  }

  upsert(missile: Missile) {
    const idx = this.missiles.findIndex((m) => m.id === missile.id);
    if (idx === -1) {
      this.missiles.push(missile);
    } else {
      this.missiles[idx] = missile;
    }
  }

  remove(id: string) {
    this.missiles = this.missiles.filter((m) => m.id !== id);
  }
}
