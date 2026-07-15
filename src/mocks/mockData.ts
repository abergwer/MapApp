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

/** Ticker cadence + how many simulated seconds pass per tick (so the
 *  movement is clearly visible at demo zoom levels). */
const TICK_MS = 1000;
const SIM_SECONDS_PER_TICK = 10;

// ── Seeds ──────────────────────────────────────────────────────────────

export const MOCK_AIRCRAFT: AirCraftTarget[] = [
  { id: 'AC-101', position: [34.55, 32.05], heading: 40, altitudeFt: 8200, speedKts: 250, icon: airCraftIcon },
  { id: 'AC-102', position: [35.01, 32.75], heading: 210, altitudeFt: 12500, speedKts: 320, icon: airCraftIcon },
  { id: 'AC-103', position: [34.9, 31.55], heading: 350, altitudeFt: 6300, speedKts: 300, icon: airCraftIcon },
  { id: 'AC-104', position: [35.45, 32.95], heading: 130, altitudeFt: 15000, speedKts: 410, icon: airCraftIcon },
  { id: 'AC-105', position: [34.4, 31.9], heading: 75, altitudeFt: 9800, speedKts: 280, icon: airCraftIcon },
  { id: 'AC-106', position: [35.4, 32.45], heading: 265, altitudeFt: 11000, speedKts: 340, icon: airCraftIcon },
  { id: 'AC-107', position: [34.7, 32.55], heading: 10, altitudeFt: 7400, speedKts: 260, icon: airCraftIcon },
  { id: 'AC-108', position: [35.15, 31.85], heading: 155, altitudeFt: 13200, speedKts: 380, icon: airCraftIcon },
];

export const MOCK_DRONES: DroneTarget[] = [
  { id: 'DRN-01', position: [34.7818, 32.0853], heading: 90, altitudeFt: 1200, speedKts: 120, icon: droneIcon },
  { id: 'DRN-02', position: [34.9885, 32.794], heading: 180, altitudeFt: 900, speedKts: 95, icon: droneIcon },
  { id: 'DRN-03', position: [35.2137, 31.7683], heading: 300, altitudeFt: 1500, speedKts: 110, icon: droneIcon },
  { id: 'DRN-04', position: [35.0, 32.3], heading: 25, altitudeFt: 800, speedKts: 85, icon: droneIcon },
  { id: 'DRN-05', position: [34.5742, 31.6693], heading: 220, altitudeFt: 1100, speedKts: 100, icon: droneIcon },
  { id: 'DRN-06', position: [34.85, 32.55], heading: 135, altitudeFt: 1350, speedKts: 130, icon: droneIcon },
];

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

/**
 * Build the visible track window + simulated telemetry for one missile.
 * Heading derives from the trajectory; pitch/roll are smooth oscillations
 * so the 3D view visibly moves; altitude descends along the flight.
 */
function missileWindow(track: MissileTrack, step: number, index: number): Missile {
  const path = track.trajectory.slice(step, step + TRACK_WINDOW);
  const [ax, ay] = path[path.length - 2];
  const [bx, by] = path[path.length - 1];
  const heading = ((Math.atan2(bx - ax, by - ay) * 180) / Math.PI + 360) % 360;
  const progress = step / (TRACK_STEPS - TRACK_WINDOW);
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

/** Advance a target along its heading; steer back when leaving the box. */
function moveTarget<T extends AirCraftTarget | DroneTarget>(target: T): T {
  const km = (target.speedKts * 1.852 * SIM_SECONDS_PER_TICK) / 3600;
  const deg = km / 111;
  let heading = target.heading + (Math.random() - 0.5) * 6;
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
 */
export function startMockTicker(stores: RootStore): () => void {
  let step = 0;
  const interval = setInterval(() => {
    step += 1;
    stores.airCraftStore.setTargets(stores.airCraftStore.targets.map(moveTarget));
    stores.droneStore.setTargets(stores.droneStore.targets.map(moveTarget));
    stores.missileStore.setAll(
      MISSILE_TRACKS.map((t, i) => missileWindow(t, step % (TRACK_STEPS - TRACK_WINDOW), i)),
    );
  }, TICK_MS);
  return () => clearInterval(interval);
}
