import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITIO } from '../lib/sitio';
import { url } from '../lib/rutas';
import { entradasBlog } from '../lib/contenido';

export async function GET(context: APIContext) {
  const entradas = (await entradasBlog()).filter((e) => !e.data.draft);
  return rss({
    title: `Blog de ${SITIO.nombre}`,
    description: SITIO.descripcion,
    site: new URL(url('/'), context.site),
    items: entradas.map((e) => ({
      title: e.data.titulo,
      pubDate: e.data.fecha,
      description: e.data.resumen,
      categories: e.data.etiquetas,
      link: new URL(url(`/blog/${e.id}/`), context.site).href,
    })),
    customData: `<language>es</language>`,
  });
}
