import { makeAutoObservable } from 'mobx';
import droneIcon from '../assets/drone.png';

export interface DroneTarget {
  id: string;
  position: [number, number];
  icon: string;
}

const seedTargets: DroneTarget[] = [
  { id: 't1', position: [34.7818, 32.0853], icon: droneIcon }, // Tel Aviv
  { id: 't2', position: [34.9885, 32.7940], icon: droneIcon }, // Haifa
  { id: 't3', position: [34.8555, 32.1093], icon: droneIcon }, // Herzliya
  { id: 't4', position: [35.2137, 31.7683], icon: droneIcon }, // Jerusalem
  { id: 't5', position: [34.9519, 29.5577], icon: droneIcon }, // Eilat
  { id: 't6', position: [35.3027, 32.9216], icon: droneIcon }, // Nazareth
  { id: 't7', position: [34.5742, 31.6693], icon: droneIcon }, // Ashdod
  { id: 't8', position: [34.7930, 31.2518], icon: droneIcon }, // Be'er Sheva
];

export class DroneStore {
  targets: DroneTarget[] = seedTargets;

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
