/**
 * Shared telemetry shape for operational targets (aircraft / drones).
 * Map layers + Intel + 3D EXTERNAL mode all read this from the stores.
 */
export interface TargetTelemetry {
  /** [lng, lat] — MapLibre / Deck.gl / Cesium convention. */
  position: [number, number];
  altitudeM: number;
  headingDeg: number;
  speedMps: number;
  pitchDeg: number;
  rollDeg: number;
  /** Recent path points [lng, lat] — short wake behind the target on the map. */
  trail: [number, number][];
}

export type TrackedTargetKind = 'aircraft' | 'drone';

export interface TrackedTargetRef {
  kind: TrackedTargetKind;
  id: string;
}

export function trackedTargetKey(ref: TrackedTargetRef): string {
  return `${ref.kind}:${ref.id}`;
}

export function parseTrackedTargetKey(key: string): TrackedTargetRef | null {
  const [kind, id] = key.split(':');
  if ((kind !== 'aircraft' && kind !== 'drone') || !id) return null;
  return { kind, id };
}
