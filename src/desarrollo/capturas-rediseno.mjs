// Capturas del rediseño: las dos direcciones, en escritorio y teléfono, claro y oscuro.
// Uso: con el servidor de desarrollo corriendo (npm run dev), en otra terminal:
//   npm run rediseno:capturas
// Deja los PNG en docs/capturas/rediseno/ (los muestra la lámina /direcciones).
// Si el servidor no está en la dirección de siempre: CAPTURAS_URL=http://localhost:4321/web/.
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { DIRECCIONES } from './temas.mjs';

const BASE = process.env.CAPTURAS_URL ?? 'http://localhost:4321/web/';
const DESTINO = fileURLToPath(new URL('../../docs/capturas/rediseno/', import.meta.url));

export const PAGINAS = [
  { nombre: 'portada', ruta: '' },
  { nombre: 'ensayos', ruta: 'ensayos/' },
  { nombre: 'entrada-larga', ruta: 'blog/ejemplo-entrada-larga/' },
  { nombre: 'libro', ruta: 'libro/' },
  // La pieza inmersiva se captura a mitad del descenso, en lo que se ve en pantalla.
  { nombre: 'prototipo', ruta: 'prototipos/profundidad/', descenso: 0.5 },
];

export const DISPOSITIVOS = [
  { nombre: 'escritorio', viewport: { width: 1280, height: 900 } },
  { nombre: 'telefono', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
];

async function lanzar() {
  try {
    return await chromium.launch();
  } catch {
    // Entornos donde Playwright no descargó su propio navegador.
    return chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium' });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const navegador = await lanzar();
  mkdirSync(DESTINO, { recursive: true });
  try {
    for (const d of DISPOSITIVOS) {
      for (const modo of ['claro', 'oscuro']) {
        const contexto = await navegador.newContext({
          viewport: d.viewport,
          isMobile: d.isMobile ?? false,
          hasTouch: d.hasTouch ?? false,
          deviceScaleFactor: 1,
          colorScheme: modo === 'oscuro' ? 'dark' : 'light',
          reducedMotion: 'no-preference',
        });
        const pagina = await contexto.newPage();
        for (const { id: tema } of DIRECCIONES) {
          for (const p of PAGINAS) {
            const direccion = `${BASE}${p.ruta}?tema=${tema}&modo=${modo}`;
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
            if (p.descenso !== undefined) {
              await pagina.evaluate((f) => {
                const cuerpo = document.querySelector('.pieza-cuerpo');
                const r = cuerpo.getBoundingClientRect();
                window.scrollTo(0, window.scrollY + r.top + f * (r.height - window.innerHeight));
              }, p.descenso);
            }
            await pagina.waitForTimeout(400);
            const archivo = `${p.nombre}-${tema}-${d.nombre}-${modo}.png`;
            await pagina.screenshot({ path: `${DESTINO}${archivo}`, fullPage: p.descenso === undefined });
            console.log(`docs/capturas/rediseno/${archivo}`);
          }
        }
        await contexto.close();
      }
    }
  } finally {
    await navegador.close();
  }
}
