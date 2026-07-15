import { makeAutoObservable } from 'mobx';
import airCraftIcon from '../assets/aircraft.png';
import { targetMotionConfig } from '../config/targetMotion.config';
import type { TargetTelemetry } from './types/trackedTarget';

export interface AirCraftTarget extends TargetTelemetry {
  id: string;
  icon: string;
}

const { defaults } = targetMotionConfig;

function seed(
  id: string,
  position: [number, number],
  headingDeg: number,
  extras: Partial<Pick<AirCraftTarget, 'altitudeM' | 'speedMps' | 'pitchDeg'>> = {},
): AirCraftTarget {
  return {
    id,
    position,
    icon: airCraftIcon,
    altitudeM: extras.altitudeM ?? defaults.aircraftAltitudeM,
    headingDeg,
    speedMps: extras.speedMps ?? defaults.aircraftSpeedMps,
    pitchDeg: extras.pitchDeg ?? defaults.pitchDeg,
    rollDeg: 0,
    trail: [position],
  };
}

const seedTargets: AirCraftTarget[] = [
  seed('t1', [34.4206, 31.8167], 35),
  seed('t2', [35.01, 32.75], 120, { altitudeM: 2800, speedMps: 110, pitchDeg: 2 }),
  seed('t3', [34.9, 31.25], 210, { altitudeM: 3500, speedMps: 88, pitchDeg: 1 }),
  seed('t4', [35.58, 33.05], 280, { altitudeM: 2400, speedMps: 100, pitchDeg: 0.5 }),
  seed('t5', [34.3, 31.5], 45, { altitudeM: 3000, speedMps: 92, pitchDeg: 1.2 }),
  seed('t6', [35.47, 32.9], 160, { altitudeM: 2600, speedMps: 105, pitchDeg: 1.8 }),
  seed('t7', [34.97, 29.56], 10, { altitudeM: 4000, speedMps: 120, pitchDeg: 2.5 }),
  seed('t8', [35.3, 32.5], 300, { altitudeM: 2200, speedMps: 85, pitchDeg: 0.8 }),
  seed('t9', [34.6, 32.05], 75, { altitudeM: 3100, speedMps: 98, pitchDeg: 1.4 }),
  seed('t10', [35.15, 31.9], 250, { altitudeM: 2700, speedMps: 90, pitchDeg: 1 }),
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

  get(id: string): AirCraftTarget | undefined {
    return this.targets.find((t) => t.id === id);
  }
}
