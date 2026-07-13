/**
 * Demo data server for testing the `network` package against the map package.
 *
 * REST (JSON, CORS enabled):
 *   GET    /api/vessels    -> Vessel[]    initial vessel snapshot
 *   GET    /api/zones      -> Zone[]      static maritime zones (polygons)
 *   GET    /api/shapes     -> MapShape[]  editable drawn shapes
 *   POST   /api/shapes     -> MapShape    create (client supplies the id)
 *   PUT    /api/shapes/:id -> MapShape    update
 *   DELETE /api/shapes/:id -> { ok }      remove
 *
 * WebSocket (ws://localhost:4000/ws):
 *   Broadcasts every second:
 *     { type: 'vesselUpdate',  vessels: Vessel[] }              (channel 'vessels')
 *     { type: 'targetUpdate',  drones: Target[], aircraft: Target[] } ('targets')
 *     { type: 'missileUpdate', missiles: Missile[] }            (channel 'missiles')
 *   Accepts from clients:
 *     { type: 'subscribe', channels: ('vessels'|'targets'|'missiles')[] }
 *   A client only receives the channels it subscribed to (default: all).
 *
 * All coordinates are GeoJSON-compatible [lng, lat].
 */
import { createServer } from 'node:http'
import { WebSocketServer } from 'ws'

const PORT = 4000
const TICK_MS = 1000

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

/** Vessels cruising the Mediterranean off the Israeli coast. (Disabled — the
 * server currently serves only the two seed polygons.) */
const vessels = []

/** Vessels are kept inside this sea box; heading reflects at the borders. */
const SEA_BOX = { west: 33.6, east: 34.75, south: 31.4, north: 33.2 }

/**
 * Editable drawn shapes (`MapShape` union from the app's DrawingToolStore),
 * managed via the CRUD /api/shapes routes. The initial seed is two polygons;
 * every other entity is added later by the user drawing on the map,
 * arriving through POST/PUT/DELETE /api/shapes.
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
const LAND_BOX = { west: 34.3, east: 35.6, south: 29.6, north: 33.2 }

/** Airborne targets (drones + aircraft) wandering over land. (Disabled.) */
const drones = []

const aircraft = []

/**
 * Missiles fly a straight trajectory from origin to target; the broadcast
 * `path` grows one point per tick. On arrival a new random flight starts.
 */
const MISSILE_STEPS = 30
// Disabled — the server currently serves only the two seed polygons.
const missiles = []

const randomIn = (min, max) => min + Math.random() * (max - min)

function randomLandPoint() {
  return [randomIn(LAND_BOX.west, LAND_BOX.east), randomIn(LAND_BOX.south, LAND_BOX.north)]
}

/** The wire shape: id + the flown part of the trajectory. */
function missilePath(m) {
  const points = []
  for (let i = 0; i <= Math.min(m.progress, MISSILE_STEPS); i++) {
    const t = i / MISSILE_STEPS
    points.push([
      m.origin[0] + (m.target[0] - m.origin[0]) * t,
      m.origin[1] + (m.target[1] - m.origin[1]) * t,
    ])
  }
  return { id: m.id, path: points }
}

// Zones disabled — the server currently serves only the two seed polygons.
const zones = []

// ---------------------------------------------------------------------------
// Simulation: advance each mover along its heading, jitter it a little and
// bounce off its bounding box so nothing wanders off-screen.
// ---------------------------------------------------------------------------

// ~ deg/s at the given speed. Exaggerated (x50) so movement is visible.
const DEG_PER_KT = (1 / 60 / 3600) * 50

function moveInBox(entity, box) {
  entity.heading += (Math.random() - 0.5) * 10
  const rad = (entity.heading * Math.PI) / 180
  const dist = entity.speedKts * DEG_PER_KT * (TICK_MS / 1000) * 3600
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

function tickVessels() {
  for (const v of vessels) moveInBox(v, SEA_BOX)
}

function tickTargets() {
  for (const d of drones) moveInBox(d, LAND_BOX)
  for (const a of aircraft) moveInBox(a, LAND_BOX)
}

function tickMissiles() {
  for (const m of missiles) {
    m.progress += 1
    if (m.progress > MISSILE_STEPS + 5) {
      // Arrived (plus a short linger): relaunch somewhere new.
      m.progress = 0
      m.origin = randomLandPoint()
      m.target = randomLandPoint()
    }
  }
}

// ---------------------------------------------------------------------------
// REST
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

  // --- Read-only collections -----------------------------------------------
  const routes = {
    '/api/vessels': vessels,
    '/api/zones': zones,
    '/api/shapes': shapes,
  }
  if (req.method === 'GET' && routes[url.pathname]) {
    return json(200, routes[url.pathname])
  }

  // --- Shapes CRUD -----------------------------------------------------------
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
// WebSocket
// ---------------------------------------------------------------------------

const wss = new WebSocketServer({ server, path: '/ws' })

const ALL_CHANNELS = ['vessels', 'targets', 'missiles']

/** Per-client channel subscriptions (set by the incoming `subscribe` message). */
const subscriptions = new WeakMap()

function frames() {
  return {
    vessels: JSON.stringify({ type: 'vesselUpdate', vessels }),
    targets: JSON.stringify({ type: 'targetUpdate', drones, aircraft }),
    missiles: JSON.stringify({ type: 'missileUpdate', missiles: missiles.map(missilePath) }),
  }
}

function sendFrames(socket, byChannel) {
  const channels = subscriptions.get(socket) ?? ALL_CHANNELS
  for (const channel of channels) {
    if (byChannel[channel]) socket.send(byChannel[channel])
  }
}

wss.on('connection', (socket) => {
  console.log(`[ws] client connected (${wss.clients.size} total)`)
  // Immediate snapshot so a new client doesn't wait a full tick.
  sendFrames(socket, frames())
  socket.on('message', (data) => {
    let msg
    try {
      msg = JSON.parse(String(data))
    } catch {
      return
    }
    if (msg?.type === 'subscribe' && Array.isArray(msg.channels)) {
      const channels = msg.channels.filter((c) => ALL_CHANNELS.includes(c))
      subscriptions.set(socket, channels)
      console.log(`[ws] client subscribed to: ${channels.join(', ') || '(none)'}`)
    }
  })
  socket.on('close', () =>
    console.log(`[ws] client disconnected (${wss.clients.size} total)`),
  )
})

setInterval(() => {
  tickVessels()
  tickTargets()
  tickMissiles()
  const byChannel = frames()
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) sendFrames(client, byChannel)
  }
}, TICK_MS)

server.listen(PORT, () => {
  console.log(`Demo server listening on http://localhost:${PORT}`)
  console.log(`  REST: GET /api/vessels | GET /api/zones | CRUD /api/shapes`)
  console.log(
    `  WS:   ws://localhost:${PORT}/ws (vesselUpdate | targetUpdate | missileUpdate every ${TICK_MS}ms)`,
  )
})
