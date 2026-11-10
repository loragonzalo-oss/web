// Motor del mapa de /mapa, con MapLibre GL JS (BSD-3). Lo carga pagina.ts sólo si el navegador
// tiene WebGL y la conexión no pide ahorrar datos; ninguna otra página lo carga. Si el lector
// pidió menos movimiento, el mapa se mueve sin animaciones (y nunca se inclina: no hay 3D).
//
// - Fondos: los define src/lib/mapa-fondos.ts; el lector elige uno con el control «Fondo».
// - Lugares: marcadores HTML (botones, para el teclado y los lectores de pantalla), agrupados
//   según el zoom. Las líneas y los polígonos se dibujan debajo, con su marcador encima.
// - Ficha: panel a la derecha en escritorio y desde abajo en celular. La copia del listado.
// - Dirección: #lugar-<id> abre la ficha. El botón «atrás» del navegador la cierra.
//
// Regla 6: el navegador sólo recibe lo que ya viene desplazado del servidor (src/lib/lugares.ts).
// Los grupos se arman con esas posiciones, así que tampoco pueden revelar la original.
import {
  AttributionControl,
  Map as Mapa,
  Marker,
  NavigationControl,
  setWorkerUrl,
  type ExpressionSpecification,
  type GeoJSONSource,
  type LayerSpecification,
  type MapGeoJSONFeature,
  type SourceSpecification,
} from 'maplibre-gl';
import urlEstilos from 'maplibre-gl/dist/maplibre-gl.css?url';
import urlTrabajador from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { crearPanel } from './panel';
import { colorPorCapa as expresionColor } from './estilo';
import type { Datos, LugarMapa } from './tipos';

interface Opciones {
  datos: Datos;
  visibles: () => Set<string>;
  alFiltrar: (f: (visibles: Set<string>) => void) => void;
  idDesdeHash: () => string | null;
}

setWorkerUrl(urlTrabajador);

// Los estilos de MapLibre se piden recién acá: la versión liviana de la página no los descarga.
const estilos = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: urlEstilos });
const estilosListos = new Promise<void>((listo) => {
  estilos.addEventListener('load', () => listo());
  estilos.addEventListener('error', () => listo());
});
document.head.prepend(estilos);

const menosMovimiento = matchMedia('(prefers-reduced-motion: reduce)');

const ZOOM_GRUPOS = 11;    // desde este zoom, ningún grupo: cada lugar con su marcador
const ZOOM_FICHA = 12;     // zoom al abrir la ficha de un punto
const CAPAS_TOCABLES = ['formas-relleno', 'formas-linea', 'formas-linea-aproximada', 'zonas-relleno'];

export async function iniciar({ datos, visibles, alFiltrar, idDesdeHash }: Opciones) {
  await estilosListos;
  const contenedor = document.getElementById('mapa')!;
  const raiz = document.documentElement;
  const porId = new Map(datos.lugares.map((l) => [l.id, l]));
  const items = [...document.querySelectorAll<HTMLElement>('.listado-item')];
  const { latMin, latMax, lonMin, lonMax } = datos.recorte;
  const [[s, o], [n, e]] = datos.vista;

  // --- Colores del tema (variables CSS) ------------------------------------------------------

  // Cualquier color CSS (hex, rgb, oklch…) pasado a rgba, que es lo que entiende MapLibre.
  const lienzo = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
  lienzo.canvas.width = lienzo.canvas.height = 1;
  const rgba = (css: string, alfa = 1) => {
    lienzo.clearRect(0, 0, 1, 1);
    lienzo.fillStyle = '#000';
    lienzo.fillStyle = css || '#000';
    lienzo.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = lienzo.getImageData(0, 0, 1, 1).data;
    return `rgba(${r}, ${g}, ${b}, ${((a / 255) * alfa).toFixed(3)})`;
  };
  const variable = (nombre: string) => getComputedStyle(raiz).getPropertyValue(nombre).trim();
  // Todas las capas del sitio (src/lib/capas.ts), no sólo las de los lugares publicados: el estilo
  // tiene que valer también con cero lugares o con lugares de una sola capa.
  const capas = Object.keys(datos.nombresCapas);
  const colorPorCapa = (alfa = 1) =>
    expresionColor(capas, (c) => rgba(variable(`--color-capa-${c}`), alfa), rgba(variable('--color-acento'), alfa));
  // El tema decide si el mapa va oscuro: con --mapa-filtro-teselas distinto de «none».
  const oscuro = () => variable('--mapa-filtro-teselas') !== 'none' && variable('--mapa-filtro-teselas') !== '';

  // --- Fuentes de datos -------------------------------------------------------------------------

  const visiblesEnMapa = () => datos.lugares.filter((l) => visibles().has(l.id));
  const puntos = (lista: LugarMapa[]): GeoJSON.FeatureCollection => ({
    type: 'FeatureCollection',
    features: lista.map((l) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: l.punto },
      properties: { id: l.id, capa: l.capa, tipo: l.tipo, aproximado: l.aproximado },
    })),
  });
  const formas = (lista: LugarMapa[]): GeoJSON.FeatureCollection => ({
    type: 'FeatureCollection',
    features: lista.filter((l) => l.forma).map((l) => ({
      type: 'Feature',
      geometry: l.forma as GeoJSON.Geometry,
      properties: { id: l.id, capa: l.capa, aproximado: l.aproximado },
    })),
  });
  // Zona de un punto aproximado: círculo de `radio` metros alrededor del punto ya desplazado.
  const zonas = (lista: LugarMapa[]): GeoJSON.FeatureCollection => ({
    type: 'FeatureCollection',
    features: lista.filter((l) => l.aproximado && l.tipo === 'punto').map((l) => {
      const [x, y] = l.punto;
      const anillo: [number, number][] = [];
      for (let i = 0; i <= 48; i++) {
        const t = (i / 48) * 2 * Math.PI;
        anillo.push([x + (datos.radio * Math.sin(t)) / (111320 * Math.cos((y * Math.PI) / 180)), y + (datos.radio * Math.cos(t)) / 111320]);
      }
      return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [anillo] }, properties: { id: l.id, capa: l.capa } };
    }),
  });

  // --- Estilo: fondos y capas ------------------------------------------------------------------

  const fuentes: Record<string, SourceSpecification> = {};
  const capasFondo: LayerSpecification[] = [{ id: 'fondo-color', type: 'background', paint: { 'background-color': rgba(variable('--color-superficie')) } }];
  for (const f of datos.fondos.filter((x) => x.disponible)) {
    const visibilidad = f.id === datos.predeterminado ? 'visible' : 'none';
    if (f.tipo === 'raster') {
      fuentes[`fondo-${f.id}`] = { type: 'raster', tiles: [f.teselas], tileSize: f.tamTesela, maxzoom: f.zoomMax, attribution: f.atribucion };
      capasFondo.push({ id: `fondo-${f.id}`, type: 'raster', source: `fondo-${f.id}`, layout: { visibility: visibilidad } });
    } else {
      fuentes[`fondo-${f.id}`] = {
        type: 'raster-dem', tiles: [f.teselas], tileSize: f.tamTesela, maxzoom: f.zoomMax,
        encoding: datos.codificacionRelieve, bounds: [lonMin, latMin, lonMax, latMax], attribution: f.atribucion,
      };
      capasFondo.push({ id: `fondo-${f.id}`, type: 'hillshade', source: `fondo-${f.id}`, layout: { visibility: visibilidad } });
    }
  }
  if (datos.lagoSintetico) {
    fuentes.lago = { type: 'geojson', data: datos.lagoSintetico };
    capasFondo.push({ id: 'lago', type: 'fill', source: 'lago', layout: { visibility: 'none' }, paint: { 'fill-color': rgba(variable('--color-acento')), 'fill-opacity': 0.14 } });
  }
  fuentes.formas = { type: 'geojson', data: formas(visiblesEnMapa()) };
  fuentes.zonas = { type: 'geojson', data: zonas(visiblesEnMapa()) };
  fuentes.lugares = { type: 'geojson', data: puntos(visiblesEnMapa()), cluster: true, clusterRadius: 44, clusterMaxZoom: ZOOM_GRUPOS - 1 };

  const esLinea: ExpressionSpecification = ['==', ['geometry-type'], 'LineString'];
  const aproximado: ExpressionSpecification = ['==', ['get', 'aproximado'], true];
  const capasLugares: LayerSpecification[] = [
    { id: 'formas-relleno', type: 'fill', source: 'formas', filter: ['!', esLinea], paint: { 'fill-color': colorPorCapa(), 'fill-opacity': 0.2 } },
    { id: 'formas-linea', type: 'line', source: 'formas', filter: ['!', aproximado], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': colorPorCapa(), 'line-width': ['case', esLinea, 4, 2] } },
    { id: 'formas-linea-aproximada', type: 'line', source: 'formas', filter: aproximado, paint: { 'line-color': colorPorCapa(), 'line-width': ['case', esLinea, 4, 2], 'line-dasharray': [2, 2] } },
    { id: 'zonas-relleno', type: 'fill', source: 'zonas', paint: { 'fill-color': colorPorCapa(), 'fill-opacity': 0.18 } },
    { id: 'zonas-borde', type: 'line', source: 'zonas', paint: { 'line-color': colorPorCapa(), 'line-width': 2, 'line-dasharray': [2.5, 2.5] } },
    // Invisible: MapLibre sólo carga una fuente si alguna capa la usa. Los marcadores son HTML.
    { id: 'lugares-ancla', type: 'circle', source: 'lugares', paint: { 'circle-radius': 0, 'circle-opacity': 0 } },
  ];

  const mapa = new Mapa({
    container: contenedor,
    style: { version: 8, sources: fuentes, layers: [...capasFondo, ...capasLugares] },
    bounds: [[o, s], [e, n]],
    maxBounds: [[lonMin - 1.5, latMin - 1.5], [lonMax + 1.5, latMax + 1.5]],
    minZoom: 6,
    maxZoom: 17,
    dragRotate: false,
    pitchWithRotate: false,
    maxPitch: 0,
    touchPitch: false,
    cooperativeGestures: true,
    attributionControl: false,
    locale: {
      'Map.Title': 'Mapa del Lago Titikaka',
      'Marker.Title': 'Lugar',
      'NavigationControl.ZoomIn': 'Acercar',
      'NavigationControl.ZoomOut': 'Alejar',
      'NavigationControl.ResetBearing': 'Volver al norte',
      'AttributionControl.ToggleAttribution': 'Mostrar u ocultar las fuentes del mapa',
      'CooperativeGesturesHandler.WindowsHelpText': 'Usá Ctrl + rueda para acercar o alejar el mapa',
      'CooperativeGesturesHandler.MacHelpText': 'Usá ⌘ + rueda para acercar o alejar el mapa',
      'CooperativeGesturesHandler.MobileHelpText': 'Usá dos dedos para mover el mapa',
    },
  });
  mapa.touchZoomRotate.disableRotation();
  mapa.keyboard.disableRotation();
  mapa.addControl(new NavigationControl({ showCompass: false }), 'top-left');
  mapa.addControl(
    new AttributionControl({ compact: matchMedia('(max-width: 700px)').matches, customAttribution: '<a href="https://maplibre.org/">MapLibre</a>' }),
    'bottom-left',
  );
  // El mapa ya tiene nombre (role="region" en #mapa); el lienzo no repite el rol.
  mapa.getCanvas().removeAttribute('role');

  // --- Colores según el tema y el modo (claro u oscuro) -------------------------------------------

  function pintar() {
    if (!mapa.isStyleLoaded()) return;
    mapa.setPaintProperty('fondo-color', 'background-color', rgba(variable('--color-superficie')));
    for (const f of datos.fondos.filter((x) => x.disponible)) {
      const capa = `fondo-${f.id}`;
      if (f.tipo === 'raster') {
        const a = oscuro() ? (f.oscuro ?? {}) : {};
        mapa.setPaintProperty(capa, 'raster-brightness-min', a.brilloMin ?? 0);
        mapa.setPaintProperty(capa, 'raster-brightness-max', a.brilloMax ?? 1);
        mapa.setPaintProperty(capa, 'raster-saturation', a.saturacion ?? 0);
        mapa.setPaintProperty(capa, 'raster-contrast', a.contraste ?? 0);
        mapa.setPaintProperty(capa, 'raster-hue-rotate', a.tono ?? 0);
      } else {
        mapa.setPaintProperty(capa, 'hillshade-shadow-color', rgba(variable('--color-texto'), 0.55));
        mapa.setPaintProperty(capa, 'hillshade-highlight-color', rgba(variable('--color-fondo'), 0.6));
        mapa.setPaintProperty(capa, 'hillshade-accent-color', rgba(variable('--color-texto'), 0.3));
      }
    }
    if (datos.lagoSintetico) mapa.setPaintProperty('lago', 'fill-color', rgba(variable('--color-acento')));
    for (const c of capasLugares) {
      if (c.type === 'fill') mapa.setPaintProperty(c.id, 'fill-color', colorPorCapa());
      if (c.type === 'line') mapa.setPaintProperty(c.id, 'line-color', colorPorCapa());
    }
  }
  mapa.on('load', pintar);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', pintar);
  // El selector de temas (sólo en desarrollo) cambia data-tema y data-modo en <html>.
  new MutationObserver(pintar).observe(raiz, { attributes: true, attributeFilter: ['data-tema', 'data-modo'] });

  // --- Marcadores: un botón por lugar y uno por grupo ------------------------------------------

  const nombreCapa = (capa: string) => datos.nombresCapas[capa] ?? capa;
  const DETALLE = { punto: '', linea: ', línea', poligono: ', zona' };
  let marcadores = new Map<string, Marker>();

  function marcadorLugar(l: LugarMapa) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = `pin capa-${l.capa}${l.aproximado ? ' pin-aproximado' : ''}${l.tipo !== 'punto' ? ' pin-forma' : ''}`;
    boton.dataset.lugar = l.id;
    boton.setAttribute('aria-label', `${l.titulo} (${nombreCapa(l.capa)}${DETALLE[l.tipo]}${l.aproximado ? ', ubicación aproximada' : ''})`);
    boton.title = l.titulo;
    boton.innerHTML = '<span class="pin-icono" aria-hidden="true"></span>';
    boton.classList.toggle('activo', panel.abierta() === l.id);
    boton.addEventListener('click', (ev) => {
      ev.stopPropagation();
      panel.abrir(l.id, { origen: 'mapa' });
    });
    return new Marker({ element: boton, anchor: 'center' }).setLngLat(l.punto);
  }

  function marcadorGrupo(id: number, cuantos: number, donde: [number, number]) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'grupo';
    boton.textContent = String(cuantos);
    boton.setAttribute('aria-label', `Grupo de ${cuantos} lugares cercanos. Acercar el mapa para separarlos.`);
    boton.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      const zoom = await (mapa.getSource('lugares') as GeoJSONSource).getClusterExpansionZoom(id);
      mapa.easeTo({ center: donde, zoom: Math.min(zoom, ZOOM_GRUPOS + 1), animate: !menosMovimiento.matches });
    });
    return new Marker({ element: boton, anchor: 'center' }).setLngLat(donde);
  }

  function sincronizar() {
    if (!mapa.getSource('lugares') || !mapa.isSourceLoaded('lugares')) return;
    const nuevos = new Map<string, Marker>();
    // Lo que se dibuja ahora (sin las teselas de otro zoom que la fuente todavía guarda).
    for (const f of mapa.queryRenderedFeatures({ layers: ['lugares-ancla'] }) as MapGeoJSONFeature[]) {
      const p = f.properties;
      const donde = (f.geometry as GeoJSON.Point).coordinates as [number, number];
      const clave = p.cluster ? `grupo-${p.cluster_id}` : `lugar-${p.id}`;
      if (nuevos.has(clave)) continue;
      let m = marcadores.get(clave);
      if (!m) {
        const l = porId.get(p.id);
        if (!p.cluster && !l) continue;
        m = p.cluster ? marcadorGrupo(p.cluster_id, p.point_count, donde) : marcadorLugar(l!);
        m.addTo(mapa);
      }
      nuevos.set(clave, m);
    }
    for (const [clave, m] of marcadores) if (!nuevos.has(clave)) m.remove();
    marcadores = nuevos;
    contenedor.dataset.listo = '';
  }
  mapa.on('render', sincronizar);
  // Centro y zoom a la vista en el marcado: los leen las pruebas (pruebas/mapa.spec.ts).
  const anotarVista = () => {
    const c = mapa.getCenter();
    contenedor.dataset.centro = `${c.lng.toFixed(5)},${c.lat.toFixed(5)}`;
    contenedor.dataset.zoom = mapa.getZoom().toFixed(2);
  };
  mapa.on('moveend', anotarVista);

  // Líneas, polígonos y zonas también abren su ficha. Un clic en el agua la cierra.
  mapa.on('click', (ev) => {
    if ((ev.originalEvent.target as HTMLElement).closest?.('.pin, .grupo')) return;
    const tocado = mapa.queryRenderedFeatures(ev.point, { layers: CAPAS_TOCABLES })[0];
    if (tocado) panel.abrir(String(tocado.properties.id), { origen: 'mapa' });
    else panel.cerrar();
  });
  for (const capa of CAPAS_TOCABLES) {
    mapa.on('mouseenter', capa, () => (mapa.getCanvas().style.cursor = 'pointer'));
    mapa.on('mouseleave', capa, () => (mapa.getCanvas().style.cursor = ''));
  }

  // --- Ficha ----------------------------------------------------------------------------------

  const panel = crearPanel({
    items,
    alAbrir(id, { origen }) {
      for (const [clave, m] of marcadores) m.getElement().classList.toggle('activo', clave === `lugar-${id}`);
      const l = porId.get(id);
      // Regla 6: una ficha oculta no tiene ubicación; se abre sin mover el mapa.
      if (!l) return;
      // El lugar queda en el centro de la parte del mapa que la ficha no tapa. Se usa `offset`
      // (no `padding`, que queda fijo en la cámara y le cambia las teselas que carga).
      const r = panel.relleno();
      const desplazar: [number, number] = [-r.right / 2, -r.bottom / 2];
      const animar = origen !== 'enlace' && !menosMovimiento.matches;
      let destino: { center: [number, number]; zoom: number };
      if (l.caja) {
        const [x0, y0, x1, y1] = l.caja;
        const camara = mapa.cameraForBounds([[x0, y0], [x1, y1]], { padding: { top: 40, bottom: 40 + r.bottom, left: 40, right: 40 + r.right }, maxZoom: 13 });
        destino = { center: [x0 + (x1 - x0) / 2, y0 + (y1 - y0) / 2], zoom: camara?.zoom ?? ZOOM_FICHA };
      } else {
        destino = { center: l.punto, zoom: Math.max(mapa.getZoom(), ZOOM_FICHA) };
      }
      mapa.easeTo({ ...destino, offset: desplazar, animate: animar });
    },
    alCerrar(id) {
      for (const m of marcadores.values()) m.getElement().classList.remove('activo');
      return marcadores.get(`lugar-${id}`)?.getElement() ?? null;
    },
  });

  // --- Filtros, fondo y fondo del lago -------------------------------------------------------------

  alFiltrar(() => {
    const lista = visiblesEnMapa();
    (mapa.getSource('lugares') as GeoJSONSource | undefined)?.setData(puntos(lista));
    (mapa.getSource('formas') as GeoJSONSource | undefined)?.setData(formas(lista));
    (mapa.getSource('zonas') as GeoJSONSource | undefined)?.setData(zonas(lista));
  });

  const radios = [...document.querySelectorAll<HTMLInputElement>('input[name="fondo"]')];
  for (const r of radios) {
    r.addEventListener('change', () => {
      for (const f of datos.fondos.filter((x) => x.disponible)) {
        mapa.setLayoutProperty(`fondo-${f.id}`, 'visibility', f.id === r.value ? 'visible' : 'none');
      }
    });
  }
  const lago = document.querySelector<HTMLInputElement>('[data-lago]');
  const rotuloLago = document.querySelector<HTMLElement>('[data-rotulo-lago]');
  lago?.addEventListener('change', () => {
    if (!datos.lagoSintetico) return;
    mapa.setLayoutProperty('lago', 'visibility', lago.checked ? 'visible' : 'none');
    if (rotuloLago) rotuloLago.hidden = !lago.checked;
  });

  // --- Listado: «Ver en el mapa» ---------------------------------------------------------------

  for (const item of items) {
    const boton = item.querySelector<HTMLButtonElement>('[data-ver-en-mapa]');
    if (!boton) continue;
    boton.hidden = false;
    boton.addEventListener('click', () => {
      contenedor.scrollIntoView({ behavior: menosMovimiento.matches ? 'auto' : 'smooth', block: 'start' });
      panel.abrir(item.dataset.lugar!, { origen: 'listado' });
    });
  }

  // --- Enlace propio: #lugar-<id> ---------------------------------------------------------------

  mapa.on('load', () => {
    anotarVista();
    sincronizar();
    const id = idDesdeHash();
    if (id) {
      // El navegador ya bajó hasta el lugar en el listado: se vuelve al mapa.
      contenedor.scrollIntoView({ block: 'start' });
      panel.abrir(id, { origen: 'enlace' });
    }
    contenedor.dataset.cargado = '';
  });
  window.addEventListener('popstate', () => {
    const id = idDesdeHash();
    if (id) {
      if (id !== panel.abierta()) panel.abrir(id, { origen: 'enlace' });
    } else panel.cerrar({ desdeHistorial: true });
  });

  return mapa;
}
