// El sitio como se publica (`npm run build`, sin borradores), servido en el puerto 4323
// (playwright.config.ts lo construye en dist-publicado/). Las demás pruebas corren sobre la
// construcción de prueba, que trae las fichas de ejemplo: así no se veía que el mapa publicado,
// todavía sin ningún lugar, no arrancaba.
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { abrir } from './ayudas';
import { BASE } from '../sitio.config.mjs';

test.use({ baseURL: `http://localhost:4323${BASE.replace(/\/?$/, '/')}` });

// Sin desborde: la página no se desplaza de costado.
const desborde = (page: Page) =>
  page.evaluate(() => {
    const visible = document.documentElement.clientWidth;
    const culpables = [...document.querySelectorAll('body *')]
      .filter((el) => el.getBoundingClientRect().right > visible + 1)
      .filter((el) => !el.closest('.maplibregl-map, .chips'))
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).trim().split(/\s+/).join('.')}`);
    return { ancho: document.documentElement.scrollWidth, visible, culpables };
  });

test('es la construcción publicada: sin fichas de ejemplo', async ({ page }) => {
  const respuesta = await page.goto('mapa/ejemplo-clima/');
  expect(respuesta?.status(), 'las fichas de ejemplo no se publican').toBe(404);
});

test('/mapa arranca sin errores en la consola', async ({ page }) => {
  const errores = await abrir(page, 'mapa/');
  await expect(page.locator('#mapa')).toHaveAttribute('data-cargado', '');
  await expect(page.locator('[data-aviso]')).toBeHidden();
  expect(errores, 'errores en la consola').toEqual([]);
});

test('/mapa no se desplaza de costado, ni con los filtros y la leyenda abiertos', async ({ page, isMobile }) => {
  const errores = await abrir(page, 'mapa/');
  await expect(page.locator('#mapa')).toHaveAttribute('data-cargado', '');
  if (isMobile) {
    await page.locator('.mapa-filtros summary').click();
    await page.locator('[data-leyenda] summary').click();
  }
  await expect(page.locator('.mapa-filtros')).toHaveAttribute('open', '');
  await expect(page.locator('[data-leyenda]')).toHaveAttribute('open', '');
  const { ancho, visible, culpables } = await desborde(page);
  expect(ancho, `la página es más ancha que la pantalla (${culpables.join(', ')})`).toBeLessThanOrEqual(visible);
  expect(errores).toEqual([]);
});

// /mapa/artesanos/ sin ninguna ficha publicada: estado vacío, rotulado, sin datos inventados.
test('/mapa/artesanos/ sin fichas: estado vacío, sin errores, accesible y sin desborde', async ({ page }) => {
  const errores = await abrir(page, 'mapa/artesanos/');
  await expect(page.locator('h1')).toHaveText('Artesanía y emprendimientos');
  await expect(page.locator('.artesanos-vacio')).toContainText('[PENDIENTE: texto del autor]');
  await expect(page.locator('.artesano-tarjeta')).toHaveCount(0);
  await expect(page.locator('.artesanos-filtros')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  const { ancho, visible, culpables } = await desborde(page);
  expect(ancho, `la página es más ancha que la pantalla (${culpables.join(', ')})`).toBeLessThanOrEqual(visible);
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);
  expect(errores, 'errores en la consola').toEqual([]);
});

test('/mapa/artesanos/ queda fuera del sitemap mientras no tenga fichas publicadas', async ({ page }) => {
  const respuesta = await page.request.get('sitemap-0.xml');
  expect(respuesta.status()).toBe(200);
  expect(await respuesta.text()).not.toContain('/mapa/artesanos/');
});

test('/mapa no enlaza a /mapa/artesanos/ mientras no haya fichas de esos tipos', async ({ page }) => {
  await abrir(page, 'mapa/');
  await expect(page.locator('a[href$="/mapa/artesanos/"]')).toHaveCount(0);
});
