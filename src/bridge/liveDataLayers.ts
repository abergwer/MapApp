import type { Layer } from '@deck.gl/core'
import { IconLayer } from '@deck.gl/layers'
import droneIcon from '../assets/drone.png'
import aircraftIcon from '../assets/aircraft.png'
import type { LiveDataStore, TargetKind } from './LiveDataStore'
import type { Target } from './types'

/**
 * Latest built target layers. Once rendered, a Deck layer carries the
 * current viewport in its context — used by the `__projectTarget` e2e hook
 * to compute where a moving target sits on screen.
 */
let currentTargetLayers: IconLayer<Target>[] = []

/** Geo [lng, lat] -> container px through Deck's live viewport (null before first render). */
function projectPosition(position: [number, number]): [number, number] | null {
  for (const layer of currentTargetLayers) {
    try {
      const viewport = layer.context?.viewport
      if (viewport) {
        const [x, y] = viewport.project(position)
        return [x, y]
      }
    } catch {
      /* layer not rendered yet */
    }
  }
  return null
}

declare global {
  interface Window {
    /** E2E hook (DEV builds only): project a target geo position to container px. */
    __projectTarget?: (position: [number, number]) => [number, number] | null
  }
}

// Lets Playwright compute where a moving target is on screen so it can click it.
if (import.meta.env.DEV) window.__projectTarget = projectPosition

/** Icon layer for airborne targets, rotated to their heading. */
function createTargetLayer(
  id: string,
  kind: TargetKind,
  targets: Target[],
  iconUrl: string,
  size: number,
  store: LiveDataStore,
) {
  return new IconLayer<Target>({
    id,
    data: targets,
    getPosition: (t) => t.position,
    getIcon: () => ({ url: iconUrl, width: size, height: size }),
    getAngle: (t) => -t.heading,
    getSize: size,
    // LayerManager hit-tests container clicks with `deck.pickObject` and
    // invokes the picked layer's `onClick` manually (the Deck canvas itself
    // is pointer-events:none, so deck.gl never dispatches DOM events).
    pickable: true,
    onClick: (info) => {
      if (info.object) store.selectTarget(kind, (info.object as Target).id)
      return true
    },
  })
}

/**
 * Build the Deck.gl layers for the server-fed data. Mirrors
 * `buildLayers(stores)` — MobX tracks the observable reads done here, so the
 * caller re-renders as the store updates. Server shapes are NOT rendered
 * here — they flow through `useLiveShapes` into `MapWrapper`, which owns
 * their rendering and editing.
 */
export function buildLiveDataLayers(store: LiveDataStore): Layer[] {
  const targetLayers = [
    createTargetLayer('live-drones', 'drone', store.drones, droneIcon, 28, store),
    createTargetLayer('live-aircraft', 'aircraft', store.aircraft, aircraftIcon, 30, store),
  ]
  currentTargetLayers = targetLayers
  return targetLayers
}
