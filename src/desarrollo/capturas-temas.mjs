// Capturas de portada, una entrada y el mapa en cada tema, claro y oscuro.
// Uso: con el servidor de desarrollo corriendo (npm run dev), en otra terminal:
//   npm run temas:capturas
// Deja los PNG en docs/capturas/temas/. Si el servidor no está en la dirección de
// siempre, se indica con CAPTURAS_URL=http://localhost:4321/web/.
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { IDS_TEMAS } from './temas.mjs';

const BASE = process.env.CAPTURAS_URL ?? 'http://localhost:4321/web/';
const DESTINO = fileURLToPath(new URL('../../docs/capturas/temas/', import.meta.url));

const PAGINAS = [
  { nombre: 'portada', ruta: '', completa: true },
  { nombre: 'entrada', ruta: 'blog/ejemplo-entrada-uno/', completa: true },
  { nombre: 'mapa', ruta: 'mapa/', ancla: '#lugar-ejemplo-arqueologia', completa: false },
];

async function lanzar() {
  try {
    return await chromium.launch();
  } catch {
    // Entornos donde Playwright no descargó su propio navegador.
    return chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium' });
  }
}

const navegador = await lanzar();
mkdirSync(DESTINO, { recursive: true });
try {
  for (const modo of ['claro', 'oscuro']) {
    const contexto = await navegador.newContext({
      viewport: { width: 1280, height: 900 },
      colorScheme: modo === 'oscuro' ? 'dark' : 'light',
    });
    const pagina = await contexto.newPage();
    for (const tema of IDS_TEMAS) {
      for (const p of PAGINAS) {
        const direccion = `${BASE}${p.ruta}?tema=${tema}&modo=${modo}${p.ancla ?? ''}`;
        const respuesta = await pagina.goto(direccion, { waitUntil: 'networkidle' }).catch((e) => {
          throw new Error(`No se pudo abrir ${direccion}. ¿Está corriendo npm run dev?\n${e.message}`);
        });
        if (!respuesta?.ok()) throw new Error(`${direccion} respondió ${respuesta?.status()}`);
        // Fuera de la captura: el selector de temas y la barra de desarrollo de Astro.
        await pagina.evaluate(async () => {
          document.querySelector('.selector-tema')?.remove();
          document.querySelector('astro-dev-toolbar')?.remove();
          await document.fonts.ready;
          window.scrollTo(0, 0); // el ancla del mapa abre la ficha y baja la página
        });
        await pagina.waitForTimeout(400);
        const archivo = `${DESTINO}${p.nombre}-${tema}-${modo}.png`;
        await pagina.screenshot({ path: archivo, fullPage: p.completa });
        console.log(`docs/capturas/temas/${p.nombre}-${tema}-${modo}.png`);
      }
    }
    await contexto.close();
  }
} finally {
  await navegador.close();
}
