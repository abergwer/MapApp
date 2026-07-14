import { test, expect } from '@playwright/test'

/**
 * Test 3 — clicking a live target opens its details card.
 *
 * drone-1 patrols a tight box around the initial map center (see
 * server/server.js), so it is always on screen. The target moves every
 * second, so each click attempt re-projects its CURRENT position through
 * Deck's own viewport (`window.__projectTarget`, DEV hook) — the same
 * projection the bridge's click hit-test uses — and clicks there.
 *
 * Asserts the card shows the image and the live details, and that the
 * close button dismisses it.
 */

test('clicking a target shows its details card', async ({ page }) => {
  await page.goto('/')

  // Live data present + a couple of ticks so Deck has rendered the icons.
  await expect
    .poll(() => page.evaluate(() => window.__liveDataStore?.drones.length ?? 0))
    .toBeGreaterThan(0)
  await page.waitForTimeout(2500)

  const overlay = page.locator('canvas.deck-overlay')
  await expect(overlay).toBeVisible()
  const card = page.getByTestId('target-card')

  await test.step('click drone-1 on the map', async () => {
    // The target moves ~every second — re-project immediately before each
    // click and retry a few times to absorb an unlucky tick.
    let opened = false
    for (let attempt = 0; attempt < 5 && !opened; attempt++) {
      const projected = await page.evaluate(() => {
        const drone = window.__liveDataStore?.drones.find((d) => d.id === 'drone-1')
        return drone && window.__projectTarget ? window.__projectTarget(drone.position) : null
      })
      if (projected) {
        const box = (await overlay.boundingBox())!
        await page.mouse.click(box.x + projected[0], box.y + projected[1])
        opened = await card.isVisible({ timeout: 1000 }).catch(() => false)
      }
      if (!opened) await page.waitForTimeout(700)
    }
    await expect(card).toBeVisible()
  })

  await test.step('card shows the target image and details', async () => {
    await expect(page.getByTestId('target-card-id')).toHaveText('drone-1')
    await expect(page.getByTestId('target-card-kind')).toHaveText('Drone')

    // The image actually loaded (not a broken img element).
    const image = page.getByTestId('target-card-image')
    await expect(image).toBeVisible()
    expect(
      await image.evaluate((el) => (el as HTMLImageElement).naturalWidth),
    ).toBeGreaterThan(0)

    for (const label of ['Latitude', 'Longitude', 'Heading', 'Speed']) {
      await expect(card.getByText(label)).toBeVisible()
    }

    // Details are live: the position readout changes on the next tick.
    const readPosition = () => card.textContent()
    const before = await readPosition()
    await expect.poll(readPosition, { timeout: 5_000 }).not.toBe(before)

    await test.info().attach('target-card', {
      body: await page.screenshot(),
      contentType: 'image/png',
    })
  })

  await test.step('close button dismisses the card', async () => {
    await page.getByRole('button', { name: 'Close target card' }).click()
    await expect(card).toHaveCount(0)
  })
})
