// Capturas de los tipos de ficha (encargo 1.4): la página propia de cada ficha de ejemplo, el panel
// del mapa con un sitio sagrado abierto y /mapa/artesanos/ (con fichas y filtrada). Escritorio
// (1280 px) y celular (390 px), modo claro.
// Uso: sobre la construcción de prueba (trae las fichas de ejemplo), servida con preview:
//   npm run build:prueba && npx astro preview
//   npm run fichas:capturas       (en otra terminal)
// Con CAPTURAS_PUBLICADO=<dirección del sitio sin borradores> saca además /mapa/artesanos/ vacía.
// Deja los PNG en docs/capturas/fichas-tipo/.
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const BASE = process.env.CAPTURAS_URL ?? 'http://localhost:4321/web/';
const PUBLICADO = process.env.CAPTURAS_PUBLICADO;
const DESTINO = fileURLToPath(new URL('../../docs/capturas/fichas-tipo/', import.meta.url));

const PANTALLAS = {
  escritorio: { viewport: { width: 1280, height: 900 } },
  celular: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

const TESELA = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==',
  'base64',
);

const PAGINAS = [
  ['ficha-municipio', 'mapa/ejemplo-ficha-municipio/'],
  ['ficha-sitio', 'mapa/ejemplo-ficha-sitio/'],
  ['ficha-sitio-sagrado', 'mapa/ejemplo-ficha-sitio-sagrado/'],
  ['ficha-ser', 'mapa/ejemplo-ficha-ser/'],
  ['ficha-ecosistema', 'mapa/ejemplo-ficha-ecosistema/'],
  ['ficha-artesano', 'mapa/ejemplo-ficha-artesano/'],
  ['ficha-emprendimiento', 'mapa/ejemplo-ficha-emprendimiento/'],
  ['ficha-agencia', 'mapa/ejemplo-ficha-agencia/'],
  ['artesanos', 'mapa/artesanos/'],
  ['artesanos-filtro-peru', 'mapa/artesanos/todos/peru/'],
];

async function lanzar() {
  try {
    return await chromium.launch();
  } catch {
    return chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium' });
  }
}

async function abrir(contexto, direccion) {
  const pagina = await contexto.newPage();
  await pagina.route(/tile\.openstreetmap\.org|tiles\.maps\.eox\.at/, (r) => r.fulfill({ contentType: 'image/png', body: TESELA }));
  const respuesta = await pagina.goto(direccion, { waitUntil: 'networkidle' }).catch((e) => {
    throw new Error(`No se pudo abrir ${direccion}. ¿Está corriendo npx astro preview?\n${e.message}`);
  });
  if (!respuesta?.ok()) throw new Error(`${direccion} respondió ${respuesta?.status()}`);
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.waitForTimeout(300);
  return pagina;
}

mkdirSync(DESTINO, { recursive: true });
const navegador = await lanzar();
for (const [pantalla, opciones] of Object.entries(PANTALLAS)) {
  const contexto = await navegador.newContext({ ...opciones, colorScheme: 'light' });
  for (const [nombre, ruta] of PAGINAS) {
    const p = await abrir(contexto, `${BASE}${ruta}`);
    await p.screenshot({ path: `${DESTINO}${nombre}-${pantalla}.png`, fullPage: true });
    await p.close();
  }
  // El panel del mapa con el tipo de ficha.
  const p = await abrir(contexto, `${BASE}mapa/#lugar-ejemplo-ficha-sitio-sagrado`);
  await p.locator('#mapa[data-cargado]').waitFor({ state: 'attached' });
  await p.locator('#ficha-panel').waitFor({ state: 'visible' });
  await p.evaluate(() => document.querySelector('.mapa-zona').scrollIntoView({ block: 'start' }));
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${DESTINO}panel-sitio-sagrado-${pantalla}.png` });
  await p.close();
  if (PUBLICADO) {
    const v = await abrir(contexto, `${PUBLICADO}mapa/artesanos/`);
    await v.screenshot({ path: `${DESTINO}artesanos-vacia-${pantalla}.png`, fullPage: true });
    await v.close();
  }
  await contexto.close();
}
await navegador.close();
console.log(`Capturas en ${DESTINO}`);
