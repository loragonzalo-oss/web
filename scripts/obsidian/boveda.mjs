// Lectura de la bóveda de Obsidian. Sólo lee: nunca escribe en la bóveda.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';

// Separa el encabezado (frontmatter) del cuerpo de una nota.
export function separarFrontmatter(texto) {
  const t = texto.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const m = t.match(/^---\n(?:([\s\S]*?)\n)?---[ \t]*(?:\n|$)/);
  if (!m) return { yaml: null, cuerpo: t };
  return { yaml: m[1] ?? '', cuerpo: t.slice(m[0].length) };
}

// Recorre la bóveda. Se saltean las carpetas ocultas (.obsidian, .trash, .git)
// y las que se pasen en `excluir` (rutas absolutas).
export async function leerBoveda(raiz, { excluir = [] } = {}) {
  const notas = [];
  const adjuntos = [];
  async function recorrer(dir) {
    const entradas = await readdir(dir, { withFileTypes: true });
    entradas.sort((a, b) => a.name.localeCompare(b.name));
    for (const e of entradas) {
      if (e.name.startsWith('.')) continue;
      const ruta = path.join(dir, e.name);
      if (excluir.includes(ruta)) continue;
      if (e.isDirectory()) await recorrer(ruta);
      else if (e.isFile()) (/\.md$/i.test(e.name) ? notas : adjuntos).push(ruta);
    }
  }
  await recorrer(raiz);

  const rel = (ruta) => path.relative(raiz, ruta).split(path.sep).join('/');
  const leidas = await Promise.all(
    notas.map(async (ruta) => {
      const { yaml, cuerpo } = separarFrontmatter(await readFile(ruta, 'utf8'));
      let fm = {};
      let errorYaml = null;
      if (yaml !== null) {
        try {
          fm = parse(yaml) ?? {};
          if (typeof fm !== 'object' || Array.isArray(fm)) fm = {};
        } catch (err) {
          errorYaml = err.message.split('\n')[0];
          // Si no se puede leer, se mira el texto crudo para saber si estaba marcada para publicar.
          fm = /^publicar:\s*true\s*$/m.test(yaml) ? { publicar: true } : {};
        }
      }
      return { ruta, rel: rel(ruta), nombre: path.basename(ruta).replace(/\.md$/i, ''), fm, cuerpo, errorYaml };
    }),
  );
  return { notas: leidas, adjuntos: adjuntos.map((ruta) => ({ ruta, rel: rel(ruta), nombre: path.basename(ruta) })) };
}

// Busca un archivo como lo hace Obsidian: por nombre, o por ruta si el enlace la trae.
// `quitarExt` sirve para las notas, que se enlazan sin «.md».
export function buscar(lista, destino, desde, { quitarExt = false } = {}) {
  const clave = (s) => (quitarExt ? s.replace(/\.md$/i, '') : s).toLowerCase();
  const buscado = clave(destino.replace(/^\.\//, '').replace(/^\/+/, ''));
  if (!buscado) return { archivo: null, ambiguo: false };

  const carpetaDesde = desde ? path.posix.dirname(desde.rel) : '.';
  let candidatos;
  if (buscado.includes('/')) {
    const relativo = clave(path.posix.normalize(path.posix.join(carpetaDesde, destino)));
    candidatos = lista.filter((a) => {
      const r = clave(a.rel);
      return r === relativo || r === buscado || r.endsWith(`/${buscado}`);
    });
  } else {
    candidatos = lista.filter((a) => clave(a.rel.split('/').pop()) === buscado);
  }
  if (candidatos.length <= 1) return { archivo: candidatos[0] ?? null, ambiguo: false };
  // Varios con el mismo nombre: primero el de la misma carpeta, después el de ruta más corta.
  const mismaCarpeta = candidatos.find((a) => path.posix.dirname(a.rel) === carpetaDesde);
  const elegido = mismaCarpeta ?? [...candidatos].sort((a, b) => a.rel.length - b.rel.length)[0];
  return { archivo: elegido, ambiguo: true };
}
