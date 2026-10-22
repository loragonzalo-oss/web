// Capas temáticas del mapa. El color y el ícono de cada una están en
// el tema (src/styles/temas/, --color-capa-<id>) y en src/styles/tokens.css (--icono-capa-<id>).
// En el frontmatter de un lugar, `capa` acepta el id o el nombre con tildes:
// «arqueologia», «Arqueología» y «arqueología» valen lo mismo.
export const CAPAS = [
  { id: 'clima', nombre: 'Clima' },
  { id: 'ecologia', nombre: 'Ecología' },
  { id: 'biodiversidad', nombre: 'Biodiversidad' },
  { id: 'cultura', nombre: 'Cultura' },
  { id: 'antropologia', nombre: 'Antropología' },
  { id: 'arqueologia', nombre: 'Arqueología' },
  { id: 'turismo', nombre: 'Turismo' },
  { id: 'emprendimientos-comunitarios', nombre: 'Emprendimientos comunitarios' },
  { id: 'gobiernos-municipales', nombre: 'Gobiernos municipales' },
] as const;

export type IdCapa = (typeof CAPAS)[number]['id'];

export const IDS_CAPAS = CAPAS.map((c) => c.id) as [IdCapa, ...IdCapa[]];

// Color e ícono de cada capa, tomados del tema (--color-capa-<id>, --icono-capa-<id>).
// Se genera desde CAPAS para que agregar una capa no obligue a tocar el CSS.
export function reglasCapas(): string {
  return CAPAS.map(
    (c) => `.capa-${c.id}{--capa-color:var(--color-capa-${c.id});--capa-icono:var(--icono-capa-${c.id})}`,
  ).join('\n');
}

export function nombreCapa(id: IdCapa): string {
  return CAPAS.find((c) => c.id === id)!.nombre;
}

// Recorte del mapa: el lago y sus orillas, de Bolivia y Perú (no toda la cuenca TDPS).
// Un lugar con coordenadas fuera de este rectángulo no deja construir el sitio:
// casi siempre es lat y lon invertidas o un signo menos que falta.
export const RECORTE = { latMin: -17.0, latMax: -14.9, lonMin: -70.4, lonMax: -68.4 };

// Vista inicial: el mapa se ajusta a este rectángulo, que contiene el lago entero.
export const VISTA_LAGO: [[number, number], [number, number]] = [[-16.65, -70.1], [-15.15, -68.6]];

// precision: aproximada. El punto está desplazado a propósito: se corre entre 1.2 y
// 2.5 km de las coordenadas del archivo (ya redondeadas a dos decimales), en una
// dirección fija para cada lugar, y se dibuja con una zona de 3 km de radio alrededor.
export const RADIO_APROXIMADO_M = 3000;
