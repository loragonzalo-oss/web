// Pruebas del puente con Obsidian: npm test
// Usan la bóveda de relleno de esta carpeta, copiada a una carpeta temporal,
// y un repositorio temporal vacío. Nunca tocan src/content del repositorio real.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { exportar, RAIZ_REPO, REGISTRO } from '../exportar.mjs';
import { convertirCuerpo } from '../convertir.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const BOVEDA = path.join(AQUI, 'boveda');

async function preparar() {
  const base = await mkdtemp(path.join(os.tmpdir(), 'puente-obsidian-'));
  const boveda = path.join(base, 'boveda');
  const repo = path.join(base, 'repo');
  await cp(BOVEDA, boveda, { recursive: true });
  await mkdir(repo);
  return { base, boveda, repo, leer: (rel) => readFile(path.join(repo, rel), 'utf8') };
}

const frenada = (r, nota) => r.frenadas.find((f) => f.nota === nota);
const estado = (r, destino) => r.archivos.find((a) => a.destino === destino)?.estado;

test('exporta cada tipo a su carpeta y deja en la bóveda lo que no se publica', async () => {
  const { base, boveda, repo } = await preparar();
  const r = await exportar({ boveda, repo });
  for (const destino of [
    'src/content/blog/entrada-de-prueba.md',
    'src/content/blog/borrador-de-prueba.md',
    'src/content/ensayos/ensayo-de-prueba.md',
    'src/content/lugares/lugar-exacto-de-prueba.md',
    'src/content/lugares/lugar-sensible-aproximado.md',
  ]) {
    assert.equal(estado(r, destino), 'nuevo', destino);
  }
  assert.ok(!existsSync(path.join(repo, 'src/content/blog/nota-privada.md')));
  assert.equal(r.marcadas, 11);
  assert.ok(existsSync(path.join(repo, REGISTRO)));
  await rm(base, { recursive: true });
});

test('convierte wikilinks: enlace si la nota se publica, texto plano si no', async () => {
  const { base, boveda, repo, leer } = await preparar();
  await exportar({ boveda, repo });
  const md = await leer('src/content/blog/entrada-de-prueba.md');
  assert.match(md, /\[Ensayo de prueba\]\(\.\.\/\.\.\/ensayos\/ensayo-de-prueba\/\)/);
  assert.match(md, /\[un ensayo\]\(\.\.\/\.\.\/ensayos\/ensayo-de-prueba\/\)/);
  assert.match(md, /\(\.\.\/\.\.\/ensayos\/ensayo-de-prueba\/#segunda-parte\)/);
  assert.match(md, /\[el ensayo\]\(\.\.\/\.\.\/ensayos\/ensayo-de-prueba\/\)/);
  assert.match(md, /\[Lugar exacto de prueba\]\(\.\.\/\.\.\/mapa\/#lugar-lugar-exacto-de-prueba\)/);
  assert.match(md, /una nota privada: Nota privada\./);
  assert.match(md, /un borrador: Borrador de prueba\./);
  assert.match(md, /Enlace a nada: No existe\./);
  assert.match(md, /\[ejemplo\]\(https:\/\/example\.org\/\)/);
  assert.doesNotMatch(md.split('```')[0], /\[\[(?!en código)/);

  const lugar = await leer('src/content/lugares/lugar-exacto-de-prueba.md');
  assert.match(lugar, /\[Lugar sensible aproximado\]\(#lugar-lugar-sensible-aproximado\)/);
  assert.match(lugar, /relacionados:\n {2}- blog\/entrada-de-prueba\n/);
  assert.doesNotMatch(lugar, /Nota privada/);
  await rm(base, { recursive: true });
});

test('un enlace a una nota frenada queda como texto, nunca roto', async () => {
  const { base, boveda, repo, leer } = await preparar();
  const ruta = path.join(boveda, '200 Ensayos/Ensayo de prueba.md');
  await writeFile(ruta, `${await readFile(ruta, 'utf8')}\nVer [[Entrada con pendiente]].\n`);
  await exportar({ boveda, repo });
  assert.match(await leer('src/content/ensayos/ensayo-de-prueba.md'), /Ver Entrada con pendiente\./);
  await rm(base, { recursive: true });
});

test('copia las imágenes y las pasa a markdown estándar', async () => {
  const { base, boveda, repo, leer } = await preparar();
  await exportar({ boveda, repo });
  const md = await leer('src/content/blog/entrada-de-prueba.md');
  assert.match(md, /!\[Texto alternativo de prueba\]\(\.\/imagenes\/entrada-de-prueba\/imagen-de-prueba\.png\)/);
  assert.match(md, /^imagen: \.\/imagenes\/entrada-de-prueba\/imagen-de-prueba\.png$/m);
  const original = await readFile(path.join(boveda, '900 Adjuntos/Imagen de prueba.png'));
  const copia = await readFile(path.join(repo, 'src/content/blog/imagenes/entrada-de-prueba/imagen-de-prueba.png'));
  assert.deepEqual(copia, original);
  await rm(base, { recursive: true });
});

test('una imagen que no está en la bóveda frena la nota', async () => {
  const { base, boveda, repo } = await preparar();
  const ruta = path.join(boveda, '200 Ensayos/Ensayo de prueba.md');
  await writeFile(ruta, `${await readFile(ruta, 'utf8')}\n![[no-existe.png]]\n`);
  const r = await exportar({ boveda, repo });
  assert.match(frenada(r, '200 Ensayos/Ensayo de prueba.md').motivos.join(), /no-existe\.png» no está en la bóveda/);
  await rm(base, { recursive: true });
});

test('callouts a bloque citado, comentarios fuera, código intacto', async () => {
  const { base, boveda, repo, leer } = await preparar();
  await exportar({ boveda, repo });
  const md = await leer('src/content/blog/entrada-de-prueba.md');
  assert.match(md, /^> \*\*Título del aviso\*\*\n>\n> Contenido del aviso de relleno\.$/m);
  assert.match(md, /^> Aviso sin título\.$/m);
  assert.doesNotMatch(md, /\[!note\]|\[!tip\]/);
  assert.doesNotMatch(md, /Comentario|comentario en la misma línea|PENDIENTE/);
  assert.match(md, /Texto antes {2}y después\./);
  assert.match(md, /identificador de bloque\.$/m);
  assert.match(md, /`\[\[en código en línea\]\]` y `%% tampoco %%`/);
  assert.match(md, /```\n\[\[en un bloque de código\]\]\n%% tampoco se toca %%\n```/);
  // Lo que no está en el esquema del sitio no sale de la bóveda.
  assert.doesNotMatch(md, /^(publicar|tipo|tags):/m);
  await rm(base, { recursive: true });
});

test('un %% sin cierre comenta hasta el final, como en Obsidian', () => {
  const ctx = { enlazar: (d) => d, incrustar: (d) => d, imagenMarkdown: (d) => d, enlaceMarkdown: () => null };
  assert.equal(convertirCuerpo('Visible.\n\n%% oculto\n\n```\ncódigo\n```\nmás oculto', ctx), 'Visible.\n');
});

test('frena el frontmatter incompleto', async () => {
  const { base, boveda, repo } = await preparar();
  const r = await exportar({ boveda, repo });
  const motivos = frenada(r, '200 Ensayos/Ensayo incompleto.md').motivos.join('\n');
  assert.match(motivos, /Falta «resumen»/);
  assert.match(motivos, /«fecha» no es una fecha válida/);
  assert.ok(!existsSync(path.join(repo, 'src/content/ensayos/ensayo-incompleto.md')));
  await rm(base, { recursive: true });
});

test('regla 6: frena lugares sensibles con coordenadas de más', async () => {
  const { base, boveda, repo, leer } = await preparar();
  const r = await exportar({ boveda, repo });
  const motivos = (nota) => frenada(r, `300 Lugares/${nota}.md`)?.motivos.join('\n') ?? '';
  assert.match(motivos('Lugar sensible con decimales'), /lat lleva como máximo dos decimales/);
  assert.match(motivos('Lugar sensible exacto'), /lugar sensible \(marcado con «sensible: true»\)/);
  assert.match(motivos('Lugar oculto con coordenadas'), /no puede llevar lat ni lon/);
  assert.match(motivos('Lugar oculto con coordenadas en el texto'), /coordenadas con más de dos decimales/);
  // El aproximado se exporta, sin la ubicación del comentario %% … %%.
  const aprox = await leer('src/content/lugares/lugar-sensible-aproximado.md');
  assert.doesNotMatch(aprox, /15\.78123|69\.40321/);
  // Ninguna coordenada fina llegó al repositorio temporal.
  for (const a of r.archivos.filter((x) => x.destino.endsWith('.md'))) {
    assert.doesNotMatch(await leer(a.destino), /-1[56]\.\d{3,}.*precision: (aproximada|oculta)/s);
  }
  await rm(base, { recursive: true });
});

test('la capa Arqueología es sensible aunque no lo diga la nota', async () => {
  const { base, boveda, repo } = await preparar();
  const ruta = path.join(boveda, '300 Lugares/Lugar sensible aproximado.md');
  await writeFile(ruta, (await readFile(ruta, 'utf8')).replace('precision: aproximada', 'precision: exacta'));
  const r = await exportar({ boveda, repo });
  assert.match(frenada(r, '300 Lugares/Lugar sensible aproximado.md').motivos.join(), /capa Arqueología/);
  await rm(base, { recursive: true });
});

test('[PENDIENTE] y [VERIFICAR] frenan salvo borrador o --forzar', async () => {
  const { base, boveda, repo } = await preparar();
  let r = await exportar({ boveda, repo, simular: true });
  assert.match(frenada(r, '100 Blog/Entrada con pendiente.md').motivos.join(), /\[PENDIENTE: dato de relleno\]/);
  assert.equal(frenada(r, '100 Blog/Borrador de prueba.md'), undefined);
  // «marcador: "[VERIFICAR]"» de un lugar es un valor válido y no frena.
  assert.equal(frenada(r, '300 Lugares/Lugar sensible aproximado.md'), undefined);
  r = await exportar({ boveda, repo, forzar: true });
  assert.equal(frenada(r, '100 Blog/Entrada con pendiente.md'), undefined);
  assert.equal(estado(r, 'src/content/blog/entrada-con-pendiente.md'), 'nuevo');
  // --forzar no salta la regla 6.
  assert.ok(frenada(r, '300 Lugares/Lugar sensible exacto.md'));
  await rm(base, { recursive: true });
});

test('--simular no escribe nada', async () => {
  const { base, boveda, repo } = await preparar();
  const r = await exportar({ boveda, repo, simular: true });
  assert.ok(r.archivos.length > 0);
  assert.ok(!existsSync(path.join(repo, 'src')));
  assert.ok(!existsSync(path.join(repo, REGISTRO)));
  await rm(base, { recursive: true });
});

test('actualiza sin preguntar lo que no se tocó en el repositorio', async () => {
  const { base, boveda, repo, leer } = await preparar();
  await exportar({ boveda, repo });
  const ruta = path.join(boveda, '200 Ensayos/Ensayo de prueba.md');
  await writeFile(ruta, (await readFile(ruta, 'utf8')).replace('Lorem ipsum.', 'Lorem ipsum corregido.'));
  let preguntas = 0;
  const r = await exportar({ boveda, repo, preguntar: async () => (preguntas++, false) });
  assert.equal(preguntas, 0);
  assert.equal(estado(r, 'src/content/ensayos/ensayo-de-prueba.md'), 'actualizado');
  assert.equal(estado(r, 'src/content/blog/entrada-de-prueba.md'), 'sin cambios');
  assert.match(await leer('src/content/ensayos/ensayo-de-prueba.md'), /Lorem ipsum corregido\./);
  await rm(base, { recursive: true });
});

test('no pisa un archivo cambiado en el repositorio sin permiso', async () => {
  const { base, boveda, repo, leer } = await preparar();
  await exportar({ boveda, repo });
  const destino = 'src/content/ensayos/ensayo-de-prueba.md';
  const editado = `${await leer(destino)}\nCorrección hecha en GitHub.\n`;
  await writeFile(path.join(repo, destino), editado);

  const preguntados = [];
  let r = await exportar({ boveda, repo, preguntar: async (d) => (preguntados.push(d), false) });
  assert.deepEqual(preguntados, [destino]);
  assert.equal(estado(r, destino), 'cambiado en el repositorio: no se tocó');
  assert.equal(await leer(destino), editado);

  r = await exportar({ boveda, repo, simular: true, preguntar: async () => assert.fail('simular no pregunta') });
  assert.match(estado(r, destino), /preguntaría/);

  r = await exportar({ boveda, repo, preguntar: async () => true });
  assert.equal(estado(r, destino), 'pisado con permiso');
  assert.doesNotMatch(await leer(destino), /Corrección hecha en GitHub/);
  await rm(base, { recursive: true });
});

test('tampoco pisa un archivo que el script no creó', async () => {
  const { base, boveda, repo, leer } = await preparar();
  const destino = 'src/content/blog/entrada-de-prueba.md';
  await mkdir(path.join(repo, 'src/content/blog'), { recursive: true });
  await writeFile(path.join(repo, destino), 'escrito a mano\n');
  const r = await exportar({ boveda, repo });
  assert.equal(estado(r, destino), 'cambiado en el repositorio: no se tocó');
  assert.equal(await leer(destino), 'escrito a mano\n');
  await rm(base, { recursive: true });
});

test('nunca borra: una nota despublicada queda en el repositorio y se avisa', async () => {
  const { base, boveda, repo } = await preparar();
  await exportar({ boveda, repo });
  const ruta = path.join(boveda, '200 Ensayos/Ensayo de prueba.md');
  await writeFile(ruta, (await readFile(ruta, 'utf8')).replace('publicar: true', 'publicar: false'));
  const r = await exportar({ boveda, repo });
  assert.ok(existsSync(path.join(repo, 'src/content/ensayos/ensayo-de-prueba.md')));
  assert.deepEqual(r.huerfanos, ['src/content/ensayos/ensayo-de-prueba.md']);
  await rm(base, { recursive: true });
});

test('una nota exportada antes y frenada ahora no figura como despublicada', async () => {
  const { base, boveda, repo } = await preparar();
  await exportar({ boveda, repo });
  const ruta = path.join(boveda, '200 Ensayos/Ensayo de prueba.md');
  await writeFile(ruta, `${await readFile(ruta, 'utf8')}\n[PENDIENTE: relleno]\n`);
  const r = await exportar({ boveda, repo });
  assert.ok(frenada(r, '200 Ensayos/Ensayo de prueba.md'));
  assert.deepEqual(r.huerfanos, []);
  await rm(base, { recursive: true });
});

test('se niega a usar una bóveda que esté dentro del repositorio', async () => {
  await assert.rejects(exportar({ boveda: BOVEDA, simular: true }), /La bóveda está dentro del repositorio/);
});

test('la orden de terminal con --simular: informa, no escribe y sale con error si hay notas frenadas', async () => {
  const { base, boveda } = await preparar();
  const registroAntes = existsSync(path.join(RAIZ_REPO, REGISTRO));
  const correr = promisify(execFile);
  const error = await correr(process.execPath, [path.join(AQUI, '../desde-obsidian.mjs'), boveda, '--simular']).catch((e) => e);
  assert.equal(error.code, 1);
  assert.match(error.stdout, /SIMULACIÓN: no se escribió nada/);
  assert.match(error.stdout, /FRENADAS: 6 nota\(s\)/);
  assert.match(error.stdout, /src\/content\/blog\/entrada-de-prueba\.md {2}\(se crearía\)/);
  assert.ok(!existsSync(path.join(RAIZ_REPO, 'src/content/blog/entrada-de-prueba.md')));
  assert.equal(existsSync(path.join(RAIZ_REPO, REGISTRO)), registroAntes);
  await rm(base, { recursive: true });
});

test('series: conserva «serie» y «parte», y frena una «parte» que no es un entero', async () => {
  const { base, boveda, repo, leer } = await preparar();
  const nota = (parte) => `---\npublicar: true\ntipo: blog\ntitulo: "Parte de serie"\nfecha: 2026-10-02\nserie: "Serie de prueba"\nparte: ${parte}\ndraft: false\n---\n\nLorem ipsum.\n`;
  await writeFile(path.join(boveda, '100 Blog', 'Parte de serie.md'), nota(2));
  await writeFile(path.join(boveda, '100 Blog', 'Parte mal numerada.md'), nota('dos'));
  const r = await exportar({ boveda, repo });
  const salida = await leer('src/content/blog/parte-de-serie.md');
  assert.match(salida, /^serie: Serie de prueba$/m);
  assert.match(salida, /^parte: 2$/m);
  assert.match(frenada(r, '100 Blog/Parte mal numerada.md').motivos.join('\n'), /«parte» tiene que ser un número entero/);
  await rm(base, { recursive: true });
});

test('frena una entrada que taparía una dirección del blog (archivo, etiquetas, un número)', async () => {
  const { base, boveda, repo } = await preparar();
  const nota = '---\npublicar: true\ntipo: blog\ntitulo: "Choque"\nfecha: 2026-10-02\ndraft: false\n---\n\nLorem ipsum.\n';
  await writeFile(path.join(boveda, '100 Blog', 'Archivo.md'), nota);
  await writeFile(path.join(boveda, '100 Blog', '2.md'), nota);
  const r = await exportar({ boveda, repo });
  assert.match(frenada(r, '100 Blog/Archivo.md').motivos.join('\n'), /ya la usa el blog/);
  assert.match(frenada(r, '100 Blog/2.md').motivos.join('\n'), /ya la usa el blog/);
  assert.ok(!existsSync(path.join(repo, 'src/content/blog/archivo.md')));
  await rm(base, { recursive: true });
});

test('ensayo en revista: conserva volumen, número, páginas y DOI, y frena los mal escritos', async () => {
  const { base, boveda, repo, leer } = await preparar();
  const nota = (extra) => `---\npublicar: true\ntipo: ensayo\ntitulo: "Ensayo en revista"\nfecha: 2026-10-02\nresumen: "Relleno."\npublicacion: "Revista de Relleno"\n${extra}draft: false\n---\n\nLorem ipsum.\n`;
  await writeFile(path.join(boveda, '200 Ensayos', 'Ensayo en revista.md'), nota('volumen: 12\nnumero: 3\npaginas: 45 - 67\ndoi: "https://doi.org/10.0000/relleno.1"\n'));
  await writeFile(path.join(boveda, '200 Ensayos', 'Ensayo con DOI malo.md'), nota('paginas: "cuarenta"\ndoi: "no-es-un-doi"\n'));
  const r = await exportar({ boveda, repo });
  const salida = await leer('src/content/ensayos/ensayo-en-revista.md');
  assert.match(salida, /^volumen: "?12"?$/m);
  assert.match(salida, /^numero: "?3"?$/m);
  assert.match(salida, /^paginas: "?45–67"?$/m);
  assert.match(salida, /^doi: "?10\.0000\/relleno\.1"?$/m);
  const motivos = frenada(r, '200 Ensayos/Ensayo con DOI malo.md').motivos.join('\n');
  assert.match(motivos, /«paginas» se escribe/);
  assert.match(motivos, /«doi» no es un DOI válido/);
  await rm(base, { recursive: true });
});

// Líneas y polígonos: la nota nombra un .geojson de la bóveda; el script lo revisa con los
// mismos controles que el sitio y lo copia a src/content/lugares/geometrias/.
async function notaGeometria(boveda, nombre, campos, geojson) {
  await mkdir(path.join(boveda, '300 Lugares/geometrias'), { recursive: true });
  const archivo = `${nombre}.geojson`;
  if (geojson) await writeFile(path.join(boveda, '300 Lugares/geometrias', archivo), JSON.stringify(geojson));
  const fm = {
    publicar: 'true', tipo: 'lugar', titulo: `"${nombre}"`, capa: 'ecologia', resumen: '"Relleno."',
    marcador: '"[DATO PROPIO]"', draft: 'true', geometria: `"[[${archivo}]]"`, ...campos,
  };
  const yaml = Object.entries(fm).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${v}`).join('\n');
  await writeFile(path.join(boveda, `300 Lugares/${nombre}.md`), `---\n${yaml}\n---\n\nTexto de relleno.\n`);
}
const linea = (coords) => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } });

test('geometría: copia el GeoJSON y escribe la ruta en la ficha', async () => {
  const { base, boveda, repo, leer } = await preparar();
  await notaGeometria(boveda, 'Linea de prueba', { pais: 'Perú' }, linea([[-69.4, -15.8], [-69.3, -15.85]]));
  const r = await exportar({ boveda, repo });
  assert.equal(frenada(r, '300 Lugares/Linea de prueba.md'), undefined);
  assert.equal(estado(r, 'src/content/lugares/geometrias/linea-de-prueba.geojson'), 'nuevo');
  const md = await leer('src/content/lugares/linea-de-prueba.md');
  assert.match(md, /\ngeometria: geometrias\/linea-de-prueba\.geojson\n/);
  assert.match(md, /\npais: peru\n/);
  assert.doesNotMatch(md, /\nlat:/);
  await rm(base, { recursive: true });
});

test('geometría: frena lo mismo que el sitio (recorte, GeoJSON, lat/lon a la vez, país y regla 6)', async () => {
  const { base, boveda, repo } = await preparar();
  await notaGeometria(boveda, 'Fuera del recorte', {}, linea([[-69.4, -15.8], [-65, -15.85]]));
  await notaGeometria(boveda, 'Punto en geometria', {}, { type: 'Point', coordinates: [-69.4, -15.8] });
  await notaGeometria(boveda, 'Con lat y lon', { lat: -15.8, lon: -69.4 }, linea([[-69.4, -15.8], [-69.3, -15.85]]));
  await notaGeometria(boveda, 'Aproximada fina', { precision: 'aproximada' }, linea([[-69.4123, -15.8], [-69.3, -15.85]]));
  await notaGeometria(boveda, 'Oculta con geometria', { precision: 'oculta' }, linea([[-69.4, -15.8], [-69.3, -15.85]]));
  await notaGeometria(boveda, 'Sin archivo', {}, null);
  await notaGeometria(boveda, 'Pais raro', { pais: 'Chile' }, linea([[-69.4, -15.8], [-69.3, -15.85]]));
  await writeFile(path.join(boveda, '300 Lugares/geometrias/Roto.geojson'), '{ esto no es json');
  await notaGeometria(boveda, 'Roto', {}, null);
  const r = await exportar({ boveda, repo });
  const motivos = (nota) => frenada(r, `300 Lugares/${nota}.md`)?.motivos.join('\n') ?? '';
  assert.match(motivos('Fuera del recorte'), /fuera del recorte del lago/);
  assert.match(motivos('Punto en geometria'), /se escribe con lat y lon/);
  assert.match(motivos('Con lat y lon'), /no las dos cosas/);
  assert.match(motivos('Aproximada fina'), /Regla 6: .*dos decimales/);
  assert.match(motivos('Oculta con geometria'), /Regla 6: con «precision: oculta» la nota no lleva «geometria»/);
  assert.match(motivos('Sin archivo'), /no está en la bóveda/);
  assert.match(motivos('Pais raro'), /«pais: Chile» no existe/);
  assert.match(motivos('Roto'), /no es GeoJSON válido/);
  assert.ok(!existsSync(path.join(repo, 'src/content/lugares/geometrias')));
  await rm(base, { recursive: true });
});

test('regla 6: un lugar sensible no lleva línea ni polígono, y «sensible: true» viaja al repositorio', async () => {
  const { base, boveda, repo, leer } = await preparar();
  const forma = linea([[-69.4, -15.8], [-69.3, -15.85]]);
  await notaGeometria(boveda, 'Sagrado con linea', { sensible: 'true', precision: 'aproximada' }, forma);
  await notaGeometria(boveda, 'Arqueologia con linea', { capa: 'arqueologia', precision: 'aproximada' }, forma);
  await writeFile(
    path.join(boveda, '300 Lugares/Sagrado punto.md'),
    '---\npublicar: true\ntipo: lugar\ntitulo: "Sagrado punto"\ncapa: cultura\nsensible: true\nlat: -15.8\nlon: -69.4\nprecision: aproximada\nresumen: "Relleno."\nmarcador: "[DATO PROPIO]"\ndraft: true\n---\n\nTexto de relleno.\n',
  );
  const r = await exportar({ boveda, repo });
  const motivos = (nota) => frenada(r, `300 Lugares/${nota}.md`)?.motivos.join('\n') ?? '';
  assert.match(motivos('Sagrado con linea'), /lugar sensible \(marcado con «sensible: true»\) y no puede llevar línea ni polígono/);
  assert.match(motivos('Arqueologia con linea'), /lugar sensible \(capa Arqueología\) y no puede llevar línea ni polígono/);
  // Un punto sensible aproximado sale con su marca, para que el sitio también lo controle;
  // un lugar no sensible, sin ella.
  assert.match(await leer('src/content/lugares/sagrado-punto.md'), /\nprecision: aproximada\nsensible: true\n/);
  assert.doesNotMatch(await leer('src/content/lugares/lugar-exacto-de-prueba.md'), /\nsensible:/);
  await rm(base, { recursive: true });
});
