import type { AirCraftTarget } from '../stores/AirCraftStore';
import type { DroneTarget } from '../stores/DroneStore';
import type { Missile } from '../stores/MissileStore';
import type { PolygonFeature } from '../stores/PolygonStore';
import type { RootStore } from '../stores/RootStore';
import { newShapeId, type MapShape } from '../stores/shapes';
import airCraftIcon from '../assets/aircraft.png';
import droneIcon from '../assets/drone.png';

/**
 * ── THE single mock data source ────────────────────────────────────────
 *
 * Everything the UI presents today comes from this file: entity seeds and
 * a small ticker that simulates the live feed a real server will push
 * later. Swapping in the server means replacing this file with a client
 * that calls the exact same store setters (`setTargets` / `setAll`).
 */

// Playbox roughly covering Israel — targets are steered back inside it.
const BOUNDS = { minLng: 34.3, maxLng: 35.6, minLat: 31.3, maxLat: 33.1 };

/**
 * Ticker cadence. Movement is time-scaled, so a smaller TICK_MS only makes
 * the motion smoother — not faster. TIME_COMPRESSION is how many simulated
 * seconds pass per real second (1 = real-time speeds).
 */
const TICK_MS = 100;
const TIME_COMPRESSION = 3;
const SIM_SECONDS_PER_TICK = (TICK_MS / 1000) * TIME_COMPRESSION;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Generate `count` random targets inside the playbox. */
function generateTargets(
  count: number,
  opts: {
    idPrefix: string;
    icon: string;
    altitudeFt: [min: number, max: number];
    speedKts: [min: number, max: number];
  },
): AirCraftTarget[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${opts.idPrefix}-${String(i + 1).padStart(2, '0')}`,
    position: [rand(BOUNDS.minLng, BOUNDS.maxLng), rand(BOUNDS.minLat, BOUNDS.maxLat)] as [
      number,
      number,
    ],
    heading: Math.round(rand(0, 360)),
    altitudeFt: Math.round(rand(...opts.altitudeFt)),
    speedKts: Math.round(rand(...opts.speedKts)),
    icon: opts.icon,
  }));
}

export const generateAircraft = (count: number): AirCraftTarget[] =>
  generateTargets(count, { idPrefix: 'AC', icon: airCraftIcon, altitudeFt: [6000, 16000], speedKts: [250, 420] });

export const generateDrones = (count: number): DroneTarget[] =>
  generateTargets(count, { idPrefix: 'DRN', icon: droneIcon, altitudeFt: [800, 1500], speedKts: [85, 130] });

// ── Seeds ──────────────────────────────────────────────────────────────

export const MOCK_AIRCRAFT: AirCraftTarget[] = generateAircraft(800);

export const MOCK_DRONES: DroneTarget[] = generateDrones(600);

/**
 * Missiles are simulated as a sliding window over a precomputed straight
 * trajectory: each tick the visible track advances one step and loops.
 */
interface MissileTrack {
  id: string;
  trajectory: [number, number][];
}

const TRACK_STEPS = 60;
const TRACK_WINDOW = 8;
/** Trajectory steps advanced per simulated second (≈0.5 km/s — missile-ish). */
const MISSILE_STEPS_PER_SIM_SECOND = 0.3;
const MAX_STEP = TRACK_STEPS - TRACK_WINDOW;

function trajectory(from: [number, number], to: [number, number]): [number, number][] {
  return Array.from({ length: TRACK_STEPS }, (_, i) => {
    const t = i / (TRACK_STEPS - 1);
    return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t] as [number, number];
  });
}

const MISSILE_TRACKS: MissileTrack[] = [
  { id: 'MSL-091', trajectory: trajectory([34.95, 32.8], [35.35, 32.1]) },
  { id: 'MSL-092', trajectory: trajectory([35.1, 32.1], [34.55, 31.7]) },
  { id: 'MSL-093', trajectory: trajectory([34.8, 31.5], [35.3, 32.2]) },
  { id: 'MSL-094', trajectory: trajectory([34.45, 32.6], [35.2, 32.9]) },
];

/** Interpolated trajectory point at a fractional step (smooth motion). */
function pointAt(track: MissileTrack, s: number): [number, number] {
  const i = Math.min(Math.floor(s), TRACK_STEPS - 1);
  const j = Math.min(i + 1, TRACK_STEPS - 1);
  const f = s - i;
  const [ax, ay] = track.trajectory[i];
  const [bx, by] = track.trajectory[j];
  return [ax + (bx - ax) * f, ay + (by - ay) * f];
}

/**
 * Build the visible track window + simulated telemetry for one missile.
 * `step` is fractional so motion stays smooth at any tick rate. Heading
 * derives from the trajectory; pitch/roll are smooth oscillations so the
 * 3D view visibly moves; altitude descends along the flight.
 */
function missileWindow(track: MissileTrack, step: number, index: number): Missile {
  const path = Array.from({ length: TRACK_WINDOW }, (_, k) =>
    pointAt(track, step + k),
  ) as [number, number][];
  const [ax, ay] = path[path.length - 2];
  const [bx, by] = path[path.length - 1];
  const heading = ((Math.atan2(bx - ax, by - ay) * 180) / Math.PI + 360) % 360;
  const progress = step / MAX_STEP;
  const phase = step / 2 + index * 2;
  return {
    id: track.id,
    path,
    heading,
    pitch: -8 + 6 * Math.sin(phase),
    roll: 25 * Math.sin(phase * 0.7),
    speedKts: Math.round(920 + 40 * Math.sin(phase * 1.3)),
    altitudeFt: Math.round(16000 - 9000 * progress),
  };
}

export const MOCK_MISSILES: Missile[] = MISSILE_TRACKS.map((t, i) => missileWindow(t, 0, i));

export const MOCK_POLYGONS: PolygonFeature[] = [
  {
    contour: [
      [35.1, 32.8], [35.0924, 32.8383], [35.0707, 32.8707], [35.0383, 32.8924],
      [35.0, 32.9], [34.9617, 32.8924], [34.9293, 32.8707], [34.9076, 32.8383],
      [34.9, 32.8], [34.9076, 32.7617], [34.9293, 32.7293], [34.9617, 32.7076],
      [35.0, 32.7], [35.0383, 32.7076], [35.0707, 32.7293], [35.0924, 32.7617],
    ],
  },
  {
    contour: [
      [35.05, 31.36], [35.0424, 31.3983], [35.0207, 31.4307], [34.9883, 31.4524],
      [34.95, 31.46], [34.9117, 31.4524], [34.8793, 31.4307], [34.8576, 31.3983],
      [34.85, 31.36], [34.8576, 31.3217], [34.8793, 31.2893], [34.9117, 31.2676],
      [34.95, 31.26], [34.9883, 31.2676], [35.0207, 31.2893], [35.0424, 31.3217],
    ],
  },
];

/** Pretend startup payload of server-owned drawn shapes. */
export const MOCK_SERVER_SHAPES: MapShape[] = [
  { id: newShapeId(), kind: 'point', position: [34.7818, 32.0853] },
  {
    id: newShapeId(),
    kind: 'polygon',
    positions: [
      [34.75, 32.05],
      [34.81, 32.05],
      [34.81, 32.1],
      [34.75, 32.1],
    ],
  },
  { id: newShapeId(), kind: 'circle', center: [34.85, 32.08], radius: 3 },
  { id: newShapeId(), kind: 'ellipse', center: [34.7, 32.12], radiusX: 4, radiusY: 2 },
  {
    id: newShapeId(),
    kind: 'sector',
    center: [34.78, 32.15],
    radius: 5,
    startBearing: 30,
    endBearing: 110,
  },
];

// ── Live-feed simulation ───────────────────────────────────────────────

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Advance a target along its heading; steer back when leaving the box.
 *  `simSeconds` = elapsed simulation time since this target's last update. */
function moveTarget<T extends AirCraftTarget | DroneTarget>(target: T, simSeconds: number): T {
  const km = (target.speedKts * 1.852 * simSeconds) / 3600;
  const deg = km / 111;
  // Heading drift scaled by elapsed time so the wander rate is the same at
  // any update frequency.
  let heading = target.heading + (Math.random() - 0.5) * 2 * simSeconds;
  let lng = target.position[0] + deg * Math.sin(toRad(heading));
  let lat = target.position[1] + deg * Math.cos(toRad(heading));
  if (lng < BOUNDS.minLng || lng > BOUNDS.maxLng || lat < BOUNDS.minLat || lat > BOUNDS.maxLat) {
    heading = (heading + 180) % 360;
    lng = target.position[0];
    lat = target.position[1];
  }
  return { ...target, position: [lng, lat] as [number, number], heading: (heading + 360) % 360 };
}

/**
 * Start the simulated server feed. Pushes updates through the same store
 * setters a real socket client would use. Returns a stop function.
 * Missiles update every tick (smooth chase view); aircraft/drones move far
 * slower on screen, so they update once per SLOW_EVERY ticks — this cuts
 * the per-tick React/deck work for the big entity lists to ~1 Hz.
 */
export function startMockTicker(stores: RootStore): () => void {
  const SLOW_EVERY = 10;
  let step = 0;
  let tick = 0;
  const interval = setInterval(() => {
    tick += 1;
    step = (step + SIM_SECONDS_PER_TICK * MISSILE_STEPS_PER_SIM_SECOND) % MAX_STEP;
    if (tick % SLOW_EVERY === 0) {
      const dt = SIM_SECONDS_PER_TICK * SLOW_EVERY;
      stores.airCraftStore.setTargets(stores.airCraftStore.targets.map((t) => moveTarget(t, dt)));
      stores.droneStore.setTargets(stores.droneStore.targets.map((t) => moveTarget(t, dt)));
    }
    stores.missileStore.setAll(MISSILE_TRACKS.map((t, i) => missileWindow(t, step, i)));
  }, TICK_MS);
  return () => clearInterval(interval);
}
