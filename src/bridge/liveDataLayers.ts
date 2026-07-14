import type { Layer } from '@deck.gl/core'
import { IconLayer } from '@deck.gl/layers'
import droneIcon from '../assets/drone.png'
import aircraftIcon from '../assets/aircraft.png'
import type { LiveDataStore } from './LiveDataStore'
import type { Target } from './types'

/** Icon layer for airborne targets, rotated to their heading. */
function createTargetLayer(id: string, targets: Target[], iconUrl: string, size: number) {
  return new IconLayer<Target>({
    id,
    data: targets,
    getPosition: (t) => t.position,
    getIcon: () => ({ url: iconUrl, width: size, height: size }),
    getAngle: (t) => -t.heading,
    getSize: size,
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
  return [
    createTargetLayer('live-drones', store.drones, droneIcon, 28),
    createTargetLayer('live-aircraft', store.aircraft, aircraftIcon, 30),
  ]
}
