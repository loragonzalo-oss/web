// PDF de cada ensayo, hecho con Playwright (Chromium) sobre el sitio ya construido.
// Uso: npm run build && npm run ensayos:pdf
// Deja dist/ensayos/<slug>/<slug>.pdf. Usa la hoja de impresión (src/styles/impresion.css),
// la misma que «Imprimir o guardar como PDF» en el navegador. Los ensayos con
// `version_web: resumen` no tienen PDF (su página no lleva data-ensayo-pdf).
//
// No corre en el despliegue: deploy.yml no instala Chromium. Para publicar los PDF hace falta,
// en deploy.yml, después de `npm run build`: `npx playwright install --with-deps chromium`,
// `npm run ensayos:pdf`, y construir con ENSAYOS_PDF=1 para que la página enlace el PDF.
// Ver COMO-PUBLICAR.md, «Publicar un ensayo como referencia».
import { createServer } from 'node:http';
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { BASE } from '../../sitio.config.mjs';

const DIST = fileURLToPath(new URL('../../dist/', import.meta.url));
const BASE_LIMPIA = BASE.replace(/\/+$/, '');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };

if (!existsSync(join(DIST, 'ensayos'))) {
  console.error('No hay dist/ensayos. Primero: npm run build (o npm run build:prueba).');
  process.exit(1);
}

// Servidor mínimo de dist/ bajo la misma base que el sitio (/web/…), para que carguen estilos y tipografías.
const servidor = createServer(async (pedido, respuesta) => {
  const ruta = decodeURIComponent(new URL(pedido.url, 'http://x').pathname);
  if (BASE_LIMPIA && !ruta.startsWith(`${BASE_LIMPIA}/`)) return respuesta.writeHead(404).end();
  let archivo = join(DIST, ruta.slice(BASE_LIMPIA.length));
  if ((await stat(archivo).catch(() => null))?.isDirectory()) archivo = join(archivo, 'index.html');
  try {
    const cuerpo = await readFile(archivo);
    respuesta.writeHead(200, { 'Content-Type': TIPOS[extname(archivo)] ?? 'application/octet-stream' }).end(cuerpo);
  } catch {
    respuesta.writeHead(404).end();
  }
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
const origen = `http://127.0.0.1:${servidor.address().port}${BASE_LIMPIA}`;

async function lanzar() {
  try {
    return await chromium.launch();
  } catch {
    return chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
  }
}

const navegador = await lanzar();
let hechos = 0;
try {
  const pagina = await navegador.newPage();
  for (const e of await readdir(join(DIST, 'ensayos'), { withFileTypes: true })) {
    const html = join(DIST, 'ensayos', e.name, 'index.html');
    if (!e.isDirectory() || !existsSync(html)) continue;
    // Sólo las páginas de ensayo con texto completo (no el índice, los temas ni las redirecciones).
    if (!(await readFile(html, 'utf8')).includes(`data-ensayo-pdf="${e.name}"`)) continue;
    await pagina.goto(`${origen}/ensayos/${e.name}/`, { waitUntil: 'networkidle' });
    await pagina.evaluate(() => document.fonts.ready);
    const destino = join(DIST, 'ensayos', e.name, `${e.name}.pdf`);
    await pagina.pdf({ path: destino, format: 'A4', printBackground: false, preferCSSPageSize: true });
    console.log(`dist/ensayos/${e.name}/${e.name}.pdf`);
    hechos++;
  }
} finally {
  await navegador.close();
  servidor.close();
}
console.log(`${hechos} PDF.`);
