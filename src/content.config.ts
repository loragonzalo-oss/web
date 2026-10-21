import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { slugificar } from './lib/slug';

// La dirección de cada texto sale del nombre del archivo (sin carpetas), o de `slug`
// en el frontmatter si se quiere fijar otra. Así se puede ordenar en carpetas sin
// cambiar los enlaces.
function generarId({ entry, data }: { entry: string; data: Record<string, unknown> }) {
  if (typeof data.slug === 'string' && data.slug.trim()) return slugificar(data.slug);
  const nombre = entry.split('/').pop()!.replace(/\.md$/i, '');
  return slugificar(nombre);
}

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
    }),
});

// Frontmatter de los ensayos. `publicacion` es el lugar donde salió (revista, libro, medio).
const ensayos = defineCollection({
  loader: glob({ base: './src/content/ensayos', pattern: '**/*.md', generateId: generarId }),
  schema: z.object({
    titulo: z.string(),
    fecha: z.coerce.date(),
    resumen: z.string(),
    publicacion: z.string().optional(),  // vacío = sin lugar de publicación
    enlace: z.union([z.url(), z.literal('')]).optional(),
    slug: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, ensayos };
