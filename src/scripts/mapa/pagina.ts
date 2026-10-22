// Parte liviana de /mapa: búsqueda, filtros por capa y por país, dirección compartible y
// leyenda. Corre siempre, haya mapa o no, y filtra el listado.
//
// El motor del mapa (motor.ts, con MapLibre, unos 430 KB comprimidos) se carga aparte, sólo si
// el navegador tiene WebGL, el lector no pidió menos movimiento y la conexión no pide ahorrar
// datos. Si no, la página queda en su versión liviana: el listado completo, con los mismos
// filtros, y un aviso (CLAUDE.md, «Piezas inmersivas»).
//
// Dirección: ?capa=clima,cultura&pais=bolivia,sin-pais&q=texto#lugar-<id>
// Un parámetro que falta quiere decir «todas». El #lugar-<id> abre esa ficha.
import type { Datos } from './tipos';

const datos: Datos = JSON.parse(document.getElementById('datos-mapa')!.textContent!);
const controles = document.querySelector<HTMLElement>('[data-controles]')!;
const buscador = document.querySelector<HTMLInputElement>('#mapa-buscar')!;
const filtros = {
  capa: [...document.querySelectorAll<HTMLInputElement>('[data-filtro="capa"] input[type=checkbox]')],
  pais: [...document.querySelectorAll<HTMLInputElement>('[data-filtro="pais"] input[type=checkbox]')],
};
const items = [...document.querySelectorAll<HTMLElement>('.listado-item')];
const estado = document.querySelector<HTMLElement>('.listado-estado');
const sinResultados = document.querySelector<HTMLElement>('[data-sin-resultados]');
const aviso = document.querySelector<HTMLElement>('[data-aviso]')!;
const zona = document.querySelector<HTMLElement>('[data-mapa-zona]')!;
const pie = document.querySelector<HTMLElement>('[data-mapa-pie]')!;
const leyenda = document.querySelector<HTMLDetailsElement>('[data-leyenda]');
const plegables = document.querySelector<HTMLDetailsElement>('[data-filtros]');
const resumenFiltros = document.querySelector<HTMLElement>('[data-filtros-resumen]');

export const normalizar = (t: string) => t.toLocaleLowerCase('es').normalize('NFD').replace(/\p{M}/gu, '').trim();

// --- Filtro -------------------------------------------------------------------------------

type Oyente = (visibles: Set<string>) => void;
const oyentes: Oyente[] = [];
let visibles = new Set(items.map((i) => i.dataset.lugar!));

function aplicar({ escribir = true } = {}) {
  const capas = new Set(filtros.capa.filter((c) => c.checked).map((c) => c.value));
  const paises = new Set(filtros.pais.filter((c) => c.checked).map((c) => c.value));
  const palabras = normalizar(buscador.value).split(/\s+/).filter(Boolean);
  visibles = new Set();
  for (const item of items) {
    const ve =
      capas.has(item.dataset.capa!) &&
      paises.has(item.dataset.pais!) &&
      palabras.every((p) => item.dataset.texto!.includes(p));
    item.hidden = !ve;
    if (ve) visibles.add(item.dataset.lugar!);
  }
  if (estado && items.length) {
    estado.textContent = visibles.size === items.length
      ? `Se muestran los ${items.length} lugares.`
      : `Se muestran ${visibles.size} de ${items.length} lugares.`;
  }
  if (sinResultados) sinResultados.hidden = visibles.size > 0 || items.length === 0;
  if (resumenFiltros) {
    const apagadas = filtros.capa.filter((c) => !c.checked).length + filtros.pais.filter((c) => !c.checked).length;
    resumenFiltros.textContent = apagadas ? `(${apagadas} apagado${apagadas > 1 ? 's' : ''})` : '(todo a la vista)';
  }
  if (escribir) escribirDireccion();
  for (const o of oyentes) o(visibles);
}

// --- Dirección compartible ------------------------------------------------------------------

function escribirDireccion() {
  const p = new URLSearchParams(location.search);
  for (const [nombre, casillas] of Object.entries(filtros)) {
    const marcadas = casillas.filter((c) => c.checked).map((c) => c.value);
    if (marcadas.length === casillas.length) p.delete(nombre);
    else p.set(nombre, marcadas.join(','));
  }
  const q = buscador.value.trim();
  if (q) p.set('q', q);
  else p.delete('q');
  const busqueda = p.toString().replace(/%2C/g, ',');
  const nueva = `${location.pathname}${busqueda ? `?${busqueda}` : ''}${location.hash}`;
  if (nueva !== `${location.pathname}${location.search}${location.hash}`) history.replaceState(history.state, '', nueva);
}

function leerDireccion() {
  const p = new URLSearchParams(location.search);
  for (const [nombre, casillas] of Object.entries(filtros)) {
    if (!p.has(nombre)) continue;
    const pedidas = new Set(p.get(nombre)!.split(',').map((v) => v.trim()));
    for (const c of casillas) c.checked = pedidas.has(c.value);
  }
  buscador.value = p.get('q') ?? '';
}

// --- Controles --------------------------------------------------------------------------------

for (const casilla of [...filtros.capa, ...filtros.pais]) casilla.addEventListener('change', () => aplicar());
document.querySelector('[data-todas]')?.addEventListener('click', () => { filtros.capa.forEach((c) => (c.checked = true)); aplicar(); });
document.querySelector('[data-ninguna]')?.addEventListener('click', () => { filtros.capa.forEach((c) => (c.checked = false)); aplicar(); });
buscador.addEventListener('input', () => aplicar());
// Enter no envía nada: deja el foco en el campo y anuncia el resultado.
buscador.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); });

leerDireccion();
controles.hidden = false;
aplicar({ escribir: false });

// En celular, la leyenda y los filtros empiezan plegados para que el mapa quede cerca de arriba.
if (matchMedia('(max-width: 700px)').matches) {
  if (leyenda) leyenda.open = false;
  if (plegables) plegables.open = false;
}

// --- ¿Mapa o versión liviana? -----------------------------------------------------------------

function tieneWebGL() {
  try {
    const lienzo = document.createElement('canvas');
    const gl = lienzo.getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

// Versión liviana: sin mapa. Un enlace #lugar-<id> abre esa ficha en el listado.
function versionLiviana(texto: string, { ofrecerMapa = false, boton: textoBoton = 'Cargar el mapa igual' } = {}) {
  zona.hidden = true;
  pie.hidden = true;
  aviso.querySelector('[data-aviso-texto]')!.textContent = texto;
  const boton = aviso.querySelector<HTMLButtonElement>('[data-cargar-igual]')!;
  boton.hidden = !ofrecerMapa;
  boton.textContent = textoBoton;
  boton.onclick = () => { aviso.hidden = true; cargarMapa(); };
  aviso.hidden = false;
  abrirEnListado();
}

function abrirEnListado() {
  const id = idDesdeHash();
  const item = id && items.find((i) => i.dataset.lugar === id);
  if (!item) return;
  item.hidden = false;
  item.querySelector('details')?.setAttribute('open', '');
  item.scrollIntoView({ block: 'start' });
}

export function idDesdeHash() {
  const id = decodeURIComponent(location.hash.match(/^#lugar-(.+)$/)?.[1] ?? '');
  return items.some((i) => i.dataset.lugar === id) ? id : null;
}

async function cargarMapa() {
  zona.hidden = false;
  pie.hidden = false;
  try {
    const { iniciar } = await import('./motor');
    await iniciar({
      datos,
      visibles: () => visibles,
      alFiltrar: (o: Oyente) => oyentes.push(o),
      idDesdeHash,
    });
  } catch (e) {
    console.warn('[mapa] No se pudo cargar el mapa:', e);
    versionLiviana('El mapa interactivo no se pudo cargar. Abajo están todos los lugares, con los mismos filtros.');
  }
}

// Conexión que pide ahorrar datos o muy lenta (sólo lo informan algunos navegadores).
const conexion = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
const ahorrarDatos = !!conexion?.saveData || /(^|-)2g$/.test(conexion?.effectiveType ?? '');

if (!tieneWebGL()) {
  versionLiviana('Este navegador no puede dibujar el mapa interactivo (le falta WebGL). Abajo están todos los lugares, con los mismos filtros.');
} else if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  versionLiviana('Pediste menos movimiento: el mapa interactivo no se carga. Abajo están todos los lugares, con los mismos filtros.', { ofrecerMapa: true, boton: 'Cargar el mapa igual, sin animaciones' });
} else if (ahorrarDatos) {
  versionLiviana('Tu conexión pide ahorrar datos: el mapa interactivo (unos 430 KB) no se descarga solo. Abajo están todos los lugares, con los mismos filtros.', { ofrecerMapa: true });
} else {
  cargarMapa();
}
window.addEventListener('hashchange', () => { if (zona.hidden) abrirEnListado(); });
