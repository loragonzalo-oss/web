// Imagen para compartir de cada entrada del blog: /og/blog/<entrada>.png
import type { APIRoute, GetStaticPaths } from 'astro';
import { entradasBlog } from '../../../lib/contenido';
import { imagenOG } from '../../../lib/og';

export const getStaticPaths = (async () => {
  const entradas = await entradasBlog();
  return entradas.map((e) => ({ params: { entrada: e.id }, props: { titulo: e.data.titulo } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => imagenOG(props.titulo, 'Blog');
