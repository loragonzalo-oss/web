// Teselas de relieve para el mapa (/mapa), a partir del Copernicus DEM GLO-30.
//
// Uso:
//   npm run mapa:relieve -- <GeoTIFF o carpeta con GeoTIFF> [opciones]
//
// Toma uno o varios GeoTIFF del DEM (en grados, EPSG:4326, como vienen las hojas de 1° × 1°
// del GLO-30), los recorta al rectángulo RECORTE de src/lib/capas.ts y escribe teselas de
// alturas codificadas en color («terrarium», PNG de 256 px) en public/mapa/relieve/{z}/{x}/{y}.png,
// más public/mapa/relieve/relieve.json. Con eso, el fondo «Relieve» del mapa se activa solo:
// MapLibre dibuja el sombreado en el navegador, y las mismas teselas sirven para relieve 3D.
//
// Opciones:
//   --zoom-min N    primer nivel de zoom (por defecto 7)
//   --zoom-max N    último nivel de zoom (por defecto 12, unos 37 m por píxel en el lago)
//   --paso M        las alturas se redondean a M metros (por defecto 0.5). Más grande = archivos
//                   más livianos y sombreado más escalonado en las pampas.
//   --salida DIR    carpeta de salida (por defecto public/mapa/relieve)
//   --reemplazar    si la carpeta de salida ya tiene teselas, las reemplaza. Sin esta opción, frena.
//   --simular       calcula cuántas teselas saldrían, sin leer el DEM ni escribir nada.
//
// Necesita unos 500 MB de memoria libre con las nueve hojas del recorte. Ver COMO-PUBLICAR.md,
// «Relieve: generar las teselas».
import { existsSync, readdirSync, statSync } from 'node:fs';
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromFile } from 'geotiff';
import sharp from 'sharp';
import { RECORTE } from '../../src/lib/capas.ts';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TAM = 256;

// --- Cuentas de teselas (Web Mercator, como OpenStreetMap) ----------------------------

const lonAX = (lon, z) => ((lon + 180) / 360) * 2 ** z;
const latAY = (lat, z) => ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * 2 ** z;
const xALon = (x, z) => (x / 2 ** z) * 360 - 180;
const yALat = (y, z) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / 2 ** z))) * 180) / Math.PI;

// Teselas que tocan el recorte en el zoom z.
export function teselasDelRecorte(z, recorte = RECORTE) {
  const x0 = Math.floor(lonAX(recorte.lonMin, z));
  const x1 = Math.floor(lonAX(recorte.lonMax, z) - 1e-9);
  const y0 = Math.floor(latAY(recorte.latMax, z));
  const y1 = Math.floor(latAY(recorte.latMin, z) - 1e-9);
  const lista = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) lista.push({ z, x, y });
  return lista;
}

// --- Codificación «terrarium»: altura = (R × 256 + G + B / 256) − 32768 --------------------

export function codificar(alturas, paso) {
  const rgb = Buffer.alloc(alturas.length * 3);
  for (let i = 0; i < alturas.length; i++) {
    const v = Math.round(alturas[i] / paso) * paso + 32768;
    const entero = Math.floor(v);
    rgb[i * 3] = entero >> 8;
    rgb[i * 3 + 1] = entero & 255;
    rgb[i * 3 + 2] = Math.round((v - entero) * 256) & 255;
  }
  return rgb;
}

export const decodificar = (r, g, b) => r * 256 + g + b / 256 - 32768;

// --- Lectura del DEM ----------------------------------------------------------------------

async function archivosDe(entradas) {
  const lista = [];
  for (const e of entradas) {
    const ruta = path.resolve(e);
    if (!existsSync(ruta)) throw new Error(`No encuentro «${e}».`);
    if (statSync(ruta).isDirectory()) {
      for (const n of readdirSync(ruta).sort()) if (/\.tiff?$/i.test(n)) lista.push(path.join(ruta, n));
    } else lista.push(ruta);
  }
  if (lista.length === 0) throw new Error('No hay ningún GeoTIFF (.tif) en lo que se indicó.');
  return lista;
}

// Lee de cada GeoTIFF sólo la parte que cae dentro del recorte (más un píxel de margen).
async function leerFuentes(archivos, recorte) {
  const fuentes = [];
  for (const archivo of archivos) {
    const tiff = await fromFile(archivo);
    const imagen = await tiff.getImage();
    const claves = imagen.getGeoKeys() ?? {};
    if (claves.ProjectedCSTypeGeoKey || (claves.GeographicTypeGeoKey && claves.GeographicTypeGeoKey !== 4326)) {
      throw new Error(`${path.basename(archivo)}: tiene que estar en grados (EPSG:4326), como el Copernicus DEM.`);
    }
    const [oeste, sur, este, norte] = imagen.getBoundingBox();
    const ancho = imagen.getWidth();
    const alto = imagen.getHeight();
    const rx = (este - oeste) / ancho;
    const ry = (norte - sur) / alto;
    // Ventana en píxeles dentro del recorte.
    const c0 = Math.max(0, Math.floor((recorte.lonMin - oeste) / rx) - 1);
    const c1 = Math.min(ancho, Math.ceil((recorte.lonMax - oeste) / rx) + 1);
    const f0 = Math.max(0, Math.floor((norte - recorte.latMax) / ry) - 1);
    const f1 = Math.min(alto, Math.ceil((norte - recorte.latMin) / ry) + 1);
    if (c0 >= c1 || f0 >= f1) {
      console.log(`  · ${path.basename(archivo)}: fuera del recorte, no se usa.`);
      continue;
    }
    const [datos] = await imagen.readRasters({ window: [c0, f0, c1, f1], samples: [0] });
    const sinDato = imagen.getGDALNoData();
    fuentes.push({
      nombre: path.basename(archivo),
      oeste: oeste + c0 * rx,
      norte: norte - f0 * ry,
      rx,
      ry,
      ancho: c1 - c0,
      alto: f1 - f0,
      datos,
      sinDato,
    });
    console.log(`  · ${path.basename(archivo)}: ${c1 - c0} × ${f1 - f0} píxeles dentro del recorte.`);
  }
  if (fuentes.length === 0) throw new Error('Ninguno de los GeoTIFF cae dentro del recorte del lago.');
  return fuentes;
}

// Altura en (lon, lat), interpolada entre los cuatro píxeles vecinos. Fuera del recorte se
// usa el borde, para que el sombreado no muestre un acantilado al final de los datos.
function muestreador(fuentes, recorte) {
  let ultima = fuentes[0];
  const dentro = (f, lon, lat) => lon >= f.oeste && lon <= f.oeste + f.ancho * f.rx && lat <= f.norte && lat >= f.norte - f.alto * f.ry;
  return (lon, lat) => {
    lon = Math.min(recorte.lonMax, Math.max(recorte.lonMin, lon));
    lat = Math.min(recorte.latMax, Math.max(recorte.latMin, lat));
    const f = dentro(ultima, lon, lat) ? ultima : (fuentes.find((g) => dentro(g, lon, lat)) ?? null);
    if (!f) return null;
    ultima = f;
    const cx = Math.min(f.ancho - 1, Math.max(0, (lon - f.oeste) / f.rx - 0.5));
    const cy = Math.min(f.alto - 1, Math.max(0, (f.norte - lat) / f.ry - 0.5));
    const x0 = Math.floor(cx);
    const y0 = Math.floor(cy);
    const x1 = Math.min(f.ancho - 1, x0 + 1);
    const y1 = Math.min(f.alto - 1, y0 + 1);
    const tx = cx - x0;
    const ty = cy - y0;
    const v = (x, y) => {
      const a = f.datos[y * f.ancho + x];
      return a === f.sinDato || !Number.isFinite(a) ? null : a;
    };
    const q = [v(x0, y0), v(x1, y0), v(x0, y1), v(x1, y1)];
    if (q.some((a) => a === null)) return q.find((a) => a !== null) ?? null;
    return (q[0] * (1 - tx) + q[1] * tx) * (1 - ty) + (q[2] * (1 - tx) + q[3] * tx) * ty;
  };
}

// Alturas de una tesela del zoom máximo, muestreadas del DEM.
function teselaDelDem({ z, x, y }, muestrear) {
  const alturas = new Float32Array(TAM * TAM);
  for (let j = 0; j < TAM; j++) {
    const lat = yALat(y + (j + 0.5) / TAM, z);
    for (let i = 0; i < TAM; i++) {
      const lon = xALon(x + (i + 0.5) / TAM, z);
      alturas[j * TAM + i] = muestrear(lon, lat) ?? 0;
    }
  }
  return alturas;
}

// Alturas de una tesela de un zoom menor: promedio de 2 × 2 píxeles de sus cuatro hijas.
function teselaDeHijas({ z, x, y }, hijas, muestrear) {
  const alturas = new Float32Array(TAM * TAM);
  for (let dy = 0; dy < 2; dy++) {
    for (let dx = 0; dx < 2; dx++) {
      const hija = hijas.get(`${z + 1}/${2 * x + dx}/${2 * y + dy}`) ?? teselaDelDem({ z: z + 1, x: 2 * x + dx, y: 2 * y + dy }, muestrear);
      for (let j = 0; j < TAM / 2; j++) {
        for (let i = 0; i < TAM / 2; i++) {
          const a = (2 * j) * TAM + 2 * i;
          const prom = (hija[a] + hija[a + 1] + hija[a + TAM] + hija[a + TAM + 1]) / 4;
          alturas[(dy * (TAM / 2) + j) * TAM + dx * (TAM / 2) + i] = prom;
        }
      }
    }
  }
  return alturas;
}

const kb = (n) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${(n / 1024).toFixed(0)} KB`);

/**
 * @param {object} op
 * @param {string[]} op.entradas  GeoTIFF o carpetas con GeoTIFF
 * @param {string} [op.salida]    carpeta de salida
 * @param {number} [op.zoomMin]
 * @param {number} [op.zoomMax]
 * @param {number} [op.paso]      redondeo de las alturas, en metros
 * @param {boolean} [op.reemplazar]
 * @param {boolean} [op.simular]
 * @param {object} [op.recorte]   por defecto, RECORTE de src/lib/capas.ts
 */
export async function generarRelieve({ entradas, salida = path.join(RAIZ, 'public/mapa/relieve'), zoomMin = 7, zoomMax = 12, paso = 0.5, reemplazar = false, simular = false, recorte = RECORTE }) {
  if (!(Number.isInteger(zoomMin) && Number.isInteger(zoomMax) && zoomMin >= 0 && zoomMin <= zoomMax && zoomMax <= 15)) {
    throw new Error('Los zoom van de 0 a 15, con --zoom-min menor o igual que --zoom-max.');
  }
  if (!(paso > 0 && paso <= 10)) throw new Error('--paso va entre 0 y 10 metros.');
  const niveles = [];
  for (let z = zoomMin; z <= zoomMax; z++) niveles.push(teselasDelRecorte(z, recorte));
  const total = niveles.reduce((n, l) => n + l.length, 0);
  console.log(`Recorte: lat ${recorte.latMin} a ${recorte.latMax}, lon ${recorte.lonMin} a ${recorte.lonMax}.`);
  console.log(`Teselas: ${total} (zoom ${zoomMin} a ${zoomMax}; en el zoom ${zoomMax}, ${niveles.at(-1).length}).`);
  if (simular) return { teselas: total, bytes: 0, simulado: true };

  if (existsSync(salida) && (await readdir(salida)).length > 0) {
    if (!reemplazar) {
      throw new Error(`La carpeta ${path.relative(RAIZ, salida) || salida} ya tiene teselas. Para reemplazarlas, repetí la orden con --reemplazar.`);
    }
    await rm(salida, { recursive: true });
  }

  console.log('Leyendo el DEM…');
  const archivos = await archivosDe(entradas);
  const fuentes = await leerFuentes(archivos, recorte);
  const muestrear = muestreador(fuentes, recorte);

  let bytes = 0;
  let hijas = new Map();
  for (let z = zoomMax; z >= zoomMin; z--) {
    const actuales = new Map();
    for (const t of niveles[z - zoomMin]) {
      const alturas = z === zoomMax ? teselaDelDem(t, muestrear) : teselaDeHijas(t, hijas, muestrear);
      actuales.set(`${t.z}/${t.x}/${t.y}`, alturas);
      const png = await sharp(codificar(alturas, paso), { raw: { width: TAM, height: TAM, channels: 3 } })
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toBuffer();
      const ruta = path.join(salida, String(t.z), String(t.x), `${t.y}.png`);
      await mkdir(path.dirname(ruta), { recursive: true });
      await writeFile(ruta, png);
      bytes += png.length;
    }
    console.log(`  zoom ${z}: ${niveles[z - zoomMin].length} teselas.`);
    hijas = actuales;
  }

  const manifiesto = {
    codificacion: 'terrarium',
    tamTesela: TAM,
    zoomMin,
    zoomMax,
    pasoMetros: paso,
    recorte,
    fuente: 'Copernicus DEM GLO-30',
    archivos: fuentes.map((f) => f.nombre),
    teselas: total,
    bytes,
    generado: new Date().toISOString().slice(0, 10),
  };
  await writeFile(path.join(salida, 'relieve.json'), `${JSON.stringify(manifiesto, null, 2)}\n`);
  console.log(`Listo: ${total} teselas, ${kb(bytes)} en ${path.relative(RAIZ, salida) || salida}.`);
  if (bytes > 200 * 1024 * 1024) {
    console.log('AVISO: pasa de 200 MB. Probá con --zoom-max 11 (un cuarto del peso) o un --paso más grande antes de subirlo.');
  }
  return { teselas: total, bytes };
}

// Peso de una carpeta de teselas ya generada.
export async function pesoCarpeta(dir) {
  let n = 0;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, e.name);
    n += e.isDirectory() ? await pesoCarpeta(ruta) : (await stat(ruta)).size;
  }
  return n;
}

// --- Línea de órdenes -----------------------------------------------------------------------

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const op = { entradas: [] };
  const numero = (nombre, v) => {
    const n = Number(v);
    if (v === undefined || !Number.isFinite(n)) throw new Error(`${nombre} necesita un número.`);
    return n;
  };
  try {
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '--zoom-min') op.zoomMin = numero(a, args[++i]);
      else if (a === '--zoom-max') op.zoomMax = numero(a, args[++i]);
      else if (a === '--paso') op.paso = numero(a, args[++i]);
      else if (a === '--salida') op.salida = path.resolve(args[++i]);
      else if (a === '--reemplazar') op.reemplazar = true;
      else if (a === '--simular') op.simular = true;
      else if (a.startsWith('--')) throw new Error(`No conozco la opción ${a}.`);
      else op.entradas.push(a);
    }
    if (op.entradas.length === 0 && !op.simular) {
      throw new Error('Falta el GeoTIFF del DEM (o la carpeta con las hojas). Uso: npm run mapa:relieve -- <archivo o carpeta> [opciones]');
    }
    await generarRelieve(op);
  } catch (e) {
    console.error(`\n${e.message}`);
    process.exit(1);
  }
}
