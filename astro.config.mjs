// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE, BASE } from './sitio.config.mjs';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  integrations: [
    // /mapa/ queda fuera del sitemap mientras esté en construcción.
    sitemap({ filter: (pagina) => !pagina.includes('/mapa/') }),
  ],
});
