# Web de autor — Gonzalo R. Lora Veizaga

Sitio estático hecho con [Astro](https://astro.build). Se publica en GitHub Pages desde la rama `main`.

- Cómo escribir y publicar: [COMO-PUBLICAR.md](COMO-PUBLICAR.md)
- Lo que falta: [PENDIENTES.md](PENDIENTES.md)
- Reglas del sitio: [CLAUDE.md](CLAUDE.md)

## Para trabajar en la computadora

Requiere Node 22.22 o posterior.

```sh
npm install
npm run dev       # sitio local en http://localhost:4321/web/ (muestra borradores)
npm run build     # construye el sitio en dist/ (sin borradores)
npm run preview   # sirve dist/ localmente
npm run revisar   # enlaces internos, páginas y accesibilidad (después de build)
npm test          # pruebas del puente con Obsidian
npm run desde-obsidian -- "<carpeta de la bóveda>" [--simular] [--forzar]
```

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Dirección del sitio (`site` y `base`) | `sitio.config.mjs` |
| Nombre, redes, correo, menú | `src/lib/sitio.ts` |
| Colores y tipografía | `src/styles/tokens.css` |
| Entradas del blog | `src/content/blog/` |
| Ensayos | `src/content/ensayos/` |
| Lugares del mapa | `src/content/lugares/` |
| Capas del mapa (nombres) | `src/lib/capas.ts` |
| Páginas | `src/pages/` |
| Plantillas para Obsidian | `plantillas/` |
| Imágenes para compartir (generador) | `src/lib/og.ts` |
| Pruebas automáticas | `pruebas/`, `playwright.config.ts`, `scripts/calidad/` |
| Revisión de pull requests | `.github/workflows/revision.yml` |
| Exportación desde la bóveda de Obsidian | `scripts/obsidian/` |
| Capturas de revisión | `docs/capturas/` |
