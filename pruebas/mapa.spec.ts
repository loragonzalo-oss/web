// Mapa (/mapa) con MapLibre: grupos de puntos, enlace propio de cada ficha, «atrás», foco,
// búsqueda, filtros en la dirección, leyenda, panel en celular, menos movimiento y versión
// liviana (sin WebGL o con ahorro de datos). Corre sobre la construcción de prueba (npm run build:prueba), que
// incluye las fichas de ejemplo: once lugares, uno de ellos oculto, una línea y un polígono.
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { abrir } from './ayudas';

const mapa = (page: Page) => page.locator('#mapa');
const panel = (page: Page) => page.locator('#ficha-panel');

async function abrirMapa(page: Page, ruta = 'mapa/') {
  const errores = await abrir(page, ruta);
  await expect(mapa(page)).toHaveAttribute('data-cargado', '');
  return errores;
}

const graves = async (page: Page) => {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return r.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    // Excepción «Equivalente» de WCAG 2.5.8: cada marcador tiene su par en el listado.
    .filter((v) => !(v.id === 'target-size' && v.nodes.every((n) => String(n.target[0]).includes('maplibregl-marker'))))
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

// Cuántos lugares representan los marcadores a la vista: uno por botón de lugar, N por grupo.
async function lugaresEnMarcadores(page: Page) {
  return page.evaluate(() => {
    const pines = document.querySelectorAll('#mapa .pin').length;
    const grupos = [...document.querySelectorAll('#mapa .grupo')].reduce((n, g) => n + Number(g.textContent), 0);
    return { pines, grupos: document.querySelectorAll('#mapa .grupo').length, total: pines + grupos };
  });
}

test('el motor del mapa sólo se descarga en /mapa', async ({ page }) => {
  const pedidos: string[] = [];
  page.on('request', (r) => pedidos.push(r.url()));
  await abrir(page, '');
  await abrir(page, 'blog/');
  expect(pedidos.filter((u) => /motor|maplibre/i.test(u))).toEqual([]);
  await abrirMapa(page);
  expect(pedidos.some((u) => /\/_astro\/motor\.[\w-]+\.js$/.test(u))).toBe(true);
  expect(pedidos.some((u) => /maplibre-gl-worker/.test(u))).toBe(true);
});

test('agrupa los lugares cercanos y el grupo dice cuántos son', async ({ page }) => {
  const errores = await abrirMapa(page);
  const enMapa = await page.locator('.listado-item[data-en-mapa]').count();
  await expect.poll(async () => (await lugaresEnMarcadores(page)).total).toBe(enMapa);
  const { grupos } = await lugaresEnMarcadores(page);
  expect(grupos, 'con la vista inicial tiene que haber al menos un grupo').toBeGreaterThan(0);

  // Un grupo es un botón que acerca el mapa.
  const grupo = page.locator('#mapa .grupo').first();
  await expect(grupo).toHaveAttribute('aria-label', /^Grupo de \d+ lugares cercanos/);
  const zoom = Number(await mapa(page).getAttribute('data-zoom'));
  await grupo.click();
  await expect.poll(async () => Number(await mapa(page).getAttribute('data-zoom'))).toBeGreaterThan(zoom);
  expect(errores).toEqual([]);
});

test('el enlace propio abre la ficha y centra la vista en el lugar', async ({ page }) => {
  const errores = await abrirMapa(page, 'mapa/#lugar-ejemplo-clima');
  await expect(panel(page)).toBeVisible();
  await expect(panel(page).locator('h2')).toHaveText('Ficha de ejemplo · Clima');
  // El punto queda a la vista, en la parte del mapa que la ficha no tapa.
  const pin = page.locator('#mapa .pin[data-lugar="ejemplo-clima"]');
  await expect(pin).toHaveClass(/activo/);
  const [p, f, m] = await Promise.all([pin.boundingBox(), panel(page).boundingBox(), mapa(page).boundingBox()]);
  expect(p!.x).toBeGreaterThan(m!.x);
  expect(p!.y).toBeGreaterThan(m!.y);
  if (f!.width < m!.width - 2) expect(p!.x + p!.width).toBeLessThan(f!.x);
  else expect(p!.y + p!.height).toBeLessThan(f!.y);
  expect(errores).toEqual([]);
});

test('una línea y un polígono abren su ficha desde el listado', async ({ page }) => {
  await abrirMapa(page);
  for (const [id, titulo] of [['ejemplo-linea', 'Línea'], ['ejemplo-poligono', 'Polígono']]) {
    const zoom = await mapa(page).getAttribute('data-zoom');
    await page.locator(`.listado-item[data-lugar="${id}"] [data-ver-en-mapa]`).click();
    await expect(panel(page).locator('h2')).toHaveText(`Ficha de ejemplo · ${titulo}`);
    await expect.poll(() => mapa(page).getAttribute('data-zoom')).not.toBe(zoom);
    await expect(page.locator(`#mapa .pin[data-lugar="${id}"]`)).toHaveClass(/pin-forma/);
    await page.keyboard.press('Escape');
    await expect(panel(page)).toBeHidden();
  }
});

test('regla 6: una ficha oculta se abre sin mover el mapa', async ({ page }) => {
  await abrirMapa(page);
  const vista = [await mapa(page).getAttribute('data-centro'), await mapa(page).getAttribute('data-zoom')];
  await page.goto('mapa/#lugar-ejemplo-cultura');
  await expect(mapa(page)).toHaveAttribute('data-cargado', '');
  await expect(panel(page).locator('h2')).toHaveText('Ficha de ejemplo · Cultura');
  expect([await mapa(page).getAttribute('data-centro'), await mapa(page).getAttribute('data-zoom')]).toEqual(vista);
  await expect(page.locator('#mapa .pin[data-lugar="ejemplo-cultura"]')).toHaveCount(0);
});

test('«atrás» cierra la ficha', async ({ page }) => {
  await abrirMapa(page);
  await page.locator('.listado-item[data-lugar="ejemplo-turismo"] [data-ver-en-mapa]').click();
  await expect(panel(page)).toBeVisible();
  expect(new URL(page.url()).hash).toBe('#lugar-ejemplo-turismo');
  await page.goBack();
  await expect(panel(page)).toBeHidden();
  expect(new URL(page.url()).hash).toBe('');
  expect(new URL(page.url()).pathname).toMatch(/\/mapa\/$/);
});

test('Escape cierra la ficha y el foco vuelve al punto', async ({ page }) => {
  await abrirMapa(page, 'mapa/#lugar-ejemplo-ecologia');
  await page.locator('.ficha-cerrar').click();
  const pin = page.locator('#mapa .pin[data-lugar="ejemplo-ecologia"]');
  await pin.focus();
  await page.keyboard.press('Enter');
  await expect(panel(page)).toBeVisible();
  await expect(panel(page).locator('h2')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(panel(page)).toBeHidden();
  await expect(pin).toBeFocused();
});

test('«Copiar enlace» copia la página propia del lugar', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await abrirMapa(page);
  await page.locator('.listado-item[data-lugar="ejemplo-linea"] [data-ver-en-mapa]').click();
  const boton = panel(page).locator('[data-copiar]');
  test.skip((await boton.textContent()) !== 'Copiar enlace', 'este navegador comparte en lugar de copiar');
  await boton.click();
  await expect(panel(page).locator('[data-copiado]')).toHaveText('Enlace copiado.');
  const copiado = await page.evaluate(() => navigator.clipboard.readText());
  expect(copiado).toMatch(/^https?:\/\/[^#]+\/mapa\/ejemplo-linea\/$/);
  await expect(panel(page).locator('[data-pagina-lugar]')).toHaveAttribute('href', /\/mapa\/ejemplo-linea\/$/);
});

test('la búsqueda filtra el listado y el mapa, con teclado y sin tildes', async ({ page }) => {
  await abrirMapa(page);
  const total = await page.locator('.listado-item').count();
  const buscador = page.getByLabel('Buscar en el mapa');
  await buscador.focus();
  await page.keyboard.type('poligono');
  await expect(page.locator('.listado-item:visible')).toHaveCount(1);
  await expect(page.locator('.listado-estado')).toHaveText(`Se muestran 1 de ${total} lugares.`);
  await expect.poll(async () => (await lugaresEnMarcadores(page)).total).toBe(1);
  expect(new URL(page.url()).searchParams.get('q')).toBe('poligono');

  await page.keyboard.press('Control+A');
  await page.keyboard.type('nada que coincida');
  await expect(page.locator('[data-sin-resultados]')).toBeVisible();
  await expect.poll(async () => (await lugaresEnMarcadores(page)).total).toBe(0);

  await buscador.fill('');
  await expect(page.locator('.listado-item:visible')).toHaveCount(total);
  expect(new URL(page.url()).searchParams.has('q')).toBe(false);
});

test('los filtros por capa y por país se combinan y quedan en la dirección', async ({ page, isMobile }) => {
  await abrirMapa(page);
  if (isMobile) {
    await test.step('desplegar «Capas y país» (en celular empieza plegado)', async () => {
      await page.locator('.mapa-filtros summary').click({ timeout: 5000 });
      await expect(page.locator('.mapa-filtros')).toHaveAttribute('open', '', { timeout: 5000 });
    });
  }
  // Las casillas se marcan con el teclado: es como las usa quien no usa el ratón, y no depende de
  // dónde caiga un toque dentro de la fila de filtros, que en celular se desplaza de costado.
  // Cada paso con su límite de tiempo, para que un fallo diga dónde se trabó.
  const marcar = async (filtro: string, valor: string) => {
    const casilla = page.locator(`[data-filtro="${filtro}"] input[value="${valor}"]`);
    await casilla.focus({ timeout: 5000 });
    await page.keyboard.press('Space');
    await expect(casilla).not.toBeChecked({ timeout: 5000 });
  };
  await test.step('apagar la capa Clima', async () => {
    await marcar('capa', 'clima');
    await expect(page.locator('.listado-item[data-lugar="ejemplo-clima"]')).toBeHidden({ timeout: 5000 });
    expect(new URL(page.url()).searchParams.get('capa')).not.toContain('clima');
  });
  await test.step('apagar «Sin país asignado»', async () => {
    await marcar('pais', 'sin-pais');
    // Quedan las fichas con país: la línea (binacional) y el polígono (Perú).
    await expect(page.locator('.listado-item:visible')).toHaveCount(2, { timeout: 5000 });
    expect(new URL(page.url()).searchParams.get('pais')).toBe('bolivia,peru,binacional');
  });
  await test.step('el mapa muestra sólo esos dos lugares', async () => {
    await expect.poll(async () => (await lugaresEnMarcadores(page)).total, { timeout: 8000 }).toBe(2);
  });
});

// Aparte de la anterior: cada carga del mapa pesa, y juntas se acercaban al límite de tiempo en CI.
// Los filtros de la dirección los aplica la parte liviana: se prueba sin WebGL, así el mapa no se descarga.
test('una dirección con filtros abre la vista filtrada', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error se reemplaza para simular un navegador sin WebGL
    HTMLCanvasElement.prototype.getContext = function (tipo: string, ...resto: unknown[]) {
      return /webgl/.test(tipo) ? null : original.call(this, tipo, ...resto);
    };
  });
  await abrir(page, 'mapa/?capa=clima,ecologia,biodiversidad,cultura,antropologia,arqueologia,turismo,emprendimientos-comunitarios,gobiernos-municipales&pais=bolivia,peru,binacional');
  await expect(page.locator('.listado-item:visible')).toHaveCount(2);
  await abrir(page, 'mapa/?capa=ecologia,biodiversidad&pais=bolivia,peru,binacional');
  await expect(page.locator('.listado-item:visible')).toHaveCount(2);
  await expect(page.locator('[data-filtro="capa"] input[value="clima"]')).not.toBeChecked();
  await abrir(page, 'mapa/?pais=peru');
  await expect(page.locator('.listado-item:visible')).toHaveCount(1);
  await expect(page.locator('.listado-item:visible')).toHaveAttribute('data-lugar', 'ejemplo-poligono');
});

test('no se desplaza de costado con los filtros, la leyenda y una ficha abiertos', async ({ page, isMobile }) => {
  await abrirMapa(page, 'mapa/#lugar-ejemplo-linea');
  await expect(panel(page)).toBeVisible();
  if (isMobile) {
    await page.locator('.mapa-filtros summary').click();
    await page.locator('[data-leyenda] summary').click();
  }
  await expect(page.locator('.mapa-filtros')).toHaveAttribute('open', '');
  await expect(page.locator('[data-leyenda]')).toHaveAttribute('open', '');
  const { ancho, visible } = await page.evaluate(() => ({ ancho: document.documentElement.scrollWidth, visible: document.documentElement.clientWidth }));
  expect(ancho, 'la página es más ancha que la pantalla').toBeLessThanOrEqual(visible);
});

test('la leyenda muestra cada capa y se pliega en celular', async ({ page, isMobile }) => {
  await abrirMapa(page);
  const leyenda = page.locator('[data-leyenda]');
  if (isMobile) {
    await expect(leyenda).not.toHaveAttribute('open', '');
    await leyenda.locator('summary').click();
  }
  await expect(leyenda).toHaveAttribute('open', '');
  await expect(leyenda.locator('.leyenda-capas li')).toHaveCount(9);
  await expect(leyenda).toContainText('Ubicación aproximada');
});

test('el fondo se elige con un control; el relieve y el fondo del lago explican por qué no están', async ({ page }) => {
  await abrirMapa(page);
  await expect(page.locator('input[name="fondo"][value="mapa"]')).toBeChecked();
  await page.locator('label', { hasText: 'Satélite' }).click();
  await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText('Sentinel-2 cloudless');
  await expect(page.locator('.maplibregl-ctrl-attrib')).not.toContainText('OpenStreetMap');
  const relieve = page.locator('input[name="fondo"][value="relieve"]');
  await expect(relieve).toBeDisabled();
  await expect(page.locator('#fondo-motivo-relieve')).toContainText('Copernicus DEM');
  // En la construcción de prueba, el fondo del lago es un relleno sintético, rotulado.
  await page.locator('label', { hasText: 'Fondo del lago (batimetría)' }).click();
  await expect(page.locator('[data-rotulo-lago]')).toHaveText('Fondo del lago: sintético, no es el fondo real');
});

test('en celular la ficha sale desde abajo, tapa menos de la mitad del mapa y se agranda', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'sólo en celular');
  await abrirMapa(page, 'mapa/#lugar-ejemplo-biodiversidad');
  const [f, m] = await Promise.all([panel(page).boundingBox(), mapa(page).boundingBox()]);
  expect(f!.height).toBeLessThan(m!.height / 2);
  expect(Math.abs(f!.y + f!.height - (m!.y + m!.height))).toBeLessThan(3);
  expect(f!.width).toBeGreaterThan(m!.width - 4);

  const asa = panel(page).locator('[data-asa]');
  await asa.click();
  await expect(asa).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(async () => (await panel(page).boundingBox())!.height).toBeGreaterThan(m!.height * 0.9);

  // Texto legible sin zoom.
  const tam = await panel(page).locator('.ficha-texto p').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(tam).toBeGreaterThanOrEqual(16);
  expect(await graves(page), 'accesibilidad con la ficha abierta').toEqual([]);

  await panel(page).locator('.ficha-cerrar').click();
  await expect(panel(page)).toBeHidden();
});

test('sin WebGL: listado completo, aviso, filtros y enlace propio, sin descargar el motor', async ({ page }) => {
  const pedidos: string[] = [];
  page.on('request', (r) => pedidos.push(r.url()));
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error se reemplaza para simular un navegador sin WebGL
    HTMLCanvasElement.prototype.getContext = function (tipo: string, ...resto: unknown[]) {
      return /webgl/.test(tipo) ? null : original.call(this, tipo, ...resto);
    };
  });
  const errores = await abrir(page, 'mapa/#lugar-ejemplo-antropologia');
  await expect(page.locator('[data-aviso]')).toContainText('le falta WebGL');
  await expect(page.locator('[data-mapa-zona]')).toBeHidden();
  await expect(page.locator('[data-mapa-pie]')).toBeHidden();
  await expect(page.locator('.listado-item:visible')).toHaveCount(11);
  await expect(page.locator('[data-ver-en-mapa]:visible')).toHaveCount(0);
  // El enlace propio abre la ficha en el listado.
  await expect(page.locator('#lugar-ejemplo-antropologia details')).toHaveAttribute('open', '');
  await page.getByLabel('Buscar en el mapa').fill('clima');
  await expect(page.locator('.listado-item:visible')).toHaveCount(1);
  expect(pedidos.filter((u) => /motor|maplibre/i.test(u))).toEqual([]);
  expect(await graves(page), 'accesibilidad de la versión liviana').toEqual([]);
  expect(errores).toEqual([]);
});

test('con menos movimiento: el mapa se carga igual y se mueve sin animaciones', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await abrirMapa(page);
  await expect(page.locator('[data-aviso]')).toBeHidden();
  // Un grupo acerca el mapa de un salto: sin animación, el zoom cambia casi enseguida
  // (una animación de MapLibre dura medio segundo).
  const zoom = await mapa(page).getAttribute('data-zoom');
  await page.locator('#mapa .grupo').first().click();
  await expect(mapa(page)).not.toHaveAttribute('data-zoom', zoom!, { timeout: 300 });
});

test('sin JavaScript, /mapa muestra el listado sin controles que no funcionarían', async ({ browser }) => {
  const contexto = await browser.newContext({ javaScriptEnabled: false });
  const page = await contexto.newPage();
  await page.goto('mapa/');
  await expect(page.locator('.listado-item:visible')).toHaveCount(11);
  await expect(page.locator('[data-controles]')).toBeHidden();
  await expect(page.locator('[data-mapa-pie]')).toBeHidden();
  await expect(page.locator('#mapa noscript')).toHaveCount(1);
  await contexto.close();
});

test('con ahorro de datos: el mapa no se descarga solo, pero se puede pedir', async ({ page }) => {
  const pedidos: string[] = [];
  page.on('request', (r) => pedidos.push(r.url()));
  await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true, effectiveType: '4g' } }));
  await abrir(page, 'mapa/');
  await expect(page.locator('[data-aviso]')).toContainText('ahorrar datos');
  expect(pedidos.filter((u) => /motor|maplibre/i.test(u))).toEqual([]);
  await page.getByRole('button', { name: 'Cargar el mapa igual' }).click();
  await expect(mapa(page)).toHaveAttribute('data-cargado', '');
});

test('cada lugar tiene su página, legible sin JavaScript, con tarjeta para compartir', async ({ browser }) => {
  const contexto = await browser.newContext({ javaScriptEnabled: false });
  const page = await contexto.newPage();
  await page.goto('mapa/ejemplo-linea/');
  await expect(page.locator('h1')).toHaveText('Ficha de ejemplo · Línea');
  await expect(page.locator('.ficha-texto')).toContainText('Esta ficha prueba una línea');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Ficha de ejemplo · Línea');
  const og = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(og).toMatch(/\/og\/mapa\/ejemplo-linea\.png$/);
  const respuesta = await page.request.get(new URL(og!).pathname);
  expect(respuesta.status()).toBe(200);
  await expect(page.getByRole('link', { name: 'Ver la línea en el mapa' })).toHaveAttribute('href', /\/mapa\/#lugar-ejemplo-linea$/);
  await contexto.close();
});
