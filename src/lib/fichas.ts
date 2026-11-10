// Tipos de ficha de un lugar del mapa (campo `ficha` del frontmatter). La capa dice en qué tema
// del mapa aparece el lugar; el tipo de ficha dice cómo se arma la ficha. Son independientes:
// un sitio sagrado puede estar en Cultura o en Antropología, y un ser del lago, en Biodiversidad.
// Una ficha sin `ficha` se dibuja como siempre.
//
// El campo no se llama `tipo` porque el puente con Obsidian ya usa `tipo: blog | ensayo | lugar`.
//
// Estos controles los usan el esquema (src/content.config.ts) y el puente con Obsidian
// (scripts/obsidian/controles.mjs): una sola fuente para los dos. Sin dependencias de Astro, para
// que Node los pueda importar en las pruebas.
import { slugificar } from './slug.ts';

export const FICHAS = [
  { id: 'municipio', nombre: 'Municipio' },
  { id: 'sitio', nombre: 'Sitio' },                       // arqueológico, histórico o cultural
  { id: 'sitio-sagrado', nombre: 'Sitio sagrado' },
  { id: 'ser', nombre: 'Ser del lago' },                  // especie o ser con nombre propio
  { id: 'ecosistema', nombre: 'Ecosistema' },
  { id: 'artesano', nombre: 'Artesanía' },
  { id: 'emprendimiento', nombre: 'Emprendimiento' },
  { id: 'agencia-turismo-comunitario', nombre: 'Agencia de turismo comunitario' },
] as const;

export type IdFicha = (typeof FICHAS)[number]['id'];
export const IDS_FICHAS = FICHAS.map((f) => f.id) as [IdFicha, ...IdFicha[]];

// Fichas de personas y negocios: llevan el bloque «Contactar o comprar» y van en /mapa/artesanos/.
export const FICHAS_CONTACTO: readonly IdFicha[] = ['artesano', 'emprendimiento', 'agencia-turismo-comunitario'];
export const esFichaContacto = (f: unknown) => typeof f === 'string' && (FICHAS_CONTACTO as readonly string[]).includes(f);

export const nombreFicha = (id: IdFicha) => FICHAS.find((f) => f.id === id)!.nombre;

// «Sitio sagrado», «sitio_sagrado» y «sitio-sagrado» valen lo mismo; también el nombre que ve el
// lector («Agencia de turismo comunitario», «Artesanía», «Ser del lago»).
export function normalizarFicha(v: unknown) {
  if (typeof v !== 'string') return v;
  const s = slugificar(v.replace(/_/g, '-'));
  return FICHAS.find((f) => slugificar(f.nombre) === s)?.id ?? (s || undefined);
}

// Campos propios de cada tipo. Un campo de otro tipo frena la ficha: casi siempre es un tipo
// mal elegido o un campo copiado de otra plantilla.
export const CAMPOS_POR_FICHA: Record<string, readonly IdFicha[]> = {
  nombre_oficial: ['municipio'],
  departamento: ['municipio'],
  provincia: ['municipio'],
  gobierno: ['municipio'],
  consulta: ['sitio-sagrado'],
  nombre_comun: ['ser'],
  nombre_cientifico: ['ser'],
  nombres_originarios: ['ser'],
  oficio: FICHAS_CONTACTO,
  comunidad: FICHAS_CONTACTO,
  contacto: FICHAS_CONTACTO,
  consentimiento: FICHAS_CONTACTO,
};

// Regla 6. Un lugar es sensible si lo marca el autor, si está en la capa Arqueología o si es una
// ficha de sitio sagrado (decisión del autor, 24-10-2026). Devuelve el motivo, para los mensajes.
export function motivoSensible(d: { sensible?: unknown; capa?: unknown; ficha?: unknown }): string | null {
  if (d.sensible === true) return 'marcado con «sensible: true»';
  if (typeof d.capa === 'string' && slugificar(d.capa) === 'arqueologia') return 'capa Arqueología';
  if (normalizarFicha(d.ficha) === 'sitio-sagrado') return 'ficha de sitio sagrado';
  return null;
}

// --- Teléfonos y direcciones (regla 5) ---------------------------------------------------------

// Un número de teléfono: siete dígitos o más, con espacios, puntos, guiones o paréntesis entre
// medio, con o sin prefijo de país («+591 2 2123456», «(02) 212-3456», «71234567»).
const RE_NUMERO = /\+?\(?\d[\d\s().\-/]{5,}\d/g;
const digitos = (s: string) => s.replace(/\D/g, '').length;
export function pareceTelefono(texto: string) {
  return (texto.match(RE_NUMERO) ?? []).some((m) => digitos(m) >= 7);
}

// WhatsApp abre una conversación con un número: es un teléfono.
const RE_WHATSAPP = /(^|[/.@])(wa\.me|wa\.link|api\.whatsapp\.com|whatsapp\.com\/send)(\/|\?|$)/i;

// Qué tiene de malo un enlace de «contacto». Sólo valen la página de la persona, su red social o
// un formulario (https://…) y, si ella lo quiere, un correo (mailto:). Nunca un teléfono.
export function problemaContacto(e: { texto?: unknown; url?: unknown }): string | null {
  const url = typeof e.url === 'string' ? e.url.trim() : '';
  const texto = typeof e.texto === 'string' ? e.texto : '';
  const esquema = url.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
  if (esquema && ['tel', 'sms', 'callto', 'whatsapp'].includes(esquema)) {
    return `«${url}» es un teléfono (${esquema}:). Regla 5: ni teléfonos ni direcciones; sólo la página, la red social o un formulario de la persona.`;
  }
  if (RE_WHATSAPP.test(url)) {
    return `«${url}» abre WhatsApp con un número de teléfono. Regla 5: ni teléfonos ni direcciones; sólo la página, la red social o un formulario de la persona.`;
  }
  if (esquema && !['http', 'https', 'mailto'].includes(esquema)) {
    return `«${url}»: en «contacto» van sólo direcciones web (https://…) o un correo (mailto:…).`;
  }
  // En la dirección, sólo cuenta un número escrito como teléfono (con «+» o en un parámetro de
  // teléfono): las redes sociales usan números largos en sus direcciones.
  const enUrl = /\+\d/.test(decodeURIComponentSeguro(url)) || /[?&](phone|tel|telefono|celular|whatsapp|numero)=\+?\d/i.test(url);
  if (enUrl || pareceTelefono(texto)) {
    return `«${texto || url}» tiene un número de teléfono. Regla 5: ni teléfonos ni direcciones en la ficha.`;
  }
  return null;
}

function decodeURIComponentSeguro(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

// --- Controles del tipo de ficha ---------------------------------------------------------------

export interface DatosFicha {
  ficha?: string;
  capa?: string;
  sensible?: boolean;
  draft?: boolean;
  enlaces?: { texto?: unknown; url?: unknown }[];
  contacto?: { texto?: unknown; url?: unknown }[];
  consentimiento?: unknown;
  [campo: string]: unknown;
}

export interface ErrorFicha { campo: string; mensaje: string }

const presente = (v: unknown) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);

export function erroresFicha(d: DatosFicha): ErrorFicha[] {
  const errores: ErrorFicha[] = [];
  const ficha = d.ficha as IdFicha | undefined;

  // Sitio sagrado: siempre sensible, no se puede desactivar (decisión del autor, 24-10-2026).
  if (ficha === 'sitio-sagrado' && d.sensible === false) {
    errores.push({
      campo: 'sensible',
      mensaje: 'Regla 6: una ficha «sitio-sagrado» es siempre sensible y no admite «sensible: false» (decisión del autor, 24-10-2026). Borrá «sensible: false» o cambiá el tipo de ficha.',
    });
  }

  for (const [campo, tipos] of Object.entries(CAMPOS_POR_FICHA)) {
    if (!presente(d[campo]) || (ficha && tipos.includes(ficha))) continue;
    const lista = tipos.map((t) => `«${t}»`).join(', ');
    errores.push({
      campo,
      mensaje: `«${campo}» va sólo en fichas ${lista}; esta ${ficha ? `es «${ficha}»` : 'no dice «ficha»'}. Revisá el tipo de ficha o borrá el campo.`,
    });
  }

  // Regla 5: ni teléfonos ni direcciones. En «contacto», tampoco en el texto del enlace;
  // en «enlaces», el esquema del enlace (tel:, WhatsApp).
  (d.contacto ?? []).forEach((e, i) => {
    const p = problemaContacto(e);
    if (p) errores.push({ campo: 'contacto', mensaje: `«contacto», enlace ${i + 1}: ${p}` });
  });
  (d.enlaces ?? []).forEach((e, i) => {
    const p = problemaContacto({ url: e.url });
    if (p && !/^«[^»]*»: en «contacto»/.test(p)) errores.push({ campo: 'enlaces', mensaje: `«enlaces», enlace ${i + 1}: ${p}` });
  });

  // Una persona o un negocio figuran sólo si aceptaron: sin fecha de consentimiento no se publica.
  if (esFichaContacto(ficha) && !d.draft && !presente(d.consentimiento)) {
    errores.push({
      campo: 'consentimiento',
      mensaje: `Falta «consentimiento»: la fecha (AAAA-MM-DD) en que la persona aceptó figurar. Una ficha «${ficha}» no se publica sin ella. Mientras tanto, dejala en «draft: true».`,
    });
  }
  return errores;
}

// Avisos que no frenan: el build los muestra en la terminal.
export function avisosFicha(d: DatosFicha & { consulta?: { fecha?: unknown } }, nombre: string): string[] {
  const avisos: string[] = [];
  if (d.ficha === 'sitio-sagrado' && !presente(d.consulta?.fecha)) {
    avisos.push(`«${nombre}»: ficha de sitio sagrado sin «consulta» (con quién se habló y cuándo). No frena la publicación; conviene registrarla.`);
  }
  return avisos;
}
