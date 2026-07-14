import { defineConfig } from '@playwright/test'

/**
 * E2E setup for MapApp.
 *
 * Playwright boots both servers (and reuses them when already running):
 *   - demo data server (REST writes + WS broadcasts) on :4000
 *   - vite dev server on :5174 (forced port so the baseURL is stable)
 *
 * Uses the locally installed Chrome (`channel: 'chrome'`) because browser
 * downloads are blocked on this machine.
 *
 * Reports: `playwright-report/` (HTML, open with `npm run test:e2e:report`),
 * plus screenshots/videos/traces of every run for the visual story.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  // The two tests share one server (and test 2 mutates it) — run serially.
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5174',
    channel: 'chrome',
    viewport: { width: 1440, height: 900 },
    screenshot: 'on',
    video: 'on',
    trace: 'on',
  },
  webServer: [
    {
      command: 'node server/server.js',
      port: 4000,
      reuseExistingServer: true,
    },
    {
      command: 'npx vite --port 5174 --strictPort',
      port: 5174,
      reuseExistingServer: true,
    },
  ],
})
