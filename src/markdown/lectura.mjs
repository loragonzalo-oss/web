// Plugins de markdown para entradas y ensayos (procesador Sätteri de Astro).
// Se registran en astro.config.mjs. La sintaxis para el autor está en COMO-PUBLICAR.md,
// «Notas, figuras y citas destacadas».
import { fileURLToPath } from 'node:url';

const texto = (value) => ({ type: 'text', value });
const elemento = (tagName, properties, children) => ({ type: 'element', tagName, properties, children });
const esBlanco = (n) => n.type === 'text' && !n.value.trim();
const archivo = (ctx) => (ctx.fileURL ? fileURLToPath(ctx.fileURL).replace(/^.*?src\/content\//, 'src/content/') : 'un archivo markdown');

// Copia un nodo hast sin las referencias internas del procesador.
function copiar(n) {
  if (n.type === 'text') return texto(n.value);
  if (n.type !== 'element') return { type: n.type, value: n.value };
  return elemento(n.tagName, { ...n.properties }, (n.children ?? []).map(copiar));
}

// Figuras. Una imagen sola en su párrafo se convierte en <figure>. El pie y el crédito
// van en el título de la imagen, separados por una barra vertical:
//   ![Texto alternativo](foto.jpg "Pie de foto | Foto: Nombre Apellido, 2025. CC BY 4.0")
// El crédito es obligatorio: sin él, el sitio no se construye.
const SEPARADOR_CREDITO = /\s+\|\s+/;

function partirTitulo(titulo) {
  const partes = String(titulo ?? '').split(SEPARADOR_CREDITO);
  if (partes.length < 2) return { pie: '', credito: partes[0].trim() };
  const credito = partes.pop().trim();
  return { pie: partes.join(' | ').trim(), credito };
}

function errorCredito(ctx, src) {
  return new Error(
    `${archivo(ctx)}: la imagen «${src}» no tiene crédito. ` +
      'Escribilo en el título de la imagen, después del pie y una barra: ' +
      '![Texto alternativo](foto.jpg "Pie de foto | Foto: Nombre Apellido, 2025. CC BY 4.0"). ' +
      'Si no tiene pie, alcanza con el crédito: ![…](foto.jpg "Foto: Nombre Apellido").',
  );
}

const figuras = {
  name: 'figuras-con-credito',
  element: [
    {
      filter: ['p'],
      visit(p, ctx) {
        const hijos = p.children.filter((n) => !esBlanco(n));
        if (hijos.length !== 1 || hijos[0].type !== 'element' || hijos[0].tagName !== 'img') return;
        const img = hijos[0];
        const { title, ...propiedades } = img.properties;
        const { pie, credito } = partirTitulo(title);
        if (!credito) throw errorCredito(ctx, img.properties.src);
        const leyenda = [];
        if (pie) leyenda.push(elemento('span', { className: ['figura-pie'] }, [texto(pie)]), texto(' '));
        leyenda.push(elemento('span', { className: ['figura-credito'] }, [texto(credito)]));
        ctx.replaceNode(
          p,
          elemento('figure', { className: ['figura'] }, [
            elemento('img', propiedades, []),
            elemento('figcaption', {}, leyenda),
          ]),
        );
      },
    },
    {
      // Una imagen dentro de un párrafo con texto también necesita crédito.
      filter: ['img'],
      visit(img, ctx) {
        const padre = ctx.parent(img);
        const sola = padre?.type === 'element' && padre.tagName === 'p' && padre.children.filter((n) => !esBlanco(n)).length === 1;
        if (sola) return; // la resuelve el visitante de párrafos
        if (!partirTitulo(img.properties.title).credito) throw errorCredito(ctx, img.properties.src);
      },
    },
  ],
};

// Citas destacadas: la sintaxis de los «callouts» de Obsidian.
//   > [!destacada]
//   > Una frase del propio texto que se quiere resaltar.
// Repite una frase que ya está en el texto, así que los lectores de pantalla la saltean.
const MARCA_DESTACADA = /^\s*\[!destacada\]\s*/i;

const citasDestacadas = {
  name: 'citas-destacadas',
  element: {
    filter: ['blockquote'],
    visit(cita, ctx) {
      const parrafos = cita.children.filter((n) => n.type === 'element');
      const primero = parrafos[0];
      const inicio = primero?.tagName === 'p' ? primero.children[0] : undefined;
      if (inicio?.type !== 'text' || !MARCA_DESTACADA.test(inicio.value)) return;
      const contenido = parrafos.map(copiar);
      const resto = inicio.value.replace(MARCA_DESTACADA, '');
      contenido[0].children[0] = texto(resto);
      if (!resto) contenido[0].children.shift();
      if (contenido[0].children.length === 0) contenido.shift();
      // Si el autor ya escribió comillas, el estilo no agrega otras.
      const conComillas = /^[«"“'‘]/.test(ctx.textContent(cita).replace(MARCA_DESTACADA, '').trim());
      ctx.replaceNode(
        cita,
        elemento('aside', { className: ['cita-destacada', ...(conComillas ? ['con-comillas'] : [])], ariaHidden: 'true' }, contenido),
      );
    },
  },
};

export const pluginsLectura = [figuras, citasDestacadas];

// Notas al pie en castellano. Cada llamada lleva a su nota y cada nota vuelve a su llamada.
export const notasAlPie = {
  label: 'Notas',
  backLabel: 'Volver a la llamada de la nota {reference}',
  backContent: '↩\uFE0E', // flecha como texto, no como emoji
};
