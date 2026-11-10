// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import temas from './src/desarrollo/integracion-temas.mjs';
import { pluginsLectura, notasAlPie } from './src/markdown/lectura.mjs';
import { SITE, BASE, TEMA } from './sitio.config.mjs';
import { hayArtesanosPublicados } from './src/lib/artesanos-publicados.mjs';

const artesanosPublicados = hayArtesanosPublicados();

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  markdown: {
    processor: satteri({
      hastPlugins: pluginsLectura,
      features: {
        // Las comillas, rayas y puntos suspensivos quedan como los escribe el autor.
        smartPunctuation: false,
        gfm: { footnotes: notasAlPie },
      },
    }),
  },
  integrations: [
    // /mapa/ queda fuera del sitemap mientras esté en construcción. /buscar/ lleva noindex.
    // /mapa/artesanos/ entra sólo cuando tiene una ficha publicada (sus páginas filtradas, nunca).
    sitemap({
      filter: (pagina) =>
        (!pagina.includes('/mapa/') || (artesanosPublicados && pagina.endsWith('/mapa/artesanos/'))) && !pagina.includes('/buscar/'),
    }),
    temas({ tema: TEMA }),
  ],
});
