// Las funciones de las distintas ramas, juntas: menú compacto con buscador, tabla de contenidos
// y notas, series, archivo, ficha del mapa y tarjetas para compartir. Corre sobre la construcción
// de prueba (npm run build:prueba), que incluye los borradores de ejemplo.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { abrir } from './ayudas';

const graves = async (page: import('@playwright/test').Page) => {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return r.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .filter((v) => !(v.id === 'target-size' && v.nodes.every((n) => String(n.target[0]).includes('leaflet-marker'))))
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

test('la cabecera lleva Buscar en el menú ancho o en el compacto', async ({ page, isMobile }) => {
  await abrir(page, '');
  if (isMobile) {
    await page.locator('.menu-compacto summary').click();
    await expect(page.locator('.menu-compacto').getByRole('link', { name: 'Buscar' })).toBeVisible();
    await expect(page.locator('.menu-ancho')).toBeHidden();
  } else {
    await expect(page.locator('.menu-ancho').getByRole('link', { name: 'Buscar' })).toBeVisible();
    await expect(page.locator('.menu-compacto')).toBeHidden();
  }
});

test('el sitio construido no lleva el selector de tema', async ({ page }) => {
  await abrir(page, '');
  await expect(page.locator('html')).toHaveAttribute('data-tema', 'provisorio');
  expect(await page.locator('.selector-tema, [data-selector-tema]').count()).toBe(0);
});

test('entrada larga: tabla de contenidos, notas de ida y vuelta, serie y tarjeta OG', async ({ page, isMobile }) => {
  await abrir(page, 'blog/ejemplo-entrada-larga/');
  const indice = isMobile ? page.locator('.indice-plegable') : page.locator('.indice-lateral');
  if (isMobile) await indice.locator('summary').click();
  await indice.getByRole('link', { name: 'Segunda sección de relleno' }).click();
  await expect(page).toHaveURL(/#segunda-secci(ó|%C3%B3)n-de-relleno$/);

  const llamada = page.locator('[data-footnote-ref]').first();
  await llamada.click();
  await expect(page).toHaveURL(/#user-content-fn-1$|#fn-1$|#fn1$/);
  await page.locator('[data-footnote-backref]').first().click();
  await expect(page).toHaveURL(/fnref/);

  await expect(page.locator('.nav-serie')).toBeVisible();
  const og = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(og).toMatch(/\/og\/blog\/ejemplo-entrada-larga\.png$/);
  const respuesta = await page.request.get(new URL(og!).pathname);
  expect(respuesta.status()).toBe(200);
  expect(respuesta.headers()['content-type']).toContain('image/png');
});

test('serie y archivo listan las entradas', async ({ page }) => {
  await abrir(page, 'series/serie-de-ejemplo/');
  await expect(page.getByRole('link', { name: 'Entrada de ejemplo larga' }).first()).toBeVisible();
  await abrir(page, 'blog/archivo/');
  await expect(page.getByRole('link', { name: 'Entrada de ejemplo larga' })).toBeVisible();
});

test('mapa: «Ver en el mapa» abre la ficha, que pasa la revisión de accesibilidad', async ({ page }) => {
  const errores = await abrir(page, 'mapa/');
  await page.locator('[data-ver-en-mapa]').first().click();
  const panel = page.locator('#ficha-panel');
  await expect(panel).toBeVisible();
  await expect(panel.locator('h2')).toBeVisible();
  expect(await graves(page), 'problemas de accesibilidad con la ficha abierta').toEqual([]);
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  expect(errores).toEqual([]);
});

test('ensayo en revista: datos en la ficha y cita APA y BibTeX con volumen, número, páginas y DOI', async ({ page }) => {
  await abrir(page, 'ensayos/ejemplo-ensayo-revista/');
  const publicacion = page.locator('.publicacion');
  await expect(publicacion).toContainText('Revista de Relleno, vol. 12, n.º 3, pp. 45–67');
  await expect(publicacion.getByRole('link', { name: '10.0000/relleno.2026.003' })).toHaveAttribute('href', 'https://doi.org/10.0000/relleno.2026.003');

  await page.locator('.como-citar summary').click();
  const apa = page.locator('.cita-apa');
  await expect(apa).toHaveText('Lora Veizaga, G. R. (2026). Ensayo de ejemplo en una revista. Revista de Relleno, 12(3), 45–67. https://doi.org/10.0000/relleno.2026.003');
  await expect(apa.locator('em')).toHaveText(['Revista de Relleno', '12']);
  const bibtex = await page.locator('.como-citar pre').textContent();
  expect(bibtex).toMatch(/^@article\{/);
  for (const linea of ['journal = {Revista de Relleno}', 'volume  = {12}', 'number  = {3}', 'pages   = {45--67}', 'doi     = {10.0000/relleno.2026.003}']) {
    expect(bibtex).toContain(linea);
  }
});
