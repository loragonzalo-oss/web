// Los borradores (draft: true) se ven con `npm run dev` y en la construcción de prueba
// (`npm run build:prueba`, modo «prueba»), para que las pruebas tengan contenido de ejemplo.
// El sitio que se publica (`npm run build`, deploy.yml) nunca los lleva.
export const verBorradores = import.meta.env.DEV || import.meta.env.MODE === 'prueba';
