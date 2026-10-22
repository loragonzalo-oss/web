# Peso y tiempo de carga por tipo de página

Generado con `npm run rediseno:peso`. No editar a mano.

Conexión móvil lenta simulada con Playwright (Chromium, protocolo de DevTools): 400 kbit/s de bajada y de subida, 400 ms de latencia, procesador 4 veces más lento, sin caché, pantalla de 390 × 844. «JS (archivos)» son los bytes transferidos de archivos .js; «JS (en línea)», el código dentro de la página. «Última descarga» es cuándo termina de bajar el último archivo de la página, tipografías incluidas. Los tiempos varían algo de una corrida a otra; los bytes no.

<!-- tema:main antes del rediseño (tema provisorio) -->
## main antes del rediseño (tema provisorio)

Medido el 2026-10-22 sobre `npm run build:prueba`.

| Página | JS (archivos) | JS (en línea) | CSS | Fuentes | Total transferido | Primer pintado | Última descarga |
|---|---|---|---|---|---|---|---|
| Portada | 0.0 KB | 0.0 KB | 5.6 KB | 76.8 KB | 85.5 KB | 1.04 s | 3.39 s |
| Índice de ensayos | 0.0 KB | 0.0 KB | 5.6 KB | 56.9 KB | 65.1 KB | 1.02 s | 2.96 s |
| Índice del blog | 0.0 KB | 0.0 KB | 5.6 KB | 56.9 KB | 65.3 KB | 1.02 s | 2.95 s |
| Entrada larga | 0.0 KB | 0.0 KB | 5.6 KB | 92.5 KB | 112.0 KB | 1.10 s | 3.48 s |
| /libro | 0.0 KB | 0.0 KB | 5.6 KB | 56.9 KB | 64.7 KB | 1.04 s | 2.58 s |
| Mapa | 44.0 KB | 0.0 KB | 13.7 KB | 72.5 KB | 134.9 KB | 1.43 s | 4.16 s |
| Buscador | 29.8 KB | 0.8 KB | 8.4 KB | 72.5 KB | 113.7 KB | 0.99 s | 4.39 s |
| Prototipo inmersivo | — | — | — | — | — | — | no existe en esta construcción |
| Prototipo, versión liviana | — | — | — | — | — | — | no existe en esta construcción |
<!-- /tema:main antes del rediseño (tema provisorio) -->

<!-- tema:provisorio -->
## Tema construido: provisorio

Medido el 2026-10-22 sobre `npm run build:prueba`.

| Página | JS (archivos) | JS (en línea) | CSS | Fuentes | Total transferido | Primer pintado | Última descarga |
|---|---|---|---|---|---|---|---|
| Portada | 0.0 KB | 0.0 KB | 5.6 KB | 76.8 KB | 85.6 KB | 1.06 s | 3.37 s |
| Índice de ensayos | 0.0 KB | 0.0 KB | 5.6 KB | 56.9 KB | 65.1 KB | 1.01 s | 2.96 s |
| Índice del blog | 0.0 KB | 0.0 KB | 5.6 KB | 56.9 KB | 65.3 KB | 1.04 s | 2.98 s |
| Entrada larga | 0.0 KB | 0.0 KB | 5.6 KB | 92.5 KB | 112.1 KB | 1.15 s | 3.50 s |
| /libro | 0.0 KB | 0.0 KB | 5.6 KB | 56.9 KB | 64.7 KB | 1.04 s | 2.99 s |
| Mapa | 44.0 KB | 0.0 KB | 13.7 KB | 72.5 KB | 134.9 KB | 1.42 s | 4.33 s |
| Buscador | 29.8 KB | 0.8 KB | 8.5 KB | 72.5 KB | 113.8 KB | 1.04 s | 4.45 s |
| Prototipo inmersivo | 0.0 KB | 2.4 KB | 7.3 KB | 56.9 KB | 69.3 KB | 1.12 s | 3.02 s |
| Prototipo, versión liviana | 0.0 KB | 0.0 KB | 7.3 KB | 56.9 KB | 68.1 KB | 1.11 s | 3.02 s |
<!-- /tema:provisorio -->

<!-- tema:noche -->
## Tema construido: noche

Medido el 2026-10-22 sobre `npm run build:prueba`.

| Página | JS (archivos) | JS (en línea) | CSS | Fuentes | Total transferido | Primer pintado | Última descarga |
|---|---|---|---|---|---|---|---|
| Portada | 0.0 KB | 0.0 KB | 6.5 KB | 86.8 KB | 96.7 KB | 1.12 s | 3.63 s |
| Índice de ensayos | 0.0 KB | 0.0 KB | 6.5 KB | 62.7 KB | 71.8 KB | 1.08 s | 3.16 s |
| Índice del blog | 0.0 KB | 0.0 KB | 6.5 KB | 62.7 KB | 72.0 KB | 1.08 s | 3.16 s |
| Entrada larga | 0.0 KB | 0.0 KB | 6.5 KB | 104.1 KB | 124.6 KB | 1.12 s | 3.75 s |
| /libro | 0.0 KB | 0.0 KB | 6.5 KB | 62.7 KB | 71.4 KB | 1.06 s | 3.16 s |
| Mapa | 44.0 KB | 0.0 KB | 14.6 KB | 80.0 KB | 143.3 KB | 1.42 s | 4.62 s |
| Buscador | 29.8 KB | 0.8 KB | 9.4 KB | 80.0 KB | 122.1 KB | 1.06 s | 4.63 s |
| Prototipo inmersivo | 0.0 KB | 2.4 KB | 8.2 KB | 62.7 KB | 76.0 KB | 1.17 s | 3.22 s |
| Prototipo, versión liviana | 0.0 KB | 0.0 KB | 8.2 KB | 62.7 KB | 74.8 KB | 1.12 s | 3.19 s |
<!-- /tema:noche -->

<!-- tema:crema -->
## Tema construido: crema

Medido el 2026-10-22 sobre `npm run build:prueba`.

| Página | JS (archivos) | JS (en línea) | CSS | Fuentes | Total transferido | Primer pintado | Última descarga |
|---|---|---|---|---|---|---|---|
| Portada | 0.0 KB | 0.0 KB | 7.0 KB | 68.4 KB | 78.7 KB | 1.10 s | 3.28 s |
| Índice de ensayos | 0.0 KB | 0.0 KB | 7.0 KB | 68.4 KB | 78.0 KB | 1.05 s | 3.25 s |
| Índice del blog | 0.0 KB | 0.0 KB | 7.0 KB | 68.4 KB | 78.2 KB | 1.04 s | 3.25 s |
| Entrada larga | 0.0 KB | 0.0 KB | 7.0 KB | 89.2 KB | 110.2 KB | 1.14 s | 3.92 s |
| /libro | 0.0 KB | 0.0 KB | 7.0 KB | 68.4 KB | 77.6 KB | 1.05 s | 3.25 s |
| Mapa | 44.0 KB | 0.0 KB | 15.0 KB | 89.2 KB | 153.0 KB | 1.45 s | 4.39 s |
| Buscador | 29.8 KB | 0.8 KB | 9.8 KB | 89.2 KB | 131.8 KB | 1.04 s | 4.83 s |
| Prototipo inmersivo | 0.0 KB | 2.4 KB | 8.6 KB | 93.5 KB | 107.2 KB | 1.18 s | 3.86 s |
| Prototipo, versión liviana | 0.0 KB | 0.0 KB | 8.6 KB | 93.5 KB | 106.0 KB | 1.13 s | 3.84 s |
<!-- /tema:crema -->

<!-- tema:Mapa 2.0 con MapLibre (tema provisorio) -->
## Mapa 2.0 con MapLibre (tema provisorio)

Medido el 2026-10-22 sobre `npm run build:prueba`.

| Página | JS (archivos) | JS (en línea) | CSS | Fuentes | Total transferido | Primer pintado | Última descarga |
|---|---|---|---|---|---|---|---|
| Portada | 0.0 KB | 0.0 KB | 5.6 KB | 76.8 KB | 85.6 KB | 1.13 s | 3.45 s |
| Índice de ensayos | 0.0 KB | 0.0 KB | 5.6 KB | 56.9 KB | 65.1 KB | 1.05 s | 2.98 s |
| Índice del blog | 0.0 KB | 0.0 KB | 5.6 KB | 56.9 KB | 65.3 KB | 1.08 s | 2.99 s |
| Entrada larga | 0.0 KB | 0.0 KB | 5.6 KB | 92.5 KB | 112.1 KB | 1.17 s | 3.92 s |
| /libro | 0.0 KB | 0.0 KB | 5.6 KB | 56.9 KB | 64.7 KB | 1.10 s | 3.01 s |
| Mapa | 282.4 KB | 0.0 KB | 19.1 KB | 72.5 KB | 383.5 KB | 1.35 s | 11.55 s |
| Buscador | 29.8 KB | 0.8 KB | 8.5 KB | 72.5 KB | 113.8 KB | 1.07 s | 4.51 s |
| Prototipo inmersivo | 0.0 KB | 2.4 KB | 7.3 KB | 56.9 KB | 69.3 KB | 1.18 s | 3.07 s |
| Prototipo, versión liviana | 0.0 KB | 0.0 KB | 7.3 KB | 56.9 KB | 68.1 KB | 1.20 s | 3.10 s |
<!-- /tema:Mapa 2.0 con MapLibre (tema provisorio) -->
