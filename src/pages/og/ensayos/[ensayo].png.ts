// Imagen para compartir de cada ensayo: /og/ensayos/<ensayo>.png. Lleva el título, el nombre
// del autor y, si hay publicación formal, su nombre. La usa la página si el ensayo no trae `imagen`.
import type { APIRoute, GetStaticPaths } from 'astro';
import { ensayos } from '../../../lib/contenido';
import { imagenOG } from '../../../lib/og';

export const getStaticPaths = (async () => {
  const lista = await ensayos();
  return lista.map((e) => ({ params: { ensayo: e.id }, props: { titulo: e.data.titulo, publicacion: e.data.publicacion?.trim() || undefined } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => imagenOG(props.titulo, 'Ensayo', { publicacion: props.publicacion });
