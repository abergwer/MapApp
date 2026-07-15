import { makeAutoObservable } from 'mobx';
import { MOCK_AIRCRAFT } from '../mocks/mockData';

export interface AirCraftTarget {
  id: string;
  position: [number, number];
  icon: string;
  /** Degrees clockwise from north. */
  heading: number;
  altitudeFt: number;
  speedKts: number;
}

export class AirCraftStore {
  targets: AirCraftTarget[] = MOCK_AIRCRAFT;

  constructor() {
    makeAutoObservable(this);
  }

  setTargets(targets: AirCraftTarget[]) {
    this.targets = targets;
  }

  upsert(target: AirCraftTarget) {
    const idx = this.targets.findIndex((t) => t.id === target.id);
    if (idx === -1) {
      this.targets.push(target);
    } else {
      this.targets[idx] = target;
    }
  }

  remove(id: string) {
    this.targets = this.targets.filter((t) => t.id !== id);
  }
}
