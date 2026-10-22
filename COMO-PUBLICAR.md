# Cómo publicar

Guía para escribir en Obsidian y publicar en la web. No hace falta tocar código.

Hay dos caminos:

- **Desde la bóveda privada** (el habitual): escribís en tu bóveda de Obsidian, marcás las notas listas y un script las copia al repositorio, convierte lo propio de Obsidian y frena lo que no puede salir. Ver «Publicar desde Obsidian».
- **A mano**: subís el archivo `.md` directamente a GitHub. Ver «Subir a mano».

En los dos casos, el encabezado de cada archivo es el mismo: ver «El encabezado».

## Índice

1. [Publicar desde Obsidian](#publicar-desde-obsidian) — el camino habitual
2. [Subir a mano](#subir-a-mano)
3. [El encabezado (frontmatter)](#el-encabezado-frontmatter) — blog, ensayo, series, reglas y plantillas
4. [Lo que el sitio agrega solo](#lo-que-el-sitio-agrega-solo)
5. [Notas, figuras y citas destacadas](#notas-figuras-y-citas-destacadas)
6. [Agregar un lugar al mapa](#agregar-un-lugar-al-mapa)
7. [Lugares sensibles](#lugares-sensibles) — regla 6
8. [Imágenes para compartir](#imágenes-para-compartir)
9. [El buscador](#el-buscador)
10. [Identidad visual: ver los temas y elegir uno](#identidad-visual-ver-los-temas-y-elegir-uno)
11. [Direcciones del rediseño: verlas y elegir una](#direcciones-del-rediseño-verlas-y-elegir-una)
12. [Prototipo de pieza inmersiva: «scroll es profundidad»](#prototipo-de-pieza-inmersiva-scroll-es-profundidad)
13. [Si algo falla](#si-algo-falla)
14. [Revisiones automáticas](#revisiones-automáticas)
15. [Primera publicación: activar GitHub Pages](#primera-publicación-activar-github-pages)
16. [Pasar al dominio propio](#pasar-al-dominio-propio)

## Publicar desde Obsidian

La bóveda es tuya y privada: vive en tu computadora, fuera del repositorio. El script la **lee** y **copia hacia** el repositorio; nunca escribe en la bóveda, nunca borra nada del repositorio y nunca pisa sin preguntar un archivo que alguien cambió en el repositorio.

### Instalación (una sola vez)

1. **Node.js**: instalá la versión LTS desde https://nodejs.org (hace falta la 22.22 o posterior). Se instala como cualquier programa.
2. **GitHub Desktop**: instalalo desde https://desktop.github.com, entrá con tu cuenta de GitHub y cloná el repositorio `loragonzalo-oss/web` (*File → Clone repository*). Elegí una carpeta **fuera** de la bóveda de Obsidian, por ejemplo `Documentos/web`.
3. **Dependencias**: en GitHub Desktop, *Repository → Open in Command Prompt* (en Mac, *Open in Terminal*). Se abre una terminal ya ubicada en la carpeta del repositorio. Escribí:

   ```sh
   npm install
   ```

   Tarda uno o dos minutos. Se hace una vez (y de nuevo sólo si un día el script avisa que falta algo).
4. **La ruta de tu bóveda**: es la carpeta que elegiste al crear la bóveda en Obsidian. Para copiarla: en Windows, abrila en el Explorador, hacé clic en la barra de dirección y copiá; en Mac, arrastrá la carpeta a la ventana de la Terminal y la ruta se escribe sola.
5. **Prueba**: en la terminal del paso 3,

   ```sh
   npm run desde-obsidian -- "C:\Users\Gonzalo\Mi bóveda" --simular
   ```

   con tu ruta entre comillas (las comillas hacen falta si la ruta tiene espacios; en Mac la ruta se ve como `"/Users/gonzalo/Documents/Mi bóveda"`). `--simular` sólo muestra qué haría: no escribe nada.

### El encabezado en la bóveda

A los campos de siempre (ver «El encabezado» y «Agregar un lugar al mapa») se suman dos que el script lee y que **no salen de la bóveda**:

- `publicar: true` — la nota sale de la bóveda hacia el repositorio. Si no está, o está en `false`, la nota no se toca.
- `tipo: blog`, `tipo: ensayo` o `tipo: lugar` — a qué carpeta del sitio va.

`publicar` y `draft` son cosas distintas: `publicar` decide si la nota sale de la bóveda; `draft` decide si, ya en el repositorio, se ve en el sitio. Una nota con `publicar: true` y `draft: true` viaja al repositorio como borrador y no se publica.

Por ejemplo, una entrada de blog:

```yaml
---
publicar: true
tipo: blog
titulo: "Título de la entrada"
fecha: 2026-10-21
resumen: "Una o dos frases. Aparece en el índice y al compartir en Facebook y X."
etiquetas: [cuencas, agua]
imagen: "[[foto-para-compartir.jpg]]"
serie: "Cuencas andinas"
parte: 2
draft: false
---
```

Diferencias con el archivo que se sube a mano:

- Las imágenes se escriben como wikilink: `imagen: "[[foto.jpg]]"` en el blog; en un lugar, `imagen:` lleva `archivo: "[[foto-del-lugar.jpg]]"`, `credito` y `descripcion`.
- En un lugar, `relacionados` acepta wikilinks (`- "[[Una entrada del blog]]"`), y se suma un tercer campo que no sale de la bóveda: `sensible` (ver «Lugares sensibles»).
- Las propiedades que no son del sitio (`tags`, `aliases`, `publicar`, `tipo`, `sensible` o cualquier otra que agregues) **se quedan en la bóveda**: al repositorio sólo pasan los campos del sitio.

En `plantillas/` hay una plantilla por tipo con estos campos (ver «Plantillas»).

### El flujo de cada semana

1. Escribís en Obsidian como siempre. Cuando una nota está lista, `publicar: true` y `draft: false`.
2. En GitHub Desktop, *Fetch origin* y, si aparece, *Pull origin*: así tu copia del repositorio tiene lo último (por ejemplo, una corrección que hiciste desde la página de GitHub).
3. En la terminal (*Repository → Open in Command Prompt*), primero el ensayo general:

   ```sh
   npm run desde-obsidian -- "ruta de tu bóveda" --simular
   ```

   Leé el informe: qué archivos crearía o cambiaría, qué notas frena y por qué, y los avisos.
4. Si está bien, la misma orden sin `--simular`. (En la terminal, la flecha hacia arriba repite la orden anterior.)
5. Opcional: `npm run dev` y abrí http://localhost:4321/web/ para ver cómo queda. `Ctrl + C` lo cierra.
6. En GitHub Desktop vas a ver los archivos nuevos o cambiados. Escribí una línea abajo a la izquierda («Entrada sobre …»), *Commit to main* y después *Push origin*.
7. En unos dos minutos el sitio está actualizado (*Actions* en GitHub muestra el avance).

Subí siempre también el archivo `scripts/obsidian/registro-exportacion.json`, que aparece en la lista de cambios: es la memoria del script para saber qué exportó.

### Qué convierte

| En la bóveda | En el sitio |
|---|---|
| `[[Otra nota]]`, `[[Otra nota\|otro texto]]`, `[[Otra nota#Un subtítulo]]` | Enlace a esa página, si la otra nota también se publica. |
| `[[Una nota que no se publica]]` | Texto plano, sin enlace (nunca un enlace roto). Lo mismo si la otra nota es un borrador o la frenó un control. |
| `![[foto.jpg]]` | La imagen se copia al repositorio (en `imagenes/<nombre-de-la-nota>/`) y queda como imagen normal. `![[foto.jpg\|Texto]]` usa «Texto» como descripción para quien no ve la imagen. |
| `> [!nota] Título` (callout) | Bloque citado, con el título en negrita. |
| `%% comentario %%` | Desaparece. Sirve para notas tuyas que no deben salir. |
| `^abc123` (identificador de bloque) | Desaparece. |
| `![[Otra nota]]` (nota incrustada) | Enlace a esa nota, o texto si no se publica. El sitio no incrusta notas. |
| `relacionados: ["[[Una entrada]]"]` en un lugar | El nombre de la entrada o el ensayo exportado. Si no se publica, se quita. |

Los enlaces que escribe el script son relativos (`../../ensayos/…`): siguen funcionando el día que se pase al dominio propio.

### Qué frena una nota

El script revisa cada nota marcada antes de copiar nada. Si una falla, **no la exporta** y dice en castellano qué corregir; las demás salen igual. Al final, la orden termina con error para que no pase inadvertido.

- **Encabezado incompleto o mal escrito**: falta un campo obligatorio, una fecha no es `AAAA-MM-DD`, una capa no existe, etc. Son los mismos controles que hace el sitio al construirse, pero acá el aviso llega antes y en tu computadora.
- **Lugar sensible con coordenadas de más** (regla 6, ver «Lugares sensibles»).
- **Marcadores de borrador**: `[PENDIENTE]`, `[PENDIENTE: …]`, `[VERIFICAR]` en el texto o en el encabezado de una nota que no tiene `draft: true`. Se completan, se marca la nota como borrador o, si de verdad tienen que salir así, se exporta con `--forzar`:

  ```sh
  npm run desde-obsidian -- "ruta de tu bóveda" --forzar
  ```

  `--forzar` sólo deja pasar los marcadores; no salta ningún otro control. El `marcador: "[VERIFICAR]"` de una ficha de lugar es un campo válido y no cuenta como borrador. Lo que está dentro de un `%% comentario %%` tampoco cuenta.
- **Una imagen que no está en la bóveda.**
- **Dos notas que irían a la misma dirección** (por ejemplo, «Cuencas» y «cuencas»), o una entrada del blog que taparía una dirección que el blog ya usa (`archivo`, `etiquetas` o un número solo).
- **Una `parte` de serie que no es un número entero** desde 1.
- **En un ensayo, `paginas` o `doi` mal escritos** (ver «Ensayo», en «El encabezado»).

### Si un archivo cambió en el repositorio

El script recuerda qué escribió la última vez (en `scripts/obsidian/registro-exportacion.json`). Si un archivo del repositorio cambió después (por ejemplo, corregiste una errata desde la página de GitHub) o no lo creó el script, **pregunta** antes de reemplazarlo:

```
src/content/blog/mi-entrada.md cambió en el repositorio después de la última exportación (o no lo creó este script).
¿Lo reemplazo con la versión de la bóveda? Se pierden los cambios hechos en el repositorio. [s/N]
```

`s` reemplaza; cualquier otra respuesta lo deja como está. Lo más simple es corregir siempre en la bóveda y volver a exportar.

### Lo que el script nunca hace

- **No borra.** Si una nota deja de tener `publicar: true`, su archivo sigue en el repositorio y en el sitio. El informe lo lista («exportados antes y que esta vez no salieron»): si ya no va, borralo a mano en GitHub Desktop o en la página de GitHub.
- **No escribe en la bóveda.**
- **No sube nada a GitHub.** Eso lo hacés vos con *Commit* y *Push*, después de mirar los cambios.

No renombres una nota ya publicada: la dirección de la página sale del nombre de la nota, y el archivo viejo queda en el repositorio (el script lo va a listar para que lo borres). Si querés cambiar el título visible, cambiá `titulo` y dejá el nombre de la nota.

## Subir a mano

1. Escribís la entrada en Obsidian, con el encabezado (ver «El encabezado»).
2. Dejás `draft: false` cuando esté lista.
3. Subís el archivo `.md` a la carpeta que corresponde del repositorio en GitHub.
4. Esperás unos dos minutos: GitHub arma el sitio y lo publica solo.

### Dónde va cada cosa

| Qué | Carpeta del repositorio |
|---|---|
| Entradas del blog | `src/content/blog/` |
| Ensayos | `src/content/ensayos/` |
| Lugares del mapa | `src/content/lugares/` |
| Imágenes de una entrada | la misma carpeta que la entrada (o una subcarpeta) |

Podés ordenar las entradas en subcarpetas (por ejemplo, `src/content/blog/2026/`). La dirección de la página sale sólo del nombre del archivo, así que mover un archivo de carpeta no rompe su enlace. **Renombrar el archivo sí lo rompe.**

### Configurar Obsidian una sola vez

Esto vale sólo para subir a mano (opciones A y B). Con «Publicar desde Obsidian», los wikilinks y las imágenes se convierten solos y no hace falta cambiar nada.

En *Configuración → Archivos y enlaces*:

- **Usar [[Wikilinks]]**: desactivado. La web entiende enlaces markdown comunes, no wikilinks.
- **Formato de nuevos enlaces**: «Ruta relativa al archivo».
- **Ubicación predeterminada para nuevos adjuntos**: «Misma carpeta que el archivo actual» (o «En subcarpeta debajo de la carpeta actual»).

Así, cuando pegues una imagen, Obsidian escribe `![](foto.jpg)` y la web la encuentra.

### Opción A: desde la página de GitHub (la más simple)

1. Entrá a https://github.com/loragonzalo-oss/web.
2. Abrí la carpeta `src/content/blog/` (o `src/content/ensayos/`).
3. *Add file → Upload files*. Arrastrá el `.md` y, si tiene, sus imágenes.
4. Abajo, en *Commit changes*, escribí una línea que diga qué subiste y elegí **Commit directly to the main branch**.
5. En la pestaña *Actions* vas a ver el despliegue en curso. Cuando aparece el tilde verde, la entrada ya está en línea.

Para corregir una entrada publicada: abrí el archivo en GitHub, tocá el lápiz (*Edit*), corregí y hacé *Commit changes*.

### Opción B: el repositorio como bóveda de Obsidian

**Esta bóveda no puede ser tu bóveda privada.** Todo lo que se escribe en ella entra al repositorio, que es público, y la bóveda privada guarda ubicaciones exactas de lugares sensibles que nunca pueden entrar (CLAUDE.md, regla 6). Si usás esta opción, es una segunda bóveda, aparte, sólo para lo que ya está listo para publicarse. El script de «Publicar desde Obsidian» se niega a leer una bóveda que esté dentro del repositorio.

1. Instalá GitHub Desktop y cloná el repositorio `loragonzalo-oss/web`.
2. En Obsidian, *Abrir carpeta como bóveda* y elegí la carpeta `src/content` del repositorio clonado.
3. Escribís normalmente. Cuando quieras publicar, en GitHub Desktop: *Commit to main* y luego *Push origin*.

La carpeta `.obsidian/` (configuración de la bóveda) no se sube: está excluida en `.gitignore`.

## El encabezado (frontmatter)

Va al principio del archivo, entre dos líneas de tres guiones. En Obsidian aparece como «Propiedades».

### Entrada de blog

```yaml
---
titulo: "Título de la entrada"
fecha: 2026-10-21
resumen: "Una o dos frases. Aparece en el índice y al compartir en Facebook y X."
etiquetas: [cuencas, agua]
draft: false
---
```

Campos opcionales:

- `imagen: ./foto.jpg` — imagen para compartir en redes. Ruta relativa al archivo. Si no la ponés, el sitio arma una sola: una tarjeta con el título de la entrada y tu nombre (ver «Imágenes para compartir»).
- `slug: otra-direccion` — si querés que la dirección no sea el nombre del archivo. No uses `archivo`, `etiquetas` ni un número solo: son direcciones que ya usa el blog y el sitio no se construye.
- `serie: "Nombre de la serie"` y `parte: 2` — ver «Series», más abajo.

### Ensayo

```yaml
---
titulo: "Título del ensayo"
fecha: 2026-10-21
resumen: "De qué trata, en dos o tres frases."
publicacion: "Inmediaciones"
enlace: "https://dirección-de-la-publicación-original"
draft: false
---
```

`publicacion` y `enlace` son opcionales. Si el ensayo es inédito, dejalos vacíos o borralos. Cuando están, el lugar de publicación aparece en /ensayos y arriba del ensayo, con enlace a la publicación original si hay `enlace`.

Si el ensayo salió en una revista, se pueden sumar sus datos (todos opcionales):

```yaml
publicacion: "Nombre de la revista"
volumen: 12
numero: 3
paginas: 45-67
doi: "10.1234/abcd.2026.003"
```

- `paginas`: el rango con guion (`45-67`) o una sola página (`45`). El sitio pone la raya corta del rango.
- `doi`: solo (`10.1234/abcd`) o como dirección (`https://doi.org/10.1234/abcd`); las dos formas sirven.
- Arriba del ensayo aparecen como «Publicado en *Revista*, vol. 12, n.º 3, pp. 45–67 · DOI 10.1234/abcd».
- La cita los usa: en APA, «*Revista*, *12*(3), 45–67. https://doi.org/10.1234/abcd» (con DOI, la cita lleva el DOI en lugar de la dirección); en BibTeX, un `@article` con `journal`, `volume`, `number`, `pages` y `doi`.
- Si `paginas` o `doi` están mal escritos, el sitio no se construye y el error dice cuál (el script de Obsidian lo frena antes).

También acepta `serie` y `parte`, igual que el blog.

### Series

Una serie es un grupo de textos que se leen en orden. Se arma sola: todos los textos (del blog o ensayos) con el mismo `serie` forman una serie.

```yaml
serie: "Cuencas andinas"
parte: 2
```

- `serie`: el nombre, escrito siempre igual en todos los textos de la serie (las mayúsculas y las tildes no cuentan: «Cuencas andinas» y «cuencas andinas» son la misma).
- `parte` (opcional): el lugar del texto en la serie (1, 2, 3…). Si falta, se ordena por fecha.

Cada serie tiene su página en `/series/nombre-de-la-serie/`, con sus textos en orden, y cada texto de la serie muestra la lista y los enlaces «anterior» y «siguiente». Todas las series están en `/series/`.

### Reglas del encabezado

- `fecha` siempre con el formato `AAAA-MM-DD`. Si falta, el sitio no se construye.
- `titulo` entre comillas si tiene dos puntos (`:`) u otros signos.
- `draft: true` = borrador. **No se publica.** Sólo se ve si alguien corre el sitio en su computadora con `npm run dev` (o en la construcción de prueba de las revisiones, que nunca se publica).
- `draft: false` = se publica en el próximo despliegue.

### Plantillas

En la carpeta `plantillas/` del repositorio hay tres plantillas listas (`entrada-blog.md`, `ensayo.md` y `lugar.md`). Para usarlas, copiá esa carpeta a tu bóveda y elegila en Obsidian en *Configuración → Plantillas → Ubicación de la carpeta de plantillas*. Traen `publicar`, `tipo` (y `sensible`, en la de lugar), que el script lee y que no salen de la bóveda; si subís el archivo a mano, el sitio los ignora.

## Lo que el sitio agrega solo

No hace falta escribir nada para esto:

- **Tiempo de lectura**, arriba del texto (a unas 200 palabras por minuto).
- **Tabla de contenidos** («En este texto»), cuando el texto tiene tres subtítulos o más (`##` y `###`). En computadora va al costado; en celular, plegada arriba del texto.
- **Cómo citar este texto**, al pie, en formato APA y BibTeX, armado con el título, la fecha y, en los ensayos, `publicacion`, `enlace` y los datos de revista (`volumen`, `numero`, `paginas`, `doi`). Autor «Lora Veizaga, G. R.»; en el blog, el medio es «Blog de Gonzalo R. Lora Veizaga».
- **Textos relacionados**, al pie de cada entrada del blog: las que comparten más etiquetas.
- **Archivo** del blog por año, en `/blog/archivo/`.
- Al **imprimir** una entrada o un ensayo salen sólo el texto y las notas, con la dirección de la página y la fecha al final.

Las comillas, rayas y puntos suspensivos quedan exactamente como los escribís: el sitio no los cambia.

## Notas, figuras y citas destacadas

Se escriben en el cuerpo del texto, con sintaxis que Obsidian también entiende.

**Notas al pie.** Una llamada `[^1]` en el texto y, en cualquier lugar del archivo (conviene al final), la nota:

```markdown
El lago tiene dos cuencas[^1].

[^1]: Texto de la nota.
```

La llamada lleva a la nota y la flecha de la nota vuelve a la llamada. Se numeran solas en el orden en que aparecen; en lugar de `1` se puede usar una palabra (`[^fuente]`).

**Figuras.** Una imagen sola en su párrafo se muestra con pie y crédito. Los dos van entre comillas después de la ruta, separados por una barra vertical:

```markdown
![Qué se ve en la imagen, para quien no la ve](./foto.jpg "Pie de foto | Foto: Nombre Apellido, 2025. CC BY 4.0")
```

- Lo que va entre corchetes es el texto alternativo (para lectores de pantalla).
- Antes de la barra, el pie; después, el crédito: autor y licencia.
- **El crédito es obligatorio.** Si una imagen no lo tiene, el sitio no se construye y el error dice qué imagen es. Si no querés pie, alcanza con el crédito: `"Foto: Nombre Apellido"`.

**Citas destacadas.** Para resaltar una frase del propio texto, en letra grande, con la sintaxis de los recuadros de Obsidian:

```markdown
> [!destacada]
> La frase que se quiere destacar.
```

El sitio le pone las comillas « » (si ya las escribiste, no agrega otras). Como repite algo que ya está en el texto, los lectores de pantalla la saltean: no pongas ahí nada que no esté también en el cuerpo. Una cita de otro autor va como cita común, con `>` y sin `[!destacada]`.

## Agregar un lugar al mapa

Cada punto del mapa es un archivo `.md` en `src/content/lugares/`. El encabezado dice dónde va y qué respaldo tiene; el cuerpo del archivo es el texto de la ficha. Se sube igual que una entrada del blog.

### El encabezado de un lugar

```yaml
---
titulo: "Nombre del lugar"
capa: arqueologia
lat: -16.01
lon: -69.12
precision: aproximada
resumen: "Una o dos frases. Aparecen en el listado y arriba de la ficha."
imagen:
  archivo: ./fotos/nombre-del-lugar.jpg
  credito: "Foto: Nombre Apellido, 2025. CC BY 4.0"
  descripcion: "Qué se ve en la foto (para quien no la ve)."
enlaces:
  - texto: "Página del museo"
    url: "https://example.org/museo"
    verificado: 2026-10-21
fuentes:
  - autor: "Apellido, N."
    año: 2019
    titulo: "Título del documento"
    url: "https://example.org/documento.pdf"
marcador: "[VERIFICAR]"
relacionados:
  - nombre-de-una-entrada-del-blog
  - ensayos/nombre-de-un-ensayo
draft: true
---

Texto de la ficha. Puede tener párrafos, subtítulos, listas y enlaces, como una entrada del blog.
```

Qué es cada campo:

- **`titulo`** y **`resumen`**: obligatorios.
- **`capa`**: una de estas nueve. Se puede escribir el nombre con tildes o sin ellas.

  | Se escribe | Capa |
  |---|---|
  | `clima` | Clima |
  | `ecologia` | Ecología |
  | `biodiversidad` | Biodiversidad |
  | `cultura` | Cultura |
  | `antropologia` | Antropología |
  | `arqueologia` | Arqueología |
  | `turismo` | Turismo |
  | `emprendimientos-comunitarios` | Emprendimientos comunitarios |
  | `gobiernos-municipales` | Gobiernos municipales |

- **`lat`** y **`lon`**: en grados decimales, con signo menos (todo el lago está al sur del ecuador y al oeste de Greenwich). Se pueden copiar de OpenStreetMap o de Google Maps (clic derecho sobre el punto). Si quedan fuera del recorte del lago y sus orillas, el sitio no se construye y el error lo dice: casi siempre es lat y lon invertidas o un signo menos que falta.
- **`precision`** (ver también «Lugares sensibles»):
  - `exacta` (si no se pone nada, vale esta): el punto va donde dicen las coordenadas.
  - `aproximada`: `lat` y `lon` van redondeadas a **dos decimales como máximo** (por ejemplo, `-16.01`). En el mapa, el punto aparece corrido entre 1.2 y 2.5 km de esas coordenadas, siempre en la misma dirección para ese lugar, con una zona sombreada de 3 km de radio alrededor.
  - `oculta`: sin punto en el mapa; la ficha aparece sólo en el listado. Con `oculta`, el archivo **no lleva** `lat` ni `lon`: se dejan vacíos o se borran.
- **`imagen`** (opcional): la foto va en la carpeta del lugar (o en una subcarpeta) y la ruta es relativa al archivo. El `credito` es obligatorio si hay imagen: autor y licencia. Sólo imágenes propias o con licencia clara.
- **`enlaces`** (opcional): enlaces externos. `verificado` es la fecha en que se comprobó que el enlace funciona y dice lo que se cita, con formato `AAAA-MM-DD`.
- **`fuentes`** (opcional, salvo con `corpus`): documentos que respaldan la ficha. `url` es opcional.
- **`marcador`**: el respaldo de la ficha. Va **entre comillas** cuando lleva corchetes.
  - `corpus`: respaldo verificable. Exige al menos una fuente.
  - `"[VERIFICAR]"`: requiere validación externa. El lector lo ve destacado.
  - `"[HIPÓTESIS]"`: premisa razonable sin respaldo documental. El lector lo ve destacado.
  - `"[DATO PROPIO]"`: conocimiento del autor, sin documento que lo cite.
- **`relacionados`** (opcional): entradas del blog o ensayos que la ficha enlaza. Se escribe el nombre del archivo sin `.md`. Si hay una entrada y un ensayo con el mismo nombre, se antepone `blog/` o `ensayos/`. También vale un wikilink de Obsidian (`"[[nombre]]"`, entre comillas). Si el relacionado está en borrador o mal escrito, en el sitio publicado se omite; con `npm run dev` aparece marcado como [PENDIENTE].
- **`draft`**: igual que en el blog. `true` = no se publica.

### Para compartir un lugar

Cada ficha tiene su propia dirección: la del mapa seguida de `#lugar-` y el nombre del archivo. Por ejemplo, `…/mapa/#lugar-isla-de-ejemplo` abre el mapa con esa ficha.

## Lugares sensibles

Regla del sitio (CLAUDE.md, regla 6): las coordenadas exactas de un lugar sensible —sitios arqueológicos, lugares sagrados y los que el autor indique— **nunca entran al repositorio**. La ubicación exacta queda en la bóveda privada.

**Lo que controla el sitio al construirse**, venga el archivo del script o subido a mano:

- Con `precision: aproximada`, el archivo lleva sólo coordenadas redondeadas a dos decimales (una cuadrícula de algo más de 1 km de lado). Si `lat` o `lon` tienen más decimales, el sitio no se construye y el error dice cuál corregir.
- Con `precision: oculta`, el archivo no lleva `lat` ni `lon`. Si tiene alguno, el sitio no se construye.

Para redondear: `-16.01234` queda `-16.01`; `-69.12789` queda `-69.13`.

**Lo que controla además el script de Obsidian.** Para el script, un lugar es sensible si está en la capa `arqueologia` o si su nota tiene `sensible: true` (lugares sagrados y los que vos indiques). Un lugar sensible:

- no puede tener `precision: exacta` (ni dejar `precision` vacío, que vale exacta);
- con `precision: aproximada`, `lat` y `lon` llevan dos decimales como máximo;
- con `precision: oculta`, no lleva `lat` ni `lon`;
- no puede tener coordenadas con más de dos decimales en el texto ni en el encabezado (por ejemplo «-15.78123» o «15°47'12"»). Este control vale también para cualquier lugar `aproximada` u `oculta`.

La ubicación exacta guardala en una nota aparte, sin `publicar`. Que esa nota privada enlace a la pública, y no al revés: un enlace a una nota que no se publica queda como texto con su nombre.

Si subís un lugar a mano, `sensible` no se controla: sólo cuenta `precision`. Antes de subir un lugar sensible, revisá vos que lleve `aproximada` u `oculta`.

## Imágenes para compartir

Cuando alguien comparte una entrada o un ensayo en Facebook o X, aparece una imagen. El sitio la arma sola al construirse: una tarjeta con el título, la palabra «Blog» o «Ensayo» y tu nombre, con los colores y las tipografías del tema publicado (`TEMA` en `sitio.config.mjs`, ver «Identidad visual»). Si cambia el tema o un color del tema, las tarjetas cambian solas en el próximo despliegue.

- En una entrada del blog, si ponés `imagen:` en el encabezado, se usa esa foto en lugar de la tarjeta.
- Si la tarjeta no se puede armar (por ejemplo, porque un color del tema está escrito de una forma que el generador no entiende: entiende `#hex`, `rgb()` y `hsl()`), se usa `public/og-default.png` y el despliegue sigue igual. En el registro del despliegue queda una línea que empieza con `[og]` y dice por qué.
- Las demás páginas (portada, mapa, «Sobre mí»…) usan siempre `public/og-default.png`.

## El buscador

La página «Buscar» (en la cabecera) busca en las entradas del blog, los ensayos, la página del libro y «Sobre mí». No usa ningún servicio externo: el índice se arma solo cada vez que se construye el sitio. Los borradores (`draft: true`) nunca entran al índice: no se construyen en el sitio publicado y, en el de prueba de las revisiones, quedan fuera del índice.

Con `npm run dev` el buscador no funciona y lo avisa: para probarlo en la computadora hay que hacer `npm run build` y después `npm run preview`.

En la cabecera, «Buscar» está a la derecha del menú en computadora y dentro del botón «Menú» en celular.

## Identidad visual: ver los temas y elegir uno

La identidad visual todavía no está decidida. Hay cuatro temas armados sobre el sitio real; el que se publica hoy es el **provisorio**.

| Tema | Inspiración | Cuerpo (serifa) | Interfaz |
|---|---|---|---|
| Provisorio | La paleta sobria con la que se armó el sitio | Source Serif 4 | Source Sans 3 |
| A · Agua honda | El lago en sus tonos fríos; acento verde azulado | Literata | Inter |
| B · Totora | La orilla: totora seca y totora viva; capas terrosas | Alegreya | Alegreya Sans |
| C · Piedra y cielo | Luz de altura: piedra clara y azul profundo de cielo | Spectral | IBM Plex Sans |

Todas las tipografías tienen licencia libre SIL Open Font License 1.1 y van dentro del sitio (paquetes `@fontsource/*`): no se cargan de Google Fonts ni de ningún otro servidor. Cada tema tiene modo claro y oscuro y sus propios colores para las nueve capas del mapa. Todos los pares de texto y fondo cumplen el contraste AA; la tabla completa está en `docs/temas-contraste.md`.

### Verlos

Hace falta el sitio corriendo en la computadora (`npm install` una vez y después `npm run dev`; se abre en http://localhost:4321/web/).

- **Selector de tema**: abajo a la izquierda de cualquier página aparece un recuadro «Tema · sólo en desarrollo». Cambia entre provisorio, A, B y C, y entre modo claro, oscuro o el del sistema, sin recargar. Recuerda la elección en ese navegador.
- **Lámina de comparación**: http://localhost:4321/web/temas/ muestra los cuatro temas, cada uno en claro y en oscuro: paleta, tipografías, un párrafo de muestra, la ficha del mapa y los colores de capa.
- **Capturas**: sin correr nada, en `docs/capturas/temas/` hay portada, una entrada y el mapa en cada tema, claro y oscuro (`portada-a-claro.png`, `mapa-c-oscuro.png`, etc.).

Ni el selector ni la lámina existen en el sitio publicado.

### Elegir uno

Se cambia **una sola línea**, en `sitio.config.mjs`:

```js
export const TEMA = 'provisorio';   // 'provisorio', 'a', 'b', 'c', 'noche' o 'crema'
```

Por ejemplo, `export const TEMA = 'b';` publica el tema Totora. Al construir, el sitio carga sólo ese tema y sus tipografías, y comprueba el contraste AA (las tarjetas para compartir también toman sus colores y tipografías): si alguien cambia un color y algún par de texto y fondo no llega a 4.5:1, el sitio no se construye y el error dice cuál.

### Ajustar un tema

Cada tema es un archivo en `src/styles/temas/` (`provisorio.css`, `a.css`, `b.css`, `c.css`), con los colores del modo claro arriba y los del oscuro (`--oscuro-…`) abajo. Después de cambiar un color:

- `npm run temas:contraste` vuelve a medir los cuatro temas y reescribe `docs/temas-contraste.md`.
- `npm run temas:capturas` (con `npm run dev` corriendo en otra terminal) rehace las capturas.

## Direcciones del rediseño: verlas y elegir una

Los temas A, B y C cambian colores y tipografías sobre la misma maqueta. Las dos **direcciones** van más lejos: cada una es un tema más su propia composición (portada, jerarquía, escala tipográfica, aire entre bloques, uso de la imagen y navegación). Ninguna está elegida; el sitio publicado sigue con el tema provisorio.

| Dirección | Idea | Cuerpo (serifa) | Interfaz |
|---|---|---|---|
| 1 · Noche de altura (`noche`) | Recorrido vertical: noche fría, luz clara, un acento cálido. Riel lateral con escala de cotas como navegación; foto a toda altura; una sola columna que baja | Newsreader | Instrument Sans |
| 2 · Crema y tierra (`crema`) | Página de libro: crema de piedra y rojo de tierra. Retícula asimétrica, nombre en tipografía muy grande, franja de foto apaisada, bloques en fila, párrafos con sangría | EB Garamond | Work Sans |

Las dos tienen modo claro y oscuro, tipografías con licencia SIL Open Font License 1.1 dentro del sitio y contraste AA comprobado (`docs/temas-contraste.md`). No agregan JavaScript: todo es CSS. Las fotos todavía no están: donde va una foto hay un marco con la proporción definida y la marca visible [PENDIENTE: foto del autor].

### Verlas

Con el sitio corriendo (`npm run dev`):

- **Selector de tema**, abajo a la izquierda: «Dirección 1 · Noche de altura» y «Dirección 2 · Crema y tierra» cambian la página entera, composición incluida, sin recargar.
- **Lámina de las direcciones**: http://localhost:4321/web/direcciones/ muestra las dos lado a lado, con capturas de portada, índice de ensayos, entrada larga, /libro y el prototipo, en escritorio y teléfono, claro y oscuro, y enlaces para verlas vivas.
- **Capturas sin correr nada**: `docs/capturas/rediseno/` (`portada-noche-escritorio-oscuro.png`, `libro-crema-telefono-claro.png`, etc.). Para rehacerlas, con `npm run dev` corriendo: `npm run rediseno:capturas`.

### Elegir una

Igual que un tema, con **una sola línea** en `sitio.config.mjs`:

```js
export const TEMA = 'noche';   // o 'crema'
```

Al construir, el sitio carga sólo esa dirección (colores, tipografías y composición) y sólo el marcado que pide (los marcos de foto, el riel de la portada). Con cualquier otro tema, el sitio publicado no lleva nada de las direcciones.

Dónde está cada cosa, por si hay que ajustar: colores y tipografías en `src/styles/temas/noche.css` y `crema.css`; composición en `src/styles/composiciones/noche.css` y `crema.css`; las piezas de marcado propias de las direcciones llevan `data-solo` y se arman según `src/lib/direcciones.ts`.

## Prototipo de pieza inmersiva: «scroll es profundidad»

Una maqueta de la interacción: al bajar con el scroll, la vista baja hacia el fondo del lago, y un **riel de profundidad** a la derecha marca el tramo y sirve para saltar entre tramos. Es una página de desarrollo: existe con `npm run dev` y en la construcción de prueba (`npm run build:prueba`), **nunca en el sitio publicado**.

- Versión inmersiva: http://localhost:4321/web/prototipos/profundidad/
- Versión liviana (mismo texto, el riel como lista de enlaces y un corte fijo en SVG, sin JavaScript): http://localhost:4321/web/prototipos/profundidad/liviana/

Lo que **no** tiene, a propósito: datos reales. La forma del fondo es sintética, calculada con una fórmula, y está rotulada en pantalla como «forma ilustrativa, no es el fondo del lago». El riel no muestra metros: donde iría la cifra dice [PENDIENTE: profundidad con fuente]. La batimetría de la ALT entra cuando confirmes la licencia y la resolución (PENDIENTES.md).

Cumple las condiciones de «Piezas inmersivas» de CLAUDE.md: página propia; versión liviana con el mismo contenido (y la inmersiva se vuelve liviana sola si el equipo pide menos movimiento o ahorro de datos); todo el texto en HTML; fuentes citadas al pie de la pieza; sin sonido; sin coordenadas. Pesa 2.4 KB de JavaScript, escrito dentro de la página (un canvas 2D, sin bibliotecas); la medición completa por tipo de página está en `docs/rediseno-peso.md` y se rehace con `npm run build:prueba && npm run rediseno:peso`.

Si el prototipo sirve, el paso siguiente es decidir qué página real lo lleva (tiene que aprobarla el autor, una por una) y con qué datos.

## Si algo falla

Si el despliegue sale en rojo en *Actions*, casi siempre es el encabezado: una fecha mal escrita, un título con dos puntos sin comillas o un campo con nombre distinto. Abrí el error en *Actions → el despliegue fallido → build*: la línea dice qué archivo y qué campo. El sitio publicado anterior sigue en línea mientras tanto.

## Revisiones automáticas

Cada vez que se abre o se actualiza un pull request, GitHub corre una revisión del sitio («Revisión del sitio», en la pestaña *Actions* y al pie del pull request). No publica nada: sólo avisa si algo se rompió **antes** de que llegue a `main`. Las entradas que subís directo a `main` no pasan por esta revisión; si el despliegue falla, mirá «Si algo falla».

La revisión tiene siete pasos. Si uno sale en rojo, los siguientes no corren.

**1. Pruebas del puente con Obsidian** (`npm test`). Prueban el script de exportación con una bóveda de relleno (`scripts/obsidian/prueba/`), nunca con la tuya.
- *Si falla:* alguien cambió el script o el esquema del sitio y ya no coinciden. Es para quien mantiene el código.

**2. Contraste de los temas** (`npm run temas:contraste`). Mide todos los temas (también las dos direcciones del rediseño), en claro y en oscuro.
- *Si falla:* un color de `src/styles/temas/` no llega al contraste AA. El error dice qué par y cuánto le falta.

**3. Construir el sitio que se publica.** Arma el sitio completo, igual que el despliegue, y el índice del buscador.
- *Si falla:* casi siempre es un encabezado mal escrito en un `.md` (fecha, comillas, un campo con otro nombre) o un lugar del mapa con coordenadas que no corresponden. El error dice qué archivo y qué campo. Es lo mismo que se explica en «Si algo falla».

**Aviso de diseño (Impeccable, no bloquea).** Entre el paso 3 y el 4 corre un detector de patrones de diseño genérico sobre el sitio construido. Es un aviso: aunque encuentre algo, la revisión sigue y no queda en rojo. Las reglas que no sirven para un sitio editorial en español están apagadas en `.impeccable/config.json`. Los hallazgos se leen en el registro de ese paso, en la pestaña *Actions*. Hay otro verificador del mismo tipo que se corre a mano: `npm run lint:taste`.
- *Si sale en amarillo:* no hace falta hacer nada. Si un hallazgo te parece útil, se discute; las reglas de CLAUDE.md ganan siempre.

**4. Enlaces internos rotos.** Revisa todos los enlaces que van de una página del sitio a otra (y a imágenes y archivos del sitio). No revisa los enlaces a otros sitios.
- *Si falla:* la lista dice en qué página está el enlace y a dónde apunta. Lo más común es un archivo renombrado (su dirección cambió y los enlaces viejos quedaron apuntando a la anterior) o un enlace escrito a mano con un error. Se corrige el enlace o se devuelve el nombre original al archivo.

**5 y 6. Construir el sitio de prueba y revisar sus enlaces.** El sitio de prueba (`npm run build:prueba`) es igual al publicado pero **incluye los borradores**, para que las revisiones tengan entradas, series y lugares de ejemplo aunque todavía no haya contenido real. Nunca se publica.

**7. Páginas en escritorio y celular, funciones y accesibilidad.** Sobre el sitio de prueba, abre en un navegador la portada, el blog, los ensayos, «Sobre mí», contacto, el mapa, el buscador, la página de error, una entrada larga con notas y tabla de contenidos, un ensayo publicado en revista, una serie, el archivo del blog y el prototipo de pieza inmersiva (sus dos versiones), en pantalla de computadora (1280 px de ancho) y de celular (390 px). En cada una comprueba:
- *Que no haya desborde horizontal*: que nada sea más ancho que la pantalla y obligue a mover la página de costado. Pasa, por ejemplo, con una tabla muy ancha o una dirección web larga sin espacios. El error nombra el elemento que se sale.
- *Que no haya errores en la consola*: errores de programación de la página. Si aparece uno después de un cambio de contenido, conviene avisar a quien mantiene el código.
- *Accesibilidad*: con la herramienta axe, en modo claro y en modo oscuro, revisa que la página se pueda usar con lector de pantalla, con teclado y con poca visión. Falla sólo con problemas serios o críticos. Los más comunes: una imagen sin descripción (en un lugar del mapa, el campo `descripcion` de la imagen), un texto con poco contraste contra el fondo (pasa al cambiar colores de un tema) o un enlace sin texto.

Además prueba que las funciones anden juntas: «Buscar» en el menú de computadora y en el de celular, el buscador encuentra resultados, la tabla de contenidos y las notas al pie llevan a su lugar, la ficha del mapa se abre y se cierra, cada entrada tiene su tarjeta para compartir, el sitio publicado no trae el selector de temas y el prototipo cumple lo comprobable de «Piezas inmersivas» (rótulo de forma ilustrativa, riel, sin sonido, sin animación con menos movimiento, versión liviana sin JavaScript).
- *Si falla:* abrí la revisión en *Actions*; el paso en rojo dice qué página, en qué pantalla y qué problema. Al final de la página de la revisión hay un archivo «informe-pruebas» con el detalle.

**Para correr las mismas revisiones en la computadora** (hace falta haber instalado todo con `npm install`):

```sh
npx playwright install chromium    # sólo la primera vez: descarga el navegador de pruebas
npm test                           # puente con Obsidian
npm run temas:contraste            # contraste de los temas
npm run build                      # el sitio que se publica
npm run build:prueba               # el sitio de prueba, con borradores
npm run revisar                    # enlaces + páginas, funciones y accesibilidad
```

Un pull request con la revisión en rojo se puede unir igual (GitHub no lo impide), pero lo que estaba roto llega al sitio publicado. Lo recomendable es corregir primero.

## Primera publicación: activar GitHub Pages

Se hace una sola vez, después de unir el primer pull request a `main`:

1. En el repositorio, *Settings → Pages*.
2. En *Build and deployment → Source*, elegí **GitHub Actions**.
3. En *Actions*, abrí «Publicar en GitHub Pages» y tocá *Run workflow* (o subí cualquier cambio a `main`).

El sitio queda en https://loragonzalo-oss.github.io/web/.

## Pasar al dominio propio

Cuando compres el dominio (en adelante, `midominio.com`):

### 1. Cambiar la configuración del sitio

En el archivo `sitio.config.mjs`, en la raíz del repositorio, cambiá las dos líneas:

```js
export const SITE = 'https://midominio.com';
export const BASE = '/';
```

No hay que tocar nada más: enlaces, estilos, imágenes, RSS, sitemap y Open Graph toman la dirección de ahí.

### 2. Agregar el archivo CNAME

Creá el archivo `public/CNAME` (sin extensión) con una sola línea, el dominio sin `https://` y sin barra:

```
midominio.com
```

Subí los dos cambios (pasos 1 y 2) juntos a `main`.

### 3. Cargar los registros DNS

En el panel de DNS de donde compraste el dominio:

**Dominio raíz (apex, `midominio.com`)** — cuatro registros `A`, nombre `@`:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

Opcional, para IPv6 — cuatro registros `AAAA`, nombre `@`:

```
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

**www** — un registro `CNAME`, nombre `www`, valor:

```
loragonzalo-oss.github.io
```

Borrá cualquier otro registro `A` o `CNAME` que el proveedor haya puesto por defecto para `@` o `www` (suelen apuntar a una página de «dominio estacionado»).

Estas direcciones son las que GitHub publica en su documentación ([Managing a custom domain for your GitHub Pages site](https://docs.github.com/es/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)). Conviene confirmarlas ahí el día que hagas el cambio.

### 4. Activar el dominio y HTTPS en GitHub

1. *Settings → Pages → Custom domain*: escribí `midominio.com` y *Save*. GitHub verifica el DNS; puede tardar desde minutos hasta 24 horas.
2. Cuando la verificación pase, marcá **Enforce HTTPS**. Si la casilla está gris, el certificado todavía se está emitiendo: volvé a mirar en una hora.
3. Recomendado: verificá el dominio en tu cuenta (*Settings de tu perfil → Pages → Add a domain*) para que nadie más pueda usarlo en GitHub Pages.

Con eso, `www.midominio.com` redirige a `midominio.com` y la dirección vieja `loragonzalo-oss.github.io/web/` también.
