/**
 * Demo data server for testing the `network` package against the map package.
 *
 * Client -> server: REST (JSON, CORS enabled)
 *   POST   /api/shapes     -> MapShape    create (client supplies the id)
 *   PUT    /api/shapes/:id -> MapShape    update
 *   DELETE /api/shapes/:id -> { ok }      remove
 *
 * Server -> client: WebSocket (ws://localhost:4000/ws)
 *   Sends on connect:
 *     { type: 'shapeSnapshot', shapes: MapShape[] }  editable drawn shapes
 *   Broadcasts:
 *     { type: 'targetUpdate', drones: Target[], aircraft: Target[] }  every TARGET_TICK_MS
 *     { type: 'missileUpdate', missiles: Missile[] }                  every MISSILE_TICK_MS
 *
 * All coordinates are GeoJSON-compatible [lng, lat].
 */
import { createServer } from 'node:http'
import { WebSocketServer } from 'ws'

const PORT = 4000

// ---------------------------------------------------------------------------
// Simulation config — tweak these to change the demo feed.
// ---------------------------------------------------------------------------

const NUM_DRONES = 400
const NUM_AIRCRAFT = 400
const NUM_MISSILES = 40
/** Drones + aircraft move (and are broadcast) at this interval. */
const TARGET_TICK_MS = 200
/** Missiles move (and are broadcast) at this interval — fast for a smooth 3D chase view. */
const MISSILE_TICK_MS = 100

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

/**
 * Editable drawn shapes (`MapShape` union from the app's DrawingToolStore),
 * managed via the CRUD /api/shapes REST routes. The initial seed is a few
 * polygons; every other entity is added later by the user drawing on the
 * map, arriving through POST/PUT/DELETE /api/shapes.
 */
const shapes = [
  {
    id: 'polygon-1',
    kind: 'polygon',
    positions: [
      [34.95, 32.75],
      [35.05, 32.75],
      [35.05, 32.83],
      [34.95, 32.83],
    ],
  },
  {
    id: 'polygon-2',
    kind: 'polygon',
    positions: [
      [34.78, 32.0],
      [34.9, 32.0],
      [34.9, 32.1],
      [34.78, 32.1],
    ],
  },
  {
    id: 'polygon-3',
    kind: 'polygon',
    positions: [
      [35.78, 32.0],
      [35.9, 32.0],
      [35.9, 32.1],
      [35.78, 32.1],
    ],
  },
]

/** Drones/aircraft/missiles roam over this land box. */
const LAND_BOX = { west: 34.3, east: 35.6, south: 31.3, north: 33.1 }

const rand = (min, max) => min + Math.random() * (max - min)
const randPoint = () => [rand(LAND_BOX.west, LAND_BOX.east), rand(LAND_BOX.south, LAND_BOX.north)]

/** A small patrol area around a seed position, so targets stay in sight. */
function patrolBox([lng, lat], radiusDeg) {
  return {
    west: lng - radiusDeg,
    east: lng + radiusDeg,
    south: lat - radiusDeg,
    north: lat + radiusDeg,
  }
}

/**
 * Airborne targets (drones + aircraft), generated at startup and moved every
 * TARGET_TICK_MS. Each target bounces inside its own patrol box so it never
 * wanders off.
 */
function makeTarget(id, [minSpeed, maxSpeed], [minAlt, maxAlt]) {
  const position = randPoint()
  return {
    id,
    position,
    heading: Math.round(rand(0, 360)),
    speedKts: Math.round(rand(minSpeed, maxSpeed)),
    altitudeFt: Math.round(rand(minAlt, maxAlt)),
    box: patrolBox(position, 0.3),
  }
}

const drones = Array.from({ length: NUM_DRONES }, (_, i) =>
  makeTarget(`drone-${i + 1}`, [70, 130], [800, 1500]),
)
const aircraft = Array.from({ length: NUM_AIRCRAFT }, (_, i) =>
  makeTarget(`aircraft-${i + 1}`, [250, 420], [6000, 16000]),
)

// ---------------------------------------------------------------------------
// Target simulation: advance each mover along its heading, jitter it a
// little and bounce off its bounding box so nothing wanders off-screen.
// ---------------------------------------------------------------------------

// Knots -> degrees per second, exaggerated (x50) so movement is visible.
// 1 kt = 1 nm/h = (1/60)° per hour = 1/216000 ° per second.
const DEG_PER_KT_PER_S = (1 / 60 / 3600) * 50

function moveInBox(entity, box) {
  entity.heading += (Math.random() - 0.5) * 10
  const rad = (entity.heading * Math.PI) / 180
  const dist = entity.speedKts * DEG_PER_KT_PER_S * (TARGET_TICK_MS / 1000)
  let [lng, lat] = entity.position
  lng += Math.sin(rad) * dist
  lat += Math.cos(rad) * dist
  if (lng < box.west || lng > box.east) {
    entity.heading = 360 - entity.heading
    lng = Math.min(Math.max(lng, box.west), box.east)
  }
  if (lat < box.south || lat > box.north) {
    entity.heading = 180 - entity.heading
    lat = Math.min(Math.max(lat, box.south), box.north)
  }
  entity.heading = ((entity.heading % 360) + 360) % 360
  entity.position = [lng, lat]
}

function tickTargets() {
  for (const d of drones) moveInBox(d, d.box)
  for (const a of aircraft) moveInBox(a, a.box)
}

/** Wire view of a target — the internal patrol box stays server-side. */
function wireTarget({ id, position, heading, speedKts, altitudeFt }) {
  return { id, position, heading, speedKts, altitudeFt }
}

// ---------------------------------------------------------------------------
// Missile simulation: each missile is a sliding window over a precomputed
// straight trajectory; the window advances every MISSILE_TICK_MS and loops.
// ---------------------------------------------------------------------------

const TRACK_STEPS = 60
const TRACK_WINDOW = 8
/** Trajectory steps advanced per second. */
const MISSILE_STEPS_PER_SECOND = 1
const MAX_STEP = TRACK_STEPS - TRACK_WINDOW

function trajectory(from, to) {
  return Array.from({ length: TRACK_STEPS }, (_, i) => {
    const t = i / (TRACK_STEPS - 1)
    return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]
  })
}

const missiles = Array.from({ length: NUM_MISSILES }, (_, i) => ({
  id: `missile-${i + 1}`,
  trajectory: trajectory(randPoint(), randPoint()),
  step: rand(0, MAX_STEP),
}))

/** Interpolated trajectory point at a fractional step (smooth motion). */
function pointAt(track, s) {
  const i = Math.min(Math.floor(s), TRACK_STEPS - 1)
  const j = Math.min(i + 1, TRACK_STEPS - 1)
  const f = s - i
  const [ax, ay] = track.trajectory[i]
  const [bx, by] = track.trajectory[j]
  return [ax + (bx - ax) * f, ay + (by - ay) * f]
}

/**
 * Wire view of a missile: visible track window + simulated telemetry.
 * Heading derives from the trajectory; pitch/roll are smooth oscillations so
 * the 3D chase view visibly moves; altitude descends along the flight.
 */
function wireMissile(missile, index) {
  const path = Array.from({ length: TRACK_WINDOW }, (_, k) => pointAt(missile, missile.step + k))
  const [ax, ay] = path[path.length - 2]
  const [bx, by] = path[path.length - 1]
  const heading = ((Math.atan2(bx - ax, by - ay) * 180) / Math.PI + 360) % 360
  const progress = missile.step / MAX_STEP
  const phase = missile.step / 2 + index * 2
  return {
    id: missile.id,
    path,
    heading,
    pitch: -8 + 6 * Math.sin(phase),
    roll: 25 * Math.sin(phase * 0.7),
    speedKts: Math.round(920 + 40 * Math.sin(phase * 1.3)),
    altitudeFt: Math.round(16000 - 9000 * progress),
  }
}

function tickMissiles() {
  const dStep = MISSILE_STEPS_PER_SECOND * (MISSILE_TICK_MS / 1000)
  for (const m of missiles) m.step = (m.step + dStep) % MAX_STEP
}

// ---------------------------------------------------------------------------
// REST: client -> server shape CRUD
// ---------------------------------------------------------------------------

const server = createServer(async (req, res) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  }
  const json = (status, body) => {
    res.writeHead(status, { ...headers, 'Content-Type': 'application/json' })
    res.end(JSON.stringify(body))
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers)
    return res.end()
  }

  const url = new URL(req.url, `http://${req.headers.host}`)

  if (url.pathname === '/api/shapes' && req.method === 'POST') {
    const body = await readJsonBody(req)
    if (!isValidShape(body)) return json(400, { error: 'Invalid shape' })
    shapes.push(body)
    console.log(`[rest] shape created: ${body.id} (${body.kind})`)
    return json(201, body)
  }

  const shapeMatch = url.pathname.match(/^\/api\/shapes\/([^/]+)$/)
  if (shapeMatch) {
    const index = shapes.findIndex((s) => s.id === shapeMatch[1])
    if (index === -1) return json(404, { error: 'Shape not found' })

    if (req.method === 'PUT') {
      const body = await readJsonBody(req)
      if (!isValidShape(body)) return json(400, { error: 'Invalid shape' })
      shapes[index] = { ...body, id: shapes[index].id }
      console.log(`[rest] shape updated: ${shapes[index].id} (${shapes[index].kind})`)
      return json(200, shapes[index])
    }
    if (req.method === 'DELETE') {
      const [removed] = shapes.splice(index, 1)
      console.log(`[rest] shape deleted: ${removed.id}`)
      return json(200, { ok: true })
    }
  }

  json(404, { error: 'Not found' })
})

/** Collects and parses a JSON request body (empty object on bad JSON). */
function readJsonBody(req) {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk) => (raw += chunk))
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw))
      } catch {
        resolve({})
      }
    })
  })
}

function isValidShape(body) {
  return body && typeof body.id === 'string' && typeof body.kind === 'string'
}

// ---------------------------------------------------------------------------
// WebSocket: server -> client broadcasts
// ---------------------------------------------------------------------------

const wss = new WebSocketServer({ server, path: '/ws' })

function targetFrame() {
  return JSON.stringify({
    type: 'targetUpdate',
    drones: drones.map(wireTarget),
    aircraft: aircraft.map(wireTarget),
  })
}

function missileFrame() {
  return JSON.stringify({ type: 'missileUpdate', missiles: missiles.map(wireMissile) })
}

/** Backpressure cap: frames are full snapshots, so skipping a slow client is
 *  lossless — without this, a stalled client (backgrounded tab, dead TCP)
 *  buffers every frame on the heap until the process OOMs. */
const MAX_BUFFERED_BYTES = 1_000_000

function broadcast(frame) {
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN && client.bufferedAmount < MAX_BUFFERED_BYTES) {
      client.send(frame)
    }
  }
}

wss.on('connection', (socket) => {
  console.log(`[ws] client connected (${wss.clients.size} total)`)
  socket.isAlive = true
  socket.on('pong', () => (socket.isAlive = true))
  // Shape snapshot + immediate frames so a new client doesn't wait a tick.
  socket.send(JSON.stringify({ type: 'shapeSnapshot', shapes }))
  socket.send(targetFrame())
  socket.send(missileFrame())
  socket.on('close', () =>
    console.log(`[ws] client disconnected (${wss.clients.size} total)`),
  )
})

// Reap connections that stopped answering pings (their send buffers never
// drain and they'd otherwise linger as OPEN zombies).
setInterval(() => {
  for (const client of wss.clients) {
    if (!client.isAlive) {
      console.log('[ws] terminating unresponsive client')
      client.terminate()
      continue
    }
    client.isAlive = false
    client.ping()
  }
}, 30_000)

setInterval(() => {
  tickTargets()
  broadcast(targetFrame())
}, TARGET_TICK_MS)

setInterval(() => {
  tickMissiles()
  broadcast(missileFrame())
}, MISSILE_TICK_MS)

server.listen(PORT, () => {
  console.log(`Demo server listening on http://localhost:${PORT}`)
  console.log(`  REST: POST /api/shapes | PUT/DELETE /api/shapes/:id`)
  console.log(
    `  WS:   ws://localhost:${PORT}/ws (shapeSnapshot on connect | ` +
      `${NUM_DRONES} drones + ${NUM_AIRCRAFT} aircraft every ${TARGET_TICK_MS}ms | ` +
      `${NUM_MISSILES} missiles every ${MISSILE_TICK_MS}ms)`,
  )
})
