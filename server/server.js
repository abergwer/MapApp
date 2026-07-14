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
 *   Broadcasts every second:
 *     { type: 'targetUpdate', drones: Target[], aircraft: Target[] }
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

/** Drones/aircraft roam over this land box. */
const LAND_BOX = { west: 34.3, east: 35.6, south: 29.6, north: 33.2 }

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
 * Airborne targets (drones + aircraft), moved every tick. Each target
 * bounces inside its own patrol box so it never wanders off. drone-1
 * patrols tightly around the app's initial map center, so it is always
 * on screen (and clickable in the e2e tests).
 */
const drones = [
  { id: 'drone-1', position: [34.75, 32.07], heading: 270, speedKts: 8, box: patrolBox([34.75, 32.07], 0.08) },
  { id: 'drone-2', position: [35.15, 32.4], heading: 210, speedKts: 95, box: patrolBox([35.15, 32.4], 0.3) },
  { id: 'drone-3', position: [34.6, 30.8], heading: 120, speedKts: 70, box: patrolBox([34.6, 30.8], 0.3) },
]

const aircraft = [
  { id: 'aircraft-1', position: [34.95, 31.3], heading: 300, speedKts: 420, box: patrolBox([34.95, 31.3], 0.4) },
  { id: 'aircraft-2', position: [35.35, 32.9], heading: 160, speedKts: 380, box: patrolBox([35.35, 32.9], 0.4) },
]

// ---------------------------------------------------------------------------
// Simulation: advance each mover along its heading, jitter it a little and
// bounce off its bounding box so nothing wanders off-screen.
// ---------------------------------------------------------------------------

// Knots -> degrees per second, exaggerated (x50) so movement is visible.
// 1 kt = 1 nm/h = (1/60)° per hour = 1/216000 ° per second.
const DEG_PER_KT_PER_S = (1 / 60 / 3600) * 50

function moveInBox(entity, box) {
  entity.heading += (Math.random() - 0.5) * 10
  const rad = (entity.heading * Math.PI) / 180
  const dist = entity.speedKts * DEG_PER_KT_PER_S * (TICK_MS / 1000)
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
  for (const d of drones) moveInBox(d, d.box ?? LAND_BOX)
  for (const a of aircraft) moveInBox(a, a.box ?? LAND_BOX)
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
  return JSON.stringify({ type: 'targetUpdate', drones, aircraft })
}

wss.on('connection', (socket) => {
  console.log(`[ws] client connected (${wss.clients.size} total)`)
  // Shape snapshot + an immediate target frame so a new client doesn't wait a tick.
  socket.send(JSON.stringify({ type: 'shapeSnapshot', shapes }))
  socket.send(targetFrame())
  socket.on('close', () =>
    console.log(`[ws] client disconnected (${wss.clients.size} total)`),
  )
})

setInterval(() => {
  tickTargets()
  const frame = targetFrame()
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(frame)
  }
}, TICK_MS)

server.listen(PORT, () => {
  console.log(`Demo server listening on http://localhost:${PORT}`)
  console.log(`  REST: POST /api/shapes | PUT/DELETE /api/shapes/:id`)
  console.log(
    `  WS:   ws://localhost:${PORT}/ws (shapeSnapshot on connect | targetUpdate every ${TICK_MS}ms)`,
  )
})
