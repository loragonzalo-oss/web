// Revisión de /tablero/ sobre la construcción de prueba (npm run build:prueba), donde la
// versión borrador se ve completa. Escritorio (1280 px) y celular (390 px) salen de
// playwright.config.ts; el ancho de 360 px se prueba aparte.
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { abrir } from './ayudas';

const RUTA = 'tablero/';

async function sinDesborde(page: Page) {
  const { ancho, visible } = await page.evaluate(() => ({
    ancho: document.documentElement.scrollWidth,
    visible: document.documentElement.clientWidth,
  }));
  expect(ancho, 'la página es más ancha que la pantalla').toBeLessThanOrEqual(visible);
}

test('carga sin errores de consola ni desborde horizontal', async ({ page }) => {
  const errores = await abrir(page, RUTA);
  expect(errores, 'errores en la consola').toEqual([]);
  await expect(page.locator('h1')).toHaveText('Tablero de indicadores del Lago Titikaka');
  await sinDesborde(page);
});

test('13 pétalos en la rosa y 13 filas en la tabla', async ({ page }) => {
  await abrir(page, RUTA);
  await expect(page.locator('svg.rosa [data-petalo]')).toHaveCount(13);
  await expect(page.locator('.tablero-tabla tbody tr[data-petalo]')).toHaveCount(13);
  // La rosa tiene nombre accesible y remite a la tabla.
  await expect(page.locator('svg.rosa')).toHaveAttribute('role', 'img');
  await expect(page.locator('svg.rosa desc')).toContainText('tabla');
});

test('no muestra marcadores de trabajo', async ({ page }) => {
  await abrir(page, RUTA);
  const html = await page.content();
  expect(html).not.toContain('[VERIFICAR]');
  expect(html).not.toMatch(/\[HIP[ÓO]TESIS\]/);
});

test('sin JavaScript propio', async ({ page }) => {
  const scripts: string[] = [];
  page.on('request', (r) => {
    if (r.resourceType() === 'script') scripts.push(r.url());
  });
  await abrir(page, RUTA);
  expect(scripts, 'scripts cargados').toEqual([]);
  expect(await page.locator('script:not([type="application/ld+json"])').count(), 'etiquetas <script>').toBe(0);
});

test('estado de cada pétalo para el lector', async ({ page }) => {
  await abrir(page, RUTA);
  const cohana = page.locator('tr[data-petalo="1"] .tablero-estado');
  await expect(cohana).toHaveText('con fuente');
  await expect(page.locator('tr[data-petalo="3"] .tablero-estado')).toContainText('umbral por convención');
  await expect(page.locator('tr[data-petalo="3"] .tablero-estado')).toContainText('valor provisorio');
});

test('a 360 px: sin desborde y con números en lugar de etiquetas largas', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await abrir(page, RUTA);
  await sinDesborde(page);
  await expect(page.locator('svg.rosa .rosa-numeros')).toBeVisible();
  await expect(page.locator('svg.rosa .rosa-etiquetas')).toBeHidden();
});

for (const modo of ['light', 'dark'] as const) {
  test(`accesibilidad (axe, modo ${modo === 'light' ? 'claro' : 'oscuro'}): sin violaciones`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: modo });
    await abrir(page, RUTA);
    const resultado = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
      .analyze();
    const informe = resultado.violations.map((v) => `[${v.impact}] ${v.id}: ${v.help}\n    ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join('\n    ')}`);
    expect(informe, 'problemas de accesibilidad').toEqual([]);
  });
}
