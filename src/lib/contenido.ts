import { getCollection } from 'astro:content';

// Los borradores (draft: true) se ven sólo con `npm run dev`. Nunca se publican.
const verBorradores = import.meta.env.DEV;

export async function entradasBlog() {
  const todas = await getCollection('blog', ({ data }) => verBorradores || !data.draft);
  return todas.sort((a, b) => b.data.fecha.valueOf() - a.data.fecha.valueOf());
}

export async function ensayos() {
  const todos = await getCollection('ensayos', ({ data }) => verBorradores || !data.draft);
  return todos.sort((a, b) => b.data.fecha.valueOf() - a.data.fecha.valueOf());
}
