// Pruebas del sitio construido (dist/), servido con `astro preview`.
// Uso: npm run build && npm run revisar:pruebas
import { defineConfig } from '@playwright/test';
import { BASE } from './sitio.config.mjs';

const PUERTO = 4321;
// En una computadora con Chromium ya instalado se puede indicar con CHROMIUM_PATH.
const lanzamiento = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};

export default defineConfig({
  testDir: './pruebas',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PUERTO}${BASE.replace(/\/?$/, '/')}`,
    browserName: 'chromium',
    launchOptions: lanzamiento,
  },
  projects: [
    { name: 'escritorio', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'celular', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
  ],
  webServer: {
    command: `npx astro preview --port ${PUERTO} --ignore-lock`,
    port: PUERTO,
    reuseExistingServer: !process.env.CI,
  },
});
