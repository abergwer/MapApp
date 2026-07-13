import { makeAutoObservable } from 'mobx'
import type { MapShape } from '../stores/DrawingToolStore'
import type { MissileTrack, Target, Vessel, Zone } from './types'

/** Max positions kept per vessel for the trail layer. */
const TRAIL_LENGTH = 60

/**
 * MobX source of truth for the server-fed entities. Plain data only — no
 * map-engine or network imports — so it stays decoupled from both the map
 * package and the transport that feeds it. The bridge only ever touches
 * this store; the app's production stores are never imported or mutated.
 */
export class LiveDataStore {
  vessels: Vessel[] = []
  zones: Zone[] = []
  drones: Target[] = []
  aircraft: Target[] = []
  missiles: MissileTrack[] = []
  /**
   * Drawn shapes fetched from REST /api/shapes (same `MapShape` union the
   * app uses). Rendered read-only through `createDrawnShapeLayers` in
   * `buildLiveDataLayers`.
   */
  shapes: MapShape[] = []
  /** Recent positions per vessel id, oldest first (for trail rendering). */
  trails = new Map<string, [number, number][]>()

  constructor() {
    makeAutoObservable(this)
  }

  setZones(zones: Zone[]) {
    this.zones = zones
  }

  setTargets(drones: Target[], aircraft: Target[]) {
    this.drones = drones
    this.aircraft = aircraft
  }

  setMissiles(missiles: MissileTrack[]) {
    this.missiles = missiles
  }

  setShapes(shapes: MapShape[]) {
    this.shapes = shapes
  }

  /** Full snapshot from WS; also extends the per-vessel trails. */
  setVessels(vessels: Vessel[]) {
    this.vessels = vessels
    for (const vessel of vessels) {
      const trail = this.trails.get(vessel.id) ?? []
      const last = trail[trail.length - 1]
      if (!last || last[0] !== vessel.position[0] || last[1] !== vessel.position[1]) {
        this.trails.set(vessel.id, [...trail, vessel.position].slice(-TRAIL_LENGTH))
      }
    }
  }
}

/** Module-level singleton, mirroring the app's `rootStore` pattern. */
export const liveDataStore = new LiveDataStore()
