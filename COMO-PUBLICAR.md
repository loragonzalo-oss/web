# Cómo publicar

Guía para escribir en Obsidian y publicar en la web. No hace falta tocar código.

## Resumen en cuatro pasos

1. Escribís la entrada en Obsidian, con el encabezado (frontmatter) de abajo.
2. Dejás `draft: false` cuando esté lista.
3. Subís el archivo `.md` a la carpeta que corresponde del repositorio en GitHub.
4. Esperás unos dos minutos: GitHub arma el sitio y lo publica solo.

## Dónde va cada cosa

| Qué | Carpeta del repositorio |
|---|---|
| Entradas del blog | `src/content/blog/` |
| Ensayos | `src/content/ensayos/` |
| Lugares del mapa | `src/content/lugares/` |
| Imágenes de una entrada | la misma carpeta que la entrada (o una subcarpeta) |

Podés ordenar las entradas en subcarpetas (por ejemplo, `src/content/blog/2026/`). La dirección de la página sale sólo del nombre del archivo, así que mover un archivo de carpeta no rompe su enlace. **Renombrar el archivo sí lo rompe.**

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

- `imagen: ./foto.jpg` — imagen para compartir en redes. Ruta relativa al archivo.
- `slug: otra-direccion` — si querés que la dirección no sea el nombre del archivo.

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

`publicacion` y `enlace` son opcionales. Si el ensayo es inédito, dejalos vacíos o borralos.

### Reglas del encabezado

- `fecha` siempre con el formato `AAAA-MM-DD`. Si falta, el sitio no se construye.
- `titulo` entre comillas si tiene dos puntos (`:`) u otros signos.
- `draft: true` = borrador. **No se publica.** Sólo se ve si alguien corre el sitio en su computadora con `npm run dev`.
- `draft: false` = se publica en el próximo despliegue.

En la carpeta `plantillas/` del repositorio hay tres plantillas listas (`entrada-blog.md`, `ensayo.md` y `lugar.md`). En Obsidian se activan en *Configuración → Plantillas → Ubicación de la carpeta de plantillas*.

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
- **`precision`**:
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

### Antes de publicar un lugar sensible

Regla del sitio (CLAUDE.md, regla 6): las coordenadas exactas de un lugar sensible —sitios arqueológicos, lugares sagrados y los que el autor indique— **nunca entran al repositorio**. La ubicación exacta queda en la bóveda privada.

- Con `precision: aproximada`, el archivo lleva sólo coordenadas redondeadas a dos decimales (una cuadrícula de algo más de 1 km de lado). Si `lat` o `lon` tienen más decimales, el sitio no se construye y el error dice cuál corregir.
- Con `precision: oculta`, el archivo no lleva `lat` ni `lon`. Si tiene alguno, el sitio no se construye.

Para redondear: `-16.01234` queda `-16.01`; `-69.12789` queda `-69.13`.

### Para compartir un lugar

Cada ficha tiene su propia dirección: la del mapa seguida de `#lugar-` y el nombre del archivo. Por ejemplo, `…/mapa/#lugar-isla-de-ejemplo` abre el mapa con esa ficha.

## Configurar Obsidian una sola vez

En *Configuración → Archivos y enlaces*:

- **Usar [[Wikilinks]]**: desactivado. La web entiende enlaces markdown comunes, no wikilinks.
- **Formato de nuevos enlaces**: «Ruta relativa al archivo».
- **Ubicación predeterminada para nuevos adjuntos**: «Misma carpeta que el archivo actual» (o «En subcarpeta debajo de la carpeta actual»).

Así, cuando pegues una imagen, Obsidian escribe `![](foto.jpg)` y la web la encuentra.

## Subir el archivo

### Opción A: desde la página de GitHub (la más simple)

1. Entrá a https://github.com/loragonzalo-oss/web.
2. Abrí la carpeta `src/content/blog/` (o `src/content/ensayos/`).
3. *Add file → Upload files*. Arrastrá el `.md` y, si tiene, sus imágenes.
4. Abajo, en *Commit changes*, escribí una línea que diga qué subiste y elegí **Commit directly to the main branch**.
5. En la pestaña *Actions* vas a ver el despliegue en curso. Cuando aparece el tilde verde, la entrada ya está en línea.

Para corregir una entrada publicada: abrí el archivo en GitHub, tocá el lápiz (*Edit*), corregí y hacé *Commit changes*.

### Opción B: el repositorio como bóveda de Obsidian

1. Instalá GitHub Desktop y cloná el repositorio `loragonzalo-oss/web`.
2. En Obsidian, *Abrir carpeta como bóveda* y elegí la carpeta `src/content` del repositorio clonado.
3. Escribís normalmente. Cuando quieras publicar, en GitHub Desktop: *Commit to main* y luego *Push origin*.

La carpeta `.obsidian/` (configuración de la bóveda) no se sube: está excluida en `.gitignore`.

## Si algo falla

Si el despliegue sale en rojo en *Actions*, casi siempre es el encabezado: una fecha mal escrita, un título con dos puntos sin comillas o un campo con nombre distinto. Abrí el error en *Actions → el despliegue fallido → build*: la línea dice qué archivo y qué campo. El sitio publicado anterior sigue en línea mientras tanto.

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
