// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import temas from './src/desarrollo/integracion-temas.mjs';
import { SITE, BASE, TEMA } from './sitio.config.mjs';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  integrations: [
    // /mapa/ queda fuera del sitemap mientras esté en construcción.
    sitemap({ filter: (pagina) => !pagina.includes('/mapa/') }),
    temas({ tema: TEMA }),
  ],
});
