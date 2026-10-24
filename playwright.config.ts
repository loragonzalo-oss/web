// Pruebas del sitio construido (dist/), servido con `astro preview`.
// Uso: npm run build:prueba && npm run revisar:pruebas
// Arma además un segundo sitio de prueba en dist-compartir/ con COMPARTIR_ACTIVO encendido, y el
// sitio como se publica (sin borradores, como `npm run build`) en dist-publicado/.
import { defineConfig } from '@playwright/test';
import { BASE } from './sitio.config.mjs';

const PUERTO = 4321;
const PUERTO_COMPARTIR = 4322; // también en pruebas/ensayos.spec.ts
const DIST_COMPARTIR = 'dist-compartir';
const PUERTO_PUBLICADO = 4323; // también en pruebas/publicado.spec.ts
const DIST_PUBLICADO = 'dist-publicado';
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
  webServer: [
    {
      command: `npx astro preview --port ${PUERTO} --ignore-lock`,
      port: PUERTO,
      reuseExistingServer: !process.env.CI,
    },
    // Segundo sitio de prueba, con COMPARTIR_ACTIVO encendido (sitio.config.mjs lo trae apagado):
    // las pruebas del bloque «Compartir» encendido corren contra este (pruebas/ensayos.spec.ts).
    {
      command: `npx astro build --mode prueba --outDir ${DIST_COMPARTIR} && npx astro preview --port ${PUERTO_COMPARTIR} --outDir ${DIST_COMPARTIR} --ignore-lock`,
      env: { COMPARTIR_ACTIVO: '1' },
      port: PUERTO_COMPARTIR,
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
    // El sitio como se publica: mismo modo que `npm run build`, sin borradores. Sirve para probar
    // lo que ve el lector hoy, por ejemplo /mapa sin ningún lugar publicado (pruebas/publicado.spec.ts).
    {
      command: `npx astro build --outDir ${DIST_PUBLICADO} && npx astro preview --port ${PUERTO_PUBLICADO} --outDir ${DIST_PUBLICADO} --ignore-lock`,
      port: PUERTO_PUBLICADO,
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
