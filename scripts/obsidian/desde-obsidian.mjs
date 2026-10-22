// npm run desde-obsidian -- <carpeta-de-la-bóveda> [--simular] [--forzar]
// Guía completa en COMO-PUBLICAR.md, «Publicar desde Obsidian».
import os from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';

const AYUDA = `Uso: npm run desde-obsidian -- <carpeta-de-la-bóveda> [--simular] [--forzar]

  --simular   muestra qué haría, sin escribir nada
  --forzar    exporta aunque una nota tenga [PENDIENTE] o [VERIFICAR] sin «draft: true»

Si la ruta tiene espacios, va entre comillas: "C:\\Users\\Gonzalo\\Mi bóveda".`;

const [mayor, menor] = process.versions.node.split('.').map(Number);
if (mayor < 22 || (mayor === 22 && menor < 18)) {
  console.error(`Hace falta Node 22.18 o posterior (tenés ${process.versions.node}). Instalá la versión LTS desde https://nodejs.org.`);
  process.exit(1);
}

const args = process.argv.slice(2);
const opciones = { simular: false, forzar: false };
const posicionales = [];
for (const a of args) {
  if (a === '--simular') opciones.simular = true;
  else if (a === '--forzar') opciones.forzar = true;
  else if (a === '--ayuda' || a === '-h' || a === '--help') {
    console.log(AYUDA);
    process.exit(0);
  } else if (a.startsWith('-')) {
    console.error(`No conozco la opción «${a}».\n\n${AYUDA}`);
    process.exit(1);
  } else posicionales.push(a);
}
if (posicionales.length !== 1) {
  console.error(`${posicionales.length ? 'Pasá una sola carpeta (¿la ruta tiene espacios y le faltan comillas?).' : 'Falta la carpeta de la bóveda.'}\n\n${AYUDA}`);
  process.exit(1);
}

// npm corre el script desde la raíz del repositorio; una ruta relativa se lee desde
// donde la escribió el autor (INIT_CWD).
let carpeta = posicionales[0].replace(/^~(?=$|[/\\])/, os.homedir());
carpeta = path.resolve(process.env.INIT_CWD ?? process.cwd(), carpeta);

const { exportar, formatearReporte } = await import('./exportar.mjs');

async function preguntar(destino) {
  if (!process.stdin.isTTY) {
    console.log(`\n${destino} cambió en el repositorio después de la última exportación. Sin terminal interactiva no se puede preguntar: no se toca.`);
    return false;
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const respuesta = await rl.question(
    `\n${destino} cambió en el repositorio después de la última exportación (o no lo creó este script).\n¿Lo reemplazo con la versión de la bóveda? Se pierden los cambios hechos en el repositorio. [s/N] `,
  );
  rl.close();
  return /^s[ií]?$/i.test(respuesta.trim());
}

try {
  const reporte = await exportar({ boveda: carpeta, ...opciones, preguntar });
  console.log(formatearReporte(reporte));
  process.exitCode = reporte.frenadas.length ? 1 : 0;
} catch (err) {
  console.error(`No se pudo exportar: ${err.message}`);
  process.exitCode = 1;
}
