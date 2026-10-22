// Direcciones del rediseño: qué piezas de composición lleva el marcado.
// Cada dirección (tema 'noche' o 'crema') agrega algunas piezas que la maqueta de base
// no tiene: marcos de foto, el riel de la portada, los ensayos en la portada.
// - Con npm run dev se arman todas, ocultas con data-solo, para que el selector de
//   temas cambie de dirección sin recargar.
// - Al construir, sólo las de la dirección publicada (TEMA en sitio.config.mjs). Con el
//   tema provisorio, el sitio publicado no lleva ninguna.
import { TEMA } from '../../sitio.config.mjs';
import { composicionDe } from '../desarrollo/temas.mjs';

const publicada = composicionDe(TEMA);
const lleva = (id: string) => import.meta.env.DEV || publicada === id;

export const DIRECCION = {
  noche: lleva('noche'),
  crema: lleva('crema'),
  alguna: lleva('noche') || lleva('crema'),
};

// Valor de data-solo para una pieza que usan una o las dos direcciones.
export const solo = (...ids: ('noche' | 'crema')[]) => ids.join(' ');
