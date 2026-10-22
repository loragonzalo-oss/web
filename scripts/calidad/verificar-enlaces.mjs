// Verifica que los enlaces internos del sitio construido (dist/) apunten a algo que existe.
// Revisa href, src y srcset de cada página HTML, y también los #anclas dentro de las páginas.
// Uso: npm run build && npm run revisar:enlaces
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative, dirname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, BASE } from '../../sitio.config.mjs';

const DIST = fileURLToPath(new URL('../../dist/', import.meta.url));
const BASE_LIMPIA = BASE.replace(/\/+$/, '');
const ORIGEN = new URL(SITE).origin;

async function archivosHtml(carpeta) {
  const lista = [];
  for (const e of await readdir(carpeta, { withFileTypes: true })) {
    const ruta = join(carpeta, e.name);
    if (e.isDirectory()) lista.push(...(await archivosHtml(ruta)));
    else if (e.name.endsWith('.html')) lista.push(ruta);
  }
  return lista;
}

const existe = (ruta) => stat(ruta).then((s) => s, () => null);

// Dirección del sitio («/web/blog/») → archivo en dist/ («dist/blog/index.html»).
async function archivoDe(ruta) {
  if (BASE_LIMPIA && !(ruta === BASE_LIMPIA || ruta.startsWith(`${BASE_LIMPIA}/`))) return null;
  const dentro = decodeURIComponent(ruta.slice(BASE_LIMPIA.length)) || '/';
  const candidato = join(DIST, dentro);
  const s = await existe(candidato);
  if (s?.isFile()) return candidato;
  if (s?.isDirectory()) {
    const indice = join(candidato, 'index.html');
    if (await existe(indice)) return indice;
  }
  return null;
}

const idsPorArchivo = new Map();
async function ids(archivo) {
  if (!idsPorArchivo.has(archivo)) {
    const html = await readFile(archivo, 'utf8');
    idsPorArchivo.set(archivo, new Set([...html.matchAll(/\s(?:id|name)="([^"]+)"/g)].map((m) => m[1])));
  }
  return idsPorArchivo.get(archivo);
}

function enlacesDe(html) {
  // Se ignora el contenido de <script> (los datos JSON del mapa, por ejemplo).
  const sinScripts = html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  const enlaces = [];
  for (const m of sinScripts.matchAll(/\s(href|src)="([^"]*)"/g)) enlaces.push(m[2]);
  for (const m of sinScripts.matchAll(/\ssrcset="([^"]*)"/g)) {
    for (const parte of m[1].split(',')) enlaces.push(parte.trim().split(/\s+/)[0]);
  }
  return enlaces.map((e) => e.replaceAll('&amp;', '&')).filter(Boolean);
}

const rotos = [];
const paginas = await archivosHtml(DIST);
let revisados = 0;

for (const pagina of paginas) {
  const html = await readFile(pagina, 'utf8');
  const rutaPagina = '/' + relative(DIST, pagina).split('\\').join('/');
  const direccionPagina = `${ORIGEN}${BASE_LIMPIA}${rutaPagina.replace(/index\.html$/, '')}`;

  for (const enlace of enlacesDe(html)) {
    if (/^(mailto|tel|javascript|data):/i.test(enlace)) continue;
    let destino;
    try {
      destino = new URL(enlace, direccionPagina);
    } catch {
      rotos.push({ pagina: rutaPagina, enlace, motivo: 'dirección mal formada' });
      continue;
    }
    if (destino.origin !== ORIGEN) continue; // externo: no se revisa acá
    revisados++;

    const archivo = await archivoDe(destino.pathname);
    if (!archivo) {
      rotos.push({ pagina: rutaPagina, enlace, motivo: 'la página o el archivo no existe' });
      continue;
    }
    const ancla = decodeURIComponent(destino.hash.slice(1));
    if (ancla && archivo.endsWith('.html') && !(await ids(archivo)).has(ancla)) {
      rotos.push({ pagina: rutaPagina, enlace, motivo: `no hay ningún elemento con id «${ancla}»` });
    }
  }
}

if (rotos.length) {
  console.error(`\n✗ ${rotos.length} enlace(s) interno(s) roto(s):\n`);
  for (const r of rotos) console.error(`  · En ${r.pagina}: ${r.enlace}\n    ${r.motivo}`);
  console.error('');
  process.exit(1);
}
console.log(`✓ Enlaces internos: ${revisados} revisados en ${paginas.length} páginas, ninguno roto.`);
