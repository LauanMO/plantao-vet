import { defineConfig, devices } from '@playwright/test'

// Joga os casos de teste sozinho, no celular em pé e no PC. Uso: npm run e2e
// Os testes do Vitest são *.test.ts; os do Playwright, *.e2e.ts, para um não rodar os do outro.
const PORTA = 5199
// O build de teste (--mode teste leva todos os casos), com o service worker que o npm run dev não tem.
// A porta se repete no teste do jogo instalado, em tests/atendimento.e2e.ts.
const PORTA_DO_BUILD = 5198

export default defineConfig({
  testDir: 'tests',
  testMatch: '*.e2e.ts',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${PORTA}` },
  projects: [
    { name: 'celular', use: { ...devices['Pixel 7'] } },
    { name: 'pc', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } } },
  ],
  webServer: [
    {
      command: `npm run dev -- --port ${PORTA} --strictPort`,
      url: `http://localhost:${PORTA}`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npx vite build --mode teste --outDir dist-teste && npx vite preview --outDir dist-teste --port ${PORTA_DO_BUILD} --strictPort`,
      url: `http://localhost:${PORTA_DO_BUILD}`,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
