// Regla 6 sobre el sitio construido (dist/): ninguna ficha `aproximada` u `oculta` deja salir sus
// coordenadas. Se corre después de `npm run build:prueba`, que trae las fichas de ejemplo.
// - Su página propia (/mapa/<id>/) no lleva ninguna coordenada del lago: ni en el texto, ni en
//   los metadatos, ni en la tarjeta para compartir.
// - /mapa/ sólo lleva coordenadas en los datos del mapa, y ahí ningún par [lon, lat] del archivo
//   de la ficha (punto o vértice de su geometría): sólo las posiciones ya desplazadas.
// - Ningún JSON del sitio lleva un par de coordenadas del archivo de una ficha protegida.
// No abre el navegador: lee los archivos.
import { test, expect } from '@playwright/test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { slugificar } from '../src/lib/slug';
import { RECORTE } from '../src/lib/capas';

const DIST = join(process.cwd(), 'dist');
const LUGARES = join(process.cwd(), 'src/content/lugares');

type Par = [number, number]; // [lon, lat]

// Fichas protegidas, con las coordenadas que tienen en el repositorio.
function protegidas() {
  const lista: { id: string; precision: string; pares: Par[] }[] = [];
  for (const archivo of readdirSync(LUGARES).filter((a) => a.endsWith('.md'))) {
    const texto = readFileSync(join(LUGARES, archivo), 'utf8');
    const fm = parse(texto.split(/^---$/m)[1]) ?? {};
    const precision = fm.precision ?? 'exacta';
    if (precision === 'exacta') continue;
    const pares: Par[] = [];
    if (typeof fm.lat === 'number' && typeof fm.lon === 'number') pares.push([fm.lon, fm.lat]);
    if (fm.geometria) {
      const gj = JSON.parse(readFileSync(join(LUGARES, fm.geometria), 'utf8'));
      const g = gj.type === 'Feature' ? gj.geometry : gj.type === 'FeatureCollection' ? gj.features[0].geometry : gj;
      const recorrer = (v: unknown): void => {
        if (Array.isArray(v) && v.length >= 2 && typeof v[0] === 'number') pares.push([v[0], v[1] as number]);
        else if (Array.isArray(v)) v.forEach(recorrer);
      };
      recorrer(g.coordinates);
    }
    lista.push({ id: fm.slug ? slugificar(fm.slug) : slugificar(archivo.replace(/\.md$/, '')), precision, pares });
  }
  return lista;
}

// Números que parecen una coordenada del lago (latitud o longitud dentro del recorte, con decimales).
function coordenadasEnTexto(texto: string) {
  return [...texto.matchAll(/-\s?(\d{1,3}[.,]\d+)/g)]
    .map((m) => -Number(m[1].replace(',', '.')))
    .filter((n) => (n >= RECORTE.latMin - 0.5 && n <= RECORTE.latMax + 0.5) || (n >= RECORTE.lonMin - 0.5 && n <= RECORTE.lonMax + 0.5));
}

// Todos los pares [lon, lat] de un valor JSON (listas de dos números u objetos con lat y lon).
function paresEnJson(v: unknown, salida: Par[] = []): Par[] {
  if (Array.isArray(v)) {
    if (v.length >= 2 && typeof v[0] === 'number' && typeof v[1] === 'number') salida.push([v[0], v[1]]);
    else v.forEach((x) => paresEnJson(x, salida));
  } else if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.lat === 'number' && typeof o.lon === 'number') salida.push([o.lon, o.lat]);
    Object.values(o).forEach((x) => paresEnJson(x, salida));
  }
  return salida;
}

const mismo = (a: Par, b: Par) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;

function archivos(dir: string, ext: RegExp): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? archivos(join(dir, e.name), ext) : ext.test(e.name) ? [join(dir, e.name)] : [],
  );
}

test.describe('regla 6 en el sitio construido', () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== 'escritorio', 'lee archivos: basta con una pasada');
    test.skip(!existsSync(DIST), 'falta construir el sitio');
  });

  test('la página propia de una ficha aproximada u oculta no lleva coordenadas', () => {
    const revisadas = [];
    for (const f of protegidas()) {
      const pagina = join(DIST, 'mapa', f.id, 'index.html');
      if (!existsSync(pagina)) continue; // borrador en `npm run build`: no existe
      revisadas.push(f.id);
      expect(coordenadasEnTexto(readFileSync(pagina, 'utf8')), `/mapa/${f.id}/`).toEqual([]);
    }
    // En la construcción de prueba están las tres fichas protegidas de ejemplo.
    if (existsSync(join(DIST, 'mapa', 'ejemplo-clima'))) {
      expect(revisadas.sort()).toEqual(expect.arrayContaining(['ejemplo-arqueologia', 'ejemplo-cultura', 'ejemplo-poligono']));
    }
  });

  test('/mapa/ sólo lleva posiciones desplazadas de las fichas protegidas', () => {
    const pagina = join(DIST, 'mapa', 'index.html');
    test.skip(!existsSync(pagina));
    const html = readFileSync(pagina, 'utf8');
    const json = html.match(/<script type="application\/json" id="datos-mapa">([\s\S]*?)<\/script>/)?.[1];
    expect(json, 'los datos del mapa').toBeTruthy();
    const datos = JSON.parse(json!);
    const enDatos = paresEnJson(datos.lugares);
    const numeros = (v: unknown): number[] => (typeof v === 'number' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(numeros) : []);
    for (const f of protegidas()) {
      for (const par of f.pares) expect(enDatos.some((p) => mismo(p, par)), `${f.id}: ${par}`).toBe(false);
      // Tampoco por separado: la entrada de la ficha no lleva a la vez la lat y la lon del archivo.
      const entrada = numeros(datos.lugares.find((l: { id: string }) => l.id === f.id));
      for (const [lon, lat] of f.pares) expect(entrada.includes(lon) && entrada.includes(lat), `${f.id}: ${lon} y ${lat} sueltos`).toBe(false);
      if (f.precision === 'oculta') expect(datos.lugares.some((l: { id: string }) => l.id === f.id), `${f.id} en el mapa`).toBe(false);
    }
    // Fuera de los datos, ninguna coordenada en el HTML.
    expect(coordenadasEnTexto(html.replace(json!, ''))).toEqual([]);
  });

  test('ningún JSON del sitio lleva coordenadas de una ficha protegida', () => {
    const pares = protegidas().flatMap((f) => f.pares.map((p) => ({ id: f.id, p })));
    for (const archivo of archivos(DIST, /\.json$/i)) {
      const enArchivo = paresEnJson(JSON.parse(readFileSync(archivo, 'utf8')));
      for (const { id, p } of pares) expect(enArchivo.some((q) => mismo(q, p)), `${archivo}: ${id}`).toBe(false);
    }
  });
});
