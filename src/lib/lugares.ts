import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getCollection, type CollectionEntry } from 'astro:content';
import { entradasBlog, ensayos } from './contenido';
import { slugificar } from './slug';
import { url } from './rutas';
import { CAPAS, RADIO_APROXIMADO_M, RECORTE, SIN_PAIS } from './capas';
import { verBorradores } from './borradores';
import { caja, leerGeometria, mapearGeometria, normalizarRutaGeometria, puntoEtiqueta, type Geometria } from './geometria';

export type Lugar = CollectionEntry<'lugares'>;

export async function lugares(): Promise<Lugar[]> {
  const todos = await getCollection('lugares', ({ data }) => verBorradores || !data.draft);
  const orden = (l: Lugar) => CAPAS.findIndex((c) => c.id === l.data.capa);
  return todos.sort((a, b) => orden(a) - orden(b) || a.data.titulo.localeCompare(b.data.titulo, 'es'));
}

// Lo único que llega al navegador para dibujar un lugar. Con precision: aproximada,
// las coordenadas del archivo no salen del servidor: el punto o el trazado van desplazados;
// con oculta, no sale ninguna ubicación.
// - `punto`: dónde va el marcador ([lon, lat]). En una línea o un polígono, su punto de etiqueta.
// - `caja`: rectángulo de la línea o el polígono ([oeste, sur, este, norte]), para centrar la vista.
// - `forma`: la línea o el polígono, si lo hay.
export type TipoLugar = 'punto' | 'linea' | 'poligono';
export interface LugarMapa {
  id: string;
  titulo: string;
  capa: string;
  pais: string;
  tipo: TipoLugar;
  aproximado: boolean;
  punto: [number, number];
  caja?: [number, number, number, number];
  forma?: Geometria;
}

// La geometría de un lugar, ya revisada por el esquema (src/content.config.ts).
export function geometriaDe(l: Lugar): Geometria | undefined {
  if (!l.data.geometria || l.data.precision === 'oculta') return undefined;
  const { ruta } = normalizarRutaGeometria(l.data.geometria);
  const texto = readFileSync(join(process.cwd(), 'src/content/lugares', ruta!), 'utf8');
  return leerGeometria(texto, { recorte: RECORTE, precision: l.data.precision }).geometria;
}

export const tipoLugar = (l: Lugar): TipoLugar | null => {
  if (l.data.precision === 'oculta') return null;
  if (!l.data.geometria) return l.data.lat === undefined ? null : 'punto';
  return geometriaDe(l)?.type === 'LineString' ? 'linea' : 'poligono';
};

export function lugarMapa(l: Lugar): LugarMapa | null {
  const { lat, lon, precision, titulo, capa } = l.data;
  if (precision === 'oculta') return null;
  const base = { id: l.id, titulo, capa, pais: l.data.pais ?? SIN_PAIS.id, aproximado: precision === 'aproximada' };
  const geometria = geometriaDe(l);
  if (geometria) {
    // Aproximada: el trazado entero se corre lo mismo que se correría el punto.
    const forma =
      precision === 'exacta'
        ? geometria
        : mapearGeometria(geometria, ([x, y]) => {
            const [dLat, dLon] = desplazamiento(l.id, y);
            return [redondear(x + dLon), redondear(y + dLat)];
          });
    const [x, y] = puntoEtiqueta(forma);
    return { ...base, tipo: forma.type === 'LineString' ? 'linea' : 'poligono', punto: [redondear(x), redondear(y)], caja: caja(forma), forma };
  }
  if (lat === undefined || lon === undefined) return null;
  if (precision === 'exacta') return { ...base, tipo: 'punto', punto: [lon, lat] };
  const [dLat, dLon] = desplazamiento(l.id, lat);
  return { ...base, tipo: 'punto', punto: [redondear(lon + dLon), redondear(lat + dLat)] };
}

// Dirección del lugar en el mapa (abre el mapa con la ficha) y su página propia.
export const enlaceMapa = (id: string) => url(`/mapa/#lugar-${id}`);
export const paginaLugar = (id: string) => url(`/mapa/${id}/`);

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
