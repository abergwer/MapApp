import { makeAutoObservable } from 'mobx'
import type { MapShape } from '../stores/DrawingToolStore'
import type { Target } from './types'

export type TargetKind = 'drone' | 'aircraft'

/**
 * MobX source of truth for the server-fed entities. Plain data only — no
 * map-engine or network imports — so it stays decoupled from both the map
 * package and the transport that feeds it. The bridge only ever touches
 * this store; the app's production stores are never imported or mutated.
 */
export class LiveDataStore {
  drones: Target[] = []
  aircraft: Target[] = []
  /** Target picked on the map; drives the `TargetCard` overlay. */
  selectedTarget: { kind: TargetKind; id: string } | null = null
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

  selectTarget(kind: TargetKind, id: string) {
    this.selectedTarget = { kind, id }
  }

  clearTargetSelection() {
    this.selectedTarget = null
  }

  /**
   * Live data for the selected target, re-resolved on every `targetUpdate`
   * tick so the card shows moving position/heading. Null when nothing is
   * selected or the target vanished from the feed.
   */
  get selectedTargetInfo(): { kind: TargetKind; target: Target } | null {
    if (!this.selectedTarget) return null
    const { kind, id } = this.selectedTarget
    const list = kind === 'drone' ? this.drones : this.aircraft
    const target = list.find((t) => t.id === id)
    return target ? { kind, target } : null
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

declare global {
  interface Window {
    /** E2E hook (DEV builds only): lets Playwright assert what the layers render. */
    __liveDataStore?: LiveDataStore
  }
}

// The Deck.gl/MapLibre canvases are not queryable from the DOM, so e2e tests
// read this store instead to verify the server entities reached the layers.
if (import.meta.env.DEV) window.__liveDataStore = liveDataStore
