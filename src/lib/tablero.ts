// Tablero de indicadores del Lago Titikaka: cálculo de z, geometría de la rosa y formato.
// Los datos están en src/content/tablero/ (un YAML por versión). Cómo se actualiza:
// docs/tablero/COMO-ACTUALIZAR.md.
//
// Método (Propuesta 07). Cada indicador tiene tres anclas: referencia (z = 0), límite (z = 1)
// y alto riesgo (z = 2), y una polaridad d: +1 si el riesgo crece cuando el valor sube, −1 si
// crece cuando baja. Se trabaja con los valores multiplicados por d.

export const Z_MAX = 3.5;          // borde de la escala: por encima, «fuera de escala»
export const TOLERANCIA_Z = 0.01;  // diferencia admitida entre z calculada y z_referencia
export const R0 = 0.16;            // hueco central, en unidades relativas
export const RMAX = 1;             // radio en z = Z_MAX
const K = (RMAX ** 2 - R0 ** 2) / Z_MAX;

export interface Anclas {
  valor: number;
  polaridad: 1 | -1;
  referencia: number;
  limite: number;
  alto_riesgo: number;
}

export function calcularZ({ valor, polaridad: d, referencia, limite, alto_riesgo }: Anclas): number {
  const xt = d * valor;
  const ref = d * referencia;
  const lim = d * limite;
  const alto = d * alto_riesgo;
  if (xt <= ref) return 0;
  if (xt <= lim) return (xt - ref) / (lim - ref);
  if (xt <= alto) return 1 + (xt - lim) / (alto - lim);
  return Math.min(Z_MAX, 2 + 0.65 * Math.log(1 + (xt - alto) / (alto - lim)));
}

// Radio relativo (0 a 1) para un z: el área del pétalo es proporcional a z.
export function radio(z: number): number {
  return Math.sqrt(R0 ** 2 + K * Math.min(Math.max(z, 0), Z_MAX));
}

// Anclas en orden según la polaridad: referencia < límite < alto riesgo (multiplicados por d).
export function anclasOrdenadas({ polaridad: d, referencia, limite, alto_riesgo }: Anclas): boolean {
  return d * referencia < d * limite && d * limite < d * alto_riesgo;
}

// ——— Estado para el lector ———

export type Umbral = 'fuente' | 'convencion';
export type Valor = 'fuente' | 'provisorio';

export const ETIQUETAS_ESTADO = {
  conFuente: 'con fuente',
  umbral: { fuente: 'umbral con fuente', convencion: 'umbral por convención' },
  valor: { fuente: 'valor con fuente', provisorio: 'valor provisorio' },
} as const;

export function etiquetasEstado(umbral: Umbral, valor: Valor): string[] {
  if (umbral === 'fuente' && valor === 'fuente') return [ETIQUETAS_ESTADO.conFuente];
  return [ETIQUETAS_ESTADO.umbral[umbral], ETIQUETAS_ESTADO.valor[valor]];
}

// Marca discreta junto al nombre en la figura (la leyenda la explica).
// El asterisco del umbral por convención va en el valor, no acá.
export const MARCA = { conFuente: '●', provisorio: '○' } as const;
export function marcaEstado(umbral: Umbral, valor: Valor): string {
  if (umbral === 'fuente' && valor === 'fuente') return MARCA.conFuente;
  return valor === 'provisorio' ? MARCA.provisorio : '';
}

// ——— Formato de números (regla del sitio) ———
// Decimal con punto; miles con espacio sólo desde cinco cifras; signo menos tipográfico;
// % pegado al número.

const MENOS = '−';
const ESPACIO_FINO = ' '; // espacio fino sin corte: «998 124» no se parte en dos líneas

export function numero(n: number, decimales?: number): string {
  const texto = decimales === undefined ? String(Math.abs(n)) : Math.abs(n).toFixed(decimales);
  const [entero, fraccion] = texto.split('.');
  const conMiles = entero.length >= 5 ? entero.replace(/\B(?=(\d{3})+(?!\d))/g, ESPACIO_FINO) : entero;
  return `${n < 0 ? MENOS : ''}${conMiles}${fraccion ? `.${fraccion}` : ''}`;
}

export function conUnidad(n: number, unidad: string, decimales?: number): string {
  const cifra = numero(n, decimales);
  return unidad.startsWith('%') ? `${cifra}${unidad}` : `${cifra} ${unidad}`;
}

// ——— Textos de la versión ———
// Párrafos separados por una línea en blanco; un párrafo cuyas líneas empiezan con «- » es
// una lista. Dentro del texto, *así* va en cursiva y «[PENDIENTE: …]» se marca como relleno.

export type Trozo = { tipo: 'texto' | 'cursiva' | 'pendiente'; texto: string };
export type Bloque = { tipo: 'parrafo'; trozos: Trozo[] } | { tipo: 'lista'; items: Trozo[][] };

export function enLinea(texto: string): Trozo[] {
  const trozos: Trozo[] = [];
  for (const parte of texto.split(/(\[PENDIENTE[^\]]*\]|\*[^*]+\*)/)) {
    if (!parte) continue;
    if (parte.startsWith('[PENDIENTE')) trozos.push({ tipo: 'pendiente', texto: parte });
    else if (/^\*[^*]+\*$/.test(parte)) trozos.push({ tipo: 'cursiva', texto: parte.slice(1, -1) });
    else trozos.push({ tipo: 'texto', texto: parte });
  }
  return trozos;
}

export function bloques(texto: string): Bloque[] {
  return texto
    .trim()
    .split(/\n\s*\n/)
    .map((p) => {
      const lineas = p.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lineas.every((l) => l.startsWith('- '))) {
        return { tipo: 'lista' as const, items: lineas.map((l) => enLinea(l.slice(2))) };
      }
      return { tipo: 'parrafo' as const, trozos: enLinea(lineas.join(' ')) };
    });
}

export const tienePendiente = (texto: string) => texto.includes('[PENDIENTE');

// Todos los textos de un objeto (para los controles de [PENDIENTE] y de marcadores de trabajo).
export function textosDe(valor: unknown, ruta: (string | number)[] = []): { ruta: (string | number)[]; texto: string }[] {
  if (typeof valor === 'string') return [{ ruta, texto: valor }];
  if (Array.isArray(valor)) return valor.flatMap((v, i) => textosDe(v, [...ruta, i]));
  if (valor && typeof valor === 'object' && !(valor instanceof Date)) {
    return Object.entries(valor).flatMap(([k, v]) => textosDe(v, [...ruta, k]));
  }
  return [];
}

// Marcadores de trabajo del autor: se quedan en la bóveda, nunca en la página.
export const MARCADORES_DE_TRABAJO = /\[(VERIFICAR|HIP[ÓO]TESIS)\]/i;

// ——— La rosa (SVG) ———
// Un solo generador para la página (Rosa.astro, en línea) y para la imagen para compartir
// (src/pages/og/tablero.png.ts, sin textos). Unidades del viewBox: el radio máximo de la
// escala (z = 3.5) mide ESCALA.

export interface PetaloRosa {
  indicador: string;
  ve: string;
  unidad: string;
  valor: number;
  decimales?: number;
  umbral: Umbral;
  estado_valor: Valor;
  incierto: boolean;
  z: number;
}

export interface OpcionesRosa {
  titulo: string;
  descripcion: string;
  centro: [string, string];             // «TDPS» y el año
  variables: { id: string; nombre: string }[];
  textos?: boolean;                     // false: sin ningún texto (imagen para compartir)
  contorno?: string;                    // color del contorno; por defecto, el del texto del tema
}

const ESCALA = 300;
const MEDIO = 560;                      // medio ancho del viewBox
const ARRIBA = -440;                    // borde superior e inferior: lo justo para las etiquetas
const ABAJO = 450;
const HUECO_GRADOS = 1.6;

// Colores fijos de la figura: no dependen del tema.
export const COLORES_ROSA = {
  zonaVerde: '#1F8A70',
  zonaAmbar: '#F2C14E',
  zonaRoja: '#D9483B',
  circuloLimite: '#3FBF95',
  circuloAltoRiesgo: '#E0705F',
  enReferencia: '#3FBF95',
  fueraDeEscala: '#C9567A',
  arcoVE: '#5E86C1',
} as const;

// Paradas del degradé por z (se convierten a radio con R(z)).
export const PARADAS: { z: number; color: string; opacidad?: number }[] = [
  { z: 0, color: '#1F6F5C', opacidad: 0.75 },
  { z: 1, color: '#1F6F5C', opacidad: 0.75 },
  { z: 1.0001, color: '#F2C14E' },
  { z: 1.5, color: '#F08A3E' },
  { z: 2, color: '#D9483B' },
  { z: 2.8, color: '#9E1F45' },
  { z: 3.5, color: '#5B1240' },
];

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r2 = (n: number) => Math.round(n * 100) / 100;

// Rumbo en grados desde arriba, en el sentido del reloj → punto del SVG (y hacia abajo).
function punto(rumbo: number, r: number): [number, number] {
  const a = (rumbo * Math.PI) / 180;
  return [r2(r * Math.sin(a)), r2(-r * Math.cos(a))];
}

function sector(desde: number, hasta: number, rIn: number, rOut: number): string {
  const [x1, y1] = punto(desde, rOut);
  const [x2, y2] = punto(hasta, rOut);
  const [x3, y3] = punto(hasta, rIn);
  const [x4, y4] = punto(desde, rIn);
  const grande = hasta - desde > 180 ? 1 : 0;
  return `M${x1} ${y1}A${rOut} ${rOut} 0 ${grande} 1 ${x2} ${y2}L${x3} ${y3}A${rIn} ${rIn} 0 ${grande} 0 ${x4} ${y4}Z`;
}

// Arco abierto; `alReves` lo recorre en contra del reloj (texto derecho en la mitad de abajo).
function arco(desde: number, hasta: number, r: number, alReves = false): string {
  const [a, b] = alReves ? [hasta, desde] : [desde, hasta];
  const [x1, y1] = punto(a, r);
  const [x2, y2] = punto(b, r);
  return `M${x1} ${y1}A${r} ${r} 0 ${Math.abs(hasta - desde) > 180 ? 1 : 0} ${alReves ? 0 : 1} ${x2} ${y2}`;
}

const anillo = (rIn: number, rOut: number) =>
  `M${rOut} 0A${rOut} ${rOut} 0 1 0 ${-rOut} 0A${rOut} ${rOut} 0 1 0 ${rOut} 0Z` +
  `M${rIn} 0A${rIn} ${rIn} 0 1 1 ${-rIn} 0A${rIn} ${rIn} 0 1 1 ${rIn} 0Z`;

// Parte un nombre en líneas de hasta `ancho` caracteres, por palabras.
function lineas(texto: string, ancho = 20): string[] {
  const salida: string[] = [];
  for (const palabra of texto.split(' ')) {
    const ultima = salida[salida.length - 1];
    if (ultima !== undefined && (ultima + ' ' + palabra).length <= ancho) salida[salida.length - 1] = `${ultima} ${palabra}`;
    else salida.push(palabra);
  }
  return salida;
}

export const valorEtiqueta = (p: Pick<PetaloRosa, 'valor' | 'unidad' | 'decimales' | 'umbral'>) =>
  `${conUnidad(p.valor, p.unidad, p.decimales)}${p.umbral === 'convencion' ? '*' : ''}`;

export function svgRosa(petalos: PetaloRosa[], o: OpcionesRosa): string {
  const conTextos = o.textos !== false;
  const n = petalos.length;
  const paso = 360 / n;
  const rIn = R0 * ESCALA;
  const rz = (z: number) => r2(radio(z) * ESCALA);
  const partes: string[] = [];

  partes.push(
    // Sin textos, el viewBox se ciñe a la rosa (el margen es para las etiquetas).
    (conTextos
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-MEDIO} ${ARRIBA} ${2 * MEDIO} ${ABAJO - ARRIBA}" class="rosa" role="img" aria-labelledby="rosa-titulo rosa-desc" style="font-family: var(--fuente-tablero, inherit)"`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-340 -340 680 680" width="1360" height="1360"`) +
      '>',
  );
  if (conTextos) partes.push(`<title id="rosa-titulo">${esc(o.titulo)}</title><desc id="rosa-desc">${esc(o.descripcion)}</desc>`);

  // Un solo degradé para todos los pétalos: el color depende sólo de z, y z sólo del radio.
  partes.push(
    `<defs><radialGradient id="rosa-degrade" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="${ESCALA}">` +
      PARADAS.map((p) => `<stop offset="${r2(radio(p.z) / RMAX * 10000) / 10000}" stop-color="${p.color}"${p.opacidad ? ` stop-opacity="${p.opacidad}"` : ''}/>`).join('') +
      '</radialGradient></defs>',
  );

  // Zonas de fondo y círculos de límite (z = 1) y alto riesgo (z = 2).
  const c = COLORES_ROSA;
  const contorno = o.contorno ?? 'currentColor';
  const trazo = `stroke="${contorno}" stroke-width="0.9" vector-effect="non-scaling-stroke"`;
  partes.push(
    '<g class="rosa-zonas">' +
      `<path d="${anillo(rIn, rz(1))}" fill="${c.zonaVerde}" fill-opacity="0.10" fill-rule="evenodd"/>` +
      `<path d="${anillo(rz(1), rz(2))}" fill="${c.zonaAmbar}" fill-opacity="0.07" fill-rule="evenodd"/>` +
      `<path d="${anillo(rz(2), rz(Z_MAX))}" fill="${c.zonaRoja}" fill-opacity="0.06" fill-rule="evenodd"/>` +
      // Cada círculo lleva un filete del color del texto a cada lado: contrasta con
      // cualquier fondo sin cambiar el color del círculo (WCAG 1.4.11).
      [[rz(1), c.circuloLimite], [rz(2), c.circuloAltoRiesgo]]
        .map(([r, color]) => `<circle r="${r}" fill="none" stroke="${contorno}" stroke-width="4" vector-effect="non-scaling-stroke"/><circle r="${r}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"/>`)
        .join('') +
      '</g>',
  );

  // Pétalos: empiezan arriba y avanzan en el sentido del reloj, en el orden de la tabla.
  partes.push('<g class="rosa-petalos">');
  petalos.forEach((p, i) => {
    const desde = i * paso + HUECO_GRADOS / 2;
    const hasta = (i + 1) * paso - HUECO_GRADOS / 2;
    const medio = (i + 0.5) * paso;
    let g = `<g data-petalo="${i + 1}">`;
    if (p.z > 0) {
      // Todos los pétalos llevan contorno del color del texto; el incierto es además tenue.
      g += `<path d="${sector(desde, hasta, rIn, Math.max(rz(p.z), rIn + 1))}" fill="url(#rosa-degrade)"${p.incierto ? ' fill-opacity="0.45"' : ''} ${trazo}/>`;
    } else {
      const [x, y] = punto(medio, rIn + 9);
      g += `<circle cx="${x}" cy="${y}" r="6" fill="${c.enReferencia}" ${trazo}/>`;
    }
    if (p.z >= Z_MAX) {
      const [ax, ay] = punto(medio, ESCALA + 24);
      const [bx, by] = punto(medio - 2.4, ESCALA + 7);
      const [cx, cy] = punto(medio + 2.4, ESCALA + 7);
      g += `<path d="M${ax} ${ay}L${bx} ${by}L${cx} ${cy}Z" fill="${c.fueraDeEscala}"/>`;
    }
    partes.push(g + '</g>');
  });
  partes.push('</g>');

  // Arco exterior por variable estructurante.
  const R_ARCO = 328;
  partes.push('<g class="rosa-ve">');
  for (const v of o.variables) {
    const indices = petalos.map((p, i) => (p.ve === v.id ? i : -1)).filter((i) => i >= 0);
    if (indices.length === 0) continue;
    const desde = indices[0] * paso + HUECO_GRADOS / 2;
    const hasta = (indices[indices.length - 1] + 1) * paso - HUECO_GRADOS / 2;
    partes.push(`<path d="${arco(desde, hasta, R_ARCO)}" fill="none" stroke="${c.arcoVE}" stroke-width="3" stroke-linecap="round"/>`);
    if (!conTextos) continue;
    const medio = (desde + hasta) / 2;
    const abajo = medio > 90 && medio < 270;
    const id = `rosa-arco-${v.id.toLowerCase()}`;
    const corto = v.id.replace(/^VE\s*/i, 'VE ');
    // Texto largo (pantallas anchas) y corto (angostas), cada uno sobre su propio arco.
    partes.push(
      `<path id="${id}" d="${arco(desde, hasta, abajo ? R_ARCO + 23 : R_ARCO + 9, abajo)}" fill="none"/>` +
        `<path id="${id}-c" d="${arco(desde, hasta, abajo ? R_ARCO + 66 : R_ARCO + 46, abajo)}" fill="none"/>` +
        `<text class="rosa-ve-texto rosa-largo"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${esc(`${corto} · ${v.nombre}`)}</textPath></text>` +
        `<text class="rosa-ve-texto rosa-corto"><textPath href="#${id}-c" startOffset="50%" text-anchor="middle">${esc(corto)}</textPath></text>`,
    );
  }
  partes.push('</g>');

  if (conTextos) {
    // Rótulos de los círculos, arriba, entre el último pétalo y el primero.
    partes.push(
      `<g class="rosa-circulos-texto rosa-largo">` +
        `<text x="6" y="${r2(-rz(1) + 16)}">límite</text>` +
        `<text x="6" y="${r2(-rz(2) + 16)}">alto riesgo</text>` +
        '</g>',
    );

    // Etiquetas: nombre (con su marca de estado) y valor; en pantallas angostas, el número.
    const largas: string[] = [];
    const numeros: string[] = [];
    petalos.forEach((p, i) => {
      const medio = (i + 0.5) * paso;
      const [x, y] = punto(medio, 372);
      const seno = Math.cos((medio * Math.PI) / 180);   // hacia arriba
      const coseno = Math.sin((medio * Math.PI) / 180); // hacia la derecha
      const ancla = coseno > 0.3 ? 'start' : coseno < -0.3 ? 'end' : 'middle';
      const nombre = lineas(p.indicador);
      const marca = marcaEstado(p.umbral, p.estado_valor);
      const filas = [
        ...nombre.map((t, j) => ({ t, clase: 'rosa-nombre', marca: j === nombre.length - 1 ? marca : '' })),
        { t: valorEtiqueta(p), clase: 'rosa-valor', marca: '' },
        ...(p.z === 0 ? [{ t: 'en la referencia', clase: 'rosa-valor', marca: '' }] : []),
      ];
      const alto = 20;
      const primera = seno > 0.3 ? y - (filas.length - 1) * alto - 4 : seno < -0.3 ? y + 14 : y - ((filas.length - 1) * alto) / 2 + 6;
      largas.push(
        `<text text-anchor="${ancla}">` +
          filas
            .map((f, j) => `<tspan x="${x}" y="${r2(primera + j * alto)}" class="${f.clase}">${esc(f.t)}${f.marca ? `<tspan class="rosa-marca"> ${f.marca}</tspan>` : ''}</tspan>`)
            .join('') +
          '</text>',
      );
      const [nx, ny] = punto(medio, 356);
      numeros.push(`<text x="${nx}" y="${r2(ny + 11)}" text-anchor="middle">${i + 1}</text>`);
    });
    partes.push(`<g class="rosa-etiquetas rosa-largo">${largas.join('')}</g>`);
    partes.push(`<g class="rosa-numeros rosa-corto">${numeros.join('')}</g>`);

    partes.push(
      `<g class="rosa-centro" text-anchor="middle"><text y="2" class="rosa-centro-sigla">${esc(o.centro[0])}</text><text y="24" class="rosa-centro-anio">${esc(o.centro[1])}</text></g>`,
    );
  }

  partes.push('</svg>');
  return partes.join('');
}

// ——— Datos de la colección ———
// astro:content se importa adentro de la función: este archivo lo usa también
// src/content.config.ts (para los controles), que no puede depender de la colección.

export async function tablero() {
  const { getCollection } = await import('astro:content');
  const versiones = (await getCollection('tablero')).sort((a, b) => b.data.fecha.valueOf() - a.data.fecha.valueOf());
  // La vigente es la más reciente que tiene pétalos; las demás son historial.
  const vigente = versiones.find((v) => v.data.petalos.length > 0);
  if (!vigente) throw new Error('[tablero] Ninguna versión de src/content/tablero/ tiene pétalos.');
  const petalos = vigente.data.petalos.map((p) => ({ ...p, z: calcularZ(p) }));
  return { versiones, vigente, petalos };
}
