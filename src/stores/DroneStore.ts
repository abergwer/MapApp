import { makeAutoObservable } from 'mobx';
import droneIcon from '../assets/drone.png';
import { targetMotionConfig } from '../config/targetMotion.config';
import type { TargetTelemetry } from './types/trackedTarget';

export interface DroneTarget extends TargetTelemetry {
  id: string;
  icon: string;
}

const { defaults } = targetMotionConfig;

function seed(
  id: string,
  position: [number, number],
  headingDeg: number,
  extras: Partial<Pick<DroneTarget, 'altitudeM' | 'speedMps' | 'pitchDeg'>> = {},
): DroneTarget {
  return {
    id,
    position,
    icon: droneIcon,
    altitudeM: extras.altitudeM ?? defaults.droneAltitudeM,
    headingDeg,
    speedMps: extras.speedMps ?? defaults.droneSpeedMps,
    pitchDeg: extras.pitchDeg ?? defaults.pitchDeg,
    rollDeg: 0,
    trail: [position],
  };
}

const seedTargets: DroneTarget[] = [
  seed('t1', [34.7818, 32.0853], 55),
  seed('t2', [34.9885, 32.794], 140, { altitudeM: 150, speedMps: 32, pitchDeg: 1 }),
  seed('t3', [34.8555, 32.1093], 200, { altitudeM: 200, speedMps: 25, pitchDeg: 0.5 }),
  seed('t4', [35.2137, 31.7683], 310, { altitudeM: 220, speedMps: 30, pitchDeg: 1.2 }),
  seed('t5', [34.9519, 29.5577], 20, { altitudeM: 160, speedMps: 26, pitchDeg: 0.8 }),
  seed('t6', [35.3027, 32.9216], 95, { altitudeM: 190, speedMps: 29, pitchDeg: 1 }),
  seed('t7', [34.5742, 31.6693], 265, { altitudeM: 170, speedMps: 27, pitchDeg: 0.6 }),
  seed('t8', [34.793, 31.2518], 175, { altitudeM: 210, speedMps: 31, pitchDeg: 1.1 }),
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

  get(id: string): DroneTarget | undefined {
    return this.targets.find((t) => t.id === id);
  }
}
