// Capturas del sitio integrado: portada, entrada larga, mapa con una ficha abierta y
// buscador con resultados, en escritorio y celular (modo claro).
// Uso: sobre la construcción de prueba, servida con preview:
//   npm run build:prueba && npx astro preview
//   npm run integracion:capturas       (en otra terminal)
// Deja los PNG en docs/capturas/integracion/. El buscador sólo funciona en el sitio construido.
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const BASE = process.env.CAPTURAS_URL ?? 'http://localhost:4321/web/';
const DESTINO = fileURLToPath(new URL('../../docs/capturas/integracion/', import.meta.url));

const PANTALLAS = {
  escritorio: { viewport: { width: 1280, height: 900 } },
  celular: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

// Teselas transparentes: la captura no depende de OpenStreetMap (ver PENDIENTES.md).
const TESELA = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

async function lanzar() {
  try {
    return await chromium.launch();
  } catch {
    return chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium' });
  }
}

async function abrir(contexto, ruta) {
  const pagina = await contexto.newPage();
  await pagina.route(/tile\.openstreetmap\.org/, (r) => r.fulfill({ contentType: 'image/png', body: TESELA }));
  const direccion = `${BASE}${ruta}`;
  const respuesta = await pagina.goto(direccion, { waitUntil: 'networkidle' }).catch((e) => {
    throw new Error(`No se pudo abrir ${direccion}. ¿Está corriendo npx astro preview?\n${e.message}`);
  });
  if (!respuesta?.ok()) throw new Error(`${direccion} respondió ${respuesta?.status()}`);
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.waitForTimeout(300);
  return pagina;
}

const CAPTURAS = [
  ['portada', '', async () => {}, true],
  ['entrada-larga', 'blog/ejemplo-entrada-larga/', async () => {}, true],
  ['mapa-ficha', 'mapa/', async (p) => {
    await p.locator('[data-ver-en-mapa]').first().click();
    await p.locator('#ficha-panel').waitFor({ state: 'visible' });
    await p.locator('#mapa').scrollIntoViewIfNeeded();
    await p.waitForTimeout(500);
  }, false],
  ['buscador', 'buscar/', async (p) => {
    await p.getByPlaceholder('Buscar en el sitio').or(p.getByRole('searchbox')).first().fill('Titikaka');
    await p.locator('.pagefind-ui__result').first().waitFor();
    await p.waitForTimeout(500);
  }, true],
];

mkdirSync(DESTINO, { recursive: true });
const navegador = await lanzar();
for (const [pantalla, opciones] of Object.entries(PANTALLAS)) {
  const contexto = await navegador.newContext({ ...opciones, colorScheme: 'light' });
  for (const [nombre, ruta, preparar, completa] of CAPTURAS) {
    const pagina = await abrir(contexto, ruta);
    await preparar(pagina);
    // La entrada larga se captura entera; las demás, lo que entra en la pantalla.
    await pagina.screenshot({ path: `${DESTINO}${nombre}-${pantalla}.png`, fullPage: completa && nombre !== 'portada' });
    await pagina.close();
    console.log(`✓ ${nombre}-${pantalla}.png`);
  }
  await contexto.close();
}
await navegador.close();
