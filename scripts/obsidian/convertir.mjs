// Conversión del markdown de Obsidian a markdown estándar para el sitio.
// Lo que está dentro de bloques de código y de `código en línea` no se toca.

export const EXT_IMAGEN = /\.(png|jpe?g|gif|webp|avif|svg)$/i;

// Parte el texto en tramos de código (bloques ``` o ~~~) y tramos de texto.
export function partirCodigo(texto) {
  const tramos = [];
  let actual = { codigo: false, lineas: [] };
  let cerca = null;
  for (const linea of texto.split('\n')) {
    if (!cerca) {
      const m = linea.match(/^ {0,3}(`{3,}|~{3,})/);
      if (m) {
        if (actual.lineas.length) tramos.push(actual);
        actual = { codigo: true, lineas: [linea] };
        cerca = m[1];
      } else {
        actual.lineas.push(linea);
      }
    } else {
      actual.lineas.push(linea);
      const m = linea.match(/^ {0,3}(`{3,}|~{3,})\s*$/);
      if (m && m[1][0] === cerca[0] && m[1].length >= cerca.length) {
        tramos.push(actual);
        actual = { codigo: false, lineas: [] };
        cerca = null;
      }
    }
  }
  if (actual.lineas.length) tramos.push(actual);
  return tramos.map((t) => ({ codigo: t.codigo, texto: t.lineas.join('\n') }));
}

// Posición del cierre de un `código en línea` que abre en i con n acentos graves.
function cierreCodigo(s, i, n) {
  const marca = '`'.repeat(n);
  let j = i + n;
  while ((j = s.indexOf(marca, j)) !== -1) {
    if (s[j - 1] !== '`' && s[j + n] !== '`') return j;
    j += 1;
  }
  return -1;
}

// Quita los comentarios %% … %%, aunque ocupen varias líneas. Como en Obsidian,
// un %% sin cierre comenta hasta el final de la nota.
export function quitarComentarios(tramos) {
  let dentro = false;
  return tramos.map((t) => {
    if (t.codigo) return dentro ? { ...t, texto: '' } : t;
    const s = t.texto;
    let salida = '';
    let i = 0;
    while (i < s.length) {
      if (dentro) {
        const fin = s.indexOf('%%', i);
        if (fin === -1) break;
        dentro = false;
        i = fin + 2;
      } else if (s[i] === '`') {
        let n = 1;
        while (s[i + n] === '`') n++;
        const cierre = cierreCodigo(s, i, n);
        const hasta = cierre === -1 ? i + n : cierre + n;
        salida += s.slice(i, hasta);
        i = hasta;
      } else if (s[i] === '%' && s[i + 1] === '%') {
        dentro = true;
        i += 2;
      } else {
        salida += s[i++];
      }
    }
    return { ...t, texto: salida };
  });
}

// Reemplaza el `código en línea` por marcas para que las conversiones no lo toquen.
function protegerCodigo(s) {
  const guardados = [];
  let salida = '';
  let i = 0;
  while (i < s.length) {
    if (s[i] !== '`') {
      salida += s[i++];
      continue;
    }
    let n = 1;
    while (s[i + n] === '`') n++;
    const cierre = cierreCodigo(s, i, n);
    if (cierre === -1) {
      salida += s.slice(i, i + n);
      i += n;
      continue;
    }
    guardados.push(s.slice(i, cierre + n));
    salida += `\uE000${guardados.length - 1}\uE001`;
    i = cierre + n;
  }
  // `guardar` aparta también lo ya convertido, para que la conversión siguiente no lo vuelva a tocar.
  const guardar = (t) => {
    guardados.push(t);
    return `\uE000${guardados.length - 1}\uE001`;
  };
  const restaurar = (t) => {
    let r = t;
    while (/\uE000\d+\uE001/.test(r)) r = r.replace(/\uE000(\d+)\uE001/g, (_, k) => guardados[Number(k)]);
    return r;
  };
  return { texto: salida, guardar, restaurar };
}

// «Nota#Encabezado|alias» → { destino: «Nota#Encabezado», alias: «alias» }
export function partirWikilink(dentro) {
  const limpio = dentro.replace(/\\\|/g, '|');
  const corte = limpio.indexOf('|');
  if (corte === -1) return { destino: limpio.trim(), alias: null };
  const alias = limpio.slice(corte + 1).trim();
  return { destino: limpio.slice(0, corte).trim(), alias: alias || null };
}

export const esExterno = (destino) => /^[a-z][a-z0-9+.-]*:/i.test(destino) || destino.startsWith('//');

// Ancla de un encabezado, como la genera el sitio: «Dos palabras» → «dos-palabras».
export function anclaEncabezado(texto) {
  return texto
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
    .replace(/ /g, '-');
}

// Destino de un enlace markdown: «<a b.md>», «a%20b.md "título"» → «a b.md».
export function limpiarDestinoMarkdown(destino) {
  let d = destino.trim();
  const angular = d.match(/^<(.+)>$/);
  d = angular ? angular[1] : d.split(/\s+/)[0];
  try {
    return decodeURI(d);
  } catch {
    return d;
  }
}

function convertirTexto(s, ctx) {
  const { texto, guardar, restaurar } = protegerCodigo(s);
  let r = texto
    // ![[imagen.png]] y ![[Otra nota]]
    .replace(/!\[\[([^\]\n]+)\]\]/g, (_, dentro) => {
      const { destino, alias } = partirWikilink(dentro);
      return guardar(ctx.incrustar(destino, alias));
    })
    // [[Nota]], [[Nota|alias]], [[Nota#Encabezado]]
    .replace(/\[\[([^\]\n]+)\]\]/g, (_, dentro) => {
      const { destino, alias } = partirWikilink(dentro);
      return guardar(ctx.enlazar(destino, alias));
    })
    // ![alt](imagen.png) con ruta local
    .replace(/!\[([^\]\n]*)\]\(([^)\n]+)\)/g, (todo, alt, destino) =>
      esExterno(destino.trim()) ? todo : guardar(ctx.imagenMarkdown(limpiarDestinoMarkdown(destino), alt)),
    )
    // [texto](Otra nota.md) con ruta local
    .replace(/(?<!!)\[([^\]\n]+)\]\(([^)\n]+)\)/g, (todo, textoEnlace, destino) => {
      const d = destino.trim();
      if (esExterno(d) || d.startsWith('#') || d.startsWith('/')) return todo;
      const r = ctx.enlaceMarkdown(textoEnlace, limpiarDestinoMarkdown(d));
      return r === null ? todo : guardar(r);
    });

  // Callouts: «> [!nota] Título» pasa a un bloque citado con el título en negrita.
  r = r
    .split('\n')
    .flatMap((linea) => {
      const m = linea.match(/^((?:[ \t]*>)+)[ \t]*\[![^\]\n]+\][+-]?[ \t]*(.*)$/);
      if (!m) return [linea];
      const prefijo = m[1].trim();
      return m[2].trim() ? [`${prefijo} **${m[2].trim()}**`, prefijo] : [];
    })
    .join('\n')
    // Identificadores de bloque de Obsidian («^abc123» al final de la línea).
    .replace(/[ \t]+\^[A-Za-z0-9-]+[ \t]*$/gm, '')
    .replace(/^\^[A-Za-z0-9-]+[ \t]*$/gm, '')
    .replace(/\n{3,}/g, '\n\n');
  return restaurar(r);
}

// `ctx` decide qué hacer con cada enlace e imagen (ver exportar.mjs):
//   enlazar(destino, alias), incrustar(destino, alias),
//   imagenMarkdown(destino, alt), enlaceMarkdown(texto, destino).
export function convertirCuerpo(cuerpo, ctx) {
  const tramos = quitarComentarios(partirCodigo(cuerpo.replace(/\r\n?/g, '\n')));
  return `${tramos
    .map((t) => (t.codigo ? t.texto : convertirTexto(t.texto, ctx)))
    .join('\n')
    .replace(/^\s*\n/, '')
    .trimEnd()}\n`;
}
