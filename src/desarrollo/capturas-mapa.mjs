// Capturas del mapa (motor MapLibre): puntos agrupados, ficha abierta, leyenda, filtros
// aplicados, enlace propio abierto, página propia de un lugar, fondo del lago sintético y
// versión sin WebGL. Escritorio (1280 px) y celular (390 px), modo claro.
// Uso: sobre la construcción de prueba (trae las fichas de ejemplo), servida con preview:
//   npm run build:prueba && npx astro preview
//   npm run mapa:capturas       (en otra terminal)
// Deja los PNG en docs/capturas/mapa-motor/.
//
// Las teselas de los fondos (OpenStreetMap, EOX) se reemplazan por una transparente: la captura
// no depende de esos servidores ni les suma tráfico. Por eso el fondo sale liso.
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const BASE = process.env.CAPTURAS_URL ?? 'http://localhost:4321/web/';
const DESTINO = fileURLToPath(new URL('../../docs/capturas/mapa-motor/', import.meta.url));

const PANTALLAS = {
  escritorio: { viewport: { width: 1280, height: 900 } },
  celular: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

const TESELA = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==',
  'base64',
);

async function lanzar() {
  try {
    return await chromium.launch();
  } catch {
    return chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium' });
  }
}

async function abrir(contexto, ruta, { sinWebGL = false, conMapa = true } = {}) {
  const pagina = await contexto.newPage();
  await pagina.route(/tile\.openstreetmap\.org|tiles\.maps\.eox\.at/, (r) => r.fulfill({ contentType: 'image/png', body: TESELA }));
  if (sinWebGL) {
    await pagina.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (tipo, ...resto) {
        return /webgl/.test(tipo) ? null : original.call(this, tipo, ...resto);
      };
    });
  }
  const direccion = `${BASE}${ruta}`;
  const respuesta = await pagina.goto(direccion, { waitUntil: 'networkidle' }).catch((e) => {
    throw new Error(`No se pudo abrir ${direccion}. ¿Está corriendo npx astro preview?\n${e.message}`);
  });
  if (!respuesta?.ok()) throw new Error(`${direccion} respondió ${respuesta?.status()}`);
  if (conMapa && !sinWebGL) await pagina.locator('#mapa[data-cargado]').waitFor({ state: 'attached' });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.waitForTimeout(600);
  return pagina;
}

const verMapa = async (p) => {
  await p.evaluate(() => {
    document.querySelector('.mapa-zona').scrollIntoView({ block: 'start' });
    window.scrollBy(0, -16);
  });
  await p.waitForTimeout(400);
};

const CAPTURAS = [
  ['1-agrupados', 'mapa/', {}, verMapa],
  ['2-ficha-abierta', 'mapa/', {}, async (p) => {
    await p.locator('.listado-item[data-lugar="ejemplo-arqueologia"] [data-ver-en-mapa]').click();
    await p.locator('#ficha-panel').waitFor({ state: 'visible' });
    await p.waitForTimeout(800);
    await verMapa(p);
  }],
  ['3-leyenda', 'mapa/', {}, async (p, celular) => {
    if (celular) await p.locator('[data-leyenda] summary').click();
    await p.locator('[data-mapa-pie]').scrollIntoViewIfNeeded();
    await p.evaluate(() => document.querySelector('[data-mapa-pie]').scrollIntoView({ block: 'start' }));
    await p.waitForTimeout(300);
  }],
  ['4-filtros-aplicados', 'mapa/?capa=ecologia,biodiversidad,clima,cultura&pais=peru,binacional,sin-pais&q=ejemplo', {}, async (p, celular) => {
    if (celular) await p.locator('.mapa-filtros summary').click();
    await p.locator('.mapa-controles').scrollIntoViewIfNeeded();
    await p.evaluate(() => document.querySelector('.mapa-controles').scrollIntoView({ block: 'start' }));
    await p.waitForTimeout(300);
  }],
  ['5-enlace-propio', 'mapa/#lugar-ejemplo-linea', {}, async (p) => {
    await p.locator('#ficha-panel').waitFor({ state: 'visible' });
    await p.waitForTimeout(800);
    await verMapa(p);
  }],
  ['6-pagina-del-lugar', 'mapa/ejemplo-poligono/', { conMapa: false }, async () => {}],
  ['7-fondo-del-lago-sintetico', 'mapa/', {}, async (p) => {
    await p.locator('label', { hasText: 'Fondo del lago (batimetría)' }).click();
    await p.waitForTimeout(500);
    await verMapa(p);
  }],
  ['8-sin-webgl', 'mapa/', { sinWebGL: true }, async (p) => {
    await p.locator('[data-aviso]').scrollIntoViewIfNeeded();
    await p.evaluate(() => document.querySelector('.mapa-controles').scrollIntoView({ block: 'start' }));
    await p.waitForTimeout(300);
  }],
];

mkdirSync(DESTINO, { recursive: true });
const navegador = await lanzar();
try {
  for (const [pantalla, opciones] of Object.entries(PANTALLAS)) {
    const contexto = await navegador.newContext({ ...opciones, colorScheme: 'light' });
    for (const [nombre, ruta, op, preparar] of CAPTURAS) {
      const pagina = await abrir(contexto, ruta, op);
      await preparar(pagina, pantalla === 'celular');
      const archivo = `${DESTINO}${nombre}-${pantalla}.png`;
      await pagina.screenshot({ path: archivo });
      console.log(`  ${archivo.replace(/^.*docs\//, 'docs/')}`);
      await pagina.close();
    }
    await contexto.close();
  }
} finally {
  await navegador.close();
}
