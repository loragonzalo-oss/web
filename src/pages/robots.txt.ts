import type { APIContext } from 'astro';
import { url } from '../lib/rutas';

export function GET(context: APIContext) {
  const mapa = new URL(url('/sitemap-index.xml'), context.site).href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${mapa}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
