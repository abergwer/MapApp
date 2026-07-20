import { makeAutoObservable, observable } from 'mobx';
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
    // Live feeds replace the whole array every tick — shallow tracking
    // avoids deep-proxying thousands of fresh target objects per frame.
    makeAutoObservable(this, { targets: observable.shallow });
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
