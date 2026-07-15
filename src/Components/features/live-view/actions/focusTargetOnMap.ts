import type { MapEngine } from '../../../../map/mapEngine/MapEngine';
import { intelFeedConfig } from '../config/intelFeed.config';

/**
 * Center the map on an operational target [lng, lat].
 * Thin UI action — engines implement `flyTo`; no store mutation here.
 */
export function focusTargetOnMap(
  engine: MapEngine | null | undefined,
  position: [number, number],
): void {
  if (!engine?.flyTo) return;
  const { zoom, durationMs } = intelFeedConfig.mapFocus;
  engine.flyTo(position, { zoom, durationMs });
}
