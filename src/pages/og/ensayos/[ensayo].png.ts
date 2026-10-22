// Imagen para compartir de cada ensayo: /og/ensayos/<ensayo>.png
import type { APIRoute, GetStaticPaths } from 'astro';
import { ensayos } from '../../../lib/contenido';
import { imagenOG } from '../../../lib/og';

export const getStaticPaths = (async () => {
  const lista = await ensayos();
  return lista.map((e) => ({ params: { ensayo: e.id }, props: { titulo: e.data.titulo } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => imagenOG(props.titulo, 'Ensayo');
