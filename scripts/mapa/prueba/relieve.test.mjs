// Pruebas del script de relieve (scripts/mapa/relieve.mjs): npm test
// Usan un DEM sintético chico, escrito en una carpeta temporal. Nunca tocan public/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { writeArrayBuffer } from 'geotiff';
import sharp from 'sharp';
import { generarRelieve, teselasDelRecorte, codificar, decodificar } from '../relieve.mjs';
import { RECORTE } from '../../../src/lib/capas.ts';

// DEM sintético en grados (EPSG:4326) que cubre el recorte con margen: un plano inclinado,
// 3800 m en el borde oeste y 4800 m en el este. No es ningún terreno real.
async function demSintetico(dir) {
  const [oeste, norte, paso] = [-70.5, -14.8, 0.01];
  const ancho = 230;
  const alto = 230;
  const valores = new Float32Array(ancho * alto);
  for (let f = 0; f < alto; f++) for (let c = 0; c < ancho; c++) valores[f * ancho + c] = 3800 + (1000 * c) / (ancho - 1);
  const buffer = writeArrayBuffer(valores, {
    width: ancho,
    height: alto,
    SampleFormat: [3],
    BitsPerSample: [32],
    ModelPixelScale: [paso, paso, 0],
    ModelTiepoint: [0, 0, 0, oeste, norte, 0],
    GTModelTypeGeoKey: 2,
    GTRasterTypeGeoKey: 1,
    GeographicTypeGeoKey: 4326,
  });
  const archivo = path.join(dir, 'dem-sintetico.tif');
  await writeFile(archivo, Buffer.from(buffer));
  return { archivo, altura: (lon) => 3800 + (1000 * ((lon - oeste) / paso - 0.5)) / (ancho - 1) };
}

test('codifica y decodifica alturas en «terrarium»', () => {
  const rgb = codificar(Float32Array.from([3810.3, -5, 6542.75]), 0.25);
  assert.equal(decodificar(rgb[0], rgb[1], rgb[2]), 3810.25);
  assert.equal(decodificar(rgb[3], rgb[4], rgb[5]), -5);
  assert.equal(decodificar(rgb[6], rgb[7], rgb[8]), 6542.75);
});

test('cuenta las teselas que tocan el recorte', () => {
  assert.equal(teselasDelRecorte(7).length, 4); // el recorte cruza un borde de tesela en cada eje
  assert.ok(teselasDelRecorte(12).length > 500);
});

test('genera teselas y relieve.json dentro del recorte, y no pisa sin --reemplazar', async () => {
  const base = await mkdtemp(path.join(os.tmpdir(), 'relieve-'));
  const salida = path.join(base, 'relieve');
  const { archivo, altura } = await demSintetico(base);
  const r = await generarRelieve({ entradas: [archivo], salida, zoomMin: 7, zoomMax: 9 });
  const esperadas = [7, 8, 9].reduce((n, z) => n + teselasDelRecorte(z).length, 0);
  assert.equal(r.teselas, esperadas);

  const manifiesto = JSON.parse(await readFile(path.join(salida, 'relieve.json'), 'utf8'));
  assert.equal(manifiesto.codificacion, 'terrarium');
  assert.deepEqual(manifiesto.recorte, RECORTE);
  assert.deepEqual(manifiesto.archivos, ['dem-sintetico.tif']);

  // Un píxel del medio de una tesela del zoom 9: la altura sale del plano inclinado.
  const t = teselasDelRecorte(9)[Math.floor(teselasDelRecorte(9).length / 2)];
  const png = path.join(salida, '9', String(t.x), `${t.y}.png`);
  assert.ok(existsSync(png));
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 256);
  const i = (128 * 256 + 128) * info.channels;
  const lon = ((t.x + 128.5 / 256) / 2 ** 9) * 360 - 180;
  const lonRecortada = Math.min(RECORTE.lonMax, Math.max(RECORTE.lonMin, lon));
  assert.ok(Math.abs(decodificar(data[i], data[i + 1], data[i + 2]) - altura(lonRecortada)) < 1.5);

  await assert.rejects(generarRelieve({ entradas: [archivo], salida, zoomMin: 7, zoomMax: 7 }), /--reemplazar/);
  await rm(base, { recursive: true });
});

test('frena un GeoTIFF que no está en grados', async () => {
  const base = await mkdtemp(path.join(os.tmpdir(), 'relieve-'));
  const buffer = writeArrayBuffer(new Float32Array(4), {
    width: 2, height: 2, SampleFormat: [3], BitsPerSample: [32],
    ModelPixelScale: [30, 30, 0], ModelTiepoint: [0, 0, 0, 500000, 8300000, 0],
    GTModelTypeGeoKey: 1, ProjectedCSTypeGeoKey: 32719,
  });
  const archivo = path.join(base, 'utm.tif');
  await writeFile(archivo, Buffer.from(buffer));
  await assert.rejects(generarRelieve({ entradas: [archivo], salida: path.join(base, 's'), zoomMin: 7, zoomMax: 7 }), /EPSG:4326/);
  await rm(base, { recursive: true });
});
