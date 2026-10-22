// Ayudas compartidas por las pruebas.
import type { Page } from '@playwright/test';

// Teselas transparentes en lugar de las de los fondos del mapa (OpenStreetMap, EOX): la prueba
// no depende de un servidor externo ni le suma tráfico.
export const TESELA = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==',
  'base64',
);
export const TESELAS_EXTERNAS = /tile\.openstreetmap\.org|tiles\.maps\.eox\.at/;

export async function abrir(page: Page, ruta: string) {
  const errores: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errores.push(m.text());
  });
  page.on('pageerror', (e) => errores.push(e.message));
  await page.route(TESELAS_EXTERNAS, (r) => r.fulfill({ contentType: 'image/png', body: TESELA }));
  await page.goto(ruta);
  await page.waitForLoadState('networkidle');
  return errores;
}
