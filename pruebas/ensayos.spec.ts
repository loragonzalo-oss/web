// Ensayos como referencia: dirección estable, «Publicado originalmente en», cita, tarjeta para
// compartir, bloque «Compartir», versión de resumen, impresión e índice por tema y por serie.
// Corre sobre la construcción de prueba (npm run build:prueba): los ensayos de relleno son borradores.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import sharp from 'sharp';
import { abrir } from './ayudas';
import { SITE, BASE } from '../sitio.config.mjs';

const RAIZ = `${new URL(SITE).origin}${BASE.replace(/\/+$/, '')}`;
const ENSAYOS = {
  revista: 'relleno-ensayo-en-revista',
  linkedin: 'relleno-ensayo-solo-linkedin',
  resumen: 'relleno-ensayo-resumen',
};
const canonicaDe = (slug: string) => `${RAIZ}/ensayos/${slug}/`;

const graves = async (page: import('@playwright/test').Page) => {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

for (const slug of Object.values(ENSAYOS)) {
  test(`${slug}: metadatos para compartir con la dirección del sitio como canónica`, async ({ page }) => {
    await abrir(page, `ensayos/${slug}/`);
    const meta = async (sel: string) => page.locator(sel).getAttribute('content');
    expect(await meta('meta[property="og:type"]')).toBe('article');
    expect(await meta('meta[property="og:title"]')).toBeTruthy();
    expect(await meta('meta[property="og:description"]')).toBeTruthy();
    expect(await meta('meta[property="og:url"]')).toBe(canonicaDe(slug));
    expect(await meta('meta[property="article:published_time"]')).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(await meta('meta[name="twitter:card"]')).toBe('summary_large_image');
    // La canónica (Base.astro la omite en los borradores, que llevan noindex) nunca apunta al
    // lugar de publicación original: es la misma dirección que og:url.
    const canonica = page.locator('link[rel="canonical"]');
    if (await canonica.count()) await expect(canonica).toHaveAttribute('href', canonicaDe(slug));
    else await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');

    // Imagen para compartir: dirección absoluta, 1200 × 630, menos de 5 MB.
    const imagen = (await meta('meta[property="og:image"]'))!;
    expect(imagen).toMatch(/^https?:\/\//);
    expect(await meta('meta[name="twitter:image"]')).toBe(imagen);
    const respuesta = await page.request.get(new URL(imagen).pathname);
    expect(respuesta.status()).toBe(200);
    const cuerpo = await respuesta.body();
    expect(cuerpo.length).toBeLessThan(5 * 1024 * 1024);
    const { width, height } = await sharp(cuerpo).metadata();
    expect([width, height]).toEqual([1200, 630]);
  });

  test(`${slug}: tarjeta tipográfica de 1200 × 630`, async ({ page }) => {
    const respuesta = await page.request.get(`og/ensayos/${slug}.png`);
    expect(respuesta.status()).toBe(200);
    const { width, height, format } = await sharp(await respuesta.body()).metadata();
    expect([format, width, height]).toEqual(['png', 1200, 630]);
  });
}

test('ensayo en revista y LinkedIn: bloque «Publicado originalmente en», cita con DOI y tarjeta propia', async ({ page }) => {
  await abrir(page, `ensayos/${ENSAYOS.revista}/`);
  const bloque = page.locator('.publicado-en').first();
  await expect(bloque.locator('.publicado-rotulo')).toHaveText('Publicado originalmente en');
  // Por fecha: primero LinkedIn (agosto) y después la revista (septiembre).
  await expect(bloque.locator('li')).toHaveCount(2);
  await expect(bloque.locator('li').nth(0)).toContainText('LinkedIn (red social)');
  await expect(bloque.locator('li').nth(1)).toContainText('Revista de Relleno Académico, vol. 4, n.º 2, pp. 10–25');
  await expect(bloque.getByRole('link', { name: '10.0000/relleno.ensayo.001' })).toHaveAttribute('href', 'https://doi.org/10.0000/relleno.ensayo.001');

  await page.locator('.como-citar summary').click();
  await expect(page.locator('.cita-apa')).toHaveText('Lora Veizaga, G. R. (2026). [Relleno] Ensayo en revista y en LinkedIn. Revista de Relleno Académico, 4(2), 10–25. https://doi.org/10.0000/relleno.ensayo.001');
  expect(await page.locator('.como-citar pre').textContent()).not.toContain('linkedin');

  // Con `imagen`, la tarjeta para compartir es esa imagen, recortada a 1200 × 630.
  expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toMatch(/relleno-imagen-compartir.*\.jpe?g$/);
  await expect(page.locator('.credito')).toContainText('Imagen de relleno generada para las pruebas');
});

test('ensayo publicado sólo en LinkedIn: la cita apunta a la web, nunca a LinkedIn', async ({ page }) => {
  await abrir(page, `ensayos/${ENSAYOS.linkedin}/`);
  await page.locator('.como-citar summary').click();
  const apa = await page.locator('.cita-apa').textContent();
  expect(apa).toContain(canonicaDe(ENSAYOS.linkedin));
  expect(apa).not.toMatch(/linkedin\.com/);
  const bibtex = await page.locator('.como-citar pre').textContent();
  expect(bibtex).toMatch(new RegExp(`url\\s+= \\{${canonicaDe(ENSAYOS.linkedin).replace(/[.]/g, '\\.')}\\}`));
  await expect(page.locator('.publicacion li')).toHaveText([/LinkedIn \(red social\)/]);
});

test('versión web de resumen: sin cuerpo ni PDF, con los datos y el enlace al original', async ({ page }) => {
  await abrir(page, `ensayos/${ENSAYOS.resumen}/`);
  await expect(page.locator('.resumen').first()).toContainText('version_web: resumen');
  await expect(page.locator('body')).not.toContainText('CUERPO DE RELLENO');
  await expect(page.locator('[data-version-web="resumen"]')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Leer el texto completo' })).toHaveAttribute('href', 'https://example.org/revista-con-derechos/articulo-1');
  expect(await page.locator('[data-ensayo-pdf], .imprimir').count()).toBe(0);
  await expect(page.locator('.publicado-en').first()).toContainText('Revista de Relleno con Derechos');
  // Cita: el enlace de la publicación formal.
  await page.locator('.como-citar summary').click();
  await expect(page.locator('.cita-apa')).toContainText('https://example.org/revista-con-derechos/articulo-1');
});

// Interruptor COMPARTIR_ACTIVO (sitio.config.mjs). Apagado, que es como viene: sin bloque
// «Compartir» ni enlaces para compartir. Encendido: segundo sitio de prueba en el puerto
// 4322, construido con COMPARTIR_ACTIVO=1 (playwright.config.ts).
test('«Compartir» apagado (COMPARTIR_ACTIVO = false): sin bloque ni enlaces a LinkedIn o X', async ({ page }) => {
  for (const slug of Object.values(ENSAYOS)) {
    await abrir(page, `ensayos/${slug}/`);
    expect(await page.locator('.compartir, .texto-compartir').count(), slug).toBe(0);
    expect(await page.locator('a[href*="linkedin.com/sharing"], a[href*="x.com/intent"]').count(), slug).toBe(0);
  }
});

test.describe('con COMPARTIR_ACTIVO encendido', () => {
  test.use({ baseURL: `http://localhost:4322${BASE.replace(/\/?$/, '/')}` });

  test('«Compartir» encendido: texto listo para copiar con la canónica y enlaces simples, sin scripts', async ({ page }) => {
    await abrir(page, `ensayos/${ENSAYOS.revista}/`);
    await page.locator('.compartir summary').click();
    const texto = (await page.locator('.texto-compartir').textContent())!;
    expect(texto.startsWith('[Relleno] Ensayo en revista y en LinkedIn')).toBe(true);
    expect(texto.endsWith(canonicaDe(ENSAYOS.revista))).toBe(true);
    expect(texto).toContain('Publicado originalmente en LinkedIn y Revista de Relleno Académico.');
    expect(texto).toContain('#TemaDeRellenoA #TemaDeRellenoB');
    expect(texto.length).toBeLessThanOrEqual(650);
    await expect(page.getByRole('link', { name: 'Compartir en LinkedIn' })).toHaveAttribute('href', `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicaDe(ENSAYOS.revista))}`);
    await expect(page.getByRole('link', { name: 'Compartir en X' })).toHaveAttribute('href', /^https:\/\/x\.com\/intent\/post\?/);
    expect(await page.locator('script[src], script[type="module"], iframe').count()).toBe(0);
    expect(await graves(page), 'accesibilidad con «Compartir» y «Cómo citar» abiertos').toEqual([]);
    // Al imprimir, el bloque no sale.
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.compartir')).toBeHidden();
  });
});

test('dirección anterior: manda a la vigente, con la canónica hacia ella y noindex', async ({ page }) => {
  const respuesta = await page.request.get('ensayos/relleno-direccion-anterior/');
  const html = await respuesta.text();
  expect(html).toContain(`<link rel="canonical" href="${canonicaDe(ENSAYOS.linkedin)}">`);
  expect(html).toContain('<meta name="robots" content="noindex">');
  await page.goto('ensayos/relleno-direccion-anterior/');
  await page.waitForURL(/relleno-ensayo-solo-linkedin\/$/);
});

test('impresión: sin menú, «Compartir» ni «Cómo citar»; al pie, dirección, fecha, publicación y cita APA', async ({ page }) => {
  await abrir(page, `ensayos/${ENSAYOS.revista}/`);
  await page.emulateMedia({ media: 'print' });
  for (const sel of ['.cabecera', '.compartir', '.como-citar', '.imprimir', '.nav-serie']) {
    await expect(page.locator(sel).first(), sel).toBeHidden();
  }
  const pie = page.locator('.pie-impreso');
  await expect(pie).toBeVisible();
  await expect(pie).toContainText(canonicaDe(ENSAYOS.revista));
  await expect(pie).toContainText('Publicado el 15 de septiembre de 2026');
  await expect(pie.locator('.publicado-en')).toContainText('Revista de Relleno Académico');
  await expect(pie.locator('.pie-impreso-cita')).toContainText('https://doi.org/10.0000/relleno.ensayo.001');
  // Las notas al pie quedan al final del texto, antes del pie de la hoja.
  const orden = await page.evaluate(() => {
    const notas = document.querySelector('.cuerpo .footnotes')!;
    const pieHoja = document.querySelector('.pie-impreso')!;
    return notas.compareDocumentPosition(pieHoja) & Node.DOCUMENT_POSITION_FOLLOWING;
  });
  expect(orden).toBeTruthy();
});

test('/ensayos: lista por fecha y accesos por tema y por serie', async ({ page }) => {
  await abrir(page, 'ensayos/');
  const temas = page.locator('#por-tema').locator('..');
  await expect(temas.getByRole('link', { name: '#Tema de relleno A' })).toBeVisible();
  await expect(temas.locator('li', { hasText: '#Tema de relleno A' })).toContainText('(2)');
  const serie = page.locator('.serie', { hasText: 'Serie de relleno de ensayos' });
  await expect(serie.getByRole('link', { name: 'Serie de relleno de ensayos' })).toHaveAttribute('href', /\/series\/serie-de-relleno-de-ensayos\/$/);
  await expect(serie.locator('li')).toHaveText(['[Relleno] Ensayo en revista y en LinkedIn', '[Relleno] Ensayo publicado sólo en LinkedIn']);
});

test('páginas de tema: con ensayos, vacía y la lista de temas', async ({ page }) => {
  await abrir(page, 'ensayos/temas/tema-de-relleno-b/');
  await expect(page.locator('h1')).toHaveText('#Tema de relleno B');
  await expect(page.locator('.lista-ensayos > li')).toHaveCount(2);
  await abrir(page, 'ensayos/temas/prueba/');
  await expect(page.locator('.vacio')).toHaveText('Todavía no hay ensayos sobre este tema.');
  await abrir(page, 'ensayos/temas/');
  await expect(page.getByRole('link', { name: '#Tema de relleno A' })).toBeVisible();
});

test('textos relacionados en ensayos, por etiquetas compartidas', async ({ page }) => {
  await abrir(page, `ensayos/${ENSAYOS.linkedin}/`);
  await expect(page.locator('.relacionados').getByRole('link', { name: '[Relleno] Ensayo en revista y en LinkedIn' })).toBeVisible();
});
