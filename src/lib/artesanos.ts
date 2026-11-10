// Filtros de /mapa/artesanos/ (src/pages/mapa/artesanos/[...filtro].astro). Sin JavaScript: cada
// combinación de tipo y país es una página propia.
import { FICHAS_CONTACTO } from './fichas';
import { PAISES } from './capas';
import { url } from './rutas';

export const TODOS = 'todos';
export const FILTRO_TIPOS: string[] = [TODOS, ...FICHAS_CONTACTO];
export const FILTRO_PAISES: string[] = [TODOS, ...PAISES.map((p) => p.id)];

// Dirección de una combinación de filtros.
export function rutaFiltro(tipo: string, pais: string) {
  return url(`/mapa/artesanos/${pais === TODOS ? (tipo === TODOS ? '' : `${tipo}/`) : `${tipo}/${pais}/`}`);
}

// Todas las combinaciones, para getStaticPaths.
export function combinaciones() {
  return FILTRO_TIPOS.flatMap((tipo) =>
    FILTRO_PAISES.map((pais) => {
      const partes = pais === TODOS ? (tipo === TODOS ? [] : [tipo]) : [tipo, pais];
      return { params: { filtro: partes.length ? partes.join('/') : undefined }, props: { tipo, pais } };
    }),
  );
}

const NOMBRES_TIPO: Record<string, string> = {
  [TODOS]: 'Todos',
  artesano: 'Artesanía',
  emprendimiento: 'Emprendimientos',
  'agencia-turismo-comunitario': 'Agencias de turismo comunitario',
};
export const nombreFiltroTipo = (t: string) => NOMBRES_TIPO[t];
export const nombreFiltroPais = (p: string) => (p === TODOS ? 'Todos' : PAISES.find((x) => x.id === p)!.nombre);
