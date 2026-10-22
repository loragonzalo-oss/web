// Capturas de los ensayos como referencia: un ensayo con «Publicado originalmente en» y
// «Compartir» abierto (escritorio y celular, claro y oscuro), la imagen para compartir de cada
// ensayo de prueba, /ensayos, una página de tema y la vista de impresión.
// Uso: con el sitio de prueba servido (npm run build:prueba && npx astro preview), en otra terminal:
//   npm run ensayos:capturas
// Deja los PNG en docs/capturas/ensayos/. Usa los ensayos de relleno en borrador.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const BASE = process.env.CAPTURAS_URL ?? 'http://localhost:4321/web/';
const DESTINO = fileURLToPath(new URL('../../docs/capturas/ensayos/', import.meta.url));
const ENSAYO = 'ensayos/relleno-ensayo-en-revista/';
const PRUEBA = ['relleno-ensayo-en-revista', 'relleno-ensayo-solo-linkedin', 'relleno-ensayo-resumen'];

const ESCRITORIO = { viewport: { width: 1280, height: 900 } };
const CELULAR = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

async function lanzar() {
  try {
    return await chromium.launch();
  } catch {
    return chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
  }
}

async function abrir(contexto, ruta) {
  const pagina = await contexto.newPage();
  const direccion = `${BASE}${ruta}`;
  const respuesta = await pagina.goto(direccion, { waitUntil: 'networkidle' }).catch((e) => {
    throw new Error(`No se pudo abrir ${direccion}. ¿Está servido el sitio de prueba?\n${e.message}`);
  });
  if (!respuesta?.ok()) throw new Error(`${direccion} respondió ${respuesta?.status()}`);
  await pagina.evaluate(async () => {
    document.querySelector('.selector-tema')?.remove();
    document.querySelector('astro-dev-toolbar')?.remove();
    await document.fonts.ready;
  });
  await pagina.waitForTimeout(300);
  return pagina;
}

async function guardar(pagina, nombre, opciones = {}) {
  await pagina.screenshot({ path: `${DESTINO}${nombre}.png`, ...opciones });
  console.log(`docs/capturas/ensayos/${nombre}.png`);
}

const navegador = await lanzar();
mkdirSync(DESTINO, { recursive: true });
try {
  for (const modo of ['claro', 'oscuro']) {
    const colorScheme = modo === 'oscuro' ? 'dark' : 'light';
    for (const [dispositivo, opciones] of [['escritorio', ESCRITORIO], ['celular', CELULAR]]) {
      const contexto = await navegador.newContext({ ...opciones, colorScheme });
      const pagina = await abrir(contexto, ENSAYO);
      await pagina.click('.compartir summary');
      await guardar(pagina, `ensayo-compartir-${dispositivo}-${modo}`, { fullPage: true });
      await contexto.close();
    }
  }

  const contexto = await navegador.newContext(ESCRITORIO);
  // La imagen para compartir de cada ensayo de prueba (la de og:image) y, aparte, la tipográfica.
  for (const slug of PRUEBA) {
    const pagina = await abrir(contexto, `ensayos/${slug}/`);
    const imagen = await pagina.locator('meta[property="og:image"]').getAttribute('content');
    const local = new URL(new URL(imagen).pathname, BASE).href;
    writeFileSync(`${DESTINO}og-${slug}.${imagen.endsWith('.png') ? 'png' : 'jpg'}`, await (await pagina.request.get(local)).body());
    console.log(`docs/capturas/ensayos/og-${slug} (og:image)`);
    if (!imagen.endsWith(`/og/ensayos/${slug}.png`)) {
      writeFileSync(`${DESTINO}og-${slug}-tipografica.png`, await (await pagina.request.get(`${BASE}og/ensayos/${slug}.png`)).body());
      console.log(`docs/capturas/ensayos/og-${slug}-tipografica.png`);
    }
    await pagina.close();
  }

  await guardar(await abrir(contexto, 'ensayos/'), 'ensayos-indice-escritorio', { fullPage: true });
  await guardar(await abrir(contexto, 'ensayos/temas/tema-de-relleno-b/'), 'tema-escritorio', { fullPage: true });
  await guardar(await abrir(contexto, 'ensayos/relleno-ensayo-resumen/'), 'ensayo-resumen-escritorio', { fullPage: true });

  const impresion = await abrir(contexto, ENSAYO);
  await impresion.emulateMedia({ media: 'print' });
  await impresion.setViewportSize({ width: 794, height: 1123 }); // A4 a 96 ppp
  await guardar(impresion, 'impresion', { fullPage: true });
  await contexto.close();
} finally {
  await navegador.close();
}
