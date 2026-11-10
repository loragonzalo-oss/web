// Tipos de ficha (campo `ficha`, src/lib/fichas.ts) y /mapa/artesanos/, sobre la construcción de
// prueba (npm run build:prueba), que trae una ficha de ejemplo por tipo, todas en borrador.
// Corre en escritorio y a 390 px (proyectos de playwright.config.ts). El estado vacío de
// /mapa/artesanos/ (sin fichas) se prueba sobre el sitio como se publica: pruebas/publicado.spec.ts.
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { abrir } from './ayudas';

const graves = async (page: Page) => {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return r.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .filter((v) => !(v.id === 'target-size' && v.nodes.every((n) => String(n.target[0]).includes('maplibregl-marker'))))
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

const desborde = (page: Page) =>
  page.evaluate(() => ({ ancho: document.documentElement.scrollWidth, visible: document.documentElement.clientWidth }));

// id → tipo que muestra la cabecera y secciones que la ficha tiene que llevar (títulos en mayúsculas
// por CSS; el texto del DOM es el de la plantilla).
const TIPOS: { id: string; tipo: string; secciones: string[]; texto?: string[] }[] = [
  { id: 'ejemplo-ficha-municipio', tipo: 'Municipio', secciones: ['Galería', 'Historia', 'Enlaces oficiales', 'Fuentes'], texto: ['Nombre oficial', 'Departamento o región', 'Tipo de gobierno', '[PENDIENTE: provincia]', '[PENDIENTE: texto del autor]'] },
  { id: 'ejemplo-ficha-sitio', tipo: 'Sitio', secciones: ['Galería', 'Historia', 'Relacionados en el mapa', 'Enlaces', 'Fuentes'], texto: ['Ubicación protegida.'] },
  { id: 'ejemplo-ficha-sitio-sagrado', tipo: 'Sitio sagrado', secciones: ['Galería', 'Historia', 'Enlaces', 'Fuentes'], texto: ['Ubicación protegida.'] },
  { id: 'ejemplo-ficha-ser', tipo: 'Ser del lago', secciones: ['Galería', 'Historia', 'Lugares relacionados', 'Enlaces', 'Fuentes'], texto: ['Nombre común', 'Nombre científico', 'En aimara'] },
  { id: 'ejemplo-ficha-ecosistema', tipo: 'Ecosistema', secciones: ['Galería', 'Historia', 'Seres y sitios relacionados', 'Enlaces', 'Fuentes'] },
  { id: 'ejemplo-ficha-artesano', tipo: 'Artesanía', secciones: ['Piezas', 'Historia', 'Contactar o comprar', 'Enlaces', 'Fuentes'], texto: ['Oficio', 'Comunidad'] },
  { id: 'ejemplo-ficha-emprendimiento', tipo: 'Emprendimiento', secciones: ['Productos y servicios', 'Historia', 'Contactar o comprar', 'Enlaces', 'Fuentes'], texto: ['Rubro', '[PENDIENTE: fecha de consentimiento'] },
  { id: 'ejemplo-ficha-agencia', tipo: 'Agencia de turismo comunitario', secciones: ['Servicios', 'Historia', 'Contactar o comprar', 'Enlaces', 'Fuentes'] },
];

for (const t of TIPOS) {
  test(`ficha «${t.tipo}»: secciones del tipo, sin errores, accesible y sin desborde`, async ({ page }) => {
    const errores = await abrir(page, `mapa/${t.id}/`);
    await expect(page.locator('.ficha-tipo')).toHaveText(` · ${t.tipo}`);
    const titulos = await page.locator('.ficha-cuerpo .ficha-seccion > h2').allTextContents();
    expect(titulos).toEqual(t.secciones);
    for (const texto of t.texto ?? []) await expect(page.locator('.ficha-cuerpo')).toContainText(texto);
    const { ancho, visible } = await desborde(page);
    expect(ancho, 'la página es más ancha que la pantalla').toBeLessThanOrEqual(visible);
    expect(await graves(page), 'accesibilidad').toEqual([]);
    expect(errores).toEqual([]);
  });
}

test('una ficha sin tipo se dibuja como siempre, sin secciones nuevas', async ({ page }) => {
  await abrir(page, 'mapa/ejemplo-clima/');
  await expect(page.locator('.ficha-tipo')).toHaveCount(0);
  await expect(page.locator('.ficha-cuerpo .ficha-seccion > h2', { hasText: 'Historia' })).toHaveCount(0);
  await expect(page.locator('.ficha-cuerpo .pendiente')).toHaveCount(0);
});

test('el contacto lleva sólo enlaces web y ninguna ficha muestra la consulta del sitio sagrado', async ({ page }) => {
  await abrir(page, 'mapa/ejemplo-ficha-artesano/');
  const hrefs = await page.locator('.ficha-contactar a').evaluateAll((l) => l.map((a) => a.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const h of hrefs) expect(h).toMatch(/^(https?:|mailto:)/);
  await abrir(page, 'mapa/ejemplo-ficha-sitio-sagrado/');
  await expect(page.locator('main')).not.toContainText(/consulta/i);
});

test('el ser lista sus lugares y el ecosistema suma al ser que lo nombra', async ({ page }) => {
  await abrir(page, 'mapa/ejemplo-ficha-ser/');
  const lugares = page.locator('.ficha-seccion', { hasText: 'Lugares relacionados' }).locator('a');
  await expect(lugares).toHaveText(['Ficha de ejemplo · Ecosistema', 'Ficha de ejemplo · Sitio']);
  await abrir(page, 'mapa/ejemplo-ficha-ecosistema/');
  await expect(page.locator('.ficha-seccion', { hasText: 'Seres y sitios relacionados' }).locator('li')).toHaveText(['Ser del lago: Ficha de ejemplo · Ser del lago']);
});

test('el panel del mapa muestra el tipo de ficha', async ({ page }) => {
  const errores = await abrir(page, 'mapa/#lugar-ejemplo-ficha-sitio-sagrado');
  await expect(page.locator('#mapa')).toHaveAttribute('data-cargado', '');
  await expect(page.locator('#ficha-panel')).toBeVisible();
  await expect(page.locator('#ficha-panel .ficha-tipo')).toHaveText(' · Sitio sagrado');
  await expect(page.locator('#ficha-panel .ficha-protegida')).toBeVisible();
  expect(errores).toEqual([]);
});

test.describe('/mapa/artesanos/ con fichas', () => {
  test('grilla con foto, nombre, oficio y comunidad, y enlaces a la ficha y al mapa', async ({ page }) => {
    const errores = await abrir(page, 'mapa/artesanos/');
    await expect(page.locator('h1')).toHaveText('Artesanía y emprendimientos');
    const tarjetas = page.locator('.artesano-tarjeta');
    await expect(tarjetas).toHaveCount(3);
    const artesano = tarjetas.filter({ has: page.locator('[href$="/mapa/ejemplo-ficha-artesano/"]') }).first();
    await expect(artesano.locator('img')).toHaveCount(1);
    await expect(artesano).toContainText('Oficio de ejemplo (relleno)');
    await expect(artesano).toContainText('Comunidad de ejemplo (relleno)');
    await expect(artesano.getByRole('link', { name: /^Ver en el mapa/ })).toHaveAttribute('href', /\/mapa\/#lugar-ejemplo-ficha-artesano$/);
    // La agencia es oculta: sin «Ver en el mapa».
    const agencia = tarjetas.filter({ has: page.locator('[href$="/mapa/ejemplo-ficha-agencia/"]') }).first();
    await expect(agencia.getByRole('link', { name: /^Ver en el mapa/ })).toHaveCount(0);
    await expect(agencia).toContainText('Sin ubicación publicada');
    const { ancho, visible } = await desborde(page);
    expect(ancho, 'la página es más ancha que la pantalla').toBeLessThanOrEqual(visible);
    expect(await graves(page), 'accesibilidad').toEqual([]);
    expect(errores).toEqual([]);
  });

  test('el filtro por tipo y por país funciona sin JavaScript y se combina', async ({ browser }) => {
    const contexto = await browser.newContext({ javaScriptEnabled: false });
    const page = await contexto.newPage();
    await page.goto('mapa/artesanos/');
    await page.locator('.artesanos-filtros').getByRole('link', { name: 'Emprendimientos' }).click();
    await expect(page).toHaveURL(/\/mapa\/artesanos\/emprendimiento\/$/);
    await expect(page.locator('.artesano-tarjeta')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await page.locator('.artesanos-filtros').getByRole('link', { name: 'Bolivia' }).click();
    await expect(page).toHaveURL(/\/mapa\/artesanos\/emprendimiento\/bolivia\/$/);
    await expect(page.locator('.artesano-tarjeta')).toHaveCount(0);
    await expect(page.locator('.vacio')).toContainText('Ninguna ficha coincide con este filtro');
    await page.locator('.artesanos-filtros').getByRole('link', { name: 'Todos' }).first().click();
    await expect(page).toHaveURL(/\/mapa\/artesanos\/todos\/bolivia\/$/);
    await expect(page.locator('.artesano-tarjeta')).toHaveCount(1);
    await expect(page.locator('.artesanos-filtros [aria-current="page"]')).toHaveText(['Todos', 'Bolivia']);
    await contexto.close();
  });

  test('sin ninguna ficha publicada, /mapa/artesanos/ no se ofrece a los buscadores', async ({ page }) => {
    await abrir(page, 'mapa/artesanos/');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  });

  test('/mapa enlaza a la página cuando hay fichas de esos tipos', async ({ page }) => {
    await abrir(page, 'mapa/');
    await expect(page.locator('.mapa-encabezado').getByRole('link', { name: 'Artesanía y emprendimientos' })).toHaveAttribute('href', /\/mapa\/artesanos\/$/);
  });
});
