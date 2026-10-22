// Peso de JavaScript y tiempo de carga por tipo de página, sobre el sitio construido (dist/).
// Uso: npm run build:prueba && npm run rediseno:peso
// Sirve dist/ con astro preview, abre cada página en Chromium con una conexión móvil lenta
// simulada y anota el resultado en docs/rediseno-peso.md, en la sección del tema con el que
// se construyó (data-tema de la portada). Las otras secciones quedan como estaban.
//
// Conexión simulada («3G lento», la de DevTools): 400 kbit/s de bajada, 400 kbit/s de subida,
// 400 ms de latencia, y procesador 4 veces más lento. Sin caché: cada página se abre en limpio.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { BASE } from '../../sitio.config.mjs';

const PUERTO = 4329;
const RAIZ = `http://localhost:${PUERTO}${BASE.replace(/\/?$/, '/')}`;
const DOC = fileURLToPath(new URL('../../docs/rediseno-peso.md', import.meta.url));
const DIST = fileURLToPath(new URL('../../dist/', import.meta.url));

const RED = { offline: false, latency: 400, downloadThroughput: (400 * 1024) / 8, uploadThroughput: (400 * 1024) / 8 };
const CPU = 4;

const PAGINAS = [
  { tipo: 'Portada', ruta: '' },
  { tipo: 'Índice de ensayos', ruta: 'ensayos/' },
  { tipo: 'Índice del blog', ruta: 'blog/' },
  { tipo: 'Entrada larga', ruta: 'blog/ejemplo-entrada-larga/' },
  { tipo: '/libro', ruta: 'libro/' },
  { tipo: 'Mapa', ruta: 'mapa/' },
  { tipo: 'Buscador', ruta: 'buscar/' },
  { tipo: 'Prototipo inmersivo', ruta: 'prototipos/profundidad/' },
  { tipo: 'Prototipo, versión liviana', ruta: 'prototipos/profundidad/liviana/' },
];

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const seg = (ms) => `${(ms / 1000).toFixed(2)} s`;

async function lanzar() {
  try {
    return await chromium.launch();
  } catch {
    return chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium' });
  }
}

async function esperarServidor() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(RAIZ)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`astro preview no respondió en ${RAIZ}`);
}

async function medir(navegador, ruta) {
  const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const pagina = await contexto.newPage();
  const cdp = await contexto.newCDPSession(pagina);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', RED);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });

  // Bytes transferidos por tipo de recurso (lo que viaja por la red, comprimido o no).
  const tipos = new Map();
  const transferido = { js: 0, css: 0, fuentes: 0, total: 0 };
  cdp.on('Network.responseReceived', (e) => tipos.set(e.requestId, e.type));
  cdp.on('Network.loadingFinished', (e) => {
    const tipo = tipos.get(e.requestId);
    transferido.total += e.encodedDataLength;
    if (tipo === 'Script') transferido.js += e.encodedDataLength;
    if (tipo === 'Stylesheet') transferido.css += e.encodedDataLength;
    if (tipo === 'Font') transferido.fuentes += e.encodedDataLength;
  });

  const respuesta = await pagina.goto(RAIZ + ruta, { waitUntil: 'load', timeout: 180_000 });
  if (!respuesta || respuesta.status() >= 400) {
    await contexto.close();
    return null;
  }
  await pagina.waitForLoadState('networkidle', { timeout: 180_000 }).catch(() => {});
  const tiempos = await pagina.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    const enLinea = [...document.querySelectorAll('script:not([src])')]
      .filter((s) => !s.type || s.type === 'module' || s.type === 'text/javascript')
      .reduce((n, s) => n + new Blob([s.textContent ?? '']).size, 0);
    // Fin de la última descarga (tipografías incluidas, que no retrasan el evento load).
    const ultima = Math.max(nav.loadEventEnd, ...performance.getEntriesByType('resource').map((r) => r.responseEnd));
    return { fcp: fcp?.startTime ?? 0, carga: ultima, enLinea };
  });
  await contexto.close();
  return { ...transferido, ...tiempos };
}

// PESO_ETIQUETA permite nombrar la sección a mano (por ejemplo, para medir una copia de main).
const tema = process.env.PESO_ETIQUETA ?? (() => {
  const portada = `${DIST}index.html`;
  if (!existsSync(portada)) throw new Error('No hay dist/. Corré antes npm run build:prueba.');
  return readFileSync(portada, 'utf8').match(/data-tema="([^"]+)"/)?.[1] ?? 'desconocido';
})();

const servidor = spawn('npx', ['astro', 'preview', '--port', String(PUERTO), '--ignore-lock'], { stdio: 'ignore', detached: true });
let navegador;
try {
  await esperarServidor();
  navegador = await lanzar();
  const fecha = new Date().toISOString().slice(0, 10);
  let md = `<!-- tema:${tema} -->\n## ${process.env.PESO_ETIQUETA ? tema : `Tema construido: ${tema}`}\n\nMedido el ${fecha} sobre \`npm run build:prueba\`.\n\n`;
  md += '| Página | JS (archivos) | JS (en línea) | CSS | Fuentes | Total transferido | Primer pintado | Última descarga |\n|---|---|---|---|---|---|---|---|\n';
  for (const p of PAGINAS) {
    const r = await medir(navegador, p.ruta);
    if (!r) {
      md += `| ${p.tipo} | — | — | — | — | — | — | no existe en esta construcción |\n`;
      continue;
    }
    md += `| ${p.tipo} | ${kb(r.js)} | ${kb(r.enLinea)} | ${kb(r.css)} | ${kb(r.fuentes)} | ${kb(r.total)} | ${seg(r.fcp)} | ${seg(r.carga)} |\n`;
    console.log(`${tema.padEnd(11)} ${p.tipo.padEnd(28)} JS ${kb(r.js + r.enLinea).padStart(9)} · total ${kb(r.total).padStart(9)} · carga ${seg(r.carga)}`);
  }
  md += `<!-- /tema:${tema} -->`;

  const cabecera = `# Peso y tiempo de carga por tipo de página\n\nGenerado con \`npm run rediseno:peso\`. No editar a mano.\n\nConexión móvil lenta simulada con Playwright (Chromium, protocolo de DevTools): 400 kbit/s de bajada y de subida, 400 ms de latencia, procesador 4 veces más lento, sin caché, pantalla de 390 × 844. «JS (archivos)» son los bytes transferidos de archivos .js; «JS (en línea)», el código dentro de la página. «Última descarga» es cuándo termina de bajar el último archivo de la página, tipografías incluidas. Los tiempos varían algo de una corrida a otra; los bytes no.\n\n`;
  let doc = existsSync(DOC) ? readFileSync(DOC, 'utf8') : cabecera;
  const patron = new RegExp(`<!-- tema:${tema} -->[\\s\\S]*?<!-- /tema:${tema} -->`);
  doc = patron.test(doc) ? doc.replace(patron, md) : `${doc.trimEnd()}\n\n${md}\n`;
  writeFileSync(DOC, doc);
  console.log(`Tabla en ${DOC}`);
} finally {
  await navegador?.close();
  try { process.kill(-servidor.pid); } catch {}
}
