// Geometrías de los lugares del mapa: una línea, un polígono o un multipolígono en un
// archivo GeoJSON aparte, en src/content/lugares/geometrias/, referido desde la ficha con
// «geometria: geometrias/<nombre>.geojson». Un punto sigue siendo lat + lon en la ficha.
//
// Lo usan el esquema (src/content.config.ts), el sitio (src/lib/lugares.ts) y el puente con
// Obsidian (scripts/obsidian/controles.mjs), para que los tres frenen lo mismo. Sin imports
// y sin sintaxis de TypeScript que Node no sepa quitar: el puente lo carga directo.

export type Posicion = [number, number];
export type Geometria =
  | { type: 'LineString'; coordinates: Posicion[] }
  | { type: 'Polygon'; coordinates: Posicion[][] }
  | { type: 'MultiPolygon'; coordinates: Posicion[][][] };

export interface Recorte { latMin: number; latMax: number; lonMin: number; lonMax: number }

// Nombre de cada tipo para el lector.
export const TIPOS_GEOMETRIA = { LineString: 'línea', Polygon: 'polígono', MultiPolygon: 'multipolígono' } as const;

export const CARPETA_GEOMETRIAS = 'geometrias';

// «geometria: geometrias/rio.geojson» (también «./geometrias/rio.geojson»). La ruta es
// relativa a src/content/lugares/ y no puede salir de la carpeta de geometrías.
export function normalizarRutaGeometria(ref: string): { ruta?: string; error?: string } {
  const limpia = ref.trim().replace(/\\/g, '/').replace(/^\.\//, '');
  const partes = limpia.split('/');
  if (
    partes[0] !== CARPETA_GEOMETRIAS ||
    partes.length < 2 ||
    partes.some((p) => p === '..' || p === '.' || p === '') ||
    !/\.geojson$/i.test(limpia)
  ) {
    return {
      error: `«geometria: ${ref}» no sirve. Se escribe «geometria: ${CARPETA_GEOMETRIAS}/<nombre>.geojson», con el archivo en src/content/lugares/${CARPETA_GEOMETRIAS}/.`,
    };
  }
  return { ruta: limpia };
}

const decimales = (n: number) => /\.(\d+)/.exec(String(n))?.[1].length ?? 0;

/**
 * Lee el texto de un archivo de geometría y lo revisa. Devuelve la geometría en dos
 * dimensiones (sin altura) o los errores en castellano.
 * - GeoJSON válido: una geometría, un Feature o un FeatureCollection con un solo elemento.
 * - Sólo una línea, un polígono o un multipolígono.
 * - Todas las coordenadas dentro del recorte del lago.
 * - Regla 6: con «precision: aproximada», dos decimales como máximo en cada coordenada.
 */
export function leerGeometria(
  texto: string,
  { recorte, precision }: { recorte: Recorte; precision: string },
): { geometria?: Geometria; errores: string[] } {
  const errores: string[] = [];
  let gj: any;
  try {
    gj = JSON.parse(texto);
  } catch (e) {
    return { errores: [`El archivo no es GeoJSON válido: no se puede leer como JSON (${(e as Error).message}).`] };
  }

  if (gj?.type === 'FeatureCollection') {
    const n = Array.isArray(gj.features) ? gj.features.length : 0;
    if (n !== 1) return { errores: [`El archivo lleva ${n} elementos. Un archivo de geometría lleva uno solo: una línea, un polígono o un multipolígono.`] };
    gj = gj.features[0];
  }
  if (gj?.type === 'Feature') gj = gj.geometry;
  if (!gj || typeof gj !== 'object' || typeof gj.type !== 'string') {
    return { errores: ['El archivo no es GeoJSON válido: falta «type» con el tipo de geometría.'] };
  }
  if (gj.type === 'Point' || gj.type === 'MultiPoint') {
    return { errores: ['Un punto no va en un archivo de geometría: se escribe con lat y lon en la ficha.'] };
  }
  if (!(gj.type in TIPOS_GEOMETRIA)) {
    return { errores: [`El tipo «${gj.type}» no se admite. Un archivo de geometría lleva una línea (LineString), un polígono (Polygon) o un multipolígono (MultiPolygon).`] };
  }

  // Revisa una posición [lon, lat] y la deja en dos dimensiones.
  let fuera = 0;
  let primeraFuera = '';
  let finas = 0;
  let primeraFina = '';
  const posicion = (p: unknown, donde: string): Posicion | null => {
    if (!Array.isArray(p) || p.length < 2 || p.length > 3 || !p.every((x) => typeof x === 'number' && Number.isFinite(x))) {
      errores.push(`${donde}: cada coordenada se escribe [lon, lat], con dos números.`);
      return null;
    }
    const [lon, lat] = p as number[];
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      errores.push(`${donde}: [${lon}, ${lat}] no es una coordenada. En GeoJSON va primero la longitud y después la latitud.`);
      return null;
    }
    if (lat < recorte.latMin || lat > recorte.latMax || lon < recorte.lonMin || lon > recorte.lonMax) {
      if (fuera++ === 0) primeraFuera = `[${lon}, ${lat}]`;
    }
    if (precision === 'aproximada' && (decimales(lon) > 2 || decimales(lat) > 2)) {
      if (finas++ === 0) primeraFina = `[${lon}, ${lat}]`;
    }
    return [lon, lat];
  };
  const linea = (l: unknown, donde: string, minimo: number): Posicion[] | null => {
    if (!Array.isArray(l)) {
      errores.push(`${donde}: tiene que ser una lista de coordenadas.`);
      return null;
    }
    if (l.length < minimo) {
      errores.push(`${donde}: hacen falta al menos ${minimo} coordenadas (tiene ${l.length}).`);
      return null;
    }
    const pos = l.map((p, i) => posicion(p, `${donde}, coordenada ${i + 1}`));
    return pos.every(Boolean) ? (pos as Posicion[]) : null;
  };
  const anillo = (a: unknown, donde: string): Posicion[] | null => {
    const pos = linea(a, donde, 4);
    if (pos) {
      const [p, q] = [pos[0], pos[pos.length - 1]];
      if (p[0] !== q[0] || p[1] !== q[1]) {
        errores.push(`${donde}: un polígono se cierra repitiendo al final la primera coordenada.`);
        return null;
      }
    }
    return pos;
  };
  const poligono = (pol: unknown, donde: string): Posicion[][] | null => {
    if (!Array.isArray(pol) || pol.length === 0) {
      errores.push(`${donde}: tiene que ser una lista de anillos (el borde y, si hay, los huecos).`);
      return null;
    }
    const anillos = pol.map((a, i) => anillo(a, `${donde}, anillo ${i + 1}`));
    return anillos.every(Boolean) ? (anillos as Posicion[][]) : null;
  };

  let geometria: Geometria | undefined;
  const c = gj.coordinates;
  if (gj.type === 'LineString') {
    const l = linea(c, 'La línea', 2);
    if (l) geometria = { type: 'LineString', coordinates: l };
  } else if (gj.type === 'Polygon') {
    const p = poligono(c, 'El polígono');
    if (p) geometria = { type: 'Polygon', coordinates: p };
  } else {
    if (!Array.isArray(c) || c.length === 0) errores.push('El multipolígono tiene que ser una lista de polígonos.');
    else {
      const ps = c.map((p: unknown, i: number) => poligono(p, `El polígono ${i + 1}`));
      if (ps.every(Boolean)) geometria = { type: 'MultiPolygon', coordinates: ps as Posicion[][][] };
    }
  }

  if (fuera) {
    const { latMin, latMax, lonMin, lonMax } = recorte;
    errores.push(
      `${fuera} coordenada(s) fuera del recorte del lago (lat entre ${latMin} y ${latMax}, lon entre ${lonMin} y ${lonMax}); la primera es ${primeraFuera}. ¿Están invertidas o les falta el signo menos?`,
    );
  }
  if (finas) {
    errores.push(
      `Regla 6: con «precision: aproximada», cada coordenada del GeoJSON lleva como máximo dos decimales. Hay ${finas} con más; la primera es ${primeraFina}. Redondealas; el trazado exacto queda en la bóveda privada.`,
    );
  }
  return errores.length ? { errores } : { geometria, errores };
}

// Todas las posiciones de una geometría.
export function posiciones(g: Geometria): Posicion[] {
  if (g.type === 'LineString') return g.coordinates;
  if (g.type === 'Polygon') return g.coordinates.flat();
  return g.coordinates.flat(2);
}

// Rectángulo que la contiene: [oeste, sur, este, norte].
export function caja(g: Geometria): [number, number, number, number] {
  const ps = posiciones(g);
  const lons = ps.map((p) => p[0]);
  const lats = ps.map((p) => p[1]);
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
}

// La misma geometría con cada posición transformada.
export function mapearGeometria(g: Geometria, f: (p: Posicion) => Posicion): Geometria {
  if (g.type === 'LineString') return { type: g.type, coordinates: g.coordinates.map(f) };
  if (g.type === 'Polygon') return { type: g.type, coordinates: g.coordinates.map((a) => a.map(f)) };
  return { type: g.type, coordinates: g.coordinates.map((pol) => pol.map((a) => a.map(f))) };
}

// Dónde va el marcador de una línea o un polígono (el que se enfoca con el teclado y se
// agrupa con los puntos): la mitad del recorrido de la línea, o el centro del polígono más grande.
export function puntoEtiqueta(g: Geometria): Posicion {
  if (g.type === 'LineString') {
    const ls = g.coordinates;
    const tramos = ls.slice(1).map((q, i) => Math.hypot(q[0] - ls[i][0], q[1] - ls[i][1]));
    let resta = tramos.reduce((a, b) => a + b, 0) / 2;
    for (let i = 0; i < tramos.length; i++) {
      if (resta <= tramos[i] && tramos[i] > 0) {
        const t = resta / tramos[i];
        return [ls[i][0] + t * (ls[i + 1][0] - ls[i][0]), ls[i][1] + t * (ls[i + 1][1] - ls[i][1])];
      }
      resta -= tramos[i];
    }
    return ls[0];
  }
  const poligonos = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  let mejor = { area: -1, centro: poligonos[0][0][0] };
  for (const pol of poligonos) {
    const a = pol[0];
    let area = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < a.length - 1; i++) {
      const cruz = a[i][0] * a[i + 1][1] - a[i + 1][0] * a[i][1];
      area += cruz;
      cx += (a[i][0] + a[i + 1][0]) * cruz;
      cy += (a[i][1] + a[i + 1][1]) * cruz;
    }
    if (Math.abs(area) > mejor.area && area !== 0) mejor = { area: Math.abs(area), centro: [cx / (3 * area), cy / (3 * area)] };
  }
  return mejor.centro;
}
