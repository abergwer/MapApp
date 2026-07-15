import destination from '@turf/destination';
import { point } from '@turf/helpers';
import type { RootStore } from './RootStore';
import type { AirCraftTarget } from './AirCraftStore';
import type { DroneTarget } from './DroneStore';
import { targetMotionConfig } from '../config/targetMotion.config';

/**
 * Single writer for live target motion simulation.
 * Mutates AirCraftStore / DroneStore via upsert — map Deck layers + Intel + 3D
 * all observe those stores (same pattern as EntityService → DrawingToolStore).
 */
export class TargetMotionService {
  private rafId = 0;
  private lastTs = 0;
  private accumSec = 0;
  private running = false;

  constructor(private readonly root: RootStore) {}

  start() {
    if (this.running || !targetMotionConfig.enabled) return;
    this.running = true;
    this.lastTs = 0;
    this.accumSec = 0;
    const loop = (ts: number) => {
      if (!this.running) return;
      if (this.lastTs === 0) this.lastTs = ts;
      const dtSec = Math.min((ts - this.lastTs) / 1000, 0.1);
      this.lastTs = ts;
      this.accumSec += dtSec;
      // ~20 Hz store writes — enough for map + 3D without flooding React.
      if (this.accumSec >= 0.05) {
        this.step(this.accumSec);
        this.accumSec = 0;
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.lastTs = 0;
    this.accumSec = 0;
  }

  private step(dtSec: number) {
    if (dtSec <= 0) return;
    if (targetMotionConfig.moveAircraft) {
      for (const t of this.root.airCraftStore.targets) {
        this.root.airCraftStore.upsert(this.advanceAircraft(t, dtSec));
      }
    }
    if (targetMotionConfig.moveDrones) {
      for (const t of this.root.droneStore.targets) {
        this.root.droneStore.upsert(this.advanceDrone(t, dtSec));
      }
    }
  }

  private advanceAircraft(t: AirCraftTarget, dtSec: number): AirCraftTarget {
    const { headingDeg, rollDeg } = this.nextAttitude(t.headingDeg, t.rollDeg, dtSec, t.id);
    const position = advanceLngLat(t.position, t.speedMps, headingDeg, dtSec);
    return {
      ...t,
      position,
      headingDeg,
      rollDeg,
      pitchDeg: t.pitchDeg,
      trail: pushTrail(t.trail, t.position, position),
    };
  }

  private advanceDrone(t: DroneTarget, dtSec: number): DroneTarget {
    const { headingDeg, rollDeg } = this.nextAttitude(t.headingDeg, t.rollDeg, dtSec, t.id);
    const position = advanceLngLat(t.position, t.speedMps, headingDeg, dtSec);
    return {
      ...t,
      position,
      headingDeg,
      rollDeg,
      pitchDeg: t.pitchDeg,
      trail: pushTrail(t.trail, t.position, position),
    };
  }

  private nextAttitude(
    headingDeg: number,
    rollDeg: number,
    dtSec: number,
    id: string,
  ): { headingDeg: number; rollDeg: number } {
    const { headingDrift, bank } = targetMotionConfig;
    let nextHeading = headingDeg;
    if (headingDrift.enabled) {
      // Deterministic per-id wobble (no Math.random — stable / testable).
      const phase = hash01(id) * Math.PI * 2;
      const drift =
        Math.sin(performance.now() / 1000 + phase) * headingDrift.maxDegPerSec * dtSec;
      nextHeading = normalizeHeading(headingDeg + drift);
    }
    const headingDelta = shortestAngleDelta(headingDeg, nextHeading);
    let nextRoll = rollDeg;
    if (bank.enabled) {
      const targetRoll = clamp(
        headingDelta * bank.rollPerHeadingDelta * 60,
        -bank.maxRollDeg,
        bank.maxRollDeg,
      );
      nextRoll = rollDeg + (targetRoll - rollDeg) * Math.min(1, dtSec * 3);
    }
    return { headingDeg: nextHeading, rollDeg: nextRoll };
  }
}

function advanceLngLat(
  position: [number, number],
  speedMps: number,
  headingDeg: number,
  dtSec: number,
): [number, number] {
  const distanceKm = (speedMps * dtSec) / 1000;
  if (distanceKm <= 0) return position;
  const [lng, lat] = position;
  const moved = destination(point([lng, lat]), distanceKm, headingDeg, {
    units: 'kilometers',
  });
  const coords = moved.geometry.coordinates;
  return [coords[0], coords[1]];
}

function pushTrail(
  trail: [number, number][] | undefined,
  prev: [number, number],
  next: [number, number],
): [number, number][] {
  const { maxPoints, minStepKm } = targetMotionConfig.trail;
  const base = trail?.length ? trail : [prev];
  const last = base[base.length - 1] ?? prev;
  const stepKm = approxKm(last, next);
  if (stepKm < minStepKm) return base.slice(-maxPoints);
  return [...base, next].slice(-maxPoints);
}

/** Cheap equirectangular distance — good enough for trail sampling. */
function approxKm(a: [number, number], b: [number, number]): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const x = (lng2 - lng1) * Math.cos(((lat1 + lat2) * Math.PI) / 360);
  const y = lat2 - lat1;
  return Math.sqrt(x * x + y * y) * 111.32;
}

function normalizeHeading(deg: number): number {
  const n = deg % 360;
  return n < 0 ? n + 360 : n;
}

function shortestAngleDelta(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function hash01(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}
