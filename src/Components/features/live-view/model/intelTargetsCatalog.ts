import type { AirCraftTarget } from '../../../../stores/AirCraftStore';
import type { DroneTarget } from '../../../../stores/DroneStore';
import {
  intelFeedConfig,
  type IntelFeedFilterId,
  type IntelTargetKind,
} from '../config/intelFeed.config';

export interface IntelTargetItem {
  /** Unique across stores (`aircraft:t1` vs `drone:t1`). */
  key: string;
  id: string;
  kind: IntelTargetKind;
  label: string;
  kindLabel: string;
  iconUrl: string;
  position: [number, number];
  headingDeg: number;
  speedMps: number;
  altitudeM: number;
}

function padIndex(index: number): string {
  return String(index + 1).padStart(2, '0');
}

function mapAircraft(targets: AirCraftTarget[]): IntelTargetItem[] {
  const kind = intelFeedConfig.kinds.aircraft;
  return targets.map((t, index) => ({
    key: `aircraft:${t.id}`,
    id: t.id,
    kind: 'aircraft',
    label: `${kind.namePrefix}-${padIndex(index)}`,
    kindLabel: kind.label,
    iconUrl: t.icon || kind.iconPath,
    position: t.position,
    headingDeg: t.headingDeg,
    speedMps: t.speedMps,
    altitudeM: t.altitudeM,
  }));
}

function mapDrones(targets: DroneTarget[]): IntelTargetItem[] {
  const kind = intelFeedConfig.kinds.drone;
  return targets.map((t, index) => ({
    key: `drone:${t.id}`,
    id: t.id,
    kind: 'drone',
    label: `${kind.namePrefix}-${padIndex(index)}`,
    kindLabel: kind.label,
    iconUrl: t.icon || kind.iconPath,
    position: t.position,
    headingDeg: t.headingDeg,
    speedMps: t.speedMps,
    altitudeM: t.altitudeM,
  }));
}

/** Merge aircraft + drone stores into one intel targets list (aircraft first). */
export function buildIntelTargetList(
  aircraft: AirCraftTarget[],
  drones: DroneTarget[],
): IntelTargetItem[] {
  return [...mapAircraft(aircraft), ...mapDrones(drones)];
}

export function filterIntelTargets(
  targets: IntelTargetItem[],
  filter: IntelFeedFilterId,
): IntelTargetItem[] {
  if (filter === 'all') return targets;
  return targets.filter((t) => t.kind === filter);
}

export function countIntelByKind(targets: IntelTargetItem[]): Record<IntelTargetKind, number> {
  return {
    aircraft: targets.filter((t) => t.kind === 'aircraft').length,
    drone: targets.filter((t) => t.kind === 'drone').length,
  };
}
