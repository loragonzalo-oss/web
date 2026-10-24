// ¿Se muestra el bloque «Compartir» de los ensayos? Lo decide COMPARTIR_ACTIVO en sitio.config.mjs.
// Sólo para las pruebas, la construcción de prueba (--mode prueba) y el modo de desarrollo aceptan
// la variable de entorno COMPARTIR_ACTIVO=1 o =0, que pisa la constante. El sitio que se publica
// (`npm run build`) usa siempre la constante.
import { COMPARTIR_ACTIVO } from '../../sitio.config.mjs';

const forzado = import.meta.env.DEV || import.meta.env.MODE === 'prueba' ? process.env.COMPARTIR_ACTIVO : undefined;

export const compartirActivo = forzado === '1' ? true : forzado === '0' ? false : COMPARTIR_ACTIVO;
