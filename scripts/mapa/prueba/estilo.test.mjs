// Color por capa del mapa (src/scripts/mapa/estilo.ts): npm test
// Valida el estilo con el validador de MapLibre, con cero lugares, una sola capa y todas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import { colorPorCapa } from '../../../src/scripts/mapa/estilo.ts';
import { IDS_CAPAS } from '../../../src/lib/capas.ts';

// Un estilo mínimo con las mismas capas de MapLibre que usa el mapa para líneas, polígonos y zonas.
const errores = (color) =>
  validateStyleMin({
    version: 8,
    sources: { formas: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } },
    layers: [
      { id: 'relleno', type: 'fill', source: 'formas', paint: { 'fill-color': color } },
      { id: 'borde', type: 'line', source: 'formas', paint: { 'line-color': color } },
    ],
  }).map((e) => e.message);

const tono = (c) => `rgba(${c.length}, 0, 0, 1)`;

test('el `match` vacío de antes es justo lo que MapLibre rechaza', () => {
  assert.notDeepEqual(errores(['match', ['get', 'capa'], '#000']), []);
});

test('sin capas, el color es el de respaldo y el estilo vale', () => {
  assert.equal(colorPorCapa([], tono, '#123456'), '#123456');
  assert.deepEqual(errores(colorPorCapa([], tono, '#123456')), []);
});

test('con una sola capa, el estilo vale', () => {
  assert.deepEqual(errores(colorPorCapa(['clima'], tono, '#000')), []);
});

test('con todas las capas del sitio (y repetidas), el estilo vale', () => {
  const expresion = colorPorCapa([...IDS_CAPAS, 'clima'], tono, '#000');
  assert.deepEqual(errores(expresion), []);
  assert.equal(expresion.length, 3 + IDS_CAPAS.length * 2);
});
