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
- [ ] Imagen para compartir en redes (`public/og-default.png`): hoy es una tarjeta tipográfica con nombre, «Pacha Shunku» y «La Paz, Bolivia». Reemplazar cuando haya identidad visual (1200 × 630 px). Desde 22-10-2026 se usa sólo en las páginas que no son entradas ni ensayos, y como respaldo si falla la generación automática.
- [ ] Tarjetas automáticas de entradas y ensayos (`src/lib/og.ts`): toman los colores de `tokens.css` y las tipografías Source Serif 4 y Source Sans 3. Revisar su diseño cuando se cierre la identidad visual. El generador entiende colores en `#hex`, `rgb()` y `hsl()`; si la paleta nueva usa otro formato (por ejemplo `oklch()`), las tarjetas caen a `og-default.png` hasta adaptar el generador.
- [ ] ¿«Sobre mí» en primera o en tercera persona? Hoy está en tercera, sólo con los datos confirmados del encargo inicial.
- [ ] ¿Foto en «Sobre mí»?

## Mapa del Lago Titikaka

- [ ] [PENDIENTE: fuentes de datos a evaluar]. Antes de incorporar cualquier capa externa hay que confirmar licencia y formato de cada una. Ninguna está descargada ni incrustada. Candidatas mencionadas en el encargo, sin evaluar:
  - GBIF (registros de biodiversidad). Licencia: [PENDIENTE]. Formato: [PENDIENTE].
  - SENAMHI de Bolivia y de Perú (clima). Licencia: [PENDIENTE]. Formato: [PENDIENTE].
  - Observatorio Binacional. Licencia: [PENDIENTE]. Formato: [PENDIENTE].
  - Otras: [PENDIENTE].
- [ ] [PENDIENTE: criterio de inclusión para empresas y emprendimientos]. Qué condiciones tiene que cumplir un emprendimiento comunitario o una empresa de turismo para tener ficha (quién lo propone, cómo se verifica, si se cobra o no, cómo se da de baja). Hasta que exista, no cargar fichas de esas dos capas.
- [ ] Colores e íconos de las nueve capas: provisorios, en `src/styles/tokens.css`. Entran en la decisión de identidad visual.
- [ ] Fondo del mapa: usa las teselas públicas de OpenStreetMap, con su atribución. Su política de uso admite sitios de poco tráfico; si el tráfico crece, pasar a un proveedor de teselas (se cambia una línea en `src/scripts/mapa.ts`).
- [ ] Puntos superpuestos: con el zoom inicial, puntos cercanos se pisan. La revisión de accesibilidad lo admite sólo porque cada punto tiene su equivalente en el listado de abajo (excepción «Equivalente» de WCAG 2.5.8, anotada en `pruebas/paginas.spec.ts`). Cuando haya contenido real, evaluar si hace falta agrupar puntos (*clustering*).
- [ ] Las capturas `docs/capturas/mapa-*.png` se sacaron sin el fondo de OpenStreetMap (el entorno donde se hicieron bloquea `tile.openstreetmap.org`). Rehacerlas cuando haya contenido real, y comprobar ahí que los puntos de ejemplo caen sobre el agua.

## Etapas siguientes

- [ ] /mapa: el motor está hecho; falta el contenido real. Las nueve fichas de `src/content/lugares/ejemplo-*.md` son de relleno, con `draft: true`: borrarlas cuando haya lugares reales.
- [ ] /mapa: cuando se publique el primer lugar real, sacar el filtro que deja /mapa/ fuera del sitemap en `astro.config.mjs`. La etiqueta `noindex` ya se quita sola cuando hay al menos un lugar publicado.
- [ ] Borrar el contenido de ejemplo cuando haya contenido real: `src/content/blog/ejemplo-entrada-uno.md`, `src/content/blog/ejemplo-entrada-dos.md`, `src/content/ensayos/ejemplo-ensayo.md`. Están en `draft: true`, así que no se publican.
- [ ] Activar GitHub Pages con fuente «GitHub Actions» después de unir el primer pull request (ver COMO-PUBLICAR.md).

- [ ] Decidir si la «Revisión del sitio» tiene que estar en verde para poder unir un pull request (*Settings → Branches → Branch protection rules → Require status checks*). Hoy sólo avisa.

## Notas técnicas

- `robots.txt` se genera en `/web/robots.txt`. Los buscadores sólo lo leen en la raíz del dominio, así que empieza a contar recién con dominio propio. El sitemap funciona igual desde ahora.
- Las revisiones automáticas corren sobre el sitio publicado, que hoy casi no tiene contenido (todo lo de ejemplo está en borrador). El 22-10-2026 se corrieron también con los ejemplos publicados de forma temporal (sin subir ese cambio): pasaron enlaces, desborde, consola y accesibilidad, y se generaron las tarjetas. Cuando entre contenido real, la revisión lo va a cubrir sola.
- El buscador (Pagefind) y su página `/buscar/` usan JavaScript del lado del cliente: es la excepción que admite CLAUDE.md («salvo que haga falta»). Todo lo demás sigue sin JavaScript, salvo el mapa.
- `/buscar/` y la página 404 llevan `noindex` y no tienen dirección canónica.
- La 404 funciona en GitHub Pages porque `dist/404.html` queda en la raíz de lo publicado. Con dominio propio sigue igual.
