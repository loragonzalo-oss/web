import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { slugificar } from './lib/slug';
import { IDS_CAPAS, IDS_PAISES, RECORTE } from './lib/capas';
import { leerGeometria, normalizarRutaGeometria } from './lib/geometria';
import { normalizarDoi, normalizarPaginas } from './lib/revista';
import { normalizarTipoLugar, TIPOS_LUGAR, chocaConEnsayos } from './lib/referencia';
import { anclasOrdenadas, calcularZ, MARCADORES_DE_TRABAJO, textosDe, TOLERANCIA_Z } from './lib/tablero';

// La dirección de cada texto sale del nombre del archivo (sin carpetas), o de `slug`
// en el frontmatter si se quiere fijar otra. Así se puede ordenar en carpetas sin
// cambiar los enlaces.
function generarId({ entry, data }: { entry: string; data: Record<string, unknown> }) {
  if (typeof data.slug === 'string' && data.slug.trim()) return slugificar(data.slug);
  const nombre = entry.split('/').pop()!.replace(/\.md$/i, '');
  return slugificar(nombre);
}

// Un campo que Obsidian deja vacío llega como null o ''. Se trata como ausente.
const vacio = (v: unknown) => (v === null || v === '' ? undefined : v);

// Series: textos que se leen en orden. Mismo nombre de `serie` = misma serie, en blog
// y en ensayos. El orden sale de `parte` (1, 2, 3…) y, si falta, de la fecha.
const serie = {
  serie: z.preprocess(vacio, z.string().trim().min(1).optional()),
  parte: z.preprocess(vacio, z.coerce.number().int().positive().optional()),
};

// Frontmatter de las entradas del blog. Ver COMO-PUBLICAR.md.
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.md', generateId: generarId }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string(),
      fecha: z.coerce.date(),
      resumen: z.string().optional(),
      etiquetas: z.array(z.string()).default([]),
      imagen: image().optional(),
      slug: z.string().optional(),
      draft: z.boolean().default(false),
      ...serie,
    }),
});

// Datos de revista (opcionales). Un número suelto en YAML («volumen: 12») llega como número.
const textoOpcional = z.preprocess((v) => {
  const x = vacio(v);
  return typeof x === 'number' ? String(x) : x;
}, z.string().trim().min(1).optional());
const revista = {
  volumen: textoOpcional,
  numero: textoOpcional,
  paginas: textoOpcional.transform((v, ctx) => {
    if (v === undefined) return undefined;
    const p = normalizarPaginas(v);
    if (!p) ctx.addIssue({ code: 'custom', message: `«paginas» se escribe «45-67» o «45» (es «${v}»).` });
    return p;
  }),
  doi: textoOpcional.transform((v, ctx) => {
    if (v === undefined) return undefined;
    const d = normalizarDoi(v);
    if (!d) ctx.addIssue({ code: 'custom', message: `«doi» no es un DOI válido: «${v}». Se escribe «10.1234/abcd» o «https://doi.org/10.1234/abcd».` });
    return d;
  }),
};

// Frontmatter de los ensayos. `publicacion` es la publicación formal, la que se cita (revista,
// libro, medio); `volumen`, `numero`, `paginas` y `doi`, los datos de la revista, si los hay.
// `publicado_en` anota otros lugares donde salió (un post en LinkedIn, por ejemplo); nunca son
// destino de la cita. Ver COMO-PUBLICAR.md, «Publicar un ensayo como referencia».
const ensayos = defineCollection({
  loader: glob({ base: './src/content/ensayos', pattern: '**/*.md', generateId: generarId }),
  schema: ({ image }) =>
    z
      .object({
        titulo: z.string(),
        fecha: z.coerce.date(),
        resumen: z.string(),
        publicacion: z.string().optional(),  // vacío = sin publicación formal
        enlace: z.union([z.url(), z.literal('')]).optional(),
        ...revista,
        publicado_en: z.preprocess(
          vacio,
          z.array(z.object({
            lugar: z.string().trim().min(1),
            tipo: z.preprocess(
              (v) => normalizarTipoLugar(v) ?? v,
              z.enum(TIPOS_LUGAR, { error: `«tipo» es uno de estos: ${TIPOS_LUGAR.join(', ')}.` }),
            ),
            fecha: z.coerce.date(),
            enlace: z.preprocess(vacio, z.url().optional()),
          })).default([]),
        ),
        version_web: z.preprocess(vacio, z.enum(['completa', 'resumen']).default('completa')),
        etiquetas: z.preprocess(vacio, z.array(z.string()).default([])),
        imagen: z.preprocess(
          vacio,
          z.object({
            archivo: image(),
            credito: z.string().min(1),           // autor y licencia de la imagen
            descripcion: z.string().optional(),   // texto alternativo
          }).optional(),
        ),
        compartir: z.preprocess(vacio, z.string().trim().min(1).optional()),
        slug: z.preprocess(vacio, z.string().trim().optional()),
        direcciones_anteriores: z.preprocess(
          vacio,
          z.array(z.preprocess((v) => (typeof v === 'number' ? String(v) : v), z.string())).default([]),
        ),
        draft: z.boolean().default(false),
        ...serie,
      })
      .superRefine((d, ctx) => {
        // La dirección de un ensayo publicado no depende del nombre del archivo.
        if (!d.draft && !d.slug) {
          ctx.addIssue({
            code: 'custom',
            path: ['slug'],
            message: 'Falta «slug». Un ensayo que se publica (draft: false) lleva «slug»: es su dirección fija, /ensayos/<slug>/, y no cambia si se renombra el archivo.',
          });
        }
        if (d.slug && chocaConEnsayos(slugificar(d.slug))) {
          ctx.addIssue({ code: 'custom', path: ['slug'], message: `La dirección /ensayos/${slugificar(d.slug)}/ ya la usa el sitio. Elegí otro «slug».` });
        }
        for (const anterior of d.direcciones_anteriores) {
          if (!slugificar(anterior)) {
            ctx.addIssue({ code: 'custom', path: ['direcciones_anteriores'], message: `«${anterior}» no sirve como dirección: usá letras o números.` });
          } else if (d.slug && slugificar(anterior) === slugificar(d.slug)) {
            ctx.addIssue({ code: 'custom', path: ['direcciones_anteriores'], message: `«${anterior}» es la dirección vigente: en «direcciones_anteriores» van sólo las que se usaron antes.` });
          }
        }
      }),
});

// Admite coma decimal («-15,8») además de punto.
const coordenada = (v: unknown) => (typeof v === 'string' ? v.trim().replace(',', '.') : vacio(v));

// `[VERIFICAR]` sin comillas es una lista en YAML; se acepta igual, con o sin corchetes y tildes.
const MARCADORES = { CORPUS: 'corpus', VERIFICAR: '[VERIFICAR]', HIPOTESIS: '[HIPÓTESIS]', 'DATO PROPIO': '[DATO PROPIO]', 'DATO PROPIO DEL AUTOR': '[DATO PROPIO]' } as const;
function normalizarMarcador(v: unknown) {
  const texto = Array.isArray(v) && v.length === 1 ? v[0] : v;
  if (typeof texto !== 'string') return texto;
  const clave = texto.replace(/[[\]]/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase();
  return MARCADORES[clave as keyof typeof MARCADORES] ?? texto;
}

// Revisa el archivo de geometría de un lugar (src/lib/geometria.ts). La ruta es relativa a
// src/content/lugares/. Rutas desde la raíz del proyecto, donde se corre `npm run build`.
const CARPETA_LUGARES = join(process.cwd(), 'src/content/lugares');
function erroresGeometria(ref: string, precision: string): string[] {
  const { ruta, error } = normalizarRutaGeometria(ref);
  if (error) return [error];
  const archivo = join(CARPETA_LUGARES, ruta!);
  if (!existsSync(archivo)) return [`No existe el archivo de geometría src/content/lugares/${ruta}.`];
  return leerGeometria(readFileSync(archivo, 'utf8'), { recorte: RECORTE, precision }).errores.map((e) => `${ruta}: ${e}`);
}

// Frontmatter de los lugares del mapa. Ver COMO-PUBLICAR.md, «Agregar un lugar al mapa».
const lugares = defineCollection({
  loader: glob({ base: './src/content/lugares', pattern: '**/*.md', generateId: generarId }),
  schema: ({ image }) =>
    z
      .object({
        titulo: z.string(),
        capa: z.preprocess((v) => (typeof v === 'string' ? slugificar(v) : v), z.enum(IDS_CAPAS)),
        lat: z.preprocess(coordenada, z.coerce.number().min(-90).max(90).optional()),
        lon: z.preprocess(coordenada, z.coerce.number().min(-180).max(180).optional()),
        // Línea o polígono: archivo GeoJSON en src/content/lugares/geometrias/. Va en lugar de lat y lon.
        geometria: z.preprocess(vacio, z.string().trim().min(1).optional()),
        precision: z.preprocess(vacio, z.enum(['exacta', 'aproximada', 'oculta']).default('exacta')),
        // Lugar sensible (lugares sagrados y los que el autor indique). La capa Arqueología es
        // siempre sensible, lo diga o no. Regla 6: sólo punto aproximado u oculto.
        sensible: z.preprocess(vacio, z.boolean().default(false)),
        // bolivia, peru o binacional («Perú» también vale). Sin `pais`: «sin país asignado» en el filtro.
        pais: z.preprocess((v) => (typeof v === 'string' && v.trim() ? slugificar(v) : vacio(v)), z.enum(IDS_PAISES).optional()),
        resumen: z.string(),
        imagen: z.preprocess(
          vacio,
          z.object({
            archivo: image(),
            credito: z.string().min(1),           // autor y licencia de la imagen
            descripcion: z.string().optional(),   // texto alternativo
          }).optional(),
        ),
        enlaces: z.preprocess(
          vacio,
          z.array(z.object({ texto: z.string(), url: z.url(), verificado: z.coerce.date() })).default([]),
        ),
        fuentes: z.preprocess(
          vacio,
          z.array(z.object({
            autor: z.string(),
            año: z.union([z.number(), z.string()]).transform(String),
            titulo: z.string(),
            url: z.preprocess(vacio, z.url().optional()),
          })).default([]),
        ),
        marcador: z.preprocess(normalizarMarcador, z.enum(['corpus', '[VERIFICAR]', '[HIPÓTESIS]', '[DATO PROPIO]'])),
        relacionados: z.preprocess(vacio, z.array(z.string()).default([])),
        slug: z.string().optional(),
        draft: z.boolean().default(false),
      })
      .superRefine((d, ctx) => {
        const sinCoordenadas = d.lat === undefined || d.lon === undefined;
        // Regla 6 (decisión del autor, 22-10-2026): un lugar sensible no lleva línea ni polígono,
        // sólo un punto aproximado (dos decimales) u oculto. Mismo criterio que esSensible() en
        // scripts/obsidian/controles.mjs.
        const sensible = d.sensible ? 'marcado con «sensible: true»' : d.capa === 'arqueologia' ? 'capa Arqueología' : null;
        if (sensible && d.geometria !== undefined) {
          ctx.addIssue({ code: 'custom', path: ['geometria'], message: `Regla 6: es un lugar sensible (${sensible}) y no puede llevar línea ni polígono. Va como punto con «precision: aproximada» (lat y lon con dos decimales) o con «precision: oculta». El trazado queda en la bóveda privada.` });
        }
        if (sensible && d.precision === 'exacta') {
          ctx.addIssue({ code: 'custom', path: ['precision'], message: `Regla 6: es un lugar sensible (${sensible}) y tiene «precision: exacta» (o no la dice, y vale exacta). Usá «aproximada» (lat y lon con dos decimales) u «oculta» (sin lat ni lon).` });
        }
        if (d.geometria !== undefined) {
          // Un lugar es un punto (lat y lon) o una línea o un polígono (geometria), nunca las dos
          // cosas: el mapa no sabría dónde ponerlo ni adónde llevar la vista.
          if (d.lat !== undefined || d.lon !== undefined) {
            ctx.addIssue({ code: 'custom', path: ['geometria'], message: 'Un lugar lleva lat y lon (un punto) o «geometria» (una línea o un polígono), no las dos cosas. Borrá lat y lon, o «geometria».' });
          }
          // Regla 6: con oculta no se publica ninguna ubicación, tampoco un trazado.
          if (d.precision === 'oculta') {
            ctx.addIssue({ code: 'custom', path: ['geometria'], message: 'Regla 6: con «precision: oculta» la ficha no lleva «geometria». El trazado queda en la bóveda privada.' });
          } else {
            for (const message of erroresGeometria(d.geometria, d.precision)) ctx.addIssue({ code: 'custom', path: ['geometria'], message });
          }
        } else if (d.precision !== 'oculta' && sinCoordenadas) {
          ctx.addIssue({ code: 'custom', path: ['lat'], message: 'Faltan lat y lon (o «geometria», para una línea o un polígono). Sólo se pueden omitir con «precision: oculta».' });
        }
        if (!sinCoordenadas) {
          const { latMin, latMax, lonMin, lonMax } = RECORTE;
          if (d.lat! < latMin || d.lat! > latMax || d.lon! < lonMin || d.lon! > lonMax) {
            ctx.addIssue({
              code: 'custom',
              path: ['lat'],
              message: `Coordenadas fuera del recorte del lago (lat entre ${latMin} y ${latMax}, lon entre ${lonMin} y ${lonMax}). ¿Están invertidas o les falta el signo menos?`,
            });
          }
        }
        // Regla de CLAUDE.md: las coordenadas exactas de un lugar sensible nunca entran al repositorio.
        if (d.precision === 'oculta' && (d.lat !== undefined || d.lon !== undefined)) {
          ctx.addIssue({
            code: 'custom',
            path: ['lat'],
            message: 'Con «precision: oculta» el archivo no lleva lat ni lon: dejalos vacíos. La ubicación exacta queda en la bóveda privada.',
          });
        }
        if (d.precision === 'aproximada') {
          for (const campo of ['lat', 'lon'] as const) {
            const decimales = String(d[campo] ?? '').split('.')[1]?.length ?? 0;
            if (decimales > 2) {
              ctx.addIssue({
                code: 'custom',
                path: [campo],
                message: `Con «precision: aproximada», ${campo} lleva como máximo dos decimales (tiene ${decimales}: ${d[campo]}). Redondeá el valor; el exacto queda en la bóveda privada.`,
              });
            }
          }
        }
        if (d.marcador === 'corpus' && d.fuentes.length === 0) {
          ctx.addIssue({ code: 'custom', path: ['fuentes'], message: 'Con «marcador: corpus» hace falta al menos una fuente.' });
        }
      }),
});

// Tablero de indicadores: un YAML por versión en src/content/tablero/.
// Ver docs/tablero/COMO-ACTUALIZAR.md.
const petalo = z.object({
  ve: z.string().trim().min(1),
  indicador: z.string().trim().min(1),
  unidad: z.string().trim().min(1),
  valor: z.number({ error: '«valor» tiene que ser un número (con punto decimal, sin espacios).' }),
  decimales: z.number().int().min(0).max(4).optional(),  // para mostrar «3807.80» en vez de «3807.8»
  polaridad: z.union([z.literal(1), z.literal(-1)], { error: '«polaridad» es 1 (el riesgo crece si el valor sube) o -1 (si baja).' }),
  referencia: z.number(),
  limite: z.number(),
  alto_riesgo: z.number(),
  criterio: z.enum(['A', 'B', 'C', 'D'], { error: '«criterio» es A, B, C o D.' }),
  umbral: z.enum(['fuente', 'convencion'], { error: '«umbral» es «fuente» o «convencion».' }),
  estado_valor: z.enum(['fuente', 'provisorio'], { error: '«estado_valor» es «fuente» o «provisorio».' }),
  incierto: z.boolean().default(false),
  z_referencia: z.number({ error: 'Falta «z_referencia» (la z de la propuesta, para comparar con el cálculo).' }),
  fuente: z.string().trim().min(1, 'Falta «fuente». Si no se conoce, «[PENDIENTE: fuente primaria del valor]».'),
  nota: z.string().trim().min(1).optional(),
});

const tablero = defineCollection({
  loader: glob({ base: './src/content/tablero', pattern: '*.yaml' }),
  schema: z
    .object({
      version: z.string().trim().min(1),          // «P07»
      nombre: z.string().trim().min(1),           // «Propuesta 07»
      fecha: z.coerce.date(),
      herramienta: z.string().trim().min(1).optional(),
      cambios: z.string().trim().min(1),          // qué cambió en esta versión (historial)
      draft: z.boolean().default(false),
      variables: z.array(z.object({ id: z.string().trim().min(1), nombre: z.string().trim().min(1) })).default([]),
      textos: z
        .object({
          rotulo: z.string().trim().min(1),
          introduccion: z.string().trim().min(1),
          regla_lectura: z.string().trim().min(1),
          metodo: z.string().trim().min(1),
          metodo_apoyo: z.string().trim().min(1).optional(),
          fuentes: z.array(z.string().trim().min(1)).default([]),
        })
        .optional(),
      petalos: z.array(petalo).default([]),
    })
    .superRefine((d, ctx) => {
      // Los marcadores de trabajo quedan en la bóveda; la página nunca los muestra.
      for (const { ruta, texto } of textosDe(d)) {
        const m = texto.match(MARCADORES_DE_TRABAJO);
        if (m) ctx.addIssue({ code: 'custom', path: ruta, message: `«${m[0]}» es un marcador de trabajo y no va en el tablero. El estado del pétalo se dice con «umbral» y «estado_valor».` });
      }
      // Una versión publicada no sale con relleno.
      if (!d.draft) {
        for (const { ruta, texto } of textosDe(d)) {
          if (texto.includes('[PENDIENTE')) ctx.addIssue({ code: 'custom', path: ruta, message: `Con «draft: false» no puede quedar ningún «[PENDIENTE…]» (está en ${ruta.join('.')}). Completalo o volvé a «draft: true».` });
        }
      }
      if (d.petalos.length > 0 && !d.textos) {
        ctx.addIssue({ code: 'custom', path: ['textos'], message: 'Una versión con pétalos lleva «textos» (rótulo, introducción, regla de lectura, método).' });
      }
      const ids = new Set(d.variables.map((v) => v.id));
      d.petalos.forEach((p, i) => {
        const nombre = `Pétalo ${i + 1} («${p.indicador}»)`;
        if (!ids.has(p.ve)) ctx.addIssue({ code: 'custom', path: ['petalos', i, 've'], message: `${nombre}: la variable «${p.ve}» no está en «variables».` });
        if (!anclasOrdenadas(p)) {
          ctx.addIssue({ code: 'custom', path: ['petalos', i, 'limite'], message: `${nombre}: las anclas no están en orden. Con polaridad ${p.polaridad}, referencia, límite y alto riesgo tienen que ${p.polaridad === 1 ? 'subir' : 'bajar'} en ese orden.` });
          return;
        }
        if ((p.criterio === 'D') !== (p.umbral === 'convencion')) {
          ctx.addIssue({ code: 'custom', path: ['petalos', i, 'umbral'], message: `${nombre}: el criterio D va con «umbral: convencion»; A, B y C van con «umbral: fuente».` });
        }
        // El YAML y el cálculo no se separan sin que nadie lo vea.
        const z = calcularZ(p);
        if (Math.abs(z - p.z_referencia) > TOLERANCIA_Z) {
          ctx.addIssue({ code: 'custom', path: ['petalos', i, 'z_referencia'], message: `${nombre}: la z calculada es ${z.toFixed(2)} y «z_referencia» dice ${p.z_referencia}. Revisá el valor y las anclas, o actualizá «z_referencia».` });
        }
      });
    }),
});

export const collections = { blog, ensayos, lugares, tablero };
