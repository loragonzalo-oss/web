// Pruebas de src/lib/referencia.ts: adónde manda la cita, «Publicado originalmente en» y el
// texto para compartir. npm test (Playwright no las toma: viven fuera de pruebas/)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  destinoCita, esRedSocial, lugaresPublicacion, textoCompartir, hashtag, normalizarTipoLugar,
  enlaceLinkedIn, enlaceX, LARGO_COMPARTIR, errorCuerpoResumen,
} from '../../../src/lib/referencia.ts';

const WEB = 'https://loragonzalo-oss.github.io/web/ensayos/relleno/';
const fecha = (s) => new Date(`${s}T00:00:00Z`);

test('cita: con DOI, el destino es el DOI', () => {
  assert.equal(destinoCita({ publicacion: 'Revista', enlace: 'https://example.org/a', doi: '10.0000/x' }, WEB), 'https://doi.org/10.0000/x');
});

test('cita: sin DOI, el enlace de la publicación formal', () => {
  assert.equal(destinoCita({ publicacion: 'Revista', enlace: 'https://example.org/a' }, WEB), 'https://example.org/a');
});

test('cita: sin publicación formal, la dirección de la web', () => {
  assert.equal(destinoCita({}, WEB), WEB);
  // Un enlace sin publicación formal no es destino.
  assert.equal(destinoCita({ enlace: 'https://example.org/a' }, WEB), WEB);
});

test('cita: una red social nunca es destino, aunque sea el enlace de la publicación formal', () => {
  for (const enlace of ['https://www.linkedin.com/posts/x', 'https://x.com/a/status/1', 'https://es-la.facebook.com/p', 'https://lnkd.in/abc']) {
    assert.equal(esRedSocial(enlace), true, enlace);
    assert.equal(destinoCita({ publicacion: 'LinkedIn', enlace }, WEB), WEB, enlace);
  }
  assert.equal(esRedSocial('https://example.org/revista'), false);
  assert.equal(esRedSocial('https://linkedin.com.example.org/'), false);
});

test('tipo de lugar: acepta mayúsculas y guiones', () => {
  assert.equal(normalizarTipoLugar('Red social'), 'red social');
  assert.equal(normalizarTipoLugar('red-social'), 'red social');
  assert.equal(normalizarTipoLugar('REVISTA'), 'revista');
  assert.equal(normalizarTipoLugar('blog'), undefined);
});

test('«Publicado originalmente en»: junta la formal y publicado_en, por fecha y sin repetir', () => {
  const lugares = lugaresPublicacion({
    fecha: fecha('2026-09-15'),
    publicacion: 'Revista de Relleno',
    publicado_en: [
      { lugar: 'LinkedIn', tipo: 'red social', fecha: fecha('2026-08-01'), enlace: 'https://www.linkedin.com/posts/x' },
      { lugar: 'revista de relleno', tipo: 'revista', fecha: fecha('2026-09-15'), enlace: 'https://example.org/r' },
      { lugar: 'Un medio', tipo: 'medio', fecha: fecha('2026-10-01') },
    ],
  });
  assert.deepEqual(lugares.map((l) => l.lugar), ['LinkedIn', 'Revista de Relleno', 'Un medio']);
  // El repetido aporta su enlace a la formal.
  assert.equal(lugares[1].enlace, 'https://example.org/r');
  assert.equal(lugares[1].formal, true);
  assert.deepEqual(lugaresPublicacion({ fecha: fecha('2026-01-01') }), []);
});

test('hashtags sin tildes ni espacios', () => {
  assert.equal(hashtag('Gestión del agua'), '#GestionDelAgua');
  assert.equal(hashtag('  '), '');
});

test('texto para compartir: título, resumen, lugares, etiquetas y dirección', () => {
  const t = textoCompartir({ titulo: 'Título', resumen: 'Resumen.', direccion: WEB, lugares: ['Revista A', 'LinkedIn'], etiquetas: ['Tema uno', 'tema uno'] });
  assert.equal(t, `Título\n\nResumen.\n\nPublicado originalmente en Revista A y LinkedIn.\n\n#TemaUno\n\n${WEB}`);
});

test('texto para compartir: si es largo se recorta el resumen, nunca la dirección', () => {
  const largo = 'palabra '.repeat(200).trim();
  const t = textoCompartir({ titulo: 'Título', resumen: largo, direccion: WEB, etiquetas: ['Tema'] });
  assert.ok(t.length <= LARGO_COMPARTIR, `${t.length} caracteres`);
  assert.ok(t.endsWith(`#Tema\n\n${WEB}`));
  assert.match(t, /palabra…\n/);
});

test('texto para compartir: el del autor se respeta y se le agrega la dirección si falta', () => {
  assert.equal(textoCompartir({ titulo: 'T', direccion: WEB, compartir: 'Propio.' }), `Propio.\n\n${WEB}`);
  assert.equal(textoCompartir({ titulo: 'T', direccion: WEB, compartir: `Propio: ${WEB}` }), `Propio: ${WEB}`);
});

test('enlaces para compartir: sin scripts, sólo la dirección codificada', () => {
  assert.equal(enlaceLinkedIn(WEB), `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(WEB)}`);
  assert.match(enlaceX('Un título', WEB), /^https:\/\/x\.com\/intent\/post\?text=Un%20t%C3%ADtulo&url=https%3A%2F%2F/);
});

test('version_web: resumen sin cuerpo; con cuerpo, el build frena, publicado o borrador', () => {
  assert.match(errorCuerpoResumen({ version_web: 'resumen', draft: false }, 'Texto completo.', 'mi-ensayo'), /^El ensayo «mi-ensayo» tiene «version_web: resumen» y trae el texto completo\./);
  assert.equal(errorCuerpoResumen({ version_web: 'resumen', draft: false }, '  \n', 'x'), undefined);
  assert.equal(errorCuerpoResumen({ version_web: 'resumen', draft: false }, undefined, 'x'), undefined);
  assert.equal(errorCuerpoResumen({ version_web: 'completa', draft: false }, 'Texto.', 'x'), undefined);
  // Un borrador también frena, con el mismo mensaje.
  assert.equal(
    errorCuerpoResumen({ version_web: 'resumen', draft: true }, 'Texto completo.', 'mi-ensayo'),
    errorCuerpoResumen({ version_web: 'resumen', draft: false }, 'Texto completo.', 'mi-ensayo'),
  );
  assert.match(errorCuerpoResumen({ version_web: 'resumen', draft: true }, 'Texto.', 'borrador'), /ni publicado ni como borrador/);
  assert.equal(errorCuerpoResumen({ version_web: 'resumen', draft: true }, '', 'x'), undefined);
});
