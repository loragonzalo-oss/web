# Tablero: contraste de los objetos gráficos de la rosa

Criterio WCAG 2.1, 1.4.11 (contraste no textual): 3:1 contra el color adyacente. Se mide contra el fondo de página de las dos direcciones, en claro y en oscuro (valores de `src/styles/temas/noche.css` y `crema.css`; los temas no se tocaron). Los colores con opacidad se mezclan antes con el fondo. ✗ = por debajo de 3:1.

## Medición con contorno (vigente, 22-10-2026)

Decisión del autor (22-10-2026): contorno fino en `currentColor` alrededor de pétalos y círculos, sin cambiar la paleta.

- Cada pétalo y el punto «en la referencia» llevan un contorno de 0.9 px del color del texto del tema.
- Cada círculo (límite y alto riesgo) es un trazo de color de 2 px entre dos filetes de 1 px del color del texto.
- Los grosores son en píxeles de pantalla (`vector-effect: non-scaling-stroke`): no se adelgazan cuando la rosa se achica en el teléfono.
- En la imagen para compartir, el contorno toma el color del texto del tema publicado.

### Contorno contra lo que lo rodea

El contorno es el color del texto del tema (`currentColor`). Mínimo 3:1.

| | noche claro | noche oscuro | crema claro | crema oscuro |
|---|---:|---:|---:|---:|
| Fondo de página | 17.45 | 16.02 | 13.81 | 14.86 |
| Zona verde (z 0-1, 10%) | 15.48 | 14.74 | 12.38 | 13.56 |
| Zona ámbar (z 1-2, 7%) | 16.88 | 14.49 | 13.57 | 13.13 |
| Zona roja (z 2-3.5, 6%) | 16.22 | 15.41 | 12.89 | 14.13 |

noche claro: texto #0b1016, fondo #f2f5f8 · noche oscuro: texto #dfe9f2, fondo #070b12 · crema claro: texto #1f1712, fondo #e8e3da · crema oscuro: texto #ede5da, fondo #18120e

### Colores de la figura contra el fondo, sin contorno

La misma medida de la primera versión, para comparar. Con contorno, la frontera de cada pétalo, del punto y de los círculos ya no depende de estos números.

| Objeto | Color | noche claro | noche oscuro | crema claro | crema oscuro |
|---|---|---:|---:|---:|---:|
| Círculo límite (z = 1) | #3FBF95 | 2.11 ✗ | 8.54 | 1.81 ✗ | 8.04 |
| Círculo alto riesgo (z = 2) | #E0705F | 2.88 ✗ | 6.24 | 2.47 ✗ | 5.88 |
| Arco de VE (sin contorno) | #5E86C1 | 3.39 | 5.31 | 2.91 ✗ | 5.00 |
| Triángulo fuera de escala (sin contorno) | #C9567A | 3.77 | 4.78 | 3.22 | 4.50 |
| Punto en la referencia | #3FBF95 | 2.11 ✗ | 8.54 | 1.81 ✗ | 8.04 |
| Pétalo, dentro del límite | #1F6F5C (opacidad 0.75) | 3.33 | 2.32 ✗ | 3.05 | 2.25 ✗ |
| Pétalo, z = 1 (ámbar) | #F2C14E | 1.53 ✗ | 11.74 | 1.31 ✗ | 11.06 |
| Pétalo, z = 1.5 | #F08A3E | 2.28 ✗ | 7.89 | 1.95 ✗ | 7.43 |
| Pétalo, z = 2 | #D9483B | 3.88 | 4.64 | 3.33 | 4.37 |
| Pétalo, z = 2.8 | #9E1F45 | 7.02 | 2.57 ✗ | 6.01 | 2.42 ✗ |
| Pétalo, z = 3.5 | #5B1240 | 11.95 | 1.51 ✗ | 10.24 | 1.42 ✗ |
| Pétalo incierto, dentro del límite | #1F6F5C (opacidad 0.338) | 1.63 ✗ | 1.34 ✗ | 1.58 ✗ | 1.34 ✗ |
| Pétalo incierto, ámbar | #F2C14E (opacidad 0.45) | 1.21 ✗ | 3.10 | 1.13 ✗ | 3.16 |
| Pétalo incierto, z = 2 | #D9483B (opacidad 0.45) | 1.84 ✗ | 1.75 ✗ | 1.74 ✗ | 1.79 ✗ |

### Círculos contra su filete

El trazo de color va entre dos filetes del color del texto; se mide el color contra el filete.

| | noche claro | noche oscuro | crema claro | crema oscuro |
|---|---:|---:|---:|---:|
| Límite (#3FBF95) | 8.27 | 1.88 ✗ | 7.65 | 1.85 ✗ |
| Alto riesgo (#E0705F) | 6.05 | 2.57 ✗ | 5.59 | 2.53 ✗ |

## Lectura

- **Pétalos y punto «en la referencia»: cumplen en los cuatro fondos.** La frontera de cada uno la marca el contorno, que contrasta entre 12.38:1 y 17.45:1 con el fondo y con las tres zonas tenues. Vale también para los pétalos inciertos, que antes no llegaban a 3:1 en ningún fondo.
- **Círculos: cumplen en los cuatro fondos.** En modo claro los separan del fondo los filetes del color del texto (13.81:1 a 17.45:1 contra el fondo). En modo oscuro el trazo de color ya contrasta solo con el fondo (círculo de límite 8.04-8.54; alto riesgo 5.88-6.24). En oscuro el trazo de color y su filete claro se parecen (1.85-2.57), pero eso no afecta: lo que tiene que contrastar es el círculo contra el fondo, no el círculo contra su propio filete.
- **Sin contorno, por decisión de alcance:**
  - El arco de VE no llega en crema claro (2.91:1); en los otros tres fondos pasa.
  - El triángulo de fuera de escala pasa en los cuatro fondos (3.22-4.78).
- **El color dentro de cada pétalo** (verde → ámbar → rojo → vino) no tiene contraste propio garantizado entre tramos ni contra el contorno. No hace falta para leer la figura: z la dicen también el largo del pétalo, los círculos y la tabla.

## Medición sin contorno (anterior, 22-10-2026)

La tabla «Colores de la figura contra el fondo, sin contorno» de arriba es esa medición. En resumen: sólo el triángulo y el rojo de z = 2 llegaban a 3:1 en los cuatro fondos. Los colores claros fallaban sobre fondo claro, los oscuros sobre fondo oscuro, y los pétalos inciertos en todos.

## Pendiente (decisión del autor)

- Si el arco de VE lleva también contorno o filetes (es lo único que queda por debajo de 3:1, en crema claro).
