import { test, expect, type Page } from '@playwright/test'

/**
 * Test 2 — full create / update / delete of a drawn entity through the UI.
 *
 * Drives the real user flow on the MapLibre engine:
 *   1. Draw menu -> Polygon -> click vertices on the map -> double-click to
 *      finish  => POST /api/shapes (201)
 *   2. Click the new polygon (Deck.gl pick -> edit mode) and drag one of its
 *      vertices  => PUT /api/shapes/:id (200)
 *   3. Press Delete on the selected shape  => DELETE /api/shapes/:id (200)
 *   4. Reload — the fresh WS shapeSnapshot no longer contains the shape.
 *
 * Each step asserts the REST round-trip the UI fires, so the test proves the
 * map, the bridge and the server stay in sync.
 */

const SHAPES_URL = /\/api\/shapes/

/**
 * Vertices are placed proportionally inside the canvas (west of the seed
 * polygons, over the sea) so picks can't hit other shapes on any viewport.
 */
function drawPoints(box: { x: number; y: number; width: number; height: number }) {
  const at = (fx: number, fy: number) => ({
    x: box.x + box.width * fx,
    y: box.y + box.height * fy,
  })
  return {
    a: at(0.2, 0.35),
    b: at(0.32, 0.35),
    c: at(0.32, 0.55),
    /** Triangle centroid — a guaranteed hit for the Deck.gl pick. */
    inside: at(0.28, 0.42),
  }
}

async function mapCanvasBox(page: Page) {
  const canvas = page.locator('.maplibregl-canvas').first()
  await expect(canvas).toBeVisible()
  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()
  return box!
}

test('create, update and delete a drawn entity end-to-end', async ({ page }) => {
  await page.goto('/')
  const box = await mapCanvasBox(page)
  const p = drawPoints(box)

  // Wait for live data so the map/deck stack is fully initialized.
  await expect
    .poll(() => page.evaluate(() => window.__liveDataStore?.drones.length ?? 0))
    .toBeGreaterThan(0)
  // The WS data lands before MapboxDraw is interactive on a cold start;
  // give the map a moment to finish wiring its handlers.
  await page.waitForTimeout(2000)

  let shapeId = ''

  await test.step('CREATE: draw a polygon -> POST /api/shapes', async () => {
    const armPolygonTool = async () => {
      await page.getByRole('button', { name: /^Draw/ }).click()
      await page.getByRole('menuitem', { name: 'Polygon' }).click()
      // Tool is armed once the trigger reflects it. The menu's exit
      // transition keeps a full-screen backdrop up briefly AFTER the menu
      // leaves the a11y tree — it would swallow the first map click, so
      // wait for the whole modal root to unmount.
      await expect(page.getByRole('button', { name: 'Draw: Polygon' })).toBeVisible()
      await expect(page.locator('.MuiModal-root')).toHaveCount(0)
      await page.waitForTimeout(300)
    }

    // Click the three vertices, then a single click on the just-placed last
    // vertex completes the polygon (double-click would be routed into the
    // circle-mode override and crash). Returns the POST if the draw took.
    const drawTriangle = async () => {
      const created = page
        .waitForResponse(
          (r) => SHAPES_URL.test(r.url()) && r.request().method() === 'POST',
          { timeout: 8_000 },
        )
        .catch(() => null)
      for (const point of [p.a, p.b, p.c]) {
        await page.mouse.click(point.x, point.y)
        await page.waitForTimeout(300)
      }
      await page.mouse.click(p.c.x, p.c.y)
      return created
    }

    await armPolygonTool()
    let response = await drawTriangle()
    if (!response) {
      // Cold-start miss: re-arming restarts draw_polygon (discarding any
      // partial vertices), then the gesture is replayed once.
      await armPolygonTool()
      response = await drawTriangle()
    }

    expect(response).not.toBeNull()
    expect(response!.status()).toBe(201)
    const shape = (await response!.json()) as { id: string; kind: string }
    expect(shape.kind).toBe('polygon')
    shapeId = shape.id

    await test.info().attach('after-create', {
      body: await page.screenshot(),
      contentType: 'image/png',
    })
  })

  await test.step('UPDATE: select the polygon and drag a vertex -> PUT /api/shapes/:id', async () => {
    // Click inside the polygon: Deck.gl picks it and hands it to the engine
    // for editing (vertices become draggable).
    await page.mouse.click(p.inside.x, p.inside.y)
    await page.waitForTimeout(800)

    const updated = page.waitForResponse(
      (r) => r.url().includes(`/api/shapes/${shapeId}`) && r.request().method() === 'PUT',
    )
    // Drag the last vertex ~50px north-east.
    await page.mouse.move(p.c.x, p.c.y)
    await page.mouse.down()
    await page.mouse.move(p.c.x + 50, p.c.y - 30, { steps: 10 })
    await page.mouse.up()

    const response = await updated
    expect(response.status()).toBe(200)
    const shape = (await response.json()) as { id: string }
    expect(shape.id).toBe(shapeId)

    await test.info().attach('after-update', {
      body: await page.screenshot(),
      contentType: 'image/png',
    })
  })

  await test.step('DELETE: press Delete on the selected shape -> DELETE /api/shapes/:id', async () => {
    const deleted = page.waitForResponse(
      (r) =>
        r.url().includes(`/api/shapes/${shapeId}`) && r.request().method() === 'DELETE',
    )
    await page.keyboard.press('Delete')

    const response = await deleted
    expect(response.status()).toBe(200)
    expect(await response.json()).toEqual({ ok: true })

    await test.info().attach('after-delete', {
      body: await page.screenshot(),
      contentType: 'image/png',
    })
  })

  await test.step('server state: a fresh snapshot no longer contains the shape', async () => {
    // Reload -> new WS connection -> fresh shapeSnapshot from the server.
    const ids: string[] = []
    page.on('websocket', (ws) => {
      ws.on('framereceived', (frame) => {
        try {
          const msg = JSON.parse(String(frame.payload))
          if (msg.type === 'shapeSnapshot') {
            ids.push(...msg.shapes.map((s: { id: string }) => s.id))
          }
        } catch {
          /* ignore */
        }
      })
    })
    await page.reload()
    await expect.poll(() => ids.length).toBeGreaterThan(0)
    expect(ids).toEqual(expect.arrayContaining(['polygon-1', 'polygon-2', 'polygon-3']))
    expect(ids).not.toContain(shapeId)
  })
})
