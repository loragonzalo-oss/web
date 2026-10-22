# Tablero: contraste de los objetos gráficos de la rosa

Criterio WCAG 2.1, 1.4.11 (contraste no textual): 3:1 contra el color adyacente. Se mide cada color fijo de la figura contra el fondo de página de las dos direcciones, en claro y en oscuro (valores de `src/styles/temas/noche.css` y `crema.css`; los temas no se tocaron). Los colores con opacidad se mezclan antes con el fondo. ✗ = por debajo de 3:1.

Medición del 22-10-2026, Propuesta 07.

| Objeto | Color | noche claro | noche oscuro | crema claro | crema oscuro |
|---|---|---:|---:|---:|---:|
| Círculo límite (z = 1) | #3FBF95 | 2.11 ✗ | 8.54 | 1.81 ✗ | 8.04 |
| Círculo alto riesgo (z = 2) | #E0705F | 2.88 ✗ | 6.24 | 2.47 ✗ | 5.88 |
| Arco de VE | #5E86C1 | 3.39 | 5.31 | 2.91 ✗ | 5.00 |
| Triángulo fuera de escala | #C9567A | 3.77 | 4.78 | 3.22 | 4.50 |
| Punto en la referencia | #3FBF95 | 2.11 ✗ | 8.54 | 1.81 ✗ | 8.04 |
| Pétalo, parte dentro del límite | #1F6F5C (opacidad 0.75) | 3.33 | 2.32 ✗ | 3.05 | 2.25 ✗ |
| Pétalo, z = 1 (ámbar) | #F2C14E | 1.53 ✗ | 11.74 | 1.31 ✗ | 11.06 |
| Pétalo, z = 1.5 | #F08A3E | 2.28 ✗ | 7.89 | 1.95 ✗ | 7.43 |
| Pétalo, z = 2 | #D9483B | 3.88 | 4.64 | 3.33 | 4.37 |
| Pétalo, z = 2.8 | #9E1F45 | 7.02 | 2.57 ✗ | 6.01 | 2.42 ✗ |
| Pétalo, z = 3.5 | #5B1240 | 11.95 | 1.51 ✗ | 10.24 | 1.42 ✗ |
| Pétalo incierto, dentro del límite | #1F6F5C (opacidad 0.338) | 1.63 ✗ | 1.34 ✗ | 1.58 ✗ | 1.34 ✗ |
| Pétalo incierto, ámbar | #F2C14E (opacidad 0.45) | 1.21 ✗ | 3.10 | 1.13 ✗ | 3.16 |
| Pétalo incierto, z = 2 | #D9483B (opacidad 0.45) | 1.84 ✗ | 1.75 ✗ | 1.74 ✗ | 1.79 ✗ |

noche claro: fondo #f2f5f8 · noche oscuro: fondo #070b12 · crema claro: fondo #e8e3da · crema oscuro: fondo #18120e

## Lectura

- Sólo dos colores llegan a 3:1 en los cuatro fondos: el triángulo de fuera de escala (#C9567A) y el rojo de z = 2 (#D9483B). El arco de VE pasa en tres (falla en crema claro, 2.91). Los colores claros (verdes de los círculos, ámbar) fallan sobre fondo claro; los oscuros (vino de z = 2.8 y 3.5, verde apagado dentro del límite) fallan sobre fondo oscuro. Con colores fijos es lo esperable: sólo un color de luminosidad media contrasta a la vez con un fondo casi blanco y con uno casi negro.
- Los pétalos inciertos (opacidad 0.45) no llegan a 3:1 en ningún fondo. El contorno claro (#F4F1EA, 0.9 px) ayuda en los fondos oscuros, no en los claros.
- El borde de un pétalo no siempre toca el fondo de página: casi siempre cae sobre las zonas tenues o junto a otro pétalo. La tabla de arriba es la peor situación.
- Atenuante: la figura tiene equivalente completo en texto (la tabla, con valor, anclas, z y estado de cada pétalo), y la leyenda explica cada marca con palabras. La información no depende sólo del contraste de la figura.

## Opciones (decisión del autor)

1. Dejarlo así, apoyado en la tabla como alternativa.
2. Contorno fino de cada pétalo y de cada círculo en `currentColor` (el color del texto del tema): resuelve 1.4.11 en los cuatro fondos sin cambiar la paleta.
3. Colores de la figura que dependan del modo (una paleta para claro y otra para oscuro). Contradice la regla del encargo de colores fijos.
