// Capturas de la experiencia de lectura: una entrada larga (escritorio y celular,
// claro y oscuro), una serie, el menú en celular y la vista de impresión.
// Uso: con el servidor de desarrollo corriendo (npm run dev), en otra terminal:
//   npm run lectura:capturas
// Deja los PNG en docs/capturas/lectura/. Usa las entradas de relleno en borrador,
// que sólo existen en modo de desarrollo.
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const BASE = process.env.CAPTURAS_URL ?? 'http://localhost:4321/web/';
const DESTINO = fileURLToPath(new URL('../../docs/capturas/lectura/', import.meta.url));
const ENTRADA = 'blog/ejemplo-entrada-larga/';
const SERIE = 'series/serie-de-ejemplo/';

const ESCRITORIO = { viewport: { width: 1280, height: 900 } };
const CELULAR = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

async function lanzar() {
  try {
    return await chromium.launch();
  } catch {
    return chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium' });
  }
}

async function abrir(contexto, ruta) {
  const pagina = await contexto.newPage();
  const direccion = `${BASE}${ruta}`;
  const respuesta = await pagina.goto(direccion, { waitUntil: 'networkidle' }).catch((e) => {
    throw new Error(`No se pudo abrir ${direccion}. ¿Está corriendo npm run dev?\n${e.message}`);
  });
  if (!respuesta?.ok()) throw new Error(`${direccion} respondió ${respuesta?.status()}`);
  // Fuera de la captura: el selector de temas y la barra de desarrollo de Astro.
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
  console.log(`docs/capturas/lectura/${nombre}.png`);
}

const navegador = await lanzar();
mkdirSync(DESTINO, { recursive: true });
try {
  for (const modo of ['claro', 'oscuro']) {
    const colorScheme = modo === 'oscuro' ? 'dark' : 'light';
    for (const [dispositivo, opciones] of [['escritorio', ESCRITORIO], ['celular', CELULAR]]) {
      const contexto = await navegador.newContext({ ...opciones, colorScheme });
      const pagina = await abrir(contexto, ENTRADA);
      if (dispositivo === 'celular') await pagina.click('.indice-plegable summary'); // índice desplegado
      await guardar(pagina, `entrada-larga-${dispositivo}-${modo}`, { fullPage: true });
      await contexto.close();
    }
  }

  // Una serie: su página y la navegación al pie de una entrada.
  {
    const contexto = await navegador.newContext({ ...ESCRITORIO, colorScheme: 'light' });
    await guardar(await abrir(contexto, SERIE), 'serie-escritorio', { fullPage: true });
    const entrada = await abrir(contexto, ENTRADA);
    await (await entrada.$('.nav-serie')).screenshot({ path: `${DESTINO}serie-navegacion.png` });
    console.log('docs/capturas/lectura/serie-navegacion.png');
    await contexto.close();
  }
  {
    const contexto = await navegador.newContext({ ...CELULAR, colorScheme: 'light' });
    await guardar(await abrir(contexto, SERIE), 'serie-celular', { fullPage: true });
    await contexto.close();
  }

  // Menú en celular: cerrado y abierto con el teclado (Tab hasta «Menú» y Enter).
  for (const modo of ['claro', 'oscuro']) {
    const contexto = await navegador.newContext({ ...CELULAR, colorScheme: modo === 'oscuro' ? 'dark' : 'light' });
    const pagina = await abrir(contexto, ENTRADA);
    await guardar(pagina, `menu-celular-cerrado-${modo}`);
    await pagina.focus('.menu-compacto summary');
    await pagina.keyboard.press('Enter');
    await pagina.keyboard.press('Tab'); // foco en el primer enlace del menú
    await guardar(pagina, `menu-celular-abierto-${modo}`);
    await contexto.close();
  }

  // Vista de impresión de la entrada larga.
  {
    const contexto = await navegador.newContext({ ...ESCRITORIO, colorScheme: 'dark' });
    const pagina = await abrir(contexto, ENTRADA);
    await pagina.emulateMedia({ media: 'print' });
    await guardar(pagina, 'impresion', { fullPage: true });
    await contexto.close();
  }
} finally {
  await navegador.close();
}
