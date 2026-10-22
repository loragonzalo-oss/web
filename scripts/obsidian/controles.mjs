// Controles del frontmatter antes de exportar. Siguen el esquema de src/content.config.ts:
// si se cambia un campo allá, hay que cambiarlo acá también.
import { IDS_CAPAS, RECORTE } from '../../src/lib/capas.ts';
import { slugificar } from '../../src/lib/slug.ts';
import { normalizarDoi, normalizarPaginas } from '../../src/lib/revista.ts';
import { TIPOS_LUGAR, normalizarTipoLugar, chocaConEnsayos } from '../../src/lib/referencia.ts';

export const TIPOS = {
  blog: { carpeta: 'blog', ruta: 'blog' },
  ensayo: { carpeta: 'ensayos', ruta: 'ensayos' },
  lugar: { carpeta: 'lugares', ruta: 'mapa' },
};

const vacio = (v) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
const esFecha = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) && !Number.isNaN(new Date(v).valueOf());
const esUrl = (v) => typeof v === 'string' && URL.canParse(v);

// Mismo criterio que normalizarMarcador() en src/content.config.ts.
const MARCADORES = { CORPUS: 'corpus', VERIFICAR: '[VERIFICAR]', HIPOTESIS: '[HIPÓTESIS]', 'DATO PROPIO': '[DATO PROPIO]', 'DATO PROPIO DEL AUTOR': '[DATO PROPIO]' };
function normalizarMarcador(v) {
  const texto = Array.isArray(v) && v.length === 1 ? v[0] : v;
  if (typeof texto !== 'string') return null;
  const clave = texto.replace(/[[\]]/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase();
  return MARCADORES[clave] ?? null;
}

// Direcciones que ya usa el blog (/blog/archivo/, /blog/etiquetas/, /blog/2/…): una entrada
// con ese nombre las taparía. Mismo criterio que src/pages/blog/[entrada].astro.
export const RESERVADAS_BLOG = ['archivo', 'etiquetas'];
export const chocaConBlog = (id) => RESERVADAS_BLOG.includes(id) || /^\d+$/.test(id);
// Lo mismo en los ensayos (/ensayos/temas/): src/lib/referencia.ts.
export { chocaConEnsayos };

// Lee los campos uno por uno y junta los errores en castellano.
function lector(fm, errores) {
  return {
    texto(campo, obligatorio) {
      const v = fm[campo];
      if (vacio(v)) {
        if (obligatorio) errores.push(`Falta «${campo}».`);
        return undefined;
      }
      if (typeof v !== 'string' && typeof v !== 'number') {
        errores.push(`«${campo}» tiene que ser un texto.`);
        return undefined;
      }
      return String(v);
    },
    fecha(campo, obligatorio) {
      const v = fm[campo] instanceof Date ? fm[campo].toISOString().slice(0, 10) : fm[campo];
      if (vacio(v)) {
        if (obligatorio) errores.push(`Falta «${campo}» (formato AAAA-MM-DD).`);
        return undefined;
      }
      if (!esFecha(String(v))) {
        errores.push(`«${campo}» no es una fecha válida: «${v}». Formato: AAAA-MM-DD.`);
        return undefined;
      }
      return String(v);
    },
    // Series (src/content.config.ts): `serie` es un nombre y `parte`, un entero positivo.
    serie() {
      const serie = this.texto('serie', false);
      const v = fm.parte;
      let parte;
      if (!vacio(v)) {
        const n = Number(typeof v === 'string' ? v.trim() : v);
        if (Number.isInteger(n) && n > 0) parte = n;
        else errores.push(`«parte» tiene que ser un número entero desde 1 (es «${v}»).`);
      }
      return { serie, parte };
    },
    draft() {
      const v = fm.draft;
      if (vacio(v)) return false;
      if (typeof v !== 'boolean') {
        errores.push(`«draft» tiene que ser true o false (es «${v}»).`);
        return false;
      }
      return v;
    },
  };
}

// `etiquetas`: lista de textos. Una sola etiqueta escrita como texto también vale.
function leerEtiquetas(fm, errores) {
  let etiquetas = fm.etiquetas;
  if (vacio(etiquetas)) etiquetas = [];
  else if (typeof etiquetas === 'string') etiquetas = [etiquetas];
  else if (!Array.isArray(etiquetas)) {
    errores.push('«etiquetas» tiene que ser una lista.');
    etiquetas = [];
  }
  return etiquetas.filter((e) => !vacio(e)).map(String);
}

// `imagen` con crédito: mismo criterio en lugares y ensayos. El archivo lo completa exportar.mjs.
function leerImagen(fm, errores) {
  if (vacio(fm.imagen)) return undefined;
  if (typeof fm.imagen !== 'object' || vacio(fm.imagen.archivo)) {
    errores.push('«imagen» lleva «archivo», «credito» y, opcional, «descripcion».');
    return undefined;
  }
  if (vacio(fm.imagen.credito)) errores.push('«imagen» necesita «credito»: autor y licencia.');
  return { archivo: undefined, credito: fm.imagen.credito, descripcion: vacio(fm.imagen.descripcion) ? undefined : fm.imagen.descripcion };
}

function validarBlog(fm, errores) {
  const l = lector(fm, errores);
  const etiquetas = leerEtiquetas(fm, errores);
  return {
    titulo: l.texto('titulo', true),
    fecha: l.fecha('fecha', true),
    resumen: l.texto('resumen', false),
    etiquetas,
    imagen: undefined, // la completa exportar.mjs después de copiar la imagen
    slug: l.texto('slug', false),
    draft: l.draft(),
    ...l.serie(),
  };
}

function validarEnsayo(fm, errores) {
  const l = lector(fm, errores);
  const enlace = l.texto('enlace', false);
  if (enlace !== undefined && !esUrl(enlace)) errores.push(`«enlace» no es una dirección web válida: «${enlace}».`);
  // Datos de revista (opcionales). Mismo criterio que el esquema: páginas con raya corta, DOI sin dirección.
  let paginas = l.texto('paginas', false);
  if (paginas !== undefined) {
    const p = normalizarPaginas(paginas);
    if (!p) errores.push(`«paginas» se escribe «45-67» o «45» (es «${paginas}»).`);
    paginas = p;
  }
  let doi = l.texto('doi', false);
  if (doi !== undefined) {
    const d = normalizarDoi(doi);
    if (!d) errores.push(`«doi» no es un DOI válido: «${doi}». Se escribe «10.1234/abcd» o «https://doi.org/10.1234/abcd».`);
    doi = d;
  }
  const fechaDe = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v);

  // Otros lugares donde salió el ensayo. Mismo esquema que src/content.config.ts.
  let publicadoEn = [];
  if (!vacio(fm.publicado_en)) {
    if (!Array.isArray(fm.publicado_en)) errores.push('«publicado_en» tiene que ser una lista de lugares (cada uno con «lugar», «tipo» y «fecha»).');
    else {
      publicadoEn = fm.publicado_en.map((p, i) => {
        const n = `«publicado_en», lugar ${i + 1}`;
        if (typeof p !== 'object' || p === null) {
          errores.push(`${n}: lleva «lugar», «tipo», «fecha» y, opcional, «enlace».`);
          return {};
        }
        const tipo = normalizarTipoLugar(p.tipo);
        const fecha = fechaDe(p.fecha);
        if (vacio(p.lugar)) errores.push(`${n}: falta «lugar».`);
        if (vacio(p.tipo)) errores.push(`${n}: falta «tipo» (${TIPOS_LUGAR.join(', ')}).`);
        else if (!tipo) errores.push(`${n}: «tipo: ${p.tipo}» no existe. Opciones: ${TIPOS_LUGAR.join(', ')}.`);
        if (vacio(fecha)) errores.push(`${n}: falta «fecha» (formato AAAA-MM-DD).`);
        else if (!esFecha(String(fecha))) errores.push(`${n}: «fecha» no es una fecha válida: «${fecha}». Formato: AAAA-MM-DD.`);
        if (!vacio(p.enlace) && !esUrl(p.enlace)) errores.push(`${n}: «enlace» no es una dirección web válida: «${p.enlace}».`);
        return { lugar: vacio(p.lugar) ? undefined : String(p.lugar), tipo: tipo ?? p.tipo, fecha: vacio(fecha) ? undefined : String(fecha), enlace: vacio(p.enlace) ? undefined : p.enlace };
      });
    }
  }

  let versionWeb;
  if (!vacio(fm.version_web)) {
    versionWeb = String(fm.version_web).trim();
    if (!['completa', 'resumen'].includes(versionWeb)) errores.push(`«version_web: ${fm.version_web}» no existe. Opciones: completa, resumen.`);
  }

  // La dirección de un ensayo que se publica es fija: /ensayos/<slug>/.
  const draft = l.draft();
  const slug = l.texto('slug', false);
  if (!draft && slug === undefined) {
    errores.push('Falta «slug». Un ensayo que se publica (draft: false) lleva «slug»: es su dirección fija, /ensayos/<slug>/, y no cambia si se renombra la nota.');
  }
  let anteriores = fm.direcciones_anteriores;
  if (vacio(anteriores)) anteriores = [];
  else if (typeof anteriores === 'string') anteriores = [anteriores];
  else if (!Array.isArray(anteriores)) {
    errores.push('«direcciones_anteriores» tiene que ser una lista de direcciones (slugs).');
    anteriores = [];
  }
  anteriores = anteriores.filter((a) => !vacio(a)).map(String);
  for (const a of anteriores) {
    if (!slugificar(a)) errores.push(`«direcciones_anteriores»: «${a}» no sirve como dirección: usá letras o números.`);
    else if (slug && slugificar(a) === slugificar(slug)) errores.push(`«direcciones_anteriores»: «${a}» es la dirección vigente; ahí van sólo las que se usaron antes.`);
  }

  return {
    titulo: l.texto('titulo', true),
    fecha: l.fecha('fecha', true),
    resumen: l.texto('resumen', true),
    publicacion: l.texto('publicacion', false),
    enlace,
    volumen: l.texto('volumen', false),
    numero: l.texto('numero', false),
    paginas,
    doi,
    publicado_en: publicadoEn.length ? publicadoEn : undefined,
    version_web: versionWeb,
    etiquetas: leerEtiquetas(fm, errores),
    imagen: leerImagen(fm, errores),
    compartir: l.texto('compartir', false),
    slug,
    direcciones_anteriores: anteriores.length ? anteriores : undefined,
    draft,
    ...l.serie(),
  };
}

function coordenada(v, campo, errores) {
  if (vacio(v)) return undefined;
  const n = typeof v === 'string' ? Number(v.trim().replace(',', '.')) : v;
  if (typeof n !== 'number' || !Number.isFinite(n)) {
    errores.push(`«${campo}» no es un número: «${v}».`);
    return undefined;
  }
  return n;
}

// Un lugar es sensible si está en la capa Arqueología o si el autor lo marca con «sensible: true».
export function esSensible(fm) {
  if (fm.sensible === true) return 'marcado con «sensible: true»';
  if (typeof fm.capa === 'string' && slugificar(fm.capa) === 'arqueologia') return 'capa Arqueología';
  return null;
}

function validarLugar(fm, errores) {
  const l = lector(fm, errores);
  const capa = typeof fm.capa === 'string' ? slugificar(fm.capa) : undefined;
  if (vacio(fm.capa)) errores.push(`Falta «capa». Opciones: ${IDS_CAPAS.join(', ')}.`);
  else if (!IDS_CAPAS.includes(capa)) errores.push(`«capa: ${fm.capa}» no existe. Opciones: ${IDS_CAPAS.join(', ')}.`);

  const precision = vacio(fm.precision) ? 'exacta' : String(fm.precision).trim();
  if (!['exacta', 'aproximada', 'oculta'].includes(precision)) {
    errores.push(`«precision: ${fm.precision}» no existe. Opciones: exacta, aproximada, oculta.`);
  }
  const lat = coordenada(fm.lat, 'lat', errores);
  const lon = coordenada(fm.lon, 'lon', errores);

  // Regla 6 de CLAUDE.md: las coordenadas exactas de un lugar sensible nunca entran al repositorio.
  const sensible = esSensible(fm);
  if (sensible && precision === 'exacta') {
    errores.push(
      `Regla 6: es un lugar sensible (${sensible}) y tiene «precision: exacta». Usá «aproximada» (lat y lon con dos decimales como máximo) u «oculta» (sin lat ni lon). La ubicación exacta queda en la bóveda.`,
    );
  }
  if (precision === 'oculta' && (lat !== undefined || lon !== undefined)) {
    errores.push('Regla 6: con «precision: oculta» la nota no puede llevar lat ni lon. Borralos; la ubicación exacta queda en la bóveda.');
  }
  if (precision === 'aproximada') {
    for (const [campo, valor] of [['lat', lat], ['lon', lon]]) {
      const decimales = String(valor ?? '').split('.')[1]?.length ?? 0;
      if (decimales > 2) {
        errores.push(`Regla 6: con «precision: aproximada», ${campo} lleva como máximo dos decimales (tiene ${decimales}). Redondealo; el valor exacto queda en la bóveda.`);
      }
    }
  }
  if (precision !== 'oculta' && (lat === undefined || lon === undefined)) {
    errores.push('Faltan lat y lon. Sólo se pueden omitir con «precision: oculta».');
  }
  if (lat !== undefined && lon !== undefined) {
    const { latMin, latMax, lonMin, lonMax } = RECORTE;
    if (lat < latMin || lat > latMax || lon < lonMin || lon > lonMax) {
      errores.push(`Coordenadas fuera del recorte del lago (lat entre ${latMin} y ${latMax}, lon entre ${lonMin} y ${lonMax}). ¿Están invertidas o les falta el signo menos?`);
    }
  }

  let imagen;
  if (!vacio(fm.imagen)) {
    if (typeof fm.imagen !== 'object' || vacio(fm.imagen.archivo)) {
      errores.push('«imagen» lleva «archivo», «credito» y, opcional, «descripcion».');
    } else {
      if (vacio(fm.imagen.credito)) errores.push('«imagen» necesita «credito»: autor y licencia.');
      imagen = { archivo: undefined, credito: fm.imagen.credito, descripcion: vacio(fm.imagen.descripcion) ? undefined : fm.imagen.descripcion };
    }
  }

  const lista = (campo) => {
    const v = fm[campo];
    if (vacio(v)) return [];
    if (!Array.isArray(v)) {
      errores.push(`«${campo}» tiene que ser una lista.`);
      return [];
    }
    return v;
  };
  const enlaces = lista('enlaces').map((e, i) => {
    if (vacio(e?.texto) || !esUrl(e?.url) || !esFecha(String(e?.verificado ?? ''))) {
      errores.push(`«enlaces», elemento ${i + 1}: necesita «texto», «url» (dirección completa) y «verificado» (AAAA-MM-DD).`);
    }
    return { texto: e?.texto, url: e?.url, verificado: e?.verificado };
  });
  const fuentes = lista('fuentes').map((f, i) => {
    if (vacio(f?.autor) || vacio(f?.año) || vacio(f?.titulo)) errores.push(`«fuentes», elemento ${i + 1}: necesita «autor», «año» y «titulo».`);
    if (!vacio(f?.url) && !esUrl(f.url)) errores.push(`«fuentes», elemento ${i + 1}: «url» no es una dirección web válida.`);
    return { autor: f?.autor, año: f?.año, titulo: f?.titulo, url: vacio(f?.url) ? undefined : f.url };
  });

  const marcador = normalizarMarcador(fm.marcador);
  if (vacio(fm.marcador)) errores.push('Falta «marcador»: corpus, "[VERIFICAR]", "[HIPÓTESIS]" o "[DATO PROPIO]".');
  else if (!marcador) errores.push(`«marcador: ${fm.marcador}» no existe. Opciones: corpus, "[VERIFICAR]", "[HIPÓTESIS]", "[DATO PROPIO]".`);
  if (marcador === 'corpus' && fuentes.length === 0) errores.push('Con «marcador: corpus» hace falta al menos una fuente.');

  return {
    titulo: l.texto('titulo', true),
    capa,
    lat,
    lon,
    precision,
    resumen: l.texto('resumen', true),
    imagen,
    enlaces,
    fuentes,
    marcador: marcador ?? undefined,
    relacionados: lista('relacionados').filter((r) => !vacio(r)).map(String),
    slug: l.texto('slug', false),
    draft: l.draft(),
  };
}

// Devuelve los datos del frontmatter que van al sitio, en el orden del esquema.
// Lo que no está en el esquema (publicar, tipo, sensible, tags, aliases…) no sale de la bóveda.
export function validarFrontmatter(tipo, fm) {
  const errores = [];
  const datos = { blog: validarBlog, ensayo: validarEnsayo, lugar: validarLugar }[tipo](fm, errores);
  return { datos, errores };
}

// Marcadores de borrador del autor. «[VERIFICAR]» en el campo `marcador` de un lugar
// es un valor válido y no cuenta.
const RE_BORRADOR = /\[(?:PENDIENTE|VERIFICAR)(?:\s*:[^\]\n]*)?\]/gi;
export function buscarMarcadoresBorrador(texto) {
  return [...new Set(texto.match(RE_BORRADOR) ?? [])];
}

// Coordenadas más precisas que dos decimales: «-15.78123», «15,7812 S», «15°47'12"».
// Sólo cuentan las que caen cerca del recorte del lago.
const RE_DECIMAL = /(-\s?)?(\d{1,3}[.,]\d{3,})(?:\s*°)?(?:\s*([NSOEW])(?![\p{L}]))?/gu;
const RE_SEXAGESIMAL = /\d{1,3}\s*°\s*\d{1,2}\s*['′’]\s*\d{1,2}(?:[.,]\d+)?\s*(?:"|″|”|'')/g;
export function buscarCoordenadas(texto) {
  const halladas = [];
  const cerca = (n, min, max) => n >= min - 1 && n <= max + 1;
  for (const m of texto.matchAll(RE_DECIMAL)) {
    if (!m[1] && !m[3]) continue;
    const n = Math.abs(Number(m[2].replace(',', '.')));
    if (cerca(n, -RECORTE.latMax, -RECORTE.latMin) || cerca(n, -RECORTE.lonMax, -RECORTE.lonMin)) halladas.push(m[0].trim());
  }
  for (const m of texto.matchAll(RE_SEXAGESIMAL)) halladas.push(m[0].trim());
  return halladas;
}
