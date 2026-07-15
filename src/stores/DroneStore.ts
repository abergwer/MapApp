import { makeAutoObservable } from 'mobx';
import { MOCK_DRONES } from '../mocks/mockData';

export interface DroneTarget {
  id: string;
  position: [number, number];
  icon: string;
  /** Degrees clockwise from north. */
  heading: number;
  altitudeFt: number;
  speedKts: number;
}

export class DroneStore {
  targets: DroneTarget[] = MOCK_DRONES;

  constructor() {
    makeAutoObservable(this);
  }

  setTargets(targets: DroneTarget[]) {
    this.targets = targets;
  }

  upsert(target: DroneTarget) {
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
