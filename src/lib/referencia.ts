// Un ensayo como referencia: la versión de la web es la que se enlaza, se cita y se comparte.
// Funciones puras (sin Astro): las usan el esquema (src/content.config.ts), la página del
// ensayo, la cita (src/lib/lectura.ts), el puente con Obsidian (scripts/obsidian/controles.mjs)
// y las pruebas (pruebas/unidad/).
import { slugificar } from './slug.ts';

// ── Dirección ────────────────────────────────────────────────────────────────
// Direcciones que ya usa la sección de ensayos: un ensayo con ese slug las taparía.
export const RESERVADAS_ENSAYOS = ['temas'];
export const chocaConEnsayos = (id: string) => RESERVADAS_ENSAYOS.includes(id);

// ── Lugares de publicación ───────────────────────────────────────────────────
export const TIPOS_LUGAR = ['revista', 'libro', 'medio', 'red social', 'otro'] as const;
export type TipoLugar = (typeof TIPOS_LUGAR)[number];

// «Red social», «red-social» o «red_social» valen igual.
export function normalizarTipoLugar(v: unknown): TipoLugar | undefined {
  if (typeof v !== 'string') return undefined;
  const clave = slugificar(v).replace(/-/g, ' ');
  return (TIPOS_LUGAR as readonly string[]).includes(clave) ? (clave as TipoLugar) : undefined;
}

// Dominios de redes sociales: un enlace a ellos nunca es destino de la cita.
const REDES = ['linkedin.com', 'lnkd.in', 'x.com', 'twitter.com', 't.co', 'facebook.com', 'fb.com', 'instagram.com', 'threads.net', 'threads.com', 'bsky.app', 'tiktok.com', 'mastodon.social'];

export function esRedSocial(enlace: string | undefined): boolean {
  if (!enlace || !URL.canParse(enlace)) return false;
  const host = new URL(enlace).hostname.toLowerCase().replace(/^www\./, '');
  return REDES.some((d) => host === d || host.endsWith(`.${d}`));
}

export interface DatosPublicacion {
  fecha: Date;
  publicacion?: string;
  enlace?: string;
  doi?: string;
  publicado_en?: { lugar: string; tipo: TipoLugar; fecha: Date; enlace?: string }[];
}

// Adónde manda la cita: el DOI si lo hay; si no, el enlace de la publicación formal (si la hay
// y no es una red social); si no, la dirección del ensayo en la web.
export function destinoCita(d: Pick<DatosPublicacion, 'publicacion' | 'enlace' | 'doi'>, direccion: string): string {
  if (d.doi) return `https://doi.org/${d.doi}`;
  if (d.publicacion?.trim() && d.enlace && !esRedSocial(d.enlace)) return d.enlace;
  return direccion;
}

export interface Lugar {
  lugar: string;
  tipo?: TipoLugar;
  fecha: Date;
  enlace?: string;
  formal: boolean;   // la publicación formal (publicacion + datos de revista)
}

// «Publicado originalmente en»: la publicación formal y los lugares de `publicado_en`, en orden
// de fecha y sin repetir. Un lugar de `publicado_en` con el mismo nombre o el mismo enlace que la
// publicación formal se junta con ella (aporta el enlace si la formal no lo tiene).
export function lugaresPublicacion(d: DatosPublicacion): Lugar[] {
  const lugares: Lugar[] = [];
  const formal = d.publicacion?.trim()
    ? { lugar: d.publicacion.trim(), fecha: d.fecha, enlace: d.enlace || undefined, formal: true }
    : undefined;
  if (formal) lugares.push(formal);
  const mismo = (a: Lugar, b: { lugar: string; enlace?: string }) =>
    slugificar(a.lugar) === slugificar(b.lugar) || (!!a.enlace && a.enlace === b.enlace);
  for (const p of d.publicado_en ?? []) {
    const repetido = lugares.find((l) => mismo(l, p));
    if (repetido) {
      if (repetido.formal) repetido.tipo ??= p.tipo;
      repetido.enlace ??= p.enlace;
      continue;
    }
    lugares.push({ lugar: p.lugar.trim(), tipo: p.tipo, fecha: p.fecha, enlace: p.enlace || undefined, formal: false });
  }
  return lugares.sort((a, b) => a.fecha.valueOf() - b.fecha.valueOf() || Number(b.formal) - Number(a.formal));
}

// ── Texto para compartir ─────────────────────────────────────────────────────
export const LARGO_COMPARTIR = 600;

// «Gestión del agua» → «#GestionDelAgua»: sin tildes ni espacios.
export function hashtag(etiqueta: string): string {
  const palabras = slugificar(etiqueta).split('-').filter(Boolean);
  return palabras.length ? `#${palabras.map((p) => p[0].toUpperCase() + p.slice(1)).join('')}` : '';
}

// Recorta en el último espacio antes del límite y agrega «…».
function recortar(texto: string, largo: number): string {
  if (texto.length <= largo) return texto;
  if (largo <= 1) return '';
  const corte = texto.slice(0, largo - 1);
  const espacio = corte.lastIndexOf(' ');
  return `${(espacio > largo / 2 ? corte.slice(0, espacio) : corte).replace(/[\s,;:.]+$/, '')}…`;
}

export interface Compartible {
  titulo: string;
  resumen?: string;
  direccion: string;          // la canónica
  lugares?: string[];         // nombres para «Publicado originalmente en …»
  etiquetas?: string[];
  compartir?: string;         // texto propio del autor
}

// Título, resumen, «Publicado originalmente en …», etiquetas como hashtags y la dirección.
// Si pasa de LARGO_COMPARTIR caracteres se recorta el resumen; la dirección nunca.
// Con `compartir`, se usa ese texto tal cual y se agrega la dirección al final si no está.
export function textoCompartir(c: Compartible): string {
  if (c.compartir?.trim()) {
    const propio = c.compartir.trim();
    return propio.includes(c.direccion) ? propio : `${propio}\n\n${c.direccion}`;
  }
  const lugares = (c.lugares ?? []).filter(Boolean);
  const publicado = lugares.length ? `Publicado originalmente en ${enumerar(lugares)}.` : '';
  const etiquetas = [...new Set((c.etiquetas ?? []).map(hashtag).filter(Boolean))].join(' ');
  const armar = (resumen: string) => [c.titulo.trim(), resumen, publicado, etiquetas, c.direccion].filter(Boolean).join('\n\n');
  const resumen = c.resumen?.trim() ?? '';
  const sinResumen = armar('').length;
  const lugar = LARGO_COMPARTIR - sinResumen - 2;
  return armar(lugar > 0 ? recortar(resumen, lugar) : '');
}

function enumerar(lista: string[]): string {
  return lista.length < 2 ? lista.join('') : `${lista.slice(0, -1).join(', ')} y ${lista.at(-1)}`;
}

export const enlaceLinkedIn = (direccion: string) =>
  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(direccion)}`;

export const enlaceX = (titulo: string, direccion: string) =>
  `https://x.com/intent/post?text=${encodeURIComponent(titulo)}&url=${encodeURIComponent(direccion)}`;
