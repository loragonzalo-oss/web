# CLAUDE.md — Web de autor de Gonzalo Lora Veizaga

Este archivo va en la raíz del repositorio. Claude Code lo lee al empezar cada sesión. Lo que no está escrito acá, la próxima sesión no lo sabe.

## Qué es este sitio

La web de autor de Gonzalo R. Lora Veizaga, «Pacha Shunku», ingeniero ambiental en La Paz, Bolivia. Al frente van el libro sobre el Lago Titikaka, los ensayos y el blog. El perfil profesional es una página secundaria.

## Stack

- **Astro** con colecciones de contenido en markdown. Sin CMS ni base de datos. La base editorial (portada, blog, ensayos, /libro, perfil) va sin JavaScript del lado del cliente salvo que haga falta. Las piezas inmersivas son la excepción (ver «Piezas inmersivas» en Diseño).
- Las entradas del blog y los ensayos son archivos .md en src/content/. El autor tiene que poder escribirlos en Obsidian y subirlos sin tocar código.
- Puente con Obsidian: scripts/obsidian/ copia de la bóveda privada del autor hacia src/content, en un solo sentido (`npm run desde-obsidian`, guía en COMO-PUBLICAR.md). Nunca borra y nunca pisa sin preguntar. Sus controles siguen el esquema de src/content.config.ts: si se cambia un campo allá, se cambia en scripts/obsidian/controles.mjs. Pruebas con `npm test`.
- Revisión antes de unir: `npm test`, `npm run temas:contraste`, `npm run build` y `npm run build:prueba` (incluye los borradores de ejemplo) seguido de `npm run revisar` (enlaces, Playwright y axe). Lo mismo corre en cada pull request (.github/workflows/revision.yml). Los borradores sólo se ven en desarrollo y en la construcción de prueba; nunca en `npm run build`.
- Despliegue con GitHub Pages mediante GitHub Actions. Dominio propio configurado con CNAME.
- RSS, sitemap y metadatos Open Graph para que los enlaces se vean bien en Facebook y X.

## Reglas de contenido (no negociables)

1. **No inventar texto biográfico ni cifras.** Si falta un dato, dejar [PENDIENTE: …] visible en el borrador y anotarlo en PENDIENTES.md.
2. **Trayectoria: unos 20 años.** Nunca escribir 30.
3. **Titikaka con k** en la voz del autor. *Titicaca* sólo en citas o nombres oficiales que lo escriban así.
4. **Obra** de Jimena Tatiana Gonzales García (T'ika Pacha) y José Mario Illescas Pompilia (Hatun Illapa): no se publica ningún texto suyo ni se resume su contenido sin orden expresa del autor. Se los nombra siempre con nombre completo y nombre de portada.
5. No publicar teléfonos ni dirección. El contacto se resuelve con un correo o un formulario que el autor decida.
6. Lugares sensibles del mapa (sitios arqueológicos, lugares sagrados y los que el autor indique): las coordenadas exactas nunca entran al repositorio. Con precision: aproximada, el archivo sólo lleva coordenadas redondeadas a dos decimales; con precision: oculta, el archivo no lleva lat ni lon. La ubicación exacta queda en la bóveda privada del autor.

## Convenciones de escritura

- Español. Separador decimal con punto («75.31%»). Separador de miles con espacio y sólo desde cinco cifras («37 152»; «1039»). % pegado al número, sin «el» delante. Años sin «el».
- Citas textuales entre comillas angulares « ».
- Redacción directa y fácil de leer. Evitar la fórmula «no es X, es Y».

## Diseño

Sobrio, editorial, pensado para leer textos largos: tipografía con serifa para el cuerpo, ancho de línea cómodo (unos 65-70 caracteres) y modo oscuro. La paleta e identidad visual del autor es un tema abierto. Las medidas compartidas van en src/styles/tokens.css; los colores y las tipografías, en un archivo por tema en src/styles/temas/. El tema publicado se elige con una sola línea (TEMA en sitio.config.mjs). Ningún tema se elige sin orden del autor. Las direcciones del rediseño (noche, crema) son temas que además traen su composición, en src/styles/composiciones/; su marcado propio lleva data-solo y sólo se arma en desarrollo o cuando esa dirección es la publicada (src/lib/direcciones.ts). Tipografías sólo autoalojadas y con licencia libre (OFL); todo par de texto y fondo cumple contraste AA (el build lo comprueba).

### Piezas inmersivas

El sitio tiene dos capas. La base editorial queda liviana y estática. Las piezas inmersivas (relatos guiados por el scroll, WebGL, Three.js, GSAP, sonido) se permiten sólo en páginas puntuales que el autor apruebe una por una, y cumplen estas condiciones:

1. Viven en su propia página o como isla de Astro. El JavaScript pesado nunca se carga en las páginas de la base editorial.
2. Tienen una versión liviana con el mismo contenido en texto e imágenes, para conexiones móviles lentas, equipos modestos, lectores de pantalla y quien pida menos movimiento (prefers-reduced-motion).
3. El texto de la pieza existe también como HTML legible e indexable.
4. Todo dato que la pieza muestre (profundidades, cotas, cifras) lleva su fuente citada en la misma pieza. Los datos de terceros entran sólo con licencia confirmada.
5. Si hay sonido, empieza apagado y lo activa el lector.
6. Rige la regla 6: ninguna pieza expone coordenadas exactas de lugares sensibles.

### Skills de diseño

Instaladas en .claude/skills/: `frontend-design` y cuatro de Emil Kowalski (`animate`, `review-animations`, `animation-performance`, `animation-vocabulary`). Cada una conserva su licencia junto al SKILL.md.

- `frontend-design` manda en identidad visual, composición y tipografía.
- Las skills de Emil Kowalski mandan sólo en la mecánica del movimiento: curvas, duraciones, propiedades y rendimiento. `review-animations` no se activa sola: se llama a mano antes de aprobar cualquier pieza inmersiva o cualquier cambio de movimiento en CSS.
- En la base editorial: nada de IntersectionObserver ni librerías de animación, y nada de entradas escalonadas en listas. Si hay aparición al hacer scroll, va sólo con CSS (`animation-timeline: view()`), dentro de `@supports` y de `@media (prefers-reduced-motion: no-preference)`. Los ejemplos de React de esas skills (useReducedMotion, useEffect) no aplican.
- Las piezas inmersivas cuentan como movimiento «explicativo»: no rige el tope de 300 ms que esas skills ponen a las animaciones de interfaz.
- Taste e Impeccable revisan, no diseñan. Taste: referencias en docs/referencias/taste/ y `npm run lint:taste`. Impeccable: un paso de aviso en la revisión de cada pull request, con sus reglas apagadas en .impeccable/config.json. Sus hallazgos son avisos; las reglas de este archivo ganan siempre.

## Manejo de archivos

- No borrar ni sobrescribir contenido escrito por el autor sin preguntar.
- No renombrar archivos de contenido: rompe enlaces.
- Cada cambio de reglas se anota con fecha al final de este archivo.

## Registro de cambios de reglas

- 21-10-2026: versión inicial.
- 21-10-2026: regla 6, lugares sensibles del mapa. Las coordenadas exactas no entran al repositorio; el esquema de `lugares` lo hace cumplir al construir el sitio.
- 22-10-2026: puente con Obsidian. scripts/obsidian/ copia de la bóveda privada hacia src/content en un solo sentido, sin borrar ni pisar sin preguntar; sus controles siguen el esquema de src/content.config.ts.
- 22-10-2026: diseño. Los colores y las tipografías pasan de tokens.css a un archivo por tema en src/styles/temas/; el tema publicado se elige en sitio.config.mjs (TEMA). Tipografías autoalojadas con licencia OFL y contraste AA comprobado al construir.
- 22-10-2026: integración de las ramas. Revisión antes de unir con la construcción de prueba (`npm run build:prueba`, con borradores) y las pruebas ampliadas.
- 22-10-2026: piezas inmersivas. Decisión del autor: se permite JavaScript pesado (WebGL, Three.js, GSAP) en páginas puntuales que él apruebe, con versión liviana, texto en HTML, fuentes citadas y sonido apagado al inicio. La base editorial sigue sin JavaScript salvo que haga falta.
- 22-10-2026: rediseño en dos capas. Una dirección es un tema más su composición (src/styles/composiciones/). Los prototipos de piezas inmersivas viven en /prototipos/ y siguen la regla de los borradores: dev y build:prueba, nunca el build publicado.
- 22-10-2026: skills de diseño. Se suman cuatro skills de movimiento de Emil Kowalski, las referencias y el verificador de Taste (`npm run lint:taste`) y el detector de Impeccable como aviso en la revisión de cada pull request. Ninguna agrega JavaScript a la base editorial. Reparto de mando en «Skills de diseño».
- 22-10-2026: ensayos como referencia. Un ensayo que se publica lleva `slug` (dirección fija /ensayos/<slug>/); la cita nunca apunta a una red social; los textos que arma el sitio para compartir sólo combinan campos del frontmatter y rótulos neutros.
- 22-10-2026: no se comparten enlaces de loragonzalo-oss.github.io/web (decisión del autor). El bloque «Compartir» de los ensayos queda apagado (COMPARTIR_ACTIVO en sitio.config.mjs) y se enciende al migrar al dominio propio.
- 22-10-2026: ensayos con `version_web: resumen` (decisión del autor). Su texto completo no entra al repositorio, que es público: el puente con Obsidian los exporta sin cuerpo y el build frena si uno publicado trae cuerpo.
- 22-10-2026: el build también frena los borradores con `version_web: resumen` que traen cuerpo (decisión del autor): el repositorio es público también para los borradores.
