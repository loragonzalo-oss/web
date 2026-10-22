// Imágenes para compartir (Open Graph) de entradas y ensayos, generadas al construir el sitio.
// Tipográficas: título y nombre del autor. Los colores salen de src/styles/tokens.css
// (se lee el archivo, no se edita). Si algo falla, se usa public/og-default.png.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { SITIO } from './sitio';

const ANCHO = 1200;
const ALTO = 630;

// Rutas desde la raíz del proyecto (donde se corre `npm run build`). import.meta.url no sirve:
// al construir, este código se empaqueta dentro de dist/.
const raiz = (ruta: string) => join(process.cwd(), ruta);

const FUENTES = [
  ['Source Serif 4', 400, '@fontsource/source-serif-4/files/source-serif-4-latin-400-normal.woff'],
  ['Source Serif 4', 600, '@fontsource/source-serif-4/files/source-serif-4-latin-600-normal.woff'],
  ['Source Serif 4', 600, '@fontsource/source-serif-4/files/source-serif-4-latin-ext-600-normal.woff'],
  ['Source Sans 3', 400, '@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.woff'],
  ['Source Sans 3', 600, '@fontsource/source-sans-3/files/source-sans-3-latin-600-normal.woff'],
  ['Source Sans 3', 400, '@fontsource/source-sans-3/files/source-sans-3-latin-ext-400-normal.woff'],
] as const;

let fuentes: Promise<Parameters<typeof satori>[1]['fonts']> | undefined;
function cargarFuentes() {
  fuentes ??= Promise.all(
    FUENTES.map(async ([name, weight, archivo]) => ({
      name,
      weight,
      style: 'normal' as const,
      data: await readFile(raiz(`node_modules/${archivo}`)),
    })),
  );
  return fuentes;
}

// Toma el primer valor de cada variable en tokens.css (el modo claro) y resuelve var(--otra).
export async function coloresDeTokens() {
  const css = (await readFile(raiz('src/styles/tokens.css'), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
  const valores = new Map<string, string>();
  for (const [, nombre, valor] of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    if (!valores.has(nombre)) valores.set(nombre, valor.trim());
  }
  const resolver = (nombre: string, vueltas = 0): string => {
    const valor = valores.get(nombre);
    if (!valor) throw new Error(`tokens.css no define ${nombre}`);
    const ref = valor.match(/^var\(\s*(--[\w-]+)\s*(?:,[^)]*)?\)$/);
    if (ref && vueltas < 5) return resolver(ref[1], vueltas + 1);
    if (!/^(#[0-9a-f]{3,8}|rgba?\(.+\)|hsla?\(.+\))$/i.test(valor)) {
      throw new Error(`${nombre} tiene un valor que la imagen no sabe usar: ${valor}`);
    }
    return valor;
  };
  return {
    fondo: resolver('--color-fondo'),
    borde: resolver('--color-borde'),
    texto: resolver('--color-texto'),
    suave: resolver('--color-texto-suave'),
    acento: resolver('--color-acento'),
  };
}

const nodo = (type: string, style: Record<string, unknown>, children?: unknown) => ({
  type,
  props: { style, children },
});

function tamTitulo(titulo: string) {
  if (titulo.length <= 40) return 76;
  if (titulo.length <= 70) return 64;
  if (titulo.length <= 110) return 52;
  return 44;
}

async function dibujar(titulo: string, seccion: string) {
  const c = await coloresDeTokens();
  // Satori suma el relleno al tamaño de la caja: el exterior fija 1200 × 630 y el interior se acomoda.
  const contenido = nodo(
    'div',
    {
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1,
      paddingTop: 64, paddingRight: 80, paddingBottom: 60, paddingLeft: 76,
    },
    [
      nodo('div', { fontFamily: 'Source Sans 3', fontSize: 28, fontWeight: 600, color: c.acento, letterSpacing: 3, textTransform: 'uppercase' }, seccion),
      nodo(
        'div',
        { fontFamily: 'Source Serif 4', fontWeight: 600, fontSize: tamTitulo(titulo), lineHeight: 1.15, color: c.texto, display: 'flex', maxHeight: 380, overflow: 'hidden' },
        titulo,
      ),
      nodo(
        'div',
        { display: 'flex', borderTop: `2px solid ${c.borde}`, paddingTop: 28, fontFamily: 'Source Sans 3', fontSize: 30, lineHeight: 1.2 },
        [
          nodo('div', { fontWeight: 600, color: c.texto }, SITIO.nombre),
          nodo('div', { color: c.suave, marginLeft: 16 }, `«${SITIO.apodo}»`),
        ],
      ),
    ],
  );
  const arbol = nodo(
    'div',
    { width: ANCHO, height: ALTO, display: 'flex', backgroundColor: c.fondo, borderLeft: `24px solid ${c.acento}` },
    [contenido],
  );
  const svg = await satori(arbol as Parameters<typeof satori>[0], { width: ANCHO, height: ALTO, fonts: await cargarFuentes() });
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// Devuelve siempre un PNG: el generado o, si falla, og-default.png.
export async function imagenOG(titulo: string, seccion: string): Promise<Response> {
  let png: Buffer;
  try {
    png = await dibujar(titulo, seccion);
  } catch (error) {
    console.warn(`[og] No se pudo generar la imagen de «${titulo}»; se usa og-default.png. ${error}`);
    png = await readFile(raiz('public/og-default.png'));
  }
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
}
