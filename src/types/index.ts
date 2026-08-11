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
export type { MapShape } from './shapes';

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
} from '../stores/DrawingToolStore';

// ── UI state: basemap styling ─────────────────────────────────────────
export type { BaseMap } from '../stores/MapStyleStore';

// ── Service layer: entity CRUD hooks ──────────────────────────────────
export type { EntityHooks } from '../Components/features/entities/EntityService';

// ── Map engine abstraction ────────────────────────────────────────────
export type {
  MapEngine,
  MapEngineType,
  MapEngineOptions,
  MapViewState,
} from '../map/mapEngine/MapEngine';

export type { MapContextValue } from '../map/MapContext';

// ── Geographic primitives ─────────────────────────────────────────────
export type { LngLat } from '../map/utils/geo';

// ── Leaflet sector tool internals (shared across sector code paths) ──
export type {
  SectorMeta,
  SectorLayer,
  SectorDrawResult,
} from '../map/utils/leafletSectorTool';

// ── External API contracts ────────────────────────────────────────────
export type {
  WebrtcViewer,
  WebrtcViewerOptions,
} from '../api/webrtcViewer';
