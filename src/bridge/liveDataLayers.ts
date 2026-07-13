import type { Layer } from '@deck.gl/core'
import {
  IconLayer,
  PathLayer,
  PolygonLayer,
  ScatterplotLayer,
  TextLayer,
} from '@deck.gl/layers'
import droneIcon from '../assets/drone.png'
import aircraftIcon from '../assets/aircraft.png'
import missileIcon from '../assets/missile.png'
import type { LiveDataStore } from './LiveDataStore'
import type { MissileTrack, Target, Vessel, Zone } from './types'

function createZoneLayer(zones: Zone[]) {
  return new PolygonLayer<Zone>({
    id: 'live-zones',
    data: zones,
    getPolygon: (z) => z.ring,
    getFillColor: (z) => [...z.color, 50] as [number, number, number, number],
    getLineColor: (z) => [...z.color, 200] as [number, number, number, number],
    getLineWidth: 2,
    lineWidthUnits: 'pixels',
    stroked: true,
    filled: true,
  })
}

function createVesselTrailLayer(store: LiveDataStore) {
  const data = store.vessels
    .map((v) => ({ id: v.id, path: store.trails.get(v.id) ?? [] }))
    .filter((t) => t.path.length > 1)
  return new PathLayer<{ id: string; path: [number, number][] }>({
    id: 'live-vessel-trails',
    data,
    getPath: (d) => d.path,
    getColor: [0, 200, 255, 120],
    getWidth: 2,
    widthUnits: 'pixels',
  })
}

function createVesselLayer(vessels: Vessel[]) {
  return new ScatterplotLayer<Vessel>({
    id: 'live-vessels',
    data: vessels,
    getPosition: (v) => v.position,
    getFillColor: [0, 200, 255],
    getLineColor: [255, 255, 255],
    getLineWidth: 1,
    lineWidthUnits: 'pixels',
    stroked: true,
    getRadius: 6,
    radiusUnits: 'pixels',
  })
}

function createVesselLabelLayer(vessels: Vessel[]) {
  return new TextLayer<Vessel>({
    id: 'live-vessel-labels',
    data: vessels,
    getPosition: (v) => v.position,
    getText: (v) => v.name,
    getSize: 12,
    getColor: [255, 255, 255],
    getPixelOffset: [0, -16],
    background: true,
    getBackgroundColor: [0, 0, 0, 140],
  })
}

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

function createMissileLayer(missiles: MissileTrack[]) {
  return new PathLayer<MissileTrack>({
    id: 'live-missiles',
    data: missiles,
    getPath: (m) => m.path,
    getColor: [255, 80, 0, 200],
    widthMinPixels: 3,
    widthMaxPixels: 10,
    capRounded: true,
    jointRounded: true,
  })
}

/** Missile icon at the tip of each trajectory. */
function createMissileHeadLayer(missiles: MissileTrack[]) {
  const data = missiles.filter((m) => m.path.length > 0)
  return new IconLayer<MissileTrack>({
    id: 'live-missile-heads',
    data,
    getPosition: (m) => m.path[m.path.length - 1],
    getIcon: () => ({ url: missileIcon, width: 24, height: 24 }),
    getSize: 24,
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
    createZoneLayer(store.zones),
    createVesselTrailLayer(store),
    createVesselLayer(store.vessels),
    createVesselLabelLayer(store.vessels),
    createMissileLayer(store.missiles),
    createMissileHeadLayer(store.missiles),
    createTargetLayer('live-drones', store.drones, droneIcon, 28),
    createTargetLayer('live-aircraft', store.aircraft, aircraftIcon, 30),
  ]
}
