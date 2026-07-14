import { makeAutoObservable } from 'mobx'
import type { MapShape } from '../stores/DrawingToolStore'
import type { Target } from './types'

/**
 * MobX source of truth for the server-fed entities. Plain data only — no
 * map-engine or network imports — so it stays decoupled from both the map
 * package and the transport that feeds it. The bridge only ever touches
 * this store; the app's production stores are never imported or mutated.
 */
export class LiveDataStore {
  drones: Target[] = []
  aircraft: Target[] = []
  /**
   * Drawn shapes hydrated once from the WS `shapeSnapshot` frame (same
   * `MapShape` union the app uses). Passed to `MapWrapper`'s `shapes` prop
   * by `useLiveShapes`; after hydration the map is authoritative.
   */
  shapes: MapShape[] = []
  /** True once the initial `shapeSnapshot` has been applied. */
  shapesHydrated = false

  constructor() {
    makeAutoObservable(this)
  }

  setTargets(drones: Target[], aircraft: Target[]) {
    this.drones = drones
    this.aircraft = aircraft
  }

  /**
   * Applies the server's shape snapshot exactly once. Reconnect snapshots
   * are ignored — swapping the array reference mid-session would re-hydrate
   * the map and wipe its selection/undo history, and the server state
   * already reflects the map's edits (they are pushed on every change).
   */
  hydrateShapes(shapes: MapShape[]) {
    if (this.shapesHydrated) return
    this.shapes = shapes
    this.shapesHydrated = true
  }
}

/** Module-level singleton, mirroring the app's `rootStore` pattern. */
export const liveDataStore = new LiveDataStore()
