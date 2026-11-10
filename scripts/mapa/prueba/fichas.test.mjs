// Tipos de ficha de los lugares (src/lib/fichas.ts): npm test
// - los controles compartidos (sitio sagrado, contacto sin teléfonos, consentimiento);
// - el puente con Obsidian (scripts/obsidian/controles.mjs), con los mismos casos;
// - el esquema de Astro (src/content.config.ts): una copia del proyecto en una carpeta temporal,
//   con una sola ficha, y `astro sync`, que frena si el esquema no la acepta.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { erroresFicha, motivoSensible, problemaContacto, normalizarFicha, pareceTelefono } from '../../../src/lib/fichas.ts';
import { validarFrontmatter } from '../../obsidian/controles.mjs';
import { hayArtesanosPublicados } from '../../../src/lib/artesanos-publicados.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const ejecutar = promisify(execFile);

// Nota de la bóveda para el puente (lo que lee validarFrontmatter: el frontmatter ya parseado).
const lugar = (extra) => ({
  titulo: 'Relleno',
  capa: 'cultura',
  resumen: 'Relleno.',
  marcador: '[DATO PROPIO]',
  lat: -15.8,
  lon: -69.4,
  precision: 'aproximada',
  draft: true,
  ...extra,
});
const erroresPuente = (extra) => validarFrontmatter('lugar', lugar(extra)).errores.join('\n');

// --- Controles compartidos ---------------------------------------------------------------------

test('normaliza el tipo de ficha', () => {
  assert.equal(normalizarFicha('Sitio sagrado'), 'sitio-sagrado');
  assert.equal(normalizarFicha('sitio_sagrado'), 'sitio-sagrado');
  assert.equal(normalizarFicha('Agencia de turismo comunitario'), 'agencia-turismo-comunitario');
});

test('el sitio sagrado es sensible aunque no lo diga; el sitio, sólo por capa o por marca', () => {
  assert.equal(motivoSensible({ ficha: 'sitio-sagrado', capa: 'cultura' }), 'ficha de sitio sagrado');
  assert.equal(motivoSensible({ ficha: 'sitio', capa: 'cultura' }), null);
  assert.equal(motivoSensible({ ficha: 'sitio', capa: 'arqueologia' }), 'capa Arqueología');
  assert.equal(motivoSensible({ ficha: 'sitio', capa: 'cultura', sensible: true }), 'marcado con «sensible: true»');
});

test('sitio sagrado con «sensible: false»: frena', () => {
  const e = erroresFicha({ ficha: 'sitio-sagrado', sensible: false });
  assert.match(e.map((x) => x.mensaje).join(), /siempre sensible y no admite «sensible: false»/);
  assert.deepEqual(erroresFicha({ ficha: 'sitio', sensible: false }), []);
});

test('contacto: frena teléfonos, WhatsApp y esquemas que no son web ni correo', () => {
  for (const url of ['tel:+59122123456', 'https://wa.me/59171234567', 'https://api.whatsapp.com/send?phone=59171234567', 'sms:71234567', 'geo:-15.8,-69.4']) {
    assert.ok(problemaContacto({ texto: 'Escribir', url }), url);
  }
  assert.ok(problemaContacto({ texto: 'Llamar al 2 2123456', url: 'https://example.org/' }));
  assert.ok(problemaContacto({ texto: '+591 71234567', url: 'https://example.org/' }));
  assert.ok(problemaContacto({ texto: 'Formulario', url: 'https://example.org/?telefono=71234567' }));
  // Una red social con un número largo en la dirección no es un teléfono.
  assert.equal(problemaContacto({ texto: 'Página', url: 'https://www.facebook.com/profile.php?id=100012345678901' }), null);
  assert.equal(problemaContacto({ texto: 'Formulario de pedidos', url: 'https://example.org/formulario' }), null);
  assert.equal(problemaContacto({ texto: 'Correo', url: 'mailto:taller@example.org' }), null);
  assert.equal(pareceTelefono('Abierto desde 2019'), false);
});

test('consentimiento: obligatorio para publicar una ficha de artesanía, emprendimiento o agencia', () => {
  for (const ficha of ['artesano', 'emprendimiento', 'agencia-turismo-comunitario']) {
    assert.match(erroresFicha({ ficha, draft: false }).map((x) => x.mensaje).join(), /Falta «consentimiento»/, ficha);
    assert.deepEqual(erroresFicha({ ficha, draft: true }), [], `${ficha} en borrador`);
    assert.deepEqual(erroresFicha({ ficha, draft: false, consentimiento: '2026-11-10' }), [], `${ficha} con consentimiento`);
  }
});

test('un campo de otro tipo de ficha frena', () => {
  assert.match(erroresFicha({ ficha: 'municipio', contacto: [{ texto: 'x', url: 'https://example.org/' }] })[0].mensaje, /«contacto» va sólo en fichas/);
  assert.match(erroresFicha({ nombre_cientifico: 'Genus' })[0].mensaje, /no dice «ficha»/);
});

// --- Puente con Obsidian ---------------------------------------------------------------------------

test('puente: sitio sagrado exacto, con geometría o con «sensible: false» frenan; aproximado sale', () => {
  assert.match(erroresPuente({ ficha: 'sitio-sagrado', precision: 'exacta' }), /lugar sensible \(ficha de sitio sagrado\) y tiene «precision: exacta»/);
  assert.match(erroresPuente({ ficha: 'sitio-sagrado', lat: undefined, lon: undefined, geometria: '[[zona.geojson]]' }), /ficha de sitio sagrado\) y no puede llevar línea ni polígono/);
  assert.match(erroresPuente({ ficha: 'sitio-sagrado', sensible: false }), /no admite «sensible: false»/);
  const { datos, errores } = validarFrontmatter('lugar', lugar({ ficha: 'Sitio sagrado', lat: -15.71, lon: -69.52, consulta: { con: 'Nombre de relleno', fecha: '2026-11-10' } }));
  assert.deepEqual(errores, []);
  assert.equal(datos.ficha, 'sitio-sagrado');
  // Con quién se habló queda en la bóveda: el repositorio es público.
  assert.deepEqual(datos.consulta, { fecha: '2026-11-10' });
});

test('puente: el sitio no es sensible por defecto', () => {
  assert.equal(erroresPuente({ ficha: 'sitio', precision: 'exacta' }), '');
  assert.match(erroresPuente({ ficha: 'sitio', capa: 'arqueologia', precision: 'exacta' }), /capa Arqueología/);
});

test('puente: contacto con teléfono y ficha publicada sin consentimiento frenan', () => {
  const contacto = [{ texto: 'WhatsApp', url: 'https://wa.me/59171234567', verificado: '2026-11-10' }];
  assert.match(erroresPuente({ ficha: 'artesano', capa: 'emprendimientos-comunitarios', precision: 'exacta', contacto }), /WhatsApp/);
  assert.match(erroresPuente({ ficha: 'emprendimiento', capa: 'emprendimientos-comunitarios', precision: 'exacta', draft: false }), /Falta «consentimiento»/);
  const { datos, errores } = validarFrontmatter('lugar', lugar({
    ficha: 'artesano', capa: 'emprendimientos-comunitarios', precision: 'exacta', draft: false,
    oficio: 'Relleno', comunidad: 'Relleno', consentimiento: '2026-11-10',
    contacto: [{ texto: 'Página', url: 'https://example.org/', verificado: '2026-11-10' }],
  }));
  assert.deepEqual(errores, []);
  assert.equal(datos.consentimiento, '2026-11-10');
  assert.equal(datos.contacto.length, 1);
});

test('puente: «ficha» que no existe frena', () => {
  assert.match(erroresPuente({ ficha: 'tienda' }), /«ficha: tienda» no existe/);
});

// --- Sitemap de /mapa/artesanos/ -------------------------------------------------------------------

test('sitemap: /mapa/artesanos/ entra sólo con una ficha de esos tipos publicada', async () => {
  const base = await mkdtemp(path.join(os.tmpdir(), 'artesanos-'));
  const md = (fm) => `---\n${fm}\n---\n\nRelleno.\n`;
  await writeFile(path.join(base, 'a.md'), md('ficha: artesano\ndraft: true'));
  await writeFile(path.join(base, 'b.md'), md('ficha: sitio\ndraft: false'));
  assert.equal(hayArtesanosPublicados(base), false);
  await writeFile(path.join(base, 'c.md'), md('ficha: Agencia de turismo comunitario\ndraft: false'));
  assert.equal(hayArtesanosPublicados(base), true);
  await rm(base, { recursive: true });
});

// --- Esquema de Astro --------------------------------------------------------------------------------

// Copia mínima del proyecto con una sola ficha en src/content/lugares/ y `astro sync`.
async function sincronizar(frontmatter) {
  const base = await mkdtemp(path.join(os.tmpdir(), 'esquema-lugares-'));
  for (const a of ['astro.config.mjs', 'sitio.config.mjs', 'tsconfig.json', 'package.json']) await cp(path.join(RAIZ, a), path.join(base, a));
  await cp(path.join(RAIZ, 'src'), path.join(base, 'src'), {
    recursive: true,
    filter: (origen) => !origen.startsWith(path.join(RAIZ, 'src/content/lugares/')) || origen.includes('/geometrias'),
  });
  await mkdir(path.join(base, 'src/content/lugares/geometrias'), { recursive: true });
  await writeFile(path.join(base, 'src/content/lugares/geometrias/zona.geojson'), '{"type":"Polygon","coordinates":[[[-69.6,-15.9],[-69.5,-15.9],[-69.5,-16.0],[-69.6,-15.9]]]}');
  await writeFile(path.join(base, 'src/content/lugares/prueba.md'), `---\n${frontmatter}\n---\n\nRelleno.\n`);
  await symlink(path.join(RAIZ, 'node_modules'), path.join(base, 'node_modules'));
  try {
    await ejecutar(process.execPath, [path.join(RAIZ, 'node_modules/astro/bin/astro.mjs'), 'sync'], { cwd: base, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } });
    return { ok: true, salida: '' };
  } catch (e) {
    return { ok: false, salida: `${e.stdout}\n${e.stderr}` };
  } finally {
    await rm(base, { recursive: true, force: true });
  }
}

const SAGRADO = 'titulo: "Relleno"\ncapa: cultura\nficha: sitio-sagrado\nresumen: "Relleno."\nmarcador: "[DATO PROPIO]"\ndraft: true';

test('esquema: sitio sagrado exacto, con geometría o con «sensible: false» frenan el build; aproximado pasa', { timeout: 120_000 }, async () => {
  const exacta = await sincronizar(`${SAGRADO}\nlat: -15.71\nlon: -69.52\nprecision: exacta`);
  assert.equal(exacta.ok, false);
  assert.match(exacta.salida, /ficha de sitio sagrado\) y tiene «precision: exacta»/);

  const geometria = await sincronizar(`${SAGRADO}\ngeometria: geometrias/zona.geojson\nprecision: aproximada`);
  assert.equal(geometria.ok, false);
  assert.match(geometria.salida, /ficha de sitio sagrado\) y no puede llevar línea ni polígono/);

  const desactivado = await sincronizar(`${SAGRADO}\nlat: -15.71\nlon: -69.52\nprecision: aproximada\nsensible: false`);
  assert.equal(desactivado.ok, false);
  assert.match(desactivado.salida, /no admite «sensible: false»/);

  const valido = await sincronizar(`${SAGRADO}\nlat: -15.71\nlon: -69.52\nprecision: aproximada`);
  assert.equal(valido.ok, true, valido.salida);
});

test('esquema: contacto con teléfono y artesanía publicada sin consentimiento frenan el build', { timeout: 120_000 }, async () => {
  const base = 'titulo: "Relleno"\ncapa: emprendimientos-comunitarios\nficha: artesano\nlat: -15.66\nlon: -69.33\nresumen: "Relleno."\nmarcador: "[DATO PROPIO]"';
  const telefono = await sincronizar(`${base}\ndraft: true\ncontacto:\n  - texto: "Llamar"\n    url: "tel:+59171234567"\n    verificado: 2026-11-10`);
  assert.equal(telefono.ok, false);
  assert.match(telefono.salida, /es un teléfono \(tel:\)/);
  const sinConsentimiento = await sincronizar(`${base}\ndraft: false`);
  assert.equal(sinConsentimiento.ok, false);
  assert.match(sinConsentimiento.salida, /Falta «consentimiento»/);
});
