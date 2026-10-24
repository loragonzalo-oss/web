// Color de cada lugar en las capas de MapLibre (líneas, polígonos y zonas aproximadas), según su
// capa. Aparte del motor para poder probarlo sin navegador (scripts/mapa/prueba/estilo.test.mjs).
// Sin imports que no sean tipos: Node lo carga directo.
import type { ExpressionSpecification } from 'maplibre-gl';

/**
 * `match` de MapLibre: ['match', ['get', 'capa'], capa1, color1, capa2, color2, …, respaldo].
 * MapLibre exige al menos un par capa-color. Sin capas (un sitio sin ningún lugar publicado),
 * devuelve sólo el color de respaldo: un `match` vacío hacía que MapLibre rechazara el estilo y
 * el mapa no arrancara.
 */
export function colorPorCapa(
  capas: readonly string[],
  color: (capa: string) => string,
  respaldo: string,
): ExpressionSpecification | string {
  const unicas = [...new Set(capas)];
  if (unicas.length === 0) return respaldo;
  return ['match', ['get', 'capa'], ...unicas.flatMap((c) => [c, color(c)]), respaldo] as ExpressionSpecification;
}
