import { getCollection, type CollectionEntry } from 'astro:content';
import { entradasBlog, ensayos } from './contenido';
import { slugificar } from './slug';
import { url } from './rutas';
import { CAPAS, RADIO_APROXIMADO_M } from './capas';

// Los borradores (draft: true) se ven sólo con `npm run dev`. Nunca se publican.
const verBorradores = import.meta.env.DEV;

export type Lugar = CollectionEntry<'lugares'>;

export async function lugares(): Promise<Lugar[]> {
  const todos = await getCollection('lugares', ({ data }) => verBorradores || !data.draft);
  const orden = (l: Lugar) => CAPAS.findIndex((c) => c.id === l.data.capa);
  return todos.sort((a, b) => orden(a) - orden(b) || a.data.titulo.localeCompare(b.data.titulo, 'es'));
}

// Lo único que llega al navegador para dibujar el punto. Con precision: aproximada,
// las coordenadas reales no salen del servidor; con oculta, no sale ningún punto.
export interface PuntoMapa {
  id: string;
  titulo: string;
  capa: string;
  lat: number;
  lon: number;
  aproximado: boolean;
}

export function puntoMapa(l: Lugar): PuntoMapa | null {
  const { lat, lon, precision, titulo, capa } = l.data;
  if (precision === 'oculta' || lat === undefined || lon === undefined) return null;
  if (precision === 'exacta') return { id: l.id, titulo, capa, lat, lon, aproximado: false };
  const [dLat, dLon] = desplazamiento(l.id, lat);
  return {
    id: l.id,
    titulo,
    capa,
    lat: redondear(lat + dLat),
    lon: redondear(lon + dLon),
    aproximado: true,
  };
}

// Desplazamiento fijo para cada lugar (sale de su nombre de archivo): el punto no salta
// de un despliegue a otro, y no se puede promediar varias versiones para encontrarlo.
function desplazamiento(id: string, lat: number): [number, number] {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const angulo = ((h % 360) * Math.PI) / 180;
  const distancia = 1200 + ((h >>> 9) % 1300); // metros, siempre menor que RADIO_APROXIMADO_M
  const mPorGrado = 111320;
  return [
    (distancia * Math.cos(angulo)) / mPorGrado,
    (distancia * Math.sin(angulo)) / (mPorGrado * Math.cos((lat * Math.PI) / 180)),
  ];
}

const redondear = (n: number) => Math.round(n * 1000) / 1000;

export const radioAproximado = RADIO_APROXIMADO_M;

// `relacionados` acepta el nombre del archivo de una entrada o un ensayo, con o sin
// carpeta y extensión, y también un wikilink de Obsidian: «mi-entrada», «blog/mi-entrada»,
// «ensayos/mi-ensayo.md», «[[Mi entrada]]».
export interface Relacionado {
  ref: string;
  titulo?: string;
  tipo?: 'Blog' | 'Ensayo';
  href?: string;
}

export async function resolverRelacionados(l: Lugar): Promise<Relacionado[]> {
  if (l.data.relacionados.length === 0) return [];
  const [blog, ens] = await Promise.all([entradasBlog(), ensayos()]);
  return l.data.relacionados.map((ref) => {
    const limpio = ref.replace(/^\[\[|\]\]$/g, '').split('|')[0].replace(/\.md$/i, '').trim();
    const partes = limpio.split('/');
    const id = slugificar(partes.pop()!);
    const carpeta = partes.join('/');
    const enBlog = !carpeta.includes('ensayos') && blog.find((e) => e.id === id);
    if (enBlog) return { ref, titulo: enBlog.data.titulo, tipo: 'Blog', href: url(`/blog/${id}/`) };
    const enEnsayos = !carpeta.includes('blog') && ens.find((e) => e.id === id);
    if (enEnsayos) return { ref, titulo: enEnsayos.data.titulo, tipo: 'Ensayo', href: url(`/ensayos/${id}/`) };
    // Una entrada en borrador o mal escrita: en desarrollo se marca, en el sitio publicado se omite.
    console.warn(`[mapa] «${l.data.titulo}»: el relacionado «${ref}» no coincide con ninguna entrada ni ensayo publicado.`);
    return { ref };
  });
}
