import { makeAutoObservable } from 'mobx';
import airCraftIcon from '../assets/aircraft.png';

export interface AirCraftTarget {
  id: string;
  position: [number, number];
  icon: string;
}

const seedTargets: AirCraftTarget[] = [
  { id: 't1', position: [34.4206, 31.8167], icon: airCraftIcon }, // Ashkelon coast
  { id: 't2', position: [35.0100, 32.7500], icon: airCraftIcon }, // Carmel
  { id: 't3', position: [34.9000, 31.2500], icon: airCraftIcon }, // Negev north
  { id: 't4', position: [35.5800, 33.0500], icon: airCraftIcon }, // Upper Galilee
  { id: 't5', position: [34.3000, 31.5000], icon: airCraftIcon }, // Gaza border
  { id: 't6', position: [35.4700, 32.9000], icon: airCraftIcon }, // Sea of Galilee
  { id: 't7', position: [34.9700, 29.5600], icon: airCraftIcon }, // Eilat mountains
  { id: 't8', position: [35.3000, 32.5000], icon: airCraftIcon }, // West Bank hills
  { id: 't9', position: [34.6000, 32.0500], icon: airCraftIcon }, // Central coastal plain
  { id: 't10', position: [35.1500, 31.9000], icon: airCraftIcon }, // Jerusalem outskirts
];

export class AirCraftStore {
  targets: AirCraftTarget[] = seedTargets;

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
