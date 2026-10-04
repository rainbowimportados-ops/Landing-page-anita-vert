import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

// Em ambientes com Chromium pré-instalado (CI, sessões na nuvem) usa-o em vez de baixar outro.
const chromiumLocal = process.env.CHROMIUM_PATH || ['/opt/pw-browsers/chromium'].find((c) => existsSync(c))

export default defineConfig({
  testDir: './e2e',
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    ...devices['Desktop Chrome'],
    launchOptions: chromiumLocal ? { executablePath: chromiumLocal } : {},
  },
  webServer: {
    command: 'npm run build && npx vite preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
