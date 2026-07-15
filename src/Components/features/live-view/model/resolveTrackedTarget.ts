import type { FlightTelemetry } from '@cesium-suite/cesium-flight-simulator';
import type { RootStore } from '../../stores/RootStore';
import type { TrackedTargetRef } from '../../stores/types/trackedTarget';
import type { TargetTelemetry } from '../../stores/types/trackedTarget';

export interface ResolvedTrackedTarget {
  ref: TrackedTargetRef;
  label: string;
  iconUrl: string;
  telemetry: TargetTelemetry;
}

/** Resolve selected track from stores — single lookup used by Intel + View3D. */
export function resolveTrackedTarget(
  root: RootStore,
  ref: TrackedTargetRef | null,
): ResolvedTrackedTarget | null {
  if (!ref) return null;

  if (ref.kind === 'aircraft') {
    const t = root.airCraftStore.get(ref.id);
    if (!t) return null;
    return {
      ref,
      label: `Aircraft-${ref.id}`,
      iconUrl: t.icon,
      telemetry: {
        position: t.position,
        altitudeM: t.altitudeM,
        headingDeg: t.headingDeg,
        speedMps: t.speedMps,
        pitchDeg: t.pitchDeg,
        rollDeg: t.rollDeg,
        trail: t.trail,
      },
    };
  }

  const t = root.droneStore.get(ref.id);
  if (!t) return null;
  return {
    ref,
    label: `Drone-${ref.id}`,
    iconUrl: t.icon,
    telemetry: {
      position: t.position,
      altitudeM: t.altitudeM,
      headingDeg: t.headingDeg,
      speedMps: t.speedMps,
      pitchDeg: t.pitchDeg,
      rollDeg: t.rollDeg,
      trail: t.trail,
    },
  };
}

export function toFlightTelemetry(t: TargetTelemetry): FlightTelemetry {
  const [longitude, latitude] = t.position;
  return {
    latitude,
    longitude,
    altitudeM: t.altitudeM,
    speedMps: t.speedMps,
    headingDeg: t.headingDeg,
    pitchDeg: t.pitchDeg,
    rollDeg: t.rollDeg,
    timestamp: Date.now(),
  };
}
