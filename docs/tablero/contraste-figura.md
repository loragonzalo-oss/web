# Tablero: contraste de los objetos gráficos de la rosa

Criterio WCAG 2.1, 1.4.11 (contraste no textual): 3:1 contra el color adyacente. Se mide contra el fondo de página de cada tema, en claro y en oscuro (valores de `src/styles/temas/`; los temas no se tocaron). Los colores con opacidad se mezclan antes con el fondo. ✗ = por debajo de 3:1.

## Cómo está dibujada la figura (decisiones del autor, 22-10-2026)

- **Pétalos y punto «en la referencia»:** contorno de 0.9 px del color del texto del tema (`currentColor`).
- **Círculos de límite y alto riesgo, y arco de cada variable estructurante (VE):** el trazo de color va entre dos filetes de 1 px del color del texto. La paleta no cambia.
- **Triángulo de fuera de escala:** sin contorno; su color contrasta solo en todos los fondos.
- Los grosores son en píxeles de pantalla (`vector-effect: non-scaling-stroke`): no se adelgazan en el teléfono.
- En la imagen para compartir, contorno y filetes toman el color del texto del tema publicado.

## Medición del 23-10-2026

### Direcciones del rediseño («noche» y «crema»)

| | noche claro | noche oscuro | crema claro | crema oscuro |
|---|---:|---:|---:|---:|
| Contorno contra el fondo | 17.45 | 16.02 | 13.81 | 14.86 |
| Contorno contra la zona verde (10%) | 15.48 | 14.74 | 12.38 | 13.56 |
| Contorno contra la zona ámbar (7%) | 16.88 | 14.49 | 13.57 | 13.13 |
| Contorno contra la zona roja (6%) | 16.22 | 15.41 | 12.89 | 14.13 |
| Arco de VE (#5E86C1) contra el fondo | 3.39 | 5.31 | 2.91 ✗ | 5.00 |
| Círculo de límite (#3FBF95) contra el fondo | 2.11 ✗ | 8.54 | 1.81 ✗ | 8.04 |
| Círculo de alto riesgo (#E0705F) contra el fondo | 2.88 ✗ | 6.24 | 2.47 ✗ | 5.88 |
| Triángulo (#C9567A, sin contorno) contra el fondo | 3.77 | 4.78 | 3.22 | 4.50 |

### Temas de base (provisorio, A, B y C)

| | provisorio claro | provisorio oscuro | a claro | a oscuro | b claro | b oscuro | c claro | c oscuro |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Contorno contra el fondo | 15.33 | 14.15 | 15.12 | 14.42 | 14.00 | 14.00 | 16.29 | 14.90 |
| Contorno contra la zona verde (10%) | 13.60 | 12.78 | 13.43 | 12.96 | 12.48 | 12.71 | 14.46 | 13.51 |
| Contorno contra la zona ámbar (7%) | 14.82 | 12.41 | 14.63 | 12.69 | 13.65 | 12.20 | 15.75 | 13.14 |
| Contorno contra la zona roja (6%) | 14.16 | 13.45 | 13.95 | 13.80 | 13.01 | 13.30 | 15.05 | 14.23 |
| Arco de VE (#5E86C1) contra el fondo | 3.50 | 4.87 | 3.45 | 4.89 | 3.32 | 4.78 | 3.59 | 4.97 |
| Círculo de límite (#3FBF95) contra el fondo | 2.18 ✗ | 7.83 | 2.14 ✗ | 7.87 | 2.07 ✗ | 7.69 | 2.23 ✗ | 7.99 |
| Círculo de alto riesgo (#E0705F) contra el fondo | 2.98 ✗ | 5.73 | 2.93 ✗ | 5.75 | 2.82 ✗ | 5.62 | 3.05 | 5.84 |
| Triángulo (#C9567A, sin contorno) contra el fondo | 3.89 | 4.39 | 3.83 | 4.41 | 3.69 | 4.31 | 3.98 | 4.47 |

Las cuatro primeras filas miden el contorno y los filetes (el color del texto) contra el fondo y contra las zonas tenues de la figura. Las demás miden los colores fijos solos, sin el filete.

## Lectura

- **Todo objeto gráfico de la rosa cumple 3:1 en los doce fondos** (seis temas, en claro y en oscuro).
- **Pétalos y punto «en la referencia».** Su borde lo marca el contorno: entre 12.20:1 y 17.45:1 contra el fondo y las zonas tenues.
- **Círculos y arco de VE.**
  - En modo claro los separan del fondo los filetes, con el mismo contraste que el contorno.
  - En modo oscuro el color solo ya pasa: arco 4.78-5.31, círculo de límite 7.69-8.54, círculo de alto riesgo 5.62-6.24.
  - Los ✗ de esas filas son el color solo en fondo claro, donde el filete se encarga del contraste.
  - El arco en crema claro (2.91:1 solo) era lo único que quedaba por debajo en la medición anterior. Ahora lo cubren sus filetes.
- **Triángulo de fuera de escala.** Pasa solo, sin contorno, en todos los fondos: 3.22-4.78.
- **El color dentro de cada pétalo** (verde → ámbar → rojo → vino) no tiene contraste garantizado entre tramos. No hace falta para leer la figura: z la dicen también el largo del pétalo, los círculos y la tabla.

## Mediciones anteriores

- **22-10-2026, sin contorno.** Sólo el triángulo y el rojo de z = 2 llegaban a 3:1 en «noche» y «crema», en claro y en oscuro. Los colores claros fallaban sobre fondo claro, los oscuros sobre fondo oscuro, y los pétalos inciertos (opacidad 0.45) en todos.
- **22-10-2026, con contorno en pétalos y círculos.** Todo cumplía salvo el arco de VE en crema claro (2.91:1).
