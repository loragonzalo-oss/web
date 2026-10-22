// Mapa interactivo de /mapa. Se carga sólo en esa página.
// Los datos (puntos, vista inicial) los escribe mapa.astro en <script id="datos-mapa">.
// Las fichas no viajan como datos: están dibujadas en el listado y el panel las copia.
import L from 'leaflet';

interface Punto { id: string; titulo: string; capa: string; lat: number; lon: number; aproximado: boolean }
interface Datos { puntos: Punto[]; vista: L.LatLngBoundsLiteral; radio: number }

const datos: Datos = JSON.parse(document.getElementById('datos-mapa')!.textContent!);
const contenedor = document.getElementById('mapa')!;
const panel = document.getElementById('ficha-panel')!;
const panelContenido = panel.querySelector<HTMLElement>('.ficha-panel-contenido')!;
const filtro = document.querySelector<HTMLFieldSetElement>('.capas')!;
const estado = document.querySelector<HTMLElement>('.listado-estado');
const items = [...document.querySelectorAll<HTMLElement>('.listado-item')];

// --- Mapa base ---------------------------------------------------------------

const mapa = L.map(contenedor, { scrollWheelZoom: false, zoomSnap: 0.5 });
mapa.fitBounds(datos.vista);
mapa.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '© <a href="https://www.openstreetmap.org/copyright">colaboradores de OpenStreetMap</a>',
}).addTo(mapa);

// La rueda del ratón hace zoom sólo después de tocar el mapa, para no atrapar
// el desplazamiento de la página.
mapa.on('focus click', () => mapa.scrollWheelZoom.enable());
mapa.on('blur mouseout', () => mapa.scrollWheelZoom.disable());

// --- Puntos, agrupados por capa ----------------------------------------------

const grupos = new Map<string, L.LayerGroup>();
const marcadores = new Map<string, L.Marker>();

for (const p of datos.puntos) {
  if (!grupos.has(p.capa)) grupos.set(p.capa, L.layerGroup().addTo(mapa));
  const grupo = grupos.get(p.capa)!;
  const abrir = () => abrirFicha(p.id);

  if (p.aproximado) {
    L.circle([p.lat, p.lon], {
      radius: datos.radio,
      className: `zona-aproximada capa-${p.capa}`,
      bubblingMouseEvents: false,
    }).on('click', abrir).addTo(grupo);
  }
  const icono = L.divIcon({
    className: 'pin-envoltura',
    html: `<span class="pin capa-${p.capa}${p.aproximado ? ' pin-aproximado' : ''}"><span class="pin-icono"></span></span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
  const marcador = L.marker([p.lat, p.lon], { icon: icono, title: p.titulo, alt: p.titulo, riseOnHover: true })
    .on('click', abrir)
    .addTo(grupo);
  marcadores.set(p.id, marcador);
}

// --- Ficha lateral -------------------------------------------------------------

let abierta: string | null = null;
let focoPrevio: HTMLElement | null = null;

function abrirFicha(id: string, { centrar = true } = {}) {
  const item = items.find((i) => i.dataset.lugar === id);
  if (!item) return;
  if (!abierta) focoPrevio = document.activeElement as HTMLElement;

  // Copia de la ficha del listado. El título pasa a h2 y queda como nombre del panel.
  const cabecera = item.querySelector('.ficha-cabecera')!.cloneNode(true) as HTMLElement;
  const h3 = cabecera.querySelector('h3')!;
  const h2 = document.createElement('h2');
  h2.className = h3.className;
  h2.id = 'ficha-panel-titulo';
  h2.textContent = h3.textContent;
  h3.replaceWith(h2);
  const cuerpo = item.querySelector('.ficha-cuerpo')!.cloneNode(true) as HTMLElement;
  panelContenido.replaceChildren(cabecera, cuerpo);
  panel.setAttribute('aria-labelledby', h2.id);
  panel.hidden = false;
  panel.scrollTop = 0;

  marcarActivo(id);
  abierta = id;
  history.replaceState(null, '', `#lugar-${id}`);

  const marcador = marcadores.get(id);
  if (marcador && centrar) {
    mapa.setView(marcador.getLatLng(), Math.max(mapa.getZoom(), 10), { animate: false });
    // Corre el punto hacia la parte del mapa que la ficha no tapa.
    const enCelular = panel.offsetWidth >= contenedor.offsetWidth - 2;
    mapa.panBy(enCelular ? [0, panel.offsetHeight / 2] : [panel.offsetWidth / 2, 0], { animate: false });
  }
  panel.focus({ preventScroll: true });
}

function cerrarFicha() {
  if (!abierta) return;
  panel.hidden = true;
  panelContenido.replaceChildren();
  marcarActivo(null);
  abierta = null;
  history.replaceState(null, '', location.pathname + location.search);
  focoPrevio?.focus({ preventScroll: true });
}

function marcarActivo(id: string | null) {
  for (const [clave, m] of marcadores) {
    m.getElement()?.querySelector('.pin')?.classList.toggle('activo', clave === id);
  }
}

panel.querySelector('.ficha-cerrar')!.addEventListener('click', cerrarFicha);
panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarFicha(); });
mapa.on('click', cerrarFicha);

// --- Filtro por capa (mapa y listado a la vez) -----------------------------------

const casillas = [...filtro.querySelectorAll<HTMLInputElement>('input[type=checkbox]')];

function aplicarFiltro() {
  const activas = new Set(casillas.filter((c) => c.checked).map((c) => c.value));
  for (const [capa, grupo] of grupos) {
    if (activas.has(capa)) grupo.addTo(mapa);
    else grupo.remove();
  }
  let visibles = 0;
  for (const item of items) {
    item.hidden = !activas.has(item.dataset.capa!);
    if (!item.hidden) visibles++;
  }
  if (estado && items.length) estado.textContent = `Se muestran ${visibles} de ${items.length} lugares.`;
}

casillas.forEach((c) => c.addEventListener('change', aplicarFiltro));
filtro.querySelector('[data-todas]')!.addEventListener('click', () => { casillas.forEach((c) => (c.checked = true)); aplicarFiltro(); });
filtro.querySelector('[data-ninguna]')!.addEventListener('click', () => { casillas.forEach((c) => (c.checked = false)); aplicarFiltro(); });
filtro.hidden = false;
aplicarFiltro();

// --- Listado: «Ver en el mapa» ------------------------------------------------

for (const item of items) {
  const boton = item.querySelector<HTMLButtonElement>('[data-ver-en-mapa]');
  if (!boton) continue;
  boton.hidden = false;
  boton.addEventListener('click', () => {
    contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    abrirFicha(item.dataset.lugar!);
  });
}

// Un enlace con #lugar-<id> abre esa ficha (sirve para compartir un lugar).
function abrirDesdeEnlace() {
  const id = decodeURIComponent(location.hash.match(/^#lugar-(.+)$/)?.[1] ?? '');
  if (!id || id === abierta || !items.some((i) => i.dataset.lugar === id)) return;
  contenedor.scrollIntoView({ block: 'start' });
  abrirFicha(id);
}
window.addEventListener('hashchange', abrirDesdeEnlace);
// Al cargar, el navegador baja solo hasta el lugar en el listado; se espera a que
// termine para subir al mapa.
if (document.readyState === 'complete') abrirDesdeEnlace();
else window.addEventListener('load', () => requestAnimationFrame(abrirDesdeEnlace), { once: true });
