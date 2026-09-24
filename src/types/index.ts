/**
 * Central barrel for the project's shared TypeScript types.
 *
 * This file **only re-exports** — every type still lives next to the code
 * that owns it. Import from here when you want a one-stop view of what
 * the app models, e.g.:
 *
 *     import type { MapShape, DrawTool, MapEngine } from '@/types';
 *
 * Types that are private to a single file (component `Props`, module-local
 * helpers) intentionally stay where they are and are *not* re-exported.
 */

// ── Domain: editable map entities ──────────────────────────────────────
export type { MapShape } from '@mapapp/map';

// ── Domain: live-feed targets ─────────────────────────────────────────
export type { AirCraftTarget } from '../stores/AirCraftStore';
export type { DroneTarget } from '../stores/DroneStore';
export type { Missile } from '../stores/MissileStore';
export type { PolygonFeature } from '../stores/PolygonStore';

// ── UI state: drawing / measuring tool selection ──────────────────────
export type {
  DrawTool,
  MeasureTool,
  Measurement,
} from '@mapapp/map';

// ── UI state: basemap styling ─────────────────────────────────────────
export type { BaseMap } from '@mapapp/map';

// ── Service layer: entity CRUD hooks ──────────────────────────────────
export type { EntityHooks } from '@mapapp/map';

// ── Map engine abstraction ────────────────────────────────────────────
export type {
  MapEngine,
  MapEngineType,
  MapEngineOptions,
  MapViewState,
} from '@mapapp/map';

export type { MapContextValue } from '@mapapp/map';

// ── Geographic primitives ─────────────────────────────────────────────
export type { LngLat } from '@mapapp/map';

// ── Leaflet sector tool internals (shared across sector code paths) ──
export type {
  SectorMeta,
  SectorLayer,
  SectorDrawResult,
} from '@mapapp/map';

// ── External API contracts ────────────────────────────────────────────
export type {
  WebrtcViewer,
  WebrtcViewerOptions,
} from '@mapapp/mini-video';
