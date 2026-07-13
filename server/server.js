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

/** Vessels cruising the Mediterranean off the Israeli coast. */
const vessels = [
  { id: 'v1', name: 'MV Carmel', position: [34.55, 32.9], heading: 200, speedKts: 14 },
  { id: 'v2', name: 'MV Galil', position: [34.4, 32.3], heading: 20, speedKts: 10 },
  { id: 'v3', name: 'SS Negev', position: [34.3, 31.9], heading: 90, speedKts: 8 },
  { id: 'v4', name: 'MV Sharon', position: [34.6, 32.1], heading: 320, speedKts: 16 },
  { id: 'v5', name: 'SS Arava', position: [34.2, 31.6], heading: 45, speedKts: 12 },
]

/** Vessels are kept inside this sea box; heading reflects at the borders. */
const SEA_BOX = { west: 33.6, east: 34.75, south: 31.4, north: 33.2 }

/**
 * Editable drawn shapes (`MapShape` union from the app's DrawingToolStore),
 * managed via the CRUD /api/shapes routes. These seed the app on load and
 * receive every draw / edit / delete the user makes on the map.
 */
const shapes = [
  { id: 's1', kind: 'point', position: [34.99, 32.79] },
  {
    id: 's2',
    kind: 'polygon',
    positions: [
      [35.0, 32.62],
      [35.08, 32.62],
      [35.08, 32.68],
      [35.0, 32.68],
    ],
  },
  { id: 's3', kind: 'circle', center: [35.1, 32.8], radius: 3 },
  { id: 's4', kind: 'ellipse', center: [34.92, 32.62], radiusX: 4, radiusY: 2 },
  {
    id: 's5',
    kind: 'sector',
    center: [35.05, 32.72],
    radius: 5,
    startBearing: 30,
    endBearing: 110,
  },
]

/** Drones/aircraft/missiles roam over this land box. */
const LAND_BOX = { west: 34.3, east: 35.6, south: 29.6, north: 33.2 }

/** Airborne targets (drones + aircraft) wandering over land. */
const drones = [
  { id: 'd1', position: [34.8, 32.1], heading: 45, speedKts: 60 },
  { id: 'd2', position: [35.0, 32.8], heading: 180, speedKts: 50 },
  { id: 'd3', position: [35.2, 31.8], heading: 270, speedKts: 70 },
  { id: 'd4', position: [34.9, 31.3], heading: 10, speedKts: 55 },
]

const aircraft = [
  { id: 'a1', position: [34.6, 32.0], heading: 90, speedKts: 240 },
  { id: 'a2', position: [35.4, 32.9], heading: 200, speedKts: 300 },
  { id: 'a3', position: [35.0, 30.5], heading: 330, speedKts: 260 },
  { id: 'a4', position: [34.5, 31.6], heading: 140, speedKts: 280 },
]

/**
 * Missiles fly a straight trajectory from origin to target; the broadcast
 * `path` grows one point per tick. On arrival a new random flight starts.
 */
const MISSILE_STEPS = 30
const missiles = [
  { id: 'm1', progress: 0, origin: [35.4, 33.1], target: [34.8, 32.0] },
  { id: 'm2', progress: 8, origin: [34.4, 31.5], target: [35.2, 32.4] },
  { id: 'm3', progress: 16, origin: [35.5, 30.2], target: [34.7, 31.9] },
]

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

const zones = [
  {
    id: 'z1',
    name: 'Haifa Port Zone',
    color: [64, 160, 255],
    ring: [
      [34.88, 32.86],
      [34.72, 32.86],
      [34.72, 32.76],
      [34.88, 32.76],
    ],
  },
  {
    id: 'z2',
    name: 'Ashdod Anchorage',
    color: [80, 220, 130],
    ring: [
      [34.6, 31.88],
      [34.44, 31.88],
      [34.44, 31.74],
      [34.6, 31.74],
    ],
  },
  {
    id: 'z3',
    name: 'Restricted Area',
    color: [255, 90, 90],
    ring: [
      [34.35, 32.55],
      [34.1, 32.6],
      [34.05, 32.35],
      [34.3, 32.3],
    ],
  },
]

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
