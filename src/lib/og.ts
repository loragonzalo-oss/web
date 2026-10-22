// Imágenes para compartir (Open Graph) de entradas y ensayos, generadas al construir el sitio.
// Tipográficas: título y nombre del autor. Colores y tipografías salen del tema publicado
// (TEMA en sitio.config.mjs → src/styles/temas/<tema>.css; se lee el archivo, no se edita).
// Si algo falla, se usa public/og-default.png.
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { SITIO } from './sitio';
import { TEMA } from '../../sitio.config.mjs';
import { TEMAS } from '../desarrollo/temas.mjs';

const ANCHO = 1200;
const ALTO = 630;

// Rutas desde la raíz del proyecto (donde se corre `npm run build`). import.meta.url no sirve:
// al construir, este código se empaqueta dentro de dist/.
const raiz = (ruta: string) => join(process.cwd(), ruta);

const leerTema = (tema: string) => readFile(raiz(`src/styles/temas/${tema}.css`), 'utf8');

type Fuente = { name: string; weight: number; style: 'normal'; data: Buffer };

// Las tipografías del tema, en los pesos que el tema importa (@import '@fontsource/<paquete>/<peso>.css').
// Satori no lee woff2: usa los .woff que trae cada paquete de Fontsource, subconjuntos latin y latin-ext.
async function fuentesDelTema(tema: string) {
  const datos = TEMAS.find((t) => t.id === tema);
  if (!datos) throw new Error(`No existe el tema '${tema}'`);
  const css = await leerTema(tema);
  const fuentes: Fuente[] = [];
  for (const familia of [datos.cuerpo, datos.interfaz]) {
    const nombrePaquete = familia.paquete.replace('@fontsource/', '');
    const pesos = [...css.matchAll(new RegExp(`@import '${familia.paquete}/(\\d+)\\.css'`, 'g'))].map((m) => Number(m[1]));
    for (const peso of pesos) {
      for (const subconjunto of ['latin', 'latin-ext']) {
        const archivo = raiz(`node_modules/${familia.paquete}/files/${nombrePaquete}-${subconjunto}-${peso}-normal.woff`);
        if (existsSync(archivo)) fuentes.push({ name: familia.familia, weight: peso, style: 'normal', data: await readFile(archivo) });
      }
    }
  }
  return { fuentes, cuerpo: datos.cuerpo.familia, interfaz: datos.interfaz.familia };
}

let fuentes: ReturnType<typeof fuentesDelTema> | undefined;
const cargarFuentes = () => (fuentes ??= fuentesDelTema(TEMA));

// Toma los colores del modo claro del tema publicado y resuelve var(--otra).
// Las variables --oscuro-* (modo oscuro) no se usan: la tarjeta es una sola.
export async function coloresDelTema(tema: string = TEMA) {
  const css = (await leerTema(tema)).replace(/\/\*[\s\S]*?\*\//g, '');
  const valores = new Map<string, string>();
  for (const [, nombre, valor] of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    if (!valores.has(nombre)) valores.set(nombre, valor.trim());
  }
  const resolver = (nombre: string, vueltas = 0): string => {
    const valor = valores.get(nombre);
    if (!valor) throw new Error(`El tema '${tema}' no define ${nombre}`);
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
  const c = await coloresDelTema();
  const f = await cargarFuentes();
  // Satori suma el relleno al tamaño de la caja: el exterior fija 1200 × 630 y el interior se acomoda.
  const contenido = nodo(
    'div',
    {
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1,
      paddingTop: 64, paddingRight: 80, paddingBottom: 60, paddingLeft: 76,
    },
    [
      nodo('div', { fontFamily: f.interfaz, fontSize: 28, fontWeight: 600, color: c.acento, letterSpacing: 3, textTransform: 'uppercase' }, seccion),
      nodo(
        'div',
        { fontFamily: f.cuerpo, fontWeight: 600, fontSize: tamTitulo(titulo), lineHeight: 1.15, color: c.texto, display: 'flex', maxHeight: 380, overflow: 'hidden' },
        titulo,
      ),
      nodo(
        'div',
        { display: 'flex', borderTop: `2px solid ${c.borde}`, paddingTop: 28, fontFamily: f.interfaz, fontSize: 30, lineHeight: 1.2 },
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
  const svg = await satori(arbol as Parameters<typeof satori>[0], { width: ANCHO, height: ALTO, fonts: f.fuentes });
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
