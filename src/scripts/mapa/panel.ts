// Panel de la ficha en /mapa. En escritorio, a la derecha del mapa; en celular (hasta 700 px),
// una hoja que sale desde abajo, que se sube y se baja con la barra de arriba (arrastrando o
// con un toque), y que al abrir tapa menos de la mitad del mapa.
//
// - Cierra con el botón × y con Escape. El foco va a la ficha al abrir y vuelve al punto (o al
//   botón que la abrió) al cerrar.
// - Dirección: abrir una ficha agrega #lugar-<id> al historial; «atrás» la cierra.
// - «Copiar enlace» copia esa dirección. En celular, si el navegador sabe compartir, comparte.
// La ficha no viaja como datos: se copia del listado (FichaLugar.astro).

type Origen = 'mapa' | 'listado' | 'enlace';
interface Opciones {
  items: HTMLElement[];
  alAbrir: (id: string, op: { origen: Origen }) => void;
  // Devuelve el marcador del lugar, si lo hay, para devolverle el foco.
  alCerrar: (id: string) => HTMLElement | null;
}

const ESTADO = 'fichaMapa';
const celular = matchMedia('(max-width: 700px)');
const tactil = matchMedia('(pointer: coarse)');

export function crearPanel({ items, alAbrir, alCerrar }: Opciones) {
  const panel = document.getElementById('ficha-panel')!;
  const contenido = panel.querySelector<HTMLElement>('.ficha-panel-contenido')!;
  const desplazable = panel.querySelector<HTMLElement>('.ficha-panel-desplazable')!;
  const asa = panel.querySelector<HTMLButtonElement>('[data-asa]')!;
  const textoAsa = asa.querySelector<HTMLElement>('.ficha-asa-texto')!;
  const copiar = panel.querySelector<HTMLButtonElement>('[data-copiar]')!;
  const copiado = panel.querySelector<HTMLElement>('[data-copiado]')!;
  const paginaLugar = panel.querySelector<HTMLAnchorElement>('[data-pagina-lugar]')!;
  const compartir = typeof navigator.share === 'function' && tactil.matches;
  if (compartir) copiar.textContent = 'Compartir enlace';

  let abierta: string | null = null;
  let focoPrevio: HTMLElement | null = null;

  const enlaceDe = (id: string) => `${location.origin}${location.pathname}#lugar-${encodeURIComponent(id)}`;

  // --- Altura de la hoja en celular -------------------------------------------------------------

  function altura(alta: boolean) {
    panel.dataset.altura = alta ? 'alta' : 'baja';
    panel.style.removeProperty('height');
    asa.setAttribute('aria-expanded', String(alta));
    textoAsa.textContent = alta ? 'Achicar la ficha' : 'Agrandar la ficha';
  }
  let arrastre: { y: number; alto: number; movio: boolean } | null = null;
  asa.addEventListener('pointerdown', (e) => {
    if (!celular.matches) return;
    arrastre = { y: e.clientY, alto: panel.offsetHeight, movio: false };
    asa.setPointerCapture(e.pointerId);
  });
  asa.addEventListener('pointermove', (e) => {
    if (!arrastre) return;
    const dy = arrastre.y - e.clientY;
    if (Math.abs(dy) > 6) arrastre.movio = true;
    const zona = panel.parentElement!.offsetHeight;
    panel.style.height = `${Math.min(zona, Math.max(zona * 0.15, arrastre.alto + dy))}px`;
  });
  asa.addEventListener('pointerup', () => {
    if (!arrastre) return;
    const { movio } = arrastre;
    arrastre = null;
    if (!movio) return; // un toque: lo resuelve «click»
    const fraccion = panel.offsetHeight / panel.parentElement!.offsetHeight;
    if (fraccion < 0.25) cerrar();
    else altura(fraccion > 0.6);
    asa.dataset.arrastrado = '';
  });
  asa.addEventListener('click', () => {
    if ('arrastrado' in asa.dataset) {
      delete asa.dataset.arrastrado;
      return;
    }
    altura(panel.dataset.altura !== 'alta');
  });

  // --- Abrir y cerrar ---------------------------------------------------------------------------

  function abrir(id: string, { origen }: { origen: Origen }) {
    const item = items.find((i) => i.dataset.lugar === id);
    if (!item) return;
    if (!abierta) focoPrevio = document.activeElement as HTMLElement | null;

    // Copia de la ficha del listado. El título pasa a h2 y queda como nombre del panel.
    const cabecera = item.querySelector('.ficha-cabecera')!.cloneNode(true) as HTMLElement;
    const h3 = cabecera.querySelector('h3')!;
    const h2 = document.createElement('h2');
    h2.className = h3.className;
    h2.id = 'ficha-panel-titulo';
    // El foco va al título: queda dentro de la parte que se desplaza, así las flechas la recorren.
    h2.tabIndex = -1;
    h2.append(...h3.childNodes);
    h3.replaceWith(h2);
    const cuerpo = item.querySelector('.ficha-cuerpo')!.cloneNode(true) as HTMLElement;
    contenido.replaceChildren(cabecera, cuerpo);
    paginaLugar.href = item.querySelector<HTMLAnchorElement>('.listado-acciones a')?.href ?? '';
    copiado.textContent = '';
    if (!abierta) altura(false);
    panel.hidden = false;
    desplazable.scrollTop = 0;

    // Historial: una ficha abierta desde el mapa o el listado es una entrada nueva, así «atrás»
    // la cierra. Si ya había otra abierta, se reemplaza: «atrás» no recorre fichas.
    if (origen !== 'enlace') {
      const destino = `${location.pathname}${location.search}#lugar-${encodeURIComponent(id)}`;
      if (abierta && history.state?.[ESTADO]) history.replaceState({ [ESTADO]: id }, '', destino);
      else history.pushState({ [ESTADO]: id }, '', destino);
    }
    abierta = id;
    alAbrir(id, { origen });
    h2.focus({ preventScroll: true });
  }

  function cerrar({ desdeHistorial = false } = {}) {
    if (!abierta) return;
    const id = abierta;
    abierta = null;
    panel.hidden = true;
    contenido.replaceChildren();
    const marcador = alCerrar(id);
    if (!desdeHistorial) {
      if (history.state?.[ESTADO]) history.back();
      else history.replaceState(null, '', location.pathname + location.search);
    }
    const destino = focoPrevio?.isConnected && focoPrevio !== document.body ? focoPrevio : marcador;
    destino?.focus({ preventScroll: true });
    focoPrevio = null;
  }

  panel.querySelector('.ficha-cerrar')!.addEventListener('click', () => cerrar());
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      cerrar();
    }
  });

  // --- Copiar o compartir el enlace ---------------------------------------------------------------

  copiar.addEventListener('click', async () => {
    if (!abierta) return;
    const url = enlaceDe(abierta);
    if (compartir) {
      try {
        await navigator.share({ title: document.getElementById('ficha-panel-titulo')?.textContent ?? '', url });
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      copiado.textContent = 'Enlace copiado.';
    } catch {
      // Sin permiso para el portapapeles: se muestra la dirección para copiarla a mano.
      copiado.textContent = `Dirección: ${url}`;
    }
  });

  // Espacio que tapa el panel, para que el lugar quede a la vista al centrarlo.
  function relleno() {
    const vacio = { top: 0, right: 0, bottom: 0, left: 0 };
    if (panel.hidden) return vacio;
    if (celular.matches) return { ...vacio, bottom: panel.offsetHeight };
    return { ...vacio, right: panel.offsetWidth };
  }

  return { abrir, cerrar, abierta: () => abierta, relleno };
}
