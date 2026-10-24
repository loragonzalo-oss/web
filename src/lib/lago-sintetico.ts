// Relleno sintético para la capa «Fondo del lago (batimetría)» del mapa. Sólo se arma en
// desarrollo y en la construcción de prueba (mapa.astro lo pide con verBorradores).
//
// NO es el fondo del lago: son cuatro elipses anidadas, giradas, para probar cómo se ve y se
// prende la capa. Sin cifras de profundidad y sin unidades. La batimetría de la ALT 2016-2021
// entra cuando el autor confirme su licencia (PENDIENTES.md).
export function lagoSintetico() {
  const centro = [-69.45, -15.8];
  const giro = (-35 * Math.PI) / 180;
  const elipse = (rx: number, ry: number) => {
    const anillo: [number, number][] = [];
    for (let i = 0; i <= 72; i++) {
      const t = (i / 72) * 2 * Math.PI;
      const [x, y] = [rx * Math.cos(t), ry * Math.sin(t)];
      anillo.push([
        Math.round((centro[0] + x * Math.cos(giro) - y * Math.sin(giro)) * 1000) / 1000,
        Math.round((centro[1] + x * Math.sin(giro) + y * Math.cos(giro)) * 1000) / 1000,
      ]);
    }
    anillo[anillo.length - 1] = anillo[0];
    return anillo;
  };
  return {
    type: 'FeatureCollection' as const,
    features: [1, 2, 3, 4].map((nivel) => ({
      type: 'Feature' as const,
      // `nivel` sólo ordena los anillos de afuera hacia adentro; no es una profundidad.
      properties: { nivel },
      geometry: { type: 'Polygon' as const, coordinates: [elipse(0.42 - nivel * 0.08, 0.22 - nivel * 0.042)] },
    })),
  };
}
