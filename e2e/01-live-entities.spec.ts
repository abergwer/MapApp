import { test, expect, type Page } from '@playwright/test'

/**
 * Test 1 — the entities we asked the server for arrive and render.
 *
 * Verifies the full inbound chain:
 *   server WS frames  ->  bridge store  ->  map/deck canvases on screen
 *
 * - `shapeSnapshot` (on connect) carries the three seed polygons
 * - `targetUpdate` carries 3 drones + 2 aircraft, and positions CHANGE
 *   between ticks (the targets really move)
 * - the bridge store (window.__liveDataStore, DEV hook) holds the same
 *   entities — i.e. the data the layers render
 * - the MapLibre basemap and the Deck.gl overlay canvases are visible
 */

interface WsFrame {
  type: string
  shapes?: { id: string; kind: string }[]
  drones?: { id: string; position: [number, number] }[]
  aircraft?: { id: string; position: [number, number] }[]
}

/** Collects every JSON frame the app receives over any WebSocket. */
function collectWsFrames(page: Page): WsFrame[] {
  const frames: WsFrame[] = []
  page.on('websocket', (ws) => {
    ws.on('framereceived', (frame) => {
      try {
        frames.push(JSON.parse(String(frame.payload)))
      } catch {
        /* non-JSON frame — ignore */
      }
    })
  })
  return frames
}

test('server entities arrive over WS and show up as layers', async ({ page }) => {
  const frames = collectWsFrames(page)
  await page.goto('/')

  await test.step('map + layer canvases are on screen', async () => {
    await expect(page.locator('.maplibregl-canvas').first()).toBeVisible()
    await expect(page.locator('canvas.deck-overlay').first()).toBeVisible()
  })

  await test.step('shapeSnapshot delivers the seed polygons', async () => {
    await expect
      .poll(() => frames.some((f) => f.type === 'shapeSnapshot'), {
        message: 'waiting for the shapeSnapshot frame',
      })
      .toBe(true)
    const snapshot = frames.find((f) => f.type === 'shapeSnapshot')!
    const ids = snapshot.shapes!.map((s) => s.id)
    expect(ids).toEqual(
      expect.arrayContaining(['polygon-1', 'polygon-2', 'polygon-3']),
    )
  })

  await test.step('targetUpdate delivers 3 drones + 2 aircraft', async () => {
    await expect
      .poll(() => frames.some((f) => f.type === 'targetUpdate'), {
        message: 'waiting for the first targetUpdate frame',
      })
      .toBe(true)
    const first = frames.find((f) => f.type === 'targetUpdate')!
    expect(first.drones).toHaveLength(3)
    expect(first.aircraft).toHaveLength(2)
    expect(first.drones!.map((d) => d.id)).toEqual([
      'drone-1',
      'drone-2',
      'drone-3',
    ])
    expect(first.aircraft!.map((a) => a.id)).toEqual(['aircraft-1', 'aircraft-2'])
  })

  await test.step('targets actually move between ticks', async () => {
    const first = frames.find((f) => f.type === 'targetUpdate')!
    // Wait for at least two more broadcast ticks (1/s).
    await expect
      .poll(() => frames.filter((f) => f.type === 'targetUpdate').length, {
        message: 'waiting for follow-up targetUpdate ticks',
        timeout: 15_000,
      })
      .toBeGreaterThanOrEqual(3)
    const updates = frames.filter((f) => f.type === 'targetUpdate')
    const last = updates[updates.length - 1]
    expect(last.drones![0].position).not.toEqual(first.drones![0].position)
    expect(last.aircraft![0].position).not.toEqual(first.aircraft![0].position)
  })

  await test.step('the bridge store feeding the layers holds the entities', async () => {
    const counts = () =>
      page.evaluate(() => {
        const store = window.__liveDataStore
        if (!store) return null
        return {
          drones: store.drones.length,
          aircraft: store.aircraft.length,
          shapes: store.shapes.length,
        }
      })
    await expect.poll(counts).not.toBeNull()
    const state = (await counts())!
    expect(state.drones).toBe(3)
    expect(state.aircraft).toBe(2)
    expect(state.shapes).toBeGreaterThanOrEqual(3)
  })

  // A labelled full-page shot for the HTML report, on top of the automatic
  // per-test screenshot/video/trace.
  await test.info().attach('entities-on-map', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  })
})
