import type { CollectionEntry } from 'astro:content';
import type { MarkdownHeading } from 'astro';
import { entradasBlog, ensayos } from './contenido';
import { SITIO } from './sitio';
import { slugificar } from './slug';
import { url } from './rutas';

export type Texto = CollectionEntry<'blog'> | CollectionEntry<'ensayos'>;

export function rutaTexto(t: Texto): string {
  return url(t.collection === 'blog' ? `/blog/${t.id}/` : `/ensayos/${t.id}/`);
}

// ── Tiempo de lectura ────────────────────────────────────────────────────────
// Unas 200 palabras por minuto: lectura atenta de un texto largo en castellano.
export const PALABRAS_POR_MINUTO = 200;

export function contarPalabras(markdown = ''): number {
  const limpio = markdown
    .replace(/```[\s\S]*?```/g, ' ')          // bloques de código
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')     // imágenes
    .replace(/\]\([^)]*\)/g, ']')             // dirección de los enlaces
    .replace(/<[^>]+>/g, ' ');                // HTML
  return limpio.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)?.length ?? 0;
}

export function minutosLectura(markdown = ''): number {
  return Math.max(1, Math.round(contarPalabras(markdown) / PALABRAS_POR_MINUTO));
}

// ── Tabla de contenidos ──────────────────────────────────────────────────────
// Sale de los subtítulos ## y ###. Aparece desde tres subtítulos.
export const MINIMO_SUBTITULOS = 3;

export interface Seccion {
  slug: string;
  texto: string;
  subsecciones: { slug: string; texto: string }[];
}

export function indice(encabezados: MarkdownHeading[]): Seccion[] {
  // «Notas» (footnote-label) lo agrega el procesador; no es un subtítulo del autor.
  const propios = encabezados.filter((h) => (h.depth === 2 || h.depth === 3) && h.slug !== 'footnote-label');
  if (propios.length < MINIMO_SUBTITULOS) return [];
  const secciones: Seccion[] = [];
  for (const h of propios) {
    // Un ### antes del primer ## cuenta como sección propia.
    if (h.depth === 2 || secciones.length === 0) secciones.push({ slug: h.slug, texto: h.text, subsecciones: [] });
    else secciones.at(-1)!.subsecciones.push({ slug: h.slug, texto: h.text });
  }
  return secciones;
}

// ── Cómo citar ───────────────────────────────────────────────────────────────
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export interface Cita {
  apa: { antes: string; cursiva: string; despues: string };
  bibtex: string;
}

function escaparBibtex(s: string): string {
  return s.replace(/([&%$#_{}])/g, '\\$1');
}

// APA 7. Entrada de blog: el nombre del blog va en cursiva y el título no.
// Ensayo: el título va en cursiva; si salió en una publicación, va en cursiva la publicación.
export function cita(t: Texto, direccion: string): Cita {
  const { apellidos, iniciales, nombres } = SITIO.autorCita;
  const f = t.data.fecha;
  const anio = f.getUTCFullYear();
  const dia = f.getUTCDate();
  const mes = MESES[f.getUTCMonth()];
  const titulo = t.data.titulo.trim();
  const autor = `${apellidos}, ${iniciales}`;
  const conPunto = (s: string) => (/[.?!]$/.test(s) ? s : `${s}.`);
  const publicacion = t.collection === 'ensayos' ? t.data.publicacion?.trim() : undefined;
  const destino = (t.collection === 'ensayos' && t.data.enlace) || direccion;

  let apa: Cita['apa'];
  if (t.collection === 'blog') {
    apa = { antes: `${autor} (${anio}, ${dia} de ${mes}). ${conPunto(titulo)} `, cursiva: SITIO.nombreBlog, despues: `. ${direccion}` };
  } else if (publicacion) {
    apa = { antes: `${autor} (${anio}). ${conPunto(titulo)} `, cursiva: publicacion, despues: `. ${destino}` };
  } else {
    const cursiva = titulo.replace(/\.$/, '');
    apa = { antes: `${autor} (${anio}, ${dia} de ${mes}). `, cursiva, despues: `${/[?!]$/.test(cursiva) ? '' : '.'} ${SITIO.nombre}. ${direccion}` };
  }

  const primeraPalabra = slugificar(titulo).split('-').find((p) => p.length > 3) ?? 'texto';
  const clave = `${slugificar(apellidos).replace(/-/g, '')}${anio}${primeraPalabra}`;
  const campos: [string, string][] = [
    ['author', `${apellidos}, ${nombres}`],
    ['title', titulo],
    ['date', f.toISOString().slice(0, 10)],
  ];
  let tipo = 'online';
  if (t.collection === 'blog') campos.push(['organization', SITIO.nombreBlog]);
  else if (publicacion) {
    tipo = 'article';
    campos.push(['journaltitle', publicacion]);
  }
  campos.push(['url', destino], ['langid', 'spanish']);
  const ancho = Math.max(...campos.map(([k]) => k.length));
  const cuerpo = campos
    .map(([k, v]) => `  ${k.padEnd(ancho)} = {${k === 'url' ? v : escaparBibtex(v)}}`)
    .join(',\n');
  return { apa, bibtex: `@${tipo}{${clave},\n${cuerpo}\n}` };
}

// ── Series ───────────────────────────────────────────────────────────────────
export interface Serie {
  slug: string;
  nombre: string;
  textos: Texto[];
}

export const slugSerie = slugificar;

function ordenSerie(a: Texto, b: Texto): number {
  const pa = a.data.parte ?? Infinity;
  const pb = b.data.parte ?? Infinity;
  return pa - pb || a.data.fecha.valueOf() - b.data.fecha.valueOf();
}

export async function series(): Promise<Serie[]> {
  const todos: Texto[] = [...(await entradasBlog()), ...(await ensayos())];
  const mapa = new Map<string, Serie>();
  for (const t of todos) {
    if (!t.data.serie) continue;
    const slug = slugSerie(t.data.serie);
    if (!mapa.has(slug)) mapa.set(slug, { slug, nombre: t.data.serie, textos: [] });
    mapa.get(slug)!.textos.push(t);
  }
  for (const s of mapa.values()) s.textos.sort(ordenSerie);
  return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export interface LugarEnSerie {
  serie: Serie;
  posicion: number; // desde 1
  anterior?: Texto;
  siguiente?: Texto;
}

export async function lugarEnSerie(t: Texto): Promise<LugarEnSerie | undefined> {
  if (!t.data.serie) return undefined;
  const serie = (await series()).find((s) => s.slug === slugSerie(t.data.serie!));
  if (!serie) return undefined;
  const i = serie.textos.findIndex((x) => x.collection === t.collection && x.id === t.id);
  return { serie, posicion: i + 1, anterior: serie.textos[i - 1], siguiente: serie.textos[i + 1] };
}

// ── Textos relacionados ──────────────────────────────────────────────────────
// Entradas del blog que comparten más etiquetas; a igual cantidad, la más cercana en fecha.
export const MAXIMO_RELACIONADOS = 3;

export async function relacionados(e: CollectionEntry<'blog'>): Promise<CollectionEntry<'blog'>[]> {
  const propias = new Set(e.data.etiquetas.map(slugificar));
  if (propias.size === 0) return [];
  const candidatas = (await entradasBlog())
    .filter((o) => o.id !== e.id)
    .map((o) => ({ o, comunes: o.data.etiquetas.filter((t) => propias.has(slugificar(t))).length }))
    .filter(({ comunes }) => comunes > 0);
  const distancia = (o: CollectionEntry<'blog'>) => Math.abs(o.data.fecha.valueOf() - e.data.fecha.valueOf());
  candidatas.sort((a, b) => b.comunes - a.comunes || distancia(a.o) - distancia(b.o));
  return candidatas.slice(0, MAXIMO_RELACIONADOS).map(({ o }) => o);
}
