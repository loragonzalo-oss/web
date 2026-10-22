# Pendientes

Lo que falta para que el sitio quede completo. Cada [PENDIENTE] visible en el sitio está anotado acá.
Al resolver uno, se borra la línea y se reemplaza el marcador en el archivo indicado.

Tres grupos: **datos del autor** (información que sólo él tiene), **decisiones del autor** (opciones que el código deja abiertas a propósito) y **etapas siguientes** (trabajo que viene después).

## Datos del autor

### Sitio

- [ ] [PENDIENTE: línea de presentación] — portada. Archivo: `src/pages/index.astro`.
- [ ] [PENDIENTE: título y descripción breve del libro] — recuadro del libro en la portada. Archivo: `src/pages/index.astro`.
- [ ] [PENDIENTE: título definitivo del libro] — página /libro. Archivo: `src/pages/libro.astro`.
- [ ] [PENDIENTE: texto de presentación del libro] — página /libro. Archivo: `src/pages/libro.astro`.
- [ ] [PENDIENTE: correo de contacto] — página /contacto. Se completa en `src/lib/sitio.ts`, campo `correo`. Decidir si va correo a la vista o un formulario (y qué servicio).
- [ ] [PENDIENTE: dominio] — dominio propio todavía no comprado/definido. Pasos en COMO-PUBLICAR.md, «Pasar al dominio propio». No crear `public/CNAME` hasta tenerlo.

### Mapa

- [ ] [PENDIENTE: fuentes de datos a evaluar]. Antes de incorporar cualquier capa externa hay que confirmar licencia y formato de cada una. Ninguna está descargada ni incrustada. Candidatas mencionadas en el encargo, sin evaluar:
  - GBIF (registros de biodiversidad). Licencia: [PENDIENTE]. Formato: [PENDIENTE].
  - SENAMHI de Bolivia y de Perú (clima). Licencia: [PENDIENTE]. Formato: [PENDIENTE].
  - Observatorio Binacional. Licencia: [PENDIENTE]. Formato: [PENDIENTE].
  - Otras: [PENDIENTE].
- [ ] [PENDIENTE: criterio de inclusión para empresas y emprendimientos]. Qué condiciones tiene que cumplir un emprendimiento comunitario o una empresa de turismo para tener ficha (quién lo propone, cómo se verifica, si se cobra o no, cómo se da de baja). Hasta que exista, no cargar fichas de esas dos capas.

## Decisiones del autor

### Identidad visual

- [ ] **Qué tema queda.** Hay tres propuestas para comparar sobre el sitio real, más el tema provisorio que se publica hoy: A «Agua honda», B «Totora» y C «Piedra y cielo». Cómo verlas y cómo elegir: COMO-PUBLICAR.md, «Identidad visual». Se elige en `sitio.config.mjs`, línea `TEMA` (o una mezcla: la paleta de uno con las tipografías de otro se arma copiando valores entre archivos de `src/styles/temas/`).
  - [ ] Si los colores de las nueve capas del mapa del tema elegido sirven así o se ajustan. Los íconos de capa son provisorios y están en `src/styles/tokens.css`.
  - [ ] Favicon: hoy son las iniciales «GL» en `public/favicon.svg`, sin relación con ningún tema.
  - [ ] Imagen para compartir de las páginas que no son entradas ni ensayos (`public/og-default.png`): hoy es una tarjeta tipográfica con nombre, «Pacha Shunku» y «La Paz, Bolivia». Reemplazar cuando haya identidad visual (1200 × 630 px). También es el respaldo si falla la tarjeta automática.
  - [ ] Tarjetas automáticas de entradas y ensayos (`src/lib/og.ts`): toman los colores y las tipografías del tema publicado. Revisar su diseño cuando se cierre la identidad. El generador entiende colores en `#hex`, `rgb()` y `hsl()`; si un tema nuevo usa otro formato (por ejemplo `oklch()`), las tarjetas caen a `og-default.png` hasta adaptar el generador.
  - [ ] Cuando esté elegido: borrar los temas descartados y sus paquetes `@fontsource/*` de `package.json`, y rehacer las capturas de `docs/capturas/`.

### «Sobre mí»

- [ ] ¿En primera o en tercera persona? Hoy está en tercera, sólo con los datos confirmados del encargo inicial.
- [ ] ¿Foto?

### Lectura y blog

- [ ] Tiempo de lectura: se calcula a 200 palabras por minuto. Ajustable en `src/lib/lectura.ts` (`PALABRAS_POR_MINUTO`).
- [ ] Buscador: en entradas y ensayos se indexan el título, el resumen y el cuerpo; quedan fuera la tabla de contenidos, la navegación de la serie, «Cómo citar» y el pie (`src/layouts/Lectura.astro`). Si se quiere que algo de eso aparezca en las búsquedas, se cambia ahí. (Decisión tomada al integrar las ramas de lectura y de calidad, 22-10-2026.)

### Mapa

- [ ] Fondo del mapa: usa las teselas públicas de OpenStreetMap, con su atribución. Su política de uso admite sitios de poco tráfico; si el tráfico crece, pasar a un proveedor de teselas (se cambia una línea en `src/scripts/mapa.ts`).
- [ ] Puntos superpuestos: con el zoom inicial, puntos cercanos se pisan. La revisión de accesibilidad lo admite sólo porque cada punto tiene su equivalente en el listado de abajo (excepción «Equivalente» de WCAG 2.5.8, anotada en `pruebas/paginas.spec.ts`). Cuando haya contenido real, evaluar si hace falta agrupar puntos (*clustering*).

### Puente con Obsidian

- [ ] Si la capa Arqueología es siempre sensible. Hoy el script no deja exportar una ficha de esa capa con `precision: exacta`, sin excepción. Si hay fichas de arqueología que no son sensibles (un museo, por ejemplo), hay que decidir cómo se marcan.
- [ ] Si el campo `sensible` entra también en el esquema del sitio (`src/content.config.ts`). Hoy sólo lo lee el script: un archivo subido a mano no se controla por ese campo, sólo por `precision`.
- [ ] Marcadores de borrador que frenan la exportación: hoy `[PENDIENTE]` y `[VERIFICAR]`. Si el autor usa otros, se agregan en `scripts/obsidian/controles.mjs`.

### Repositorio

- [ ] Si la «Revisión del sitio» tiene que estar en verde para poder unir un pull request (*Settings → Branches → Branch protection rules → Require status checks*). Hoy sólo avisa.

## Etapas siguientes

- [ ] Unir el pull request de integración a `main` y activar GitHub Pages con fuente «GitHub Actions» (ver COMO-PUBLICAR.md, «Primera publicación»).
- [ ] Primera corrida del puente en la computadora del autor: instalar Node y GitHub Desktop, `npm install` y una prueba con `--simular` (pasos en COMO-PUBLICAR.md, «Publicar desde Obsidian»). El script sólo se probó con la bóveda de relleno de `scripts/obsidian/prueba/`, no con la bóveda real.
- [ ] /mapa: el motor está hecho; falta el contenido real. Cuando se publique el primer lugar real, sacar el filtro que deja /mapa/ fuera del sitemap en `astro.config.mjs`. La etiqueta `noindex` ya se quita sola cuando hay al menos un lugar publicado.
- [ ] Rehacer las capturas del mapa (`docs/capturas/mapa-*.png`, `docs/capturas/temas/mapa-*.png` y `docs/capturas/integracion/mapa-*.png`) cuando haya contenido real: se sacaron sin el fondo de OpenStreetMap, porque el entorno donde se hicieron bloquea `tile.openstreetmap.org`. Comprobar ahí que los puntos de ejemplo caen sobre el agua.
- [ ] Borrar el contenido de ejemplo cuando haya contenido real. Todo está en `draft: true`, así que no se publica:
  - `src/content/blog/ejemplo-entrada-uno.md`, `ejemplo-entrada-dos.md`, `ejemplo-entrada-larga.md`, `ejemplo-entrada-serie.md` y `ejemplo-figura.png` (con ellos desaparece la «Serie de ejemplo»);
  - `src/content/ensayos/ejemplo-ensayo.md` y `ejemplo-ensayo-revista.md`;
  - las nueve fichas `src/content/lugares/ejemplo-*.md`.

  Las pruebas de `pruebas/` abren `blog/ejemplo-entrada-larga/`, `series/serie-de-ejemplo/`, `ensayos/ejemplo-ensayo-revista/` y la ficha de un lugar de ejemplo: al borrar los ejemplos, apuntarlas a contenido real (`pruebas/paginas.spec.ts` y `pruebas/integracion.spec.ts`).

## Notas técnicas

No son pendientes: explican decisiones de construcción para quien mantenga el sitio.

- `robots.txt` se genera en `/web/robots.txt`. Los buscadores sólo lo leen en la raíz del dominio, así que empieza a contar recién con dominio propio. El sitemap funciona igual desde ahora.
- Las revisiones corren sobre dos construcciones: la que se publica (`npm run build`, sin borradores) y la de prueba (`npm run build:prueba`, modo «prueba», con los borradores de ejemplo). Así las pruebas de páginas, funciones y accesibilidad tienen entradas, series y lugares aunque todavía no haya contenido real. La de prueba nunca se despliega: `deploy.yml` usa `npm run build`.
- El buscador (Pagefind) y su página `/buscar/` usan JavaScript del lado del cliente: es la excepción que admite CLAUDE.md («salvo que haga falta»). Todo lo demás sigue sin JavaScript, salvo el mapa.
- `/buscar/` y la página 404 llevan `noindex` y no tienen dirección canónica.
- La 404 funciona en GitHub Pages porque `dist/404.html` queda en la raíz de lo publicado. Con dominio propio sigue igual.
- El selector de tema y la lámina `/temas` existen sólo con `npm run dev`; una prueba comprueba que el sitio construido no los trae.
