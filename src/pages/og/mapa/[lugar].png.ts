// Imagen para compartir de cada lugar del mapa: /og/mapa/<lugar>.png. Sólo el título:
// nunca coordenadas ni un mapa (regla 6).
import type { APIRoute, GetStaticPaths } from 'astro';
import { lugares } from '../../../lib/lugares';
import { imagenOG } from '../../../lib/og';

export const getStaticPaths = (async () => {
  const lista = await lugares();
  return lista.map((l) => ({ params: { lugar: l.id }, props: { titulo: l.data.titulo } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => imagenOG(props.titulo, 'Mapa');
