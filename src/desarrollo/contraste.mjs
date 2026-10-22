// Contraste de los temas, según WCAG 2.1 (nivel AA).
// - Texto sobre fondo: al menos 4.5:1 (texto de cuerpo y de interfaz, de cualquier tamaño).
// - Gráficos (ícono dentro del marcador, punto de capa sobre el fondo): al menos 3:1.
//
// Uso: npm run temas:contraste — escribe docs/temas-contraste.md y termina con error
// si algún par no llega. El build también lo comprueba para el tema publicado.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { TEMAS } from './temas.mjs';

const CARPETA_TEMAS = new URL('../styles/temas/', import.meta.url);

const CAPAS = [
  ['clima', 'Clima'],
  ['ecologia', 'Ecología'],
  ['biodiversidad', 'Biodiversidad'],
  ['cultura', 'Cultura'],
  ['antropologia', 'Antropología'],
  ['arqueologia', 'Arqueología'],
  ['turismo', 'Turismo'],
  ['emprendimientos-comunitarios', 'Emprendimientos comunitarios'],
  ['gobiernos-municipales', 'Gobiernos municipales'],
];

// [primer plano, fondo, mínimo, descripción]
export const PARES = [
  ['color-texto', 'color-fondo', 4.5, 'Texto sobre fondo'],
  ['color-texto', 'color-superficie', 4.5, 'Texto sobre superficie'],
  ['color-texto-suave', 'color-fondo', 4.5, 'Texto suave sobre fondo'],
  ['color-texto-suave', 'color-superficie', 4.5, 'Texto suave sobre superficie'],
  ['color-acento', 'color-fondo', 4.5, 'Enlace sobre fondo'],
  ['color-acento', 'color-superficie', 4.5, 'Enlace sobre superficie'],
  ['color-acento-hover', 'color-fondo', 4.5, 'Enlace (cursor encima) sobre fondo'],
  ['color-pendiente-texto', 'color-pendiente-fondo', 4.5, 'Marca [PENDIENTE]'],
  ...CAPAS.map(([id, nombre]) => [`color-capa-icono`, `color-capa-${id}`, 3, `Ícono sobre capa ${nombre}`]),
  ...CAPAS.map(([id, nombre]) => [`color-capa-${id}`, `color-fondo`, 3, `Capa ${nombre} sobre fondo`]),
];

export const MODOS = [
  ['claro', ''],
  ['oscuro', 'oscuro-'],
];

// Lee los valores hexadecimales --token: #rrggbb de un archivo de tema.
export function leerTema(id) {
  const css = readFileSync(new URL(`${id}.css`, CARPETA_TEMAS), 'utf8');
  const valores = {};
  for (const [, nombre, valor] of css.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,6})\b/g)) valores[nombre] = valor;
  return valores;
}

function luminancia(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contraste(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// Devuelve una fila por par y modo. Un token que falta cuenta como falla.
export function revisarTema(id) {
  const v = leerTema(id);
  const filas = [];
  for (const [modo, prefijo] of MODOS) {
    for (const [frente, fondo, minimo, descripcion] of PARES) {
      const cf = v[prefijo + frente];
      const cb = v[prefijo + fondo];
      const razon = cf && cb ? contraste(cf, cb) : 0;
      filas.push({ modo, descripcion, frente: cf ?? `falta --${prefijo}${frente}`, fondo: cb ?? `falta --${prefijo}${fondo}`, razon, minimo, pasa: razon >= minimo });
    }
  }
  return filas;
}

function tabla() {
  const fecha = new Date().toISOString().slice(0, 10);
  let md = `# Contraste de los temas\n\nGenerado con \`npm run temas:contraste\` el ${fecha}. No editar a mano.\n\n`;
  md += 'Criterio WCAG 2.1, nivel AA: texto sobre fondo, al menos 4.5:1; gráficos (ícono dentro del marcador del mapa y punto de capa sobre el fondo), al menos 3:1.\n\n';
  let fallas = 0;
  for (const tema of TEMAS) {
    const filas = revisarTema(tema.id);
    const malas = filas.filter((f) => !f.pasa).length;
    fallas += malas;
    md += `## ${tema.nombre}\n\n${malas === 0 ? `Los ${filas.length} pares pasan.` : `**${malas} de ${filas.length} pares no llegan.**`}\n\n`;
    md += '| Modo | Par | Primer plano | Fondo | Contraste | Mínimo | AA |\n|---|---|---|---|---|---|---|\n';
    for (const f of filas) {
      md += `| ${f.modo} | ${f.descripcion} | \`${f.frente}\` | \`${f.fondo}\` | ${f.razon.toFixed(2)}:1 | ${f.minimo}:1 | ${f.pasa ? 'sí' : '**no**'} |\n`;
    }
    md += '\n';
  }
  return { md, fallas };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { md, fallas } = tabla();
  const destino = new URL('../../docs/temas-contraste.md', import.meta.url);
  writeFileSync(destino, md);
  for (const tema of TEMAS) {
    const filas = revisarTema(tema.id);
    const peor = filas.reduce((a, b) => (b.razon / b.minimo < a.razon / a.minimo ? b : a));
    console.log(`${tema.nombre.padEnd(20)} ${filas.filter((f) => f.pasa).length}/${filas.length} pares AA · el más justo: ${peor.descripcion} (${peor.modo}) ${peor.razon.toFixed(2)}:1`);
    for (const f of filas.filter((f) => !f.pasa)) console.log(`   NO: ${f.modo} · ${f.descripcion} ${f.frente} / ${f.fondo} = ${f.razon.toFixed(2)}:1`);
  }
  console.log(`Tabla en ${fileURLToPath(destino)}`);
  if (fallas > 0) process.exit(1);
}
