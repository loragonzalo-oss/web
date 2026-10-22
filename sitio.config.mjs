// Dirección del sitio. Es el ÚNICO lugar donde se cambia al pasar al dominio propio.
// Ver COMO-PUBLICAR.md, sección «Pasar al dominio propio».
//
// Mientras el sitio vive en GitHub Pages:
//   SITE = 'https://loragonzalo-oss.github.io'
//   BASE = '/web'
// Con dominio propio:
//   SITE = 'https://midominio.com'
//   BASE = '/'
export const SITE = 'https://loragonzalo-oss.github.io';
export const BASE = '/web';

// Tema visual que se publica: 'provisorio', 'a', 'b' o 'c' (están en src/styles/temas/).
// Para elegir la identidad visual se cambia SÓLO esta línea. Ver COMO-PUBLICAR.md, «Identidad visual».
export const TEMA = 'provisorio';

// Bloque «Compartir» de los ensayos (texto para copiar y enlaces a LinkedIn y X).
// Apagado mientras el sitio vive en loragonzalo-oss.github.io/web: esas direcciones no se
// comparten, porque al migrar desaparece la ruta /web/. Se enciende (true) al migrar al dominio
// propio. Ver COMO-PUBLICAR.md, «Pasar al dominio propio».
export const COMPARTIR_ACTIVO = false;
