# Pendientes

Lo que falta para que el sitio quede completo. Cada [PENDIENTE] visible en el sitio está anotado acá.
Al resolver uno, se borra la línea y se reemplaza el marcador en el archivo indicado.

## Datos que tiene que dar el autor

- [ ] [PENDIENTE: línea de presentación] — portada. Archivo: `src/pages/index.astro`.
- [ ] [PENDIENTE: título y descripción breve del libro] — recuadro del libro en la portada. Archivo: `src/pages/index.astro`.
- [ ] [PENDIENTE: título definitivo del libro] — página /libro. Archivo: `src/pages/libro.astro`.
- [ ] [PENDIENTE: texto de presentación del libro] — página /libro. Archivo: `src/pages/libro.astro`.
- [ ] [PENDIENTE: correo de contacto] — página /contacto. Se completa en `src/lib/sitio.ts`, campo `correo`. Decidir si va correo a la vista o un formulario (y qué servicio).
- [ ] [PENDIENTE: dominio] — dominio propio todavía no comprado/definido. Pasos en COMO-PUBLICAR.md, «Pasar al dominio propio». No crear `public/CNAME` hasta tenerlo.

## Decisiones abiertas

- [ ] Identidad visual: paleta, tipografías y favicon. Hoy hay una paleta provisoria y sobria en `src/styles/tokens.css` y un favicon con iniciales «GL» en `public/favicon.svg`.
- [ ] Imagen para compartir en redes (`public/og-default.png`): hoy es una tarjeta tipográfica con nombre, «Pacha Shunku» y «La Paz, Bolivia». Reemplazar cuando haya identidad visual (1200 × 630 px).
- [ ] ¿«Sobre mí» en primera o en tercera persona? Hoy está en tercera, sólo con los datos confirmados del encargo inicial.
- [ ] ¿Foto en «Sobre mí»?

## Etapas siguientes

- [ ] /mapa: hoy es una página «en construcción», fuera del sitemap. Va en una sesión aparte con su propio encargo. Carpeta reservada: `src/content/lugares/`.
- [ ] Borrar el contenido de ejemplo cuando haya contenido real: `src/content/blog/ejemplo-entrada-uno.md`, `src/content/blog/ejemplo-entrada-dos.md`, `src/content/ensayos/ejemplo-ensayo.md`. Están en `draft: true`, así que no se publican.
- [ ] Activar GitHub Pages con fuente «GitHub Actions» después de unir el primer pull request (ver COMO-PUBLICAR.md).

## Notas técnicas

- `robots.txt` se genera en `/web/robots.txt`. Los buscadores sólo lo leen en la raíz del dominio, así que empieza a contar recién con dominio propio. El sitemap funciona igual desde ahora.
