// Temas visuales.
// - Al construir el sitio: carga sólo el tema de TEMA (sitio.config.mjs) y comprueba
//   que cumpla el contraste AA. Si no lo cumple, el sitio no se construye.
// - Con npm run dev: carga todos los temas, muestra el selector y agrega las láminas /temas
//   y /direcciones (las dos direcciones del rediseño lado a lado).
//   Nada de esto llega al sitio publicado.
import { fileURLToPath } from 'node:url';
import { IDS_TEMAS } from './temas.mjs';
import { revisarTema } from './contraste.mjs';

export default function temas({ tema }) {
  return {
    name: 'temas',
    hooks: {
      'astro:config:setup': ({ command, injectRoute, updateConfig }) => {
        if (!IDS_TEMAS.includes(tema)) {
          throw new Error(`TEMA = '${tema}' en sitio.config.mjs no existe. Valores posibles: ${IDS_TEMAS.join(', ')}.`);
        }
        const desarrollo = command === 'dev';
        if (!desarrollo) {
          const fallas = revisarTema(tema).filter((f) => !f.pasa);
          if (fallas.length > 0) {
            const lista = fallas.map((f) => `  ${f.modo} · ${f.descripcion}: ${f.frente} / ${f.fondo} = ${f.razon.toFixed(2)}:1 (mínimo ${f.minimo}:1)`).join('\n');
            throw new Error(`El tema '${tema}' no cumple el contraste AA:\n${lista}`);
          }
        }
        const archivo = desarrollo ? 'todos' : tema;
        updateConfig({
          vite: { resolve: { alias: { '@tema-activo': fileURLToPath(new URL(`../styles/temas/${archivo}.css`, import.meta.url)) } } },
        });
        if (desarrollo) {
          injectRoute({ pattern: '/temas', entrypoint: fileURLToPath(new URL('./Lamina.astro', import.meta.url)) });
          injectRoute({ pattern: '/direcciones', entrypoint: fileURLToPath(new URL('./Direcciones.astro', import.meta.url)) });
        }
      },
    },
  };
}
