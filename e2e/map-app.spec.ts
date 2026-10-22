import { expect, test } from '@playwright/test'

type LiveDataSnapshot = {
  drones: number
  aircraft: number
  missiles: number
  shapes: number
  shapesHydrated: boolean
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('System Operational')).toBeVisible()
})

test('hydrates live feeds and loads the selected missile in 3D', async ({ page }) => {
  await expect
    .poll(async (): Promise<LiveDataSnapshot | null> =>
      page.evaluate(() => {
        const store = Reflect.get(globalThis, '__liveDataStore') as
          | {
              drones: unknown[]
              aircraft: unknown[]
              missiles: unknown[]
              shapes: unknown[]
              shapesHydrated: boolean
            }
          | undefined
        if (!store) return null

        return {
          drones: store.drones.length,
          aircraft: store.aircraft.length,
          missiles: store.missiles.length,
          shapes: store.shapes.length,
          shapesHydrated: store.shapesHydrated,
        }
      }),
    )
    .toMatchObject({
      drones: expect.any(Number),
      aircraft: expect.any(Number),
      missiles: expect.any(Number),
      shapes: 3,
      shapesHydrated: true,
    })

  const snapshot = await page.evaluate(() => {
    const store = Reflect.get(globalThis, '__liveDataStore') as
      | { drones: unknown[]; aircraft: unknown[]; missiles: unknown[] }
      | undefined
    return {
      drones: store?.drones.length ?? 0,
      aircraft: store?.aircraft.length ?? 0,
      missiles: store?.missiles.length ?? 0,
    }
  })

  expect(snapshot.drones).toBeGreaterThan(0)
  expect(snapshot.aircraft).toBeGreaterThan(0)
  expect(snapshot.missiles).toBeGreaterThan(0)

  await page.getByRole('button', { name: 'Open Missiles view' }).click()
  await page.getByRole('button', { name: /^missile-1\b/i }).click()
  await expect(page.getByText('Lat', { exact: true })).toBeVisible()
  await expect(page.getByText('Lng', { exact: true })).toBeVisible()
})

test('toggles the drones layer group and its child layers together', async ({ page }) => {
  await page.getByRole('button', { name: 'Open Layers view' }).click()

  const group = page.getByRole('switch', { name: 'Toggle Drones + Rings layer' })
  await expect(group).toBeChecked()
  await group.click()
  await expect(group).not.toBeChecked()

  await page.getByRole('button', { name: 'Expand Drones + Rings' }).click()
  await expect(page.getByRole('switch', { name: 'Toggle Drones layer' })).not.toBeChecked()
  await expect(page.getByRole('switch', { name: 'Toggle Range Rings layer' })).not.toBeChecked()

  await group.click()
  await expect(page.getByRole('switch', { name: 'Toggle Drones layer' })).toBeChecked()
  await expect(page.getByRole('switch', { name: 'Toggle Range Rings layer' })).toBeChecked()
})

test('moves the video panel through floating, maximized, restored, and docked modes', async ({ page }) => {
  // The workspace dock starts collapsed; expand it first (and move the
  // mouse away so the open tooltip doesn't swallow the next click).
  await page.getByRole('button', { name: 'Expand workspace' }).click()
  await page.mouse.move(10, 10)

  const dockedHeading = page.getByRole('heading', { name: 'Video Feed' })
  await expect(dockedHeading).toBeVisible()

  await page.getByRole('button', { name: 'Float Video Feed window' }).click()
  await expect(dockedHeading).toBeHidden()

  await page.getByRole('button', { name: 'Full view Video Feed' }).click()
  await expect(page.getByRole('button', { name: 'Restore Video Feed window' })).toBeVisible()

  await page.getByRole('button', { name: 'Restore Video Feed window' }).click()
  await expect(page.getByRole('button', { name: 'Full view Video Feed' })).toBeVisible()

  await page.getByRole('button', { name: 'Dock Video Feed to panel' }).click()
  await expect(dockedHeading).toBeVisible()
  await expect(page.getByRole('button', { name: 'Dock Video Feed to panel' })).toBeHidden()
})