import { slugificar } from './slug';

// Toda ruta interna pasa por url() para respetar `base` (ver sitio.config.mjs).
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

export function url(ruta = '/'): string {
  let limpia = ruta.startsWith('/') ? ruta : `/${ruta}`;
  // Páginas con barra final; archivos (rss.xml, imágenes) sin ella.
  const esArchivo = /\.[a-z0-9]+$/i.test(limpia.split(/[?#]/)[0]);
  if (!esArchivo && !limpia.split(/[?#]/)[0].endsWith('/')) {
    limpia = limpia.replace(/^([^?#]*)/, '$1/');
  }
  return `${BASE}${limpia}`;
}

// Dirección absoluta (para Open Graph, RSS, canónicas).
export function urlAbsoluta(ruta: string, site: URL | undefined): string {
  return new URL(url(ruta), site).href;
}

export const slugEtiqueta = slugificar;
