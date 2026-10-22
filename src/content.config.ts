import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { slugificar } from './lib/slug';
import { IDS_CAPAS, RECORTE } from './lib/capas';
import { normalizarDoi, normalizarPaginas } from './lib/revista';
import { normalizarTipoLugar, TIPOS_LUGAR, chocaConEnsayos } from './lib/referencia';

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
        precision: z.preprocess(vacio, z.enum(['exacta', 'aproximada', 'oculta']).default('exacta')),
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
        if (d.precision !== 'oculta' && sinCoordenadas) {
          ctx.addIssue({ code: 'custom', path: ['lat'], message: 'Faltan lat y lon. Sólo se pueden omitir con «precision: oculta».' });
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

export const collections = { blog, ensayos, lugares };
