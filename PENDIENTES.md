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
- [ ] [PENDIENTE: foto del autor] — marcos de foto de las dos direcciones del rediseño. Sólo se ven en desarrollo o si se elige `noche` o `crema`; con el tema provisorio no se publican. Componente: `src/components/Marco.astro`. Usos y proporciones:
  - portada, foto principal (`src/pages/index.astro`, clase `portada-foto`): en `noche`, a toda la altura de la pantalla en escritorio y 4:5 en teléfono; en `crema`, franja apaisada 12:5 en escritorio y 4:3 en teléfono;
  - portada, foto del libro (`libro-foto`): 4:5 en `noche`, 2:3 (como una tapa) en `crema`;
  - /libro (`src/pages/libro.astro`, `pagina-libro-foto`): 21:9 en escritorio y 4:5 en teléfono en `noche`; 2:3 en `crema`.

  Fotos propias del autor, nunca de stock ni generadas. Para cada una hace falta también la descripción (texto alternativo) y, si corresponde, el crédito. Cuando lleguen, el marco pasa a llevar la imagen optimizada con `astro:assets`.
- [ ] [PENDIENTE: dominio] — dominio propio todavía no comprado/definido. Pasos en COMO-PUBLICAR.md, «Pasar al dominio propio». No crear `public/CNAME` hasta tenerlo.

### Mapa

- [ ] [PENDIENTE: fuentes de datos a evaluar]. Antes de incorporar cualquier capa externa hay que confirmar licencia y formato de cada una. Ninguna está descargada ni incrustada. Candidatas mencionadas en el encargo, sin evaluar:
  - GBIF (registros de biodiversidad). Licencia: [PENDIENTE]. Formato: [PENDIENTE].
  - SENAMHI de Bolivia y de Perú (clima). Licencia: [PENDIENTE]. Formato: [PENDIENTE].
  - Observatorio Binacional. Licencia: [PENDIENTE]. Formato: [PENDIENTE].
  - Otras: [PENDIENTE].
- [ ] [PENDIENTE: criterio de inclusión para empresas y emprendimientos]. Qué condiciones tiene que cumplir un emprendimiento comunitario o una empresa de turismo para tener ficha (quién lo propone, cómo se verifica, si se cobra o no, cómo se da de baja). Hasta que exista, no cargar fichas de esas dos capas.
- [ ] Capa de la cuenca Katari (borrador, encargo 9): 14 fichas en `src/content/lugares/` con `draft: true`, sin coordenada (el corpus no las da), capa provisoria Ecología y actores por confirmar contra el Cuadro 19 del PDCKyLMT. Decisiones abiertas: capa nueva «Presiones y saneamiento», ríos como trazos y candidatos sin ficha. Todo en `docs/revision/katari.md`.

## Decisiones del autor

### Identidad visual

- [ ] **Qué tema queda.** Hay tres propuestas para comparar sobre el sitio real, más el tema provisorio que se publica hoy: A «Agua honda», B «Totora» y C «Piedra y cielo». Cómo verlas y cómo elegir: COMO-PUBLICAR.md, «Identidad visual». Se elige en `sitio.config.mjs`, línea `TEMA` (o una mezcla: la paleta de uno con las tipografías de otro se arma copiando valores entre archivos de `src/styles/temas/`).
  - [ ] Si los colores de las nueve capas del mapa del tema elegido sirven así o se ajustan. Los íconos de capa son provisorios y están en `src/styles/tokens.css`.
  - [ ] Favicon: hoy son las iniciales «GL» en `public/favicon.svg`, sin relación con ningún tema.
  - [ ] Imagen para compartir de las páginas que no son entradas ni ensayos (`public/og-default.png`): hoy es una tarjeta tipográfica con nombre, «Pacha Shunku» y «La Paz, Bolivia». Reemplazar cuando haya identidad visual (1200 × 630 px). También es el respaldo si falla la tarjeta automática.
  - [ ] Tarjetas automáticas de entradas y ensayos (`src/lib/og.ts`): toman los colores y las tipografías del tema publicado. Revisar su diseño cuando se cierre la identidad. El generador entiende colores en `#hex`, `rgb()` y `hsl()`; si un tema nuevo usa otro formato (por ejemplo `oklch()`), las tarjetas caen a `og-default.png` hasta adaptar el generador.
  - [ ] Cuando esté elegido: borrar los temas descartados y sus paquetes `@fontsource/*` de `package.json`, y rehacer las capturas de `docs/capturas/`.

### Rediseño en dos capas (22-10-2026)

- [ ] **Qué dirección queda**: 1 «Noche de altura» (`noche`) o 2 «Crema y tierra» (`crema`), o seguir con un tema de colores sobre la maqueta de siempre. Cómo verlas y cómo elegir: COMO-PUBLICAR.md, «Direcciones del rediseño». Se elige con la línea `TEMA` de `sitio.config.mjs`. Al elegir, revisar también el favicon y `public/og-default.png` (ver «Identidad visual»), y borrar la dirección descartada (su tema, su composición y sus `@fontsource/*`).
- [ ] **Fotos del autor** para los marcos (ver «Datos del autor → Sitio»).
- [ ] **Licencia y resolución de la batimetría de la ALT**, para que el prototipo «scroll es profundidad» deje la forma sintética y muestre el fondo real. Hasta entonces quedan visibles en el prototipo [PENDIENTE: profundidad con fuente] (riel y cada tramo) y [PENDIENTE: batimetría de la ALT, con licencia y resolución confirmadas por el autor] (fuentes). Archivos: `src/components/profundidad/Pieza.astro` y `src/lib/profundidad.ts`.
- [ ] **Texto de cada tramo del prototipo**: [PENDIENTE: texto del autor para este tramo], cuatro veces (Superficie, Aguas someras, Aguas abiertas, Fondo; nombres de maqueta, se cambian en `src/lib/profundidad.ts`).
- [ ] **Qué página real lleva la primera pieza inmersiva**, si el prototipo sirve. CLAUDE.md pide aprobación del autor página por página.
- [ ] Ensayos en la portada: las dos direcciones muestran los tres últimos ensayos en la portada (la maqueta de siempre sólo muestra el blog). Confirmar si se quiere así.
- [ ] Sitios de referencia: el entorno donde se hizo el rediseño bloquea los dominios de las referencias de Awwwards (everest.suraj.work, 1000whales.com, moncalisse.com, beautiful-imperfections.com, alethia.earth y los demás), así que el diseño salió de la descripción del encargo, no de mirar los sitios vivos. Conviene que el autor compare las direcciones con las referencias que eligió.

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
- El selector de tema y la lámina `/temas` existen sólo con `npm run dev`; una prueba comprueba que el sitio construido no los trae. Lo mismo la lámina `/direcciones`.
- Los prototipos de piezas inmersivas (`/prototipos/…`) siguen la regla de los borradores: existen con `npm run dev` y en `npm run build:prueba`, nunca en `npm run build`. Así las pruebas y la medición de peso los cubren sin publicarlos.
- La base editorial sigue sin JavaScript con cualquiera de los temas: las dos direcciones son sólo CSS. Peso por tipo de página en `docs/rediseno-peso.md`.
