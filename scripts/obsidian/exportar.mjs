// Exportación desde la bóveda privada de Obsidian hacia src/content del repositorio.
// Copia en un solo sentido: lee la bóveda y escribe en el repositorio. Nunca borra.
import { createHash } from 'node:crypto';
import { existsSync, statSync } from 'node:fs';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { leerBoveda, buscar } from './boveda.mjs';
import { convertirCuerpo, EXT_IMAGEN, anclaEncabezado } from './convertir.mjs';
import { TIPOS, validarFrontmatter, controlarCuerpo, esSensible, buscarMarcadoresBorrador, buscarCoordenadas, chocaConBlog, chocaConEnsayos } from './controles.mjs';
import { slugificar } from '../../src/lib/slug.ts';

export const RAIZ_REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Registro de lo exportado: ruta en el repositorio → huella del contenido escrito.
// Sirve para saber si alguien cambió un archivo en el repositorio después de exportarlo.
export const REGISTRO = 'scripts/obsidian/registro-exportacion.json';

const ENCABEZADO = [
  '# Exportado desde la bóveda de Obsidian con «npm run desde-obsidian».',
  '# Los cambios se hacen en la bóveda. Si se edita acá, la próxima exportación pregunta antes de pisarlo.',
].join('\n');

const huella = (contenido) => createHash('sha256').update(contenido).digest('hex');
const dentroDe = (padre, hijo) => {
  const r = path.relative(padre, hijo);
  return r === '' || (!r.startsWith('..') && !path.isAbsolute(r));
};
const escaparTexto = (t) => t.replace(/([[\]])/g, '\\$1');
const sinUndefined = (o) => JSON.parse(JSON.stringify(o));

/**
 * @param {object} op
 * @param {string} op.boveda    carpeta de la bóveda
 * @param {string} [op.repo]    raíz del repositorio (las pruebas usan una carpeta temporal)
 * @param {boolean} [op.simular] muestra qué haría, sin escribir nada
 * @param {boolean} [op.forzar]  exporta aunque haya [PENDIENTE] o [VERIFICAR]
 * @param {(ruta: string) => Promise<boolean>} [op.preguntar] si se puede pisar un archivo cambiado
 */
export async function exportar({ boveda, repo = RAIZ_REPO, simular = false, forzar = false, preguntar = async () => false }) {
  const reporte = { boveda, simular, forzar, marcadas: 0, frenadas: [], archivos: [], avisos: [], huerfanos: [] };

  if (!existsSync(boveda) || !statSync(boveda).isDirectory()) {
    throw new Error(`No encuentro la carpeta de la bóveda: ${boveda}`);
  }
  if (dentroDe(repo, boveda)) {
    throw new Error(
      'La bóveda está dentro del repositorio. La bóveda privada tiene que vivir fuera: guarda ubicaciones exactas que no pueden entrar al repositorio (CLAUDE.md, regla 6).',
    );
  }
  const excluir = dentroDe(boveda, repo) ? [repo] : [];
  if (excluir.length) reporte.avisos.push({ nota: null, texto: 'El repositorio está dentro de la bóveda: se saltea al leerla.' });

  const { notas, adjuntos } = await leerBoveda(boveda, { excluir });

  // 1. Notas marcadas para publicar, con el frontmatter revisado.
  const fichas = [];
  for (const nota of notas) {
    const { fm } = nota;
    if (fm.publicar !== true) {
      if (typeof fm.publicar === 'string' && /^(true|s[ií])$/i.test(fm.publicar.trim())) {
        reporte.avisos.push({ nota: nota.rel, texto: '«publicar» está escrito como texto. Tiene que ser una casilla: publicar: true (sin comillas).' });
      }
      continue;
    }
    reporte.marcadas++;
    const ficha = { nota, errores: [], avisos: [] };
    fichas.push(ficha);
    if (nota.errorYaml) {
      ficha.errores.push(`El encabezado (frontmatter) no se puede leer: ${nota.errorYaml}`);
      continue;
    }
    const tipo = typeof fm.tipo === 'string' ? fm.tipo.trim().toLowerCase() : fm.tipo;
    if (!TIPOS[tipo]) {
      ficha.errores.push(`«tipo» tiene que ser blog, ensayo o lugar (es «${fm.tipo ?? ''}»).`);
      continue;
    }
    const { datos, errores } = validarFrontmatter(tipo, fm);
    ficha.errores.push(...errores);
    ficha.tipo = tipo;
    ficha.datos = datos;
    ficha.archivo = slugificar(nota.nombre);
    ficha.id = datos.slug ? slugificar(datos.slug) : ficha.archivo;
    if (!ficha.archivo) ficha.errores.push('El nombre de la nota no sirve para armar una dirección: usá letras o números.');
    else if (tipo === 'blog' && chocaConBlog(ficha.id)) {
      ficha.errores.push(`La dirección /blog/${ficha.id}/ ya la usa el blog. Cambiá el nombre de la nota o poné otro «slug».`);
    } else if (tipo === 'ensayo' && chocaConEnsayos(ficha.id)) {
      ficha.errores.push(`La dirección /ensayos/${ficha.id}/ ya la usa el sitio. Poné otro «slug».`);
    }
  }

  // Dos notas que irían al mismo archivo o a la misma dirección.
  const validas = fichas.filter((f) => f.tipo);
  for (const f of validas) {
    const choque = validas.find((o) => o !== f && o.tipo === f.tipo && (o.archivo === f.archivo || o.id === f.id));
    if (choque) f.errores.push(`Iría a la misma dirección que «${choque.nota.rel}». Cambiá el nombre de una de las dos notas o poné «slug».`);
  }

  // 2. Conversión. Una nota sólo se enlaza si se exporta y no es borrador; si la
  // conversión frena una nota, se vuelve a convertir todo sin ella (nunca un enlace roto).
  let exportables = new Set(fichas.filter((f) => f.errores.length === 0));
  for (;;) {
    for (const f of exportables) convertir(f, { exportables, notas, adjuntos, forzar });
    const frenadas = [...exportables].filter((f) => f.conversion.errores.length);
    if (frenadas.length === 0) break;
    for (const f of frenadas) {
      f.errores.push(...f.conversion.errores);
      exportables.delete(f);
    }
  }

  for (const f of fichas) {
    if (f.errores.length) reporte.frenadas.push({ nota: f.nota.rel, motivos: f.errores });
    for (const texto of [...f.avisos, ...(f.conversion?.avisos ?? [])]) reporte.avisos.push({ nota: f.nota.rel, texto });
  }

  // 3. Escritura, sin pisar lo que se cambió en el repositorio y sin borrar nada.
  const rutaRegistro = path.join(repo, REGISTRO);
  const registro = existsSync(rutaRegistro) ? JSON.parse(await readFile(rutaRegistro, 'utf8')) : { archivos: {} };
  const producidos = new Set();
  let registroCambiado = false;

  for (const f of [...exportables].sort((a, b) => a.nota.rel.localeCompare(b.nota.rel))) {
    const archivos = [
      ...f.conversion.imagenes.map((img) => ({ destino: img.destino, origen: img.origen })),
      { destino: f.conversion.destino, contenido: Buffer.from(f.conversion.contenido, 'utf8') },
    ];
    for (const a of archivos) {
      const contenido = a.contenido ?? (await readFile(a.origen));
      const nueva = huella(contenido);
      const absoluta = path.join(repo, a.destino);
      producidos.add(a.destino);
      let estado;
      if (!existsSync(absoluta)) estado = 'nuevo';
      else {
        const actual = huella(await readFile(absoluta));
        if (actual === nueva) estado = 'sin cambios';
        else if (registro.archivos[a.destino]?.huella === actual) estado = 'actualizado';
        else estado = 'cambiado en el repositorio';
        if (estado === 'cambiado en el repositorio') {
          if (simular) estado = 'cambiado en el repositorio: preguntaría antes de pisarlo';
          else if (await preguntar(a.destino)) estado = 'pisado con permiso';
          else estado = 'cambiado en el repositorio: no se tocó';
        }
      }
      reporte.archivos.push({ nota: f.nota.rel, destino: a.destino, estado });
      const escribir = ['nuevo', 'actualizado', 'pisado con permiso'].includes(estado);
      if (simular || !(escribir || estado === 'sin cambios')) continue;
      if (escribir) {
        await mkdir(path.dirname(absoluta), { recursive: true });
        if (a.contenido) await writeFile(absoluta, a.contenido);
        else await copyFile(a.origen, absoluta);
      }
      if (registro.archivos[a.destino]?.huella !== nueva) {
        registro.archivos[a.destino] = { huella: nueva };
        registroCambiado = true;
      }
    }
  }

  // Lo exportado antes que esta vez no salió: se avisa, no se borra. Las notas frenadas
  // ya figuran arriba con su motivo y no se repiten acá.
  const deFrenadas = new Set(fichas.filter((f) => f.archivo && !exportables.has(f)).map((f) => `src/content/${TIPOS[f.tipo].carpeta}/${f.archivo}.md`));
  for (const destino of Object.keys(registro.archivos).sort()) {
    if (!producidos.has(destino) && !deFrenadas.has(destino) && existsSync(path.join(repo, destino)) && destino.endsWith('.md')) {
      reporte.huerfanos.push(destino);
    }
  }

  if (!simular && registroCambiado) {
    const ordenado = { archivos: Object.fromEntries(Object.entries(registro.archivos).sort(([a], [b]) => a.localeCompare(b))) };
    await mkdir(path.dirname(rutaRegistro), { recursive: true });
    await writeFile(rutaRegistro, `${JSON.stringify(ordenado, null, 2)}\n`);
  }
  return reporte;
}

// Convierte una nota y deja el resultado en f.conversion. No escribe nada.
function convertir(f, { exportables, notas, adjuntos, forzar }) {
  const { nota, tipo } = f;
  const errores = [];
  const avisos = [];
  const carpeta = `src/content/${TIPOS[tipo].carpeta}`;
  const imagenes = new Map(); // ruta en la bóveda → { origen, destino, ref }
  const enlazable = (otra) => exportables.has(otra) && !otra.datos.draft;
  const fichaDe = (n) => [...exportables].find((x) => x.nota === n);

  // Las páginas del blog y de los ensayos están dos niveles abajo de la raíz del
  // sitio (/blog/<id>/) y los lugares se leen en /mapa/. Los enlaces relativos
  // siguen funcionando cuando se pase al dominio propio.
  const prefijo = tipo === 'lugar' ? '../' : '../../';
  const urlDe = (otra, encabezado) => {
    if (otra.tipo === 'lugar') return tipo === 'lugar' ? `#lugar-${otra.id}` : `${prefijo}mapa/#lugar-${otra.id}`;
    const ancla = encabezado ? `#${anclaEncabezado(encabezado)}` : '';
    if (otra === f) return ancla || './';
    return `${prefijo}${TIPOS[otra.tipo].ruta}/${otra.id}/${ancla}`;
  };

  function registrarImagen(destino, original) {
    const { archivo, ambiguo } = buscar(adjuntos, destino, nota);
    if (!archivo) {
      errores.push(`La imagen «${original}» no está en la bóveda.`);
      return null;
    }
    if (ambiguo) avisos.push(`Hay varias imágenes llamadas «${archivo.nombre}» en la bóveda; se usó ${archivo.rel}.`);
    if (!imagenes.has(archivo.rel)) {
      const ext = path.extname(archivo.nombre).toLowerCase();
      const base = slugificar(path.basename(archivo.nombre, path.extname(archivo.nombre))) || 'imagen';
      const usados = new Set([...imagenes.values()].map((i) => i.nombre));
      let nombre = `${base}${ext}`;
      for (let n = 2; usados.has(nombre); n++) nombre = `${base}-${n}${ext}`;
      imagenes.set(archivo.rel, {
        origen: archivo.ruta,
        nombre,
        destino: `${carpeta}/imagenes/${f.archivo}/${nombre}`,
        ref: `./imagenes/${f.archivo}/${nombre}`,
      });
    }
    return imagenes.get(archivo.rel).ref;
  }

  function enlazar(destino, alias) {
    const [ruta, ...anclas] = destino.split('#');
    const encabezado = anclas.filter(Boolean).pop();
    const encabezadoUtil = encabezado && !encabezado.startsWith('^') ? encabezado : null;
    if (!ruta.trim()) {
      // [[#Encabezado]] dentro de la misma nota
      if (!encabezadoUtil) return alias ?? '';
      return `[${escaparTexto(alias ?? encabezadoUtil)}](#${anclaEncabezado(encabezadoUtil)})`;
    }
    const ext = path.extname(ruta).toLowerCase();
    if (ext && ext !== '.md') {
      avisos.push(`«${destino}» es un archivo adjunto, no una nota: quedó como texto.`);
      return alias ?? path.basename(ruta);
    }
    const { archivo: otra, ambiguo } = buscar(notas, ruta, nota, { quitarExt: true });
    const texto = alias ?? otra?.nombre ?? path.basename(ruta);
    if (!otra) {
      avisos.push(`«[[${destino}]]» quedó como texto: no hay ninguna nota con ese nombre en la bóveda.`);
      return texto;
    }
    if (ambiguo) avisos.push(`Hay varias notas llamadas «${otra.nombre}»; el enlace apunta a ${otra.rel}.`);
    const ficha = fichaDe(otra);
    if (!ficha || !enlazable(ficha)) {
      const motivo = !ficha ? 'esa nota no se publica' : 'esa nota es un borrador (draft: true)';
      avisos.push(`«[[${destino}]]» quedó como texto: ${motivo}.`);
      return texto;
    }
    return `[${escaparTexto(texto)}](${urlDe(ficha, encabezadoUtil)})`;
  }

  const ctx = {
    enlazar,
    incrustar(destino, alias) {
      const ruta = destino.split('#')[0];
      if (EXT_IMAGEN.test(ruta)) {
        const ref = registrarImagen(ruta, destino);
        // ![[foto.png|300]] lleva un ancho, no un texto alternativo.
        const alt = alias && !/^\d+(x\d+)?$/.test(alias) ? alias : '';
        return ref ? `![${escaparTexto(alt)}](${ref})` : '';
      }
      if (path.extname(ruta) && path.extname(ruta).toLowerCase() !== '.md') {
        avisos.push(`«![[${destino}]]» no es una imagen: el sitio no lo puede incrustar y quedó como texto.`);
        return alias ?? path.basename(ruta);
      }
      avisos.push(`«![[${destino}]]» incrusta una nota: en el sitio queda como enlace (o como texto, si no se publica).`);
      return enlazar(destino, alias);
    },
    imagenMarkdown(destino, alt) {
      if (!EXT_IMAGEN.test(destino)) {
        avisos.push(`«${destino}» no es una imagen que el sitio pueda mostrar: quedó como texto.`);
        return alt || path.basename(destino);
      }
      const ref = registrarImagen(destino, destino);
      return ref ? `![${alt}](${ref})` : '';
    },
    enlaceMarkdown(texto, destino) {
      const [ruta, ...anclas] = destino.split('#');
      if (/\.md$/i.test(ruta)) return enlazar(`${ruta.replace(/\.md$/i, '')}${anclas.length ? `#${anclas.join('#')}` : ''}`, texto);
      if (path.extname(ruta)) {
        avisos.push(`El enlace a «${destino}» apunta a un archivo de la bóveda que no se publica: quedó como texto.`);
        return texto;
      }
      return null;
    },
  };

  // `version_web: resumen`: el texto completo no sale de la bóveda (el repositorio es público).
  const soloResumen = tipo === 'ensayo' && f.datos.version_web === 'resumen';
  if (soloResumen && nota.cuerpo.trim()) {
    avisos.push('Tiene «version_web: resumen»: se exportó sin el cuerpo. El texto completo queda en la bóveda.');
  }
  const cuerpo = soloResumen ? '' : convertirCuerpo(nota.cuerpo, ctx);
  errores.push(...controlarCuerpo(tipo, f.datos, cuerpo, f.id));
  const datos = structuredClone(f.datos);

  // Imágenes del frontmatter: «imagen: "[[foto.jpg]]"» o «imagen: ./foto.jpg».
  const imagenFm = (valor) => {
    if (typeof valor !== 'string') {
      errores.push('La imagen del encabezado tiene que ser un texto: "[[foto.jpg]]" o ./foto.jpg.');
      return undefined;
    }
    const limpio = valor.trim().replace(/^!?\[\[|\]\]$/g, '').split('|')[0].trim();
    return registrarImagen(limpio, valor) ?? undefined;
  };
  if (tipo === 'blog' && nota.fm.imagen) datos.imagen = imagenFm(nota.fm.imagen);
  if ((tipo === 'lugar' || tipo === 'ensayo') && datos.imagen) datos.imagen.archivo = imagenFm(nota.fm.imagen.archivo);

  // relacionados: «[[Nota]]» pasa al nombre del archivo exportado.
  if (tipo === 'lugar') {
    datos.relacionados = datos.relacionados.flatMap((ref) => {
      const m = ref.trim().match(/^\[\[([^\]]+)\]\]$/);
      if (!m) return [ref];
      const ruta = m[1].split('|')[0].split('#')[0];
      const { archivo: otra } = buscar(notas, ruta, nota, { quitarExt: true });
      const ficha = otra && fichaDe(otra);
      if (ficha && enlazable(ficha) && ficha.tipo !== 'lugar') return [ficha.tipo === 'blog' ? `blog/${ficha.id}` : `ensayos/${ficha.id}`];
      avisos.push(`relacionados: «${ref}» se quitó porque ${ficha?.tipo === 'lugar' ? 'es otro lugar (sólo valen entradas y ensayos)' : 'esa nota no se publica o es un borrador'}.`);
      return [];
    });
  }

  const salida = sinUndefined(datos);
  const frontmatter = stringify(salida, { lineWidth: 0 });

  // Marcadores de borrador ([PENDIENTE], [VERIFICAR]) fuera de un borrador.
  // `marcador` es un campo válido de los lugares; lat y lon se revisan aparte.
  const { marcador: _m, lat: _lat, lon: _lon, ...resto } = salida;
  const marcas = buscarMarcadoresBorrador(`${JSON.stringify(resto)}\n${cuerpo}`);
  if (marcas.length && !datos.draft) {
    if (forzar) avisos.push(`Se exportó con marcadores de borrador (${marcas.join(', ')}) porque se usó --forzar.`);
    else errores.push(`Tiene marcadores de borrador (${marcas.join(', ')}) y no está en «draft: true». Completalos, marcala como borrador o exportala igual con --forzar.`);
  }

  // Regla 6: un lugar sensible o con ubicación protegida no puede llevar coordenadas finas en el texto.
  const coords = buscarCoordenadas(`${JSON.stringify(resto)}\n${cuerpo}`);
  if (coords.length) {
    const protegido = tipo === 'lugar' && (esSensible(nota.fm) || datos.precision !== 'exacta');
    if (protegido) {
      errores.push(`Regla 6: el texto tiene coordenadas con más de dos decimales (${coords.join('; ')}). Sacalas de la nota pública; la ubicación exacta queda en la bóveda.`);
    } else {
      avisos.push(`El texto tiene algo que parece una coordenada precisa (${coords.join('; ')}). Si es un lugar sensible, sacala (regla 6).`);
    }
  }

  f.conversion = {
    errores,
    avisos,
    imagenes: [...imagenes.values()],
    destino: `${carpeta}/${f.archivo}.md`,
    contenido: `---\n${ENCABEZADO}\n${frontmatter}---\n\n${cuerpo}`,
  };
}

// Texto para la terminal.
export function formatearReporte(r) {
  const l = [];
  if (r.simular) l.push('SIMULACIÓN: no se escribió nada. Esto es lo que haría la exportación.', '');
  l.push(`Bóveda: ${r.boveda}`);
  l.push(`Notas marcadas para publicar: ${r.marcadas}`);
  if (r.forzar) l.push('Con --forzar: los marcadores de borrador no frenan la exportación.');

  if (r.frenadas.length) {
    l.push('', `FRENADAS: ${r.frenadas.length} nota(s) no se exportaron. Corregilas en la bóveda y volvé a correr el script.`);
    for (const f of r.frenadas) {
      l.push(`  ✗ ${f.nota}`);
      for (const m of f.motivos) l.push(`      - ${m}`);
    }
  }

  const verbo = r.simular
    ? { nuevo: 'se crearía', actualizado: 'se actualizaría', 'sin cambios': 'sin cambios' }
    : { nuevo: 'nuevo', actualizado: 'actualizado', 'sin cambios': 'sin cambios' };
  if (r.archivos.length) {
    l.push('', r.simular ? 'Archivos que tocaría:' : 'Archivos:');
    for (const a of r.archivos) {
      const marca = { nuevo: '+', actualizado: '~', 'sin cambios': '=' }[a.estado] ?? '!';
      l.push(`  ${marca} ${a.destino}  (${verbo[a.estado] ?? a.estado})`);
    }
  }

  if (r.avisos.length) {
    l.push('', 'Avisos (no frenan la exportación):');
    for (const a of r.avisos) l.push(`  · ${a.nota ? `${a.nota}: ` : ''}${a.texto}`);
  }
  if (r.huerfanos.length) {
    l.push('', 'Exportados antes y que esta vez no salieron de ninguna nota (se despublicaron o se renombraron). Siguen en el repositorio: el script nunca borra. Si ya no van, borralos a mano:');
    for (const h of r.huerfanos) l.push(`  ? ${h}`);
  }
  if (!r.frenadas.length && !r.archivos.length) l.push('', 'No hay nada para exportar.');
  return l.join('\n');
}
