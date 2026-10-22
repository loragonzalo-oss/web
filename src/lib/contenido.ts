import { getCollection } from 'astro:content';
import { verBorradores } from './borradores';

export async function entradasBlog() {
  const todas = await getCollection('blog', ({ data }) => verBorradores || !data.draft);
  return todas.sort((a, b) => b.data.fecha.valueOf() - a.data.fecha.valueOf());
}

export async function ensayos() {
  const todos = await getCollection('ensayos', ({ data }) => verBorradores || !data.draft);
  return todos.sort((a, b) => b.data.fecha.valueOf() - a.data.fecha.valueOf());
}
