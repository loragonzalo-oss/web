// Lista de temas visuales. Los valores (colores, tipografías) están en
// src/styles/temas/<id>.css; acá sólo lo que la lámina /temas y el selector
// necesitan mostrar. El tema publicado se elige en sitio.config.mjs (TEMA).
//
// composicion: 'base' es la maqueta de siempre (los temas sólo cambian colores y
// tipografías). Las dos direcciones del rediseño traen además su propia composición
// (src/styles/composiciones/<id>.css y el marcado que piden), y se eligen igual que
// cualquier otro tema.
export const TEMAS = [
  {
    id: 'provisorio',
    composicion: 'base',
    nombre: 'Provisorio',
    inspiracion: 'La paleta sobria con la que se armó el sitio, sin decisión de identidad detrás.',
    cuerpo: { familia: 'Source Serif 4', autor: 'Frank Grießhammer (Adobe)', licencia: 'SIL OFL 1.1', paquete: '@fontsource/source-serif-4' },
    interfaz: { familia: 'Source Sans 3', autor: 'Paul D. Hunt (Adobe)', licencia: 'SIL OFL 1.1', paquete: '@fontsource/source-sans-3' },
  },
  {
    id: 'a',
    composicion: 'base',
    nombre: 'A · Agua honda',
    inspiracion: 'El lago de cerca, en sus tonos fríos: fondo con tinte de agua, texto azul muy oscuro, acento verde azulado.',
    cuerpo: { familia: 'Literata', autor: 'TypeTogether (para Google)', licencia: 'SIL OFL 1.1', paquete: '@fontsource/literata' },
    interfaz: { familia: 'Inter', autor: 'Rasmus Andersson', licencia: 'SIL OFL 1.1', paquete: '@fontsource/inter' },
  },
  {
    id: 'b',
    composicion: 'base',
    nombre: 'B · Totora',
    inspiracion: 'La orilla: fondo cálido de totora seca, texto pardo, acento verde de totora viva y capas terrosas.',
    cuerpo: { familia: 'Alegreya', autor: 'Juan Pablo del Peral (Huerta Tipográfica)', licencia: 'SIL OFL 1.1', paquete: '@fontsource/alegreya' },
    interfaz: { familia: 'Alegreya Sans', autor: 'Juan Pablo del Peral (Huerta Tipográfica)', licencia: 'SIL OFL 1.1', paquete: '@fontsource/alegreya-sans' },
  },
  {
    id: 'c',
    composicion: 'base',
    nombre: 'C · Piedra y cielo',
    inspiracion: 'La luz de altura: fondo casi blanco de piedra clara, texto gris piedra y acento azul profundo de cielo.',
    cuerpo: { familia: 'Spectral', autor: 'Production Type', licencia: 'SIL OFL 1.1', paquete: '@fontsource/spectral' },
    interfaz: { familia: 'IBM Plex Sans', autor: 'Mike Abbink y Bold Monday (para IBM)', licencia: 'SIL OFL 1.1', paquete: '@fontsource/ibm-plex-sans' },
  },
  {
    id: 'noche',
    composicion: 'noche',
    nombre: 'Dirección 1 · Noche de altura',
    inspiracion: 'El recorrido vertical: noche fría de altura, luz clara y un solo acento cálido. La navegación es un riel lateral, como una escala de cotas; la imagen entra a toda altura y los textos bajan en una sola columna.',
    cuerpo: { familia: 'Newsreader', autor: 'Production Type', licencia: 'SIL OFL 1.1', paquete: '@fontsource/newsreader' },
    interfaz: { familia: 'Instrument Sans', autor: 'Instrument (The Instrument Sans Project Authors)', licencia: 'SIL OFL 1.1', paquete: '@fontsource/instrument-sans' },
  },
  {
    id: 'crema',
    composicion: 'crema',
    nombre: 'Dirección 2 · Crema y tierra',
    inspiracion: 'La página de libro: fondo crema de piedra, texto pardo y un acento rojo de tierra. Retícula asimétrica con margen de notas, imagen apaisada de lado a lado y bloques que se leen de izquierda a derecha.',
    cuerpo: { familia: 'EB Garamond', autor: 'Georg Duffner y Octavio Pardo', licencia: 'SIL OFL 1.1', paquete: '@fontsource/eb-garamond' },
    interfaz: { familia: 'Work Sans', autor: 'Wei Huang', licencia: 'SIL OFL 1.1', paquete: '@fontsource/work-sans' },
  },
];

export const IDS_TEMAS = TEMAS.map((t) => t.id);

// Composición de un tema ('base', 'noche' o 'crema').
export const composicionDe = (id) => TEMAS.find((t) => t.id === id)?.composicion ?? 'base';
export const DIRECCIONES = TEMAS.filter((t) => t.composicion !== 'base');
