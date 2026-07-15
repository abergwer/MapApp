/**
 * Simulated live motion for operational targets.
 * TargetMotionService is the single writer; stores stay the source of truth.
 */
export const targetMotionConfig = {
  /** Master switch — started from RootStore. */
  enabled: true,
  /** Animate aircraft on the map + feed 3D EXTERNAL telemetry. */
  moveAircraft: true,
  /** Animate drones (same pipeline). */
  moveDrones: true,
  /** Default altitude when a seed target has none. */
  defaults: {
    aircraftAltitudeM: 3200,
    droneAltitudeM: 180,
    aircraftSpeedMps: 95,
    droneSpeedMps: 28,
    pitchDeg: 1.5,
    rollDeg: 0,
  },
  /** Soft banking while turning (visual only for 3D). */
  bank: {
    enabled: true,
    maxRollDeg: 18,
    rollPerHeadingDelta: 0.35,
  },
  /** Occasional gentle heading drift so paths look alive. */
  headingDrift: {
    enabled: true,
    maxDegPerSec: 4,
  },
  /** Wake behind each target on the 2D map. */
  trail: {
    /** Longer ribbon — ~2–3× previous length at typical speeds. */
    maxPoints: 40,
    /** Slightly denser sampling for a smoother wake. */
    minStepKm: 0.01,
  },
} as const;

export type TargetMotionConfig = typeof targetMotionConfig;
