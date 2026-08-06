import { GLTFLoader } from '@loaders.gl/gltf';

/**
 * Shared missile 3D-model settings — single source for the main-map layer
 * and the 3D chase view so the two can never drift.
 *
 * Model: Shahed-style delta wing (public/models). Fallback if it ever fails
 * to load or points the wrong way: '/models/aim120d-forward-x-gray.glb'
 * (forward = +X per its name).
 */
export const MISSILE_MODEL_URL = '/models/stealth_drone_perfect.glb';

/** Loaders passed to every ScenegraphLayer that renders the model. */
export const MISSILE_MODEL_LOADERS = [GLTFLoader];

/**
 * Extra yaw/roll applied on top of the missile attitude so the model's nose
 * points along the flight direction with wings level (tuned visually for
 * this asset — its local axes differ from deck's).
 */
export const MODEL_YAW_OFFSET = 90;
export const MODEL_ROLL_OFFSET = 90;

export const FT_TO_M = 0.3048;

/**
 * deck.gl ScenegraphLayer orientation is `[pitch, yaw, roll]` in degrees with
 * yaw counter-clockwise; our heading is clockwise from north.
 */
export const missileOrientation = (m: {
  heading: number;
  pitch: number;
  roll: number;
}): [number, number, number] => [
  m.pitch,
  -m.heading + MODEL_YAW_OFFSET,
  m.roll + MODEL_ROLL_OFFSET,
];

/** Head of the missile track with altitude, as a deck position. */
export const missileHeadPosition = (m: {
  path: [number, number][];
  altitudeFt: number;
}): [number, number, number] => {
  const [lng, lat] = m.path[m.path.length - 1];
  return [lng, lat, m.altitudeFt * FT_TO_M];
};
