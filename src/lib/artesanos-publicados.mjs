// ¿Hay alguna ficha publicada (sin draft: true) de artesanía, emprendimiento o agencia de turismo
// comunitario? Lo usa astro.config.mjs para sumar /mapa/artesanos/ al sitemap sólo entonces.
// Lee los archivos directamente: la configuración se arma antes que las colecciones.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { FICHAS_CONTACTO, normalizarFicha } from './fichas.ts';

function archivos(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? archivos(join(dir, e.name)) : e.name.endsWith('.md') ? [join(dir, e.name)] : [],
  );
}

export function hayArtesanosPublicados(carpeta = join(process.cwd(), 'src/content/lugares')) {
  return archivos(carpeta).some((archivo) => {
    const fm = readFileSync(archivo, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
    if (!fm) return false;
    try {
      const d = parse(fm) ?? {};
      return FICHAS_CONTACTO.includes(normalizarFicha(d.ficha)) && d.draft !== true;
    } catch {
      return false; // un encabezado roto lo frena el esquema al construir
    }
  });
}
