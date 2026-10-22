// Prototipo «scroll es profundidad» (página de desarrollo, fuera del sitio publicado).
// Contenido compartido por la versión inmersiva y la liviana, y la forma sintética del fondo.
//
// La forma NO es el fondo del lago: es una función matemática (una cuenca con ondas
// sumadas) para probar la interacción. La batimetría de la ALT entra cuando el autor
// confirme licencia y resolución (PENDIENTES.md). No hay cifras de profundidad acá.

export interface Tramo {
  id: string;
  nombre: string;
}

// Tramos del descenso. Nombres genéricos de maqueta; el texto de cada uno es del autor.
export const TRAMOS: Tramo[] = [
  { id: 'superficie', nombre: 'Superficie' },
  { id: 'aguas-someras', nombre: 'Aguas someras' },
  { id: 'aguas-abiertas', nombre: 'Aguas abiertas' },
  { id: 'fondo', nombre: 'Fondo' },
];

// Profundidad sintética en [0, 1] para x en [-1, 1] y z en [0, 1].
// 0 es la orilla, 1 lo más hondo de la forma. Sin unidades: no son metros.
export function hondura(x: number, z: number): number {
  const cuenca = 1 - (0.85 * x * x + 1.1 * (z - 0.5) * (z - 0.5));
  const ondas = 0.07 * Math.sin(6 * x + 3 * z) + 0.045 * Math.sin(13 * x - 7 * z) + 0.035 * Math.cos(9 * z + 2 * x);
  return Math.min(1, Math.max(0, cuenca + ondas));
}

// Corte de la forma (z = 0.5) como trazado SVG, en un lienzo de 1000 × 400.
// El agua empieza en y = 40; lo más hondo llega cerca de y = 380.
export function perfilSvg(puntos = 120): string {
  const ancho = 1000;
  const superficie = 40;
  const alto = 340;
  let d = `M0 400`;
  for (let i = 0; i <= puntos; i++) {
    const x = -1 + (2 * i) / puntos;
    const y = superficie + hondura(x, 0.5) * alto;
    d += ` L${((i / puntos) * ancho).toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d} L${ancho} 400 Z`;
}
