# Tablero de indicadores: cómo se actualiza

La página es `/tablero/`. Todo lo que muestra sale de un archivo YAML por versión, en `src/content/tablero/`. Para cambiar cifras o textos se edita el YAML; no hace falta tocar código.

| Qué | Dónde |
|---|---|
| Datos y textos de cada versión | `src/content/tablero/p07.yaml` (vigente), `p06.yaml` (sólo historial) |
| Reglas que se comprueban al construir | `src/content.config.ts`, colección `tablero` |
| Cálculo de z, radios y dibujo de la rosa | `src/lib/tablero.ts` |
| Rosa, leyenda, tabla y textos | `src/components/tablero/` |
| Página | `src/pages/tablero.astro` |
| Imagen para compartir | `src/pages/og/[pagina].png.ts` (`/og/tablero.png`) |
| Pruebas | `pruebas/tablero.spec.ts` |

## Qué versión se muestra

La vigente es la versión **más reciente que tiene pétalos**. Las demás aparecen sólo en el historial, con su fecha, lo que cambió (`cambios`) y la herramienta con que se hizo (`herramienta`; si se borra ese campo, la línea no aparece).

## Cargar una versión nueva

1. Copiar el YAML de la vigente con el nombre nuevo: `p07.yaml` → `p08.yaml`. No renombrar ni borrar el anterior: queda como historial.
2. En el archivo nuevo, cambiar `version`, `nombre`, `fecha`, `cambios`, `herramienta` y dejar `draft: true`.
3. Cambiar valores, anclas y estados de los pétalos. Los números van con punto decimal y sin espacios (`998124`, no «998 124»): el sitio los escribe con el formato de la casa («998 124», «55%», signo menos «−»). `decimales` sirve para mostrar ceros finales («3807.80»).
4. Recalcular `z_referencia` de cada pétalo que cambió. Si no se recalcula, la construcción avisa: el error dice qué pétalo, la z calculada y la que dice el YAML. Se copia la calculada (con dos decimales) y listo.
5. En el archivo viejo se puede quitar `petalos` y `textos` para dejarlo sólo como historial, o dejarlos: como no es la más reciente, no se muestra.

## Qué controla la construcción

El sitio no se construye, y el error dice qué archivo y qué campo, si:

- la z calculada de un pétalo difiere de `z_referencia` en más de 0.01;
- las anclas no están en orden (con polaridad 1: referencia < límite < alto riesgo; con −1, al revés);
- un pétalo con criterio D no lleva `umbral: convencion`, o uno con A, B o C no lleva `umbral: fuente`;
- un pétalo usa una variable (`ve`) que no está en `variables`;
- algún texto lleva `[VERIFICAR]` o `[HIPÓTESIS]` (los marcadores de trabajo quedan en la bóveda);
- la versión tiene `draft: false` y queda algún `[PENDIENTE…]` en cualquier campo.

## Estado de cada pétalo para el lector

- `umbral: fuente` → «umbral con fuente»; `umbral: convencion` → «umbral por convención» y asterisco junto al valor.
- `estado_valor: fuente` → «valor con fuente»; `estado_valor: provisorio` → «valor provisorio».
- Umbral y valor con fuente se resumen como «con fuente».
- `incierto: true` → pétalo tenue con contorno claro y «valor incierto» en la tabla.

(El encargo llamaba `valor` al segundo campo; se llama `estado_valor` porque `valor` ya es la cifra.)

## Pasar de borrador a publicado

Mientras la versión vigente tenga `draft: true`, el sitio publicado muestra sólo «Tablero de indicadores del Lago Titikaka · en preparación», sin cifras ni rosa, fuera de los buscadores y con la imagen para compartir por defecto. Con `npm run dev` y en la construcción de prueba se ve todo, con el aviso de borrador.

Para publicar:

1. Reemplazar todos los `[PENDIENTE: …]` del YAML (textos, fuentes de los pétalos, lista de fuentes). Mientras quede uno, la construcción no deja publicar.
2. Cambiar `draft: true` por `draft: false`.

Con eso aparece todo, entra al buscador y se genera `/og/tablero.png` con la rosa. No hay que tocar código.

## Dónde se cambian los textos

En el YAML de la versión, bloque `textos`:

- `rotulo`: el recuadro de proyecto en curso, arriba de la rosa.
- `introduccion`: debajo de la fecha de la versión.
- `regla_lectura`: el pie de la figura (texto del autor, ya fijado).
- `metodo`: la nota de método.
- `metodo_apoyo`: el apoyo técnico (anclas, jerarquía A-D, fórmulas). Hoy es relleno; mientras lleve un `[PENDIENTE…]` se muestra enmarcado como tal. Se puede reescribir o borrar el campo entero.
- `fuentes`: la lista de fuentes, una por línea, en formato APA.

Formato de los textos: párrafos separados por una línea en blanco; una lista se escribe con líneas que empiezan con «- »; `*así*` va en cursiva. Las notas de cada pétalo (`nota`) y sus fuentes (`fuente`) admiten también la cursiva.

Los nombres de las variables estructurantes (`variables`) salen en la figura, en la tabla y en la leyenda.

## La figura

- Colores de pétalos y zonas: fijos, en `COLORES_ROSA` y `PARADAS` (`src/lib/tablero.ts`). No dependen del tema.
- Tipografía de la figura: `--fuente-tablero`, definida en un solo lugar (regla `.tablero` en `src/components/tablero/Rosa.astro`). Hoy hereda la del texto. Si se decide otra (por ejemplo Lato), hay que autoalojarla como las demás (paquete de Fontsource, licencia OFL) y poner su nombre en esa variable.
- Contraste de los objetos gráficos contra los fondos de «noche» y «crema»: `docs/tablero/contraste-figura.md`.

## Revisar antes de unir

```sh
npm run build:prueba
npm run revisar        # incluye pruebas/tablero.spec.ts
```
