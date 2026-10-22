// Lista de temas visuales. Los valores (colores, tipografías) están en
// src/styles/temas/<id>.css; acá sólo lo que la lámina /temas y el selector
// necesitan mostrar. El tema publicado se elige en sitio.config.mjs (TEMA).
export const TEMAS = [
  {
    id: 'provisorio',
    nombre: 'Provisorio',
    inspiracion: 'La paleta sobria con la que se armó el sitio, sin decisión de identidad detrás.',
    cuerpo: { familia: 'Source Serif 4', autor: 'Frank Grießhammer (Adobe)', licencia: 'SIL OFL 1.1', paquete: '@fontsource/source-serif-4' },
    interfaz: { familia: 'Source Sans 3', autor: 'Paul D. Hunt (Adobe)', licencia: 'SIL OFL 1.1', paquete: '@fontsource/source-sans-3' },
  },
  {
    id: 'a',
    nombre: 'A · Agua honda',
    inspiracion: 'El lago de cerca, en sus tonos fríos: fondo con tinte de agua, texto azul muy oscuro, acento verde azulado.',
    cuerpo: { familia: 'Literata', autor: 'TypeTogether (para Google)', licencia: 'SIL OFL 1.1', paquete: '@fontsource/literata' },
    interfaz: { familia: 'Inter', autor: 'Rasmus Andersson', licencia: 'SIL OFL 1.1', paquete: '@fontsource/inter' },
  },
  {
    id: 'b',
    nombre: 'B · Totora',
    inspiracion: 'La orilla: fondo cálido de totora seca, texto pardo, acento verde de totora viva y capas terrosas.',
    cuerpo: { familia: 'Alegreya', autor: 'Juan Pablo del Peral (Huerta Tipográfica)', licencia: 'SIL OFL 1.1', paquete: '@fontsource/alegreya' },
    interfaz: { familia: 'Alegreya Sans', autor: 'Juan Pablo del Peral (Huerta Tipográfica)', licencia: 'SIL OFL 1.1', paquete: '@fontsource/alegreya-sans' },
  },
  {
    id: 'c',
    nombre: 'C · Piedra y cielo',
    inspiracion: 'La luz de altura: fondo casi blanco de piedra clara, texto gris piedra y acento azul profundo de cielo.',
    cuerpo: { familia: 'Spectral', autor: 'Production Type', licencia: 'SIL OFL 1.1', paquete: '@fontsource/spectral' },
    interfaz: { familia: 'IBM Plex Sans', autor: 'Mike Abbink y Bold Monday (para IBM)', licencia: 'SIL OFL 1.1', paquete: '@fontsource/ibm-plex-sans' },
  },
];

export const IDS_TEMAS = TEMAS.map((t) => t.id);
