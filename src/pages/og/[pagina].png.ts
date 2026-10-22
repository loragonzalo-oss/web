// Imagen para compartir del tablero: /og/tablero.png (1200 × 630).
// Sólo existe cuando la versión vigente no es borrador; mientras lo es, /tablero/ usa
// public/og-default.png. La rosa sale del mismo generador que la página (svgRosa), sin
// textos; el título y el nombre los pone satori con las tipografías del tema publicado.
import type { APIRoute, GetStaticPaths } from 'astro';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { coloresDelTema } from '../../lib/og';
import { fechaLarga } from '../../lib/fechas';
import { SITIO } from '../../lib/sitio';
import { svgRosa, tablero } from '../../lib/tablero';
import { TEMA } from '../../../sitio.config.mjs';
import { TEMAS } from '../../desarrollo/temas.mjs';

export const getStaticPaths = (async () => {
  const { vigente } = await tablero();
  return vigente.data.draft ? [] : [{ params: { pagina: 'tablero' } }];
}) satisfies GetStaticPaths;

const raiz = (ruta: string) => join(process.cwd(), ruta);

async function fuente(paquete: string, familia: string, peso: number) {
  const nombre = paquete.replace('@fontsource/', '');
  const archivo = raiz(`node_modules/${paquete}/files/${nombre}-latin-${peso}-normal.woff`);
  return existsSync(archivo) ? [{ name: familia, weight: peso, style: 'normal' as const, data: await readFile(archivo) }] : [];
}

const nodo = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}) => ({
  type,
  props: { style, children, ...extra },
});

export const GET: APIRoute = async () => {
  const { vigente, petalos } = await tablero();
  const v = vigente.data;
  // El contorno va del color del texto del tema publicado (en el SVG suelto no hay currentColor).
  const c = await coloresDelTema().catch(() => null);
  const svg = svgRosa(petalos, { titulo: '', descripcion: '', centro: ['', ''], variables: v.variables, textos: false, contorno: c?.texto ?? '#222222' });
  const rosa = await sharp(Buffer.from(svg)).resize(560, 560).png().toBuffer();
  try {
    if (!c) throw new Error('sin colores del tema');
    const tema = TEMAS.find((t) => t.id === TEMA)!;
    const fuentes = [
      ...(await fuente(tema.cuerpo.paquete, tema.cuerpo.familia, 600)),
      ...(await fuente(tema.interfaz.paquete, tema.interfaz.familia, 400)),
      ...(await fuente(tema.interfaz.paquete, tema.interfaz.familia, 600)),
    ];
    const arbol = nodo('div', { width: 1200, height: 630, display: 'flex', alignItems: 'center', backgroundColor: c.fondo }, [
      nodo('img', { width: 560, height: 560, flexShrink: 0, marginLeft: 36, marginRight: 24 }, undefined, { src: `data:image/png;base64,${rosa.toString('base64')}`, width: 560, height: 560 }),
      nodo('div', { display: 'flex', flexDirection: 'column', flexGrow: 1, paddingRight: 64, paddingLeft: 24 }, [
        nodo('div', { fontFamily: tema.interfaz.familia, fontSize: 24, fontWeight: 600, color: c.acento, letterSpacing: 3, textTransform: 'uppercase' }, 'Tablero de indicadores'),
        nodo('div', { fontFamily: tema.cuerpo.familia, fontSize: 56, fontWeight: 600, lineHeight: 1.12, color: c.texto, marginTop: 18 }, 'Lago Titikaka y su cuenca'),
        nodo('div', { fontFamily: tema.interfaz.familia, fontSize: 26, color: c.suave, marginTop: 22 }, `${v.nombre} · ${fechaLarga(v.fecha)}`),
        nodo('div', { fontFamily: tema.interfaz.familia, fontSize: 26, fontWeight: 600, color: c.texto, marginTop: 40, paddingTop: 22, borderTop: `2px solid ${c.borde}` }, SITIO.nombre),
      ]),
    ]);
    const tarjeta = await satori(arbol as Parameters<typeof satori>[0], { width: 1200, height: 630, fonts: fuentes });
    const png = await sharp(Buffer.from(tarjeta)).png().toBuffer();
    return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
  } catch (error) {
    // Sin tarjeta: la rosa sola, centrada sobre fondo claro.
    console.warn(`[og] No se pudo armar la tarjeta del tablero; va la rosa sola. ${error}`);
    const png = await sharp({ create: { width: 1200, height: 630, channels: 4, background: '#ffffff' } })
      .composite([{ input: await sharp(rosa).resize(600, 600).toBuffer(), left: 300, top: 15 }])
      .png()
      .toBuffer();
    return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
  }
};
