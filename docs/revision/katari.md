# Revisión · Capa del mapa: presiones y obras de la cuenca Katari

Encargo 9, 22-10-2026. Borrador: las 14 fichas llevan `draft: true` y no salen en `npm run build`. Se ven sólo en desarrollo y en la construcción de prueba (`npm run build:prueba`).

## Fuentes

Sólo dos documentos del repositorio `loragonzalo-oss/tecnico` (rama `main`, sin modificar):

- **PDCKyLMT**: Ministerio de Medio Ambiente y Agua, Viceministro de Recursos Hídricos y Riego (2018). *Plan Director de la Cuenca Katari y su Estrategia de Recuperación Integral de la Cuenca y del Lago Menor del Titicaca*. Archivo: `BID - ALT/Plan de Fortalecimieno Institucional/Corpus documental/PDCKyLMT. PDF  Final.pdf.md`. El nombre del archivo lleva **dos espacios** entre «PDF» y «Final»; en el encargo figuraba con uno.
- **Diagnóstico ALT**: Gonzalo Lora Veizaga, CT BID BO-T1425 (octubre de 2025). *Diagnóstico Institucional de la Autoridad Autónoma del Sistema TDPS – ALT* (Producto 2). Archivo: `BID - ALT/Plan de Fortalecimieno Institucional/Corpus documental/02_ADM_PROD2_Diagnostico_Institucional_y_Consultorias_Gonzalo_Lora.pdf.md`.

Como índice se usó el grafo `_grafo/piloto-pfi/graphify-out/graph.json` de la rama `grafo/piloto-pfi`. Cada cita se tomó del archivo original. Un script comprobó que cada texto entre « » de las fichas aparece en el rango de líneas que se indica.

Los números de línea son los de los archivos `.md` del corpus. No son páginas del PDF.

## Lugares

Las 14 fichas van con `capa: ecologia` de forma provisoria, `precision: oculta`, sin lat ni lon, y `marcador: "[VERIFICAR]"`.

| Lugar | Papel en la cadena | Coordenada y origen | Actores responsables (PDCKyLMT, Cuadro 20) | Fuentes con línea | Marcador | Observaciones |
|---|---|---|---|---|---|---|
| Pasivos mineros de Milluni (`pasivos-mineros-milluni.md`) | Fuente de lixiviados con metales pesados | Pendiente | LA 3.1, Mesa Técnica 7: Plataforma Interinstitucional, MMAyA-VRHR, GADLP, GAM, entidades productivas sectoriales privadas, VAPSB, VMABCCGDF, MDRyT, MDPEP, Min. Minería, Min. Cultura y Turismo | PDCKyLMT 2368, 2752-2755, 2933-2934, 3301-3310, 7717-7719, 11680-11686; Diagnóstico ALT 14365-14369 | [VERIFICAR] | El Diagnóstico ALT escribe «Mulluni» en una línea (14368). El PDCKyLMT nombra también una presa Milluni en Pucarani, para consumo humano, animal y riego (líneas 1262-1264): es otro objeto, no entra en la ficha. |
| Relleno sanitario de Villa Ingenio (`relleno-sanitario-villa-ingenio.md`) | Disposición final de residuos de El Alto; fuente de lixiviados hacia el río Seke | Pendiente | LA 3.3, Mesa Técnica 9: Plataforma Interinstitucional, MMAyA-VAPSB, VRHR, GADLP, GAM, EMAGUA, VMABCCGDF | PDCKyLMT 2872-2875, 3308-3314, 5822, 5832-5836, 7717-7719, 11696-11699 | [VERIFICAR] | El plan habla de «rellenos sanitarios» en plural en la línea 5833. |
| PTAR de Puchukollo (`ptar-puchukollo.md`) | Planta de tratamiento (rebasada; en obras del PSLT) | Pendiente | LA 3.2, Mesa Técnica 8: GADLP, GAM, FPS, EMAGUA, MMAyA-VAPSB, Plataforma Interinstitucional, MMAyA-VRHR | PDCKyLMT 2809-2815, 2934-2935, 5474-5476, 7717-7719, 11687-11690, 18405-18406, 18421-18423; Diagnóstico ALT 5256-5267, 5354-5357, 14369-14371 | [VERIFICAR] | Variantes del nombre: Puchucollo (PDCKyLMT 18423) y Puchokollo (Diagnóstico ALT 14369). Regla 6: la fuente atribuye retrasos de obra a «temas arqueológicos». Decidir antes de ponerle coordenada. |
| Desembocadura del río Katari (`desembocadura-rio-katari.md`) | Punto de descarga al cuerpo receptor | Pendiente | LA 5.1 (monitoreo): SENAMHI, Plataforma Interinstitucional, MMAyA-VRHR, GADLP, GAM, UOB | PDCKyLMT 2754-2755, 3221-3227, 6315-6317, 11650-11651, 11714-11715; Diagnóstico ALT 18598-18600 | [VERIFICAR] | El PDCKyLMT describe la descarga sin nombrar un sitio. El «sitio sentinel» del Diagnóstico ALT es una propuesta. |
| Bahía de Cohana (`bahia-de-cohana.md`) | Cuerpo receptor | Pendiente | LA 3.2 (Mesa Técnica 8) y LA 5.1 (monitoreo), como arriba | PDCKyLMT 2754-2755, 2765-2767, 2869-2870, 2929-2932, 3159-3164, 3229-3232, 5478-5480, 7717-7719, 11650-11651, 11687-11690, 11714-11715; Diagnóstico ALT 10435-10436, 20823-20825 | [VERIFICAR] | Es un área, no un punto. Si lleva coordenada, decidir si se dibuja como punto. |
| Cascachi (`monitoreo-cascachi.md`) | Sitio de monitoreo del cuerpo receptor | Pendiente | LA 5.1 (monitoreo), como arriba | PDCKyLMT 3159-3164, 3184-3214, 6315-6317, 11650-11651, 11714-11715 | [VERIFICAR] | La fuente lo llama «zona»: no da un punto de muestreo. |
| Pajchiri (`monitoreo-pajchiri.md`) | Sitio de monitoreo del cuerpo receptor | Pendiente | LA 5.1 (monitoreo), como arriba | PDCKyLMT 3159-3164, 3184-3214, 6315-6317, 11650-11651, 11714-11715 | [VERIFICAR] | El PDCKyLMT nombra también el «Sistema de riego Pajchari-Cohana» (línea 2380). No se sabe si es el mismo lugar. |
| Boya HydroMet del Lago Menor (`boya-hydromet-lago-menor.md`) | Monitoreo del cuerpo receptor (hoy fuera de operación) | Pendiente | LA 5.1 (monitoreo), como arriba | Diagnóstico ALT 5863-5865, 5942-5950, 16436-16448; PDCKyLMT 11650-11651, 11714-11715 | [VERIFICAR] | El PDCKyLMT no la menciona. Según la fuente, el equipo está guardado en un predio privado: decidir si conviene publicar ese dato. |
| PTAR del municipio de Desaguadero (`ptar-desaguadero.md`) | Planta de tratamiento | Pendiente | LA 3.2, Mesa Técnica 8 | PDCKyLMT 2803-2806, 2821, 2827, 7717-7719, 11687-11690; Diagnóstico ALT 5279-5293 | [VERIFICAR] | No se sabe si la PTAR del PSLT es la misma de 2017 o una nueva. |
| PTAR del municipio de Batallas (`ptar-batallas.md`) | Planta de tratamiento | Pendiente | LA 3.2, Mesa Técnica 8 | PDCKyLMT 2803-2806, 2825, 2827, 7717-7719, 11687-11690; Diagnóstico ALT 5279-5287 | [VERIFICAR] | Ídem. |
| PTAR del municipio de Tiahuanacu (`ptar-tiahuanacu.md`) | Planta de tratamiento | Pendiente | LA 3.2, Mesa Técnica 8 | PDCKyLMT 2803-2806, 2819, 2827, 7717-7719, 11687-11690 | [VERIFICAR] | Regla 6: municipio con sitios arqueológicos. Decidir la precisión antes de ponerle coordenada. |
| PTAR del municipio de Copacabana (`ptar-copacabana.md`) | Planta de tratamiento | Pendiente | LA 3.2, Mesa Técnica 8 | PDCKyLMT 2803-2806, 2823, 2827, 7717-7719, 11687-11690 | [VERIFICAR] | — |
| Relleno sanitario de Tiahuanaco (`relleno-sanitario-tiahuanaco.md`) | Disposición final de residuos sólidos (obra del PSLT) | Pendiente | LA 3.3, Mesa Técnica 9 | PDCKyLMT 7717-7719, 11696-11699, 18431-18440; Diagnóstico ALT 5310-5312 | [VERIFICAR] | Se escribe «Tiahuanaco» en el PDCKyLMT y «Tiahuanacu» en el Diagnóstico ALT. Regla 6, como arriba. |
| Relleno sanitario de Copacabana (`relleno-sanitario-copacabana.md`) | Disposición final de residuos sólidos (obra prevista) | Pendiente | LA 3.3, Mesa Técnica 9 | PDCKyLMT 7717-7719, 11696-11699, 18431-18440; Diagnóstico ALT 5316-5317 | [VERIFICAR] | El proyecto fue «desestimado por falta de viabilidad social». Decidir si la ficha se mantiene. |

**Cuenta: 0 fichas con coordenada del corpus y 14 pendientes.** Ninguna de las dos fuentes da coordenadas geográficas ni UTM de estos lugares. La única coordenada puntual que trae el PDCKyLMT es la de la estación meteorológica Tiawanacu del SENAMHI (16° 34' 07'' S, 68° 40' 42'' W; líneas 1018-1023, sin datum). Esa estación no forma parte de la cadena de contaminación y saneamiento y queda fuera de este encargo. Las líneas 646-647 dan los límites de la cuenca, no un punto.

Como ninguna ficha tiene coordenadas, **no hay capturas** en `docs/capturas/katari/`: las fichas no tienen punto en el mapa y sólo aparecen en el listado de la página del mapa.

## Por qué todas llevan [VERIFICAR]

1. **Coordenada pendiente** en las 14, como pide el encargo.
2. **Actores.** El Cuadro 19 del PDCKyLMT (Matriz de corresponsabilidad, líneas 8940-9952) llegó desarmado en la conversión del PDF a texto. Los encabezados de los actores y los códigos (P, Iv, Inv, NC) quedaron en el orden en que los leyó `pdftotext`, y no se pueden atar a cada columna. Los actores de las fichas salen del Cuadro 20 (mesas técnicas), que el propio plan dice haber armado «con base en las Matriz de corresponsabilidad» (líneas 7717-7719). La tabla del Cuadro 20 también llegó desordenada. Que la Mesa 7 corresponda a la LA 3.1, la Mesa 8 a la LA 3.2 y la Mesa 9 a la LA 3.3 se dedujo del orden de aparición y del contenido: la 7 incluye a Min. Minería, la 8 a FPS y EMAGUA. Para el monitoreo (LA 5.1) se tomó la lista de ejecutores que aparece junto a las AE 5.1.x. **Hay que confirmarlo contra el PDF original.**
3. **Capa provisoria** (Ecología).

## Capa: propuesta

Ninguna de las nueve capas existentes corresponde. Las fichas van en Ecología, la más cercana. No se tocó el código. Nombre propuesto para una capa nueva: **«Presiones y saneamiento»** (id `presiones-saneamiento`). Cubre fuentes de contaminación, obras de saneamiento y sitios de monitoreo. Si se aprueba, se agrega en `src/lib/capas.ts` con su color en cada tema y su ícono en `tokens.css`, y en las 14 fichas se cambia una línea.

## Ríos: pendiente de decisión del autor

Los ríos son trazos, no puntos. No tienen ficha. Para dibujarlos haría falta una geometría con licencia confirmada, y el mapa hoy sólo admite puntos.

- **Seke** (también «Seque» en PDCKyLMT 5770 y en Diagnóstico ALT 16475). Lleva los lixiviados de Milluni y de Villa Ingenio (PDCKyLMT 2752-2753, 2874).
- **Seco**. Se une al Seke a la salida de El Alto (PDCKyLMT 2753-2754).
- **Pallina**. Recibe al Seke y al Seco y pasa al Katari (PDCKyLMT 2754; Diagnóstico ALT 16475-16476).
- **Katari**. Descarga en la Bahía de Cohana (PDCKyLMT 2754-2755).
- Otros que nombran las fuentes en la misma cadena: **Jalakeri** (metales pesados, PDCKyLMT 2933), **Hernani** (desechos de mataderos clandestinos de El Alto, PDCKyLMT 2936-2937), **San Roque** (PDCKyLMT 5830) y **Sewenca** o **Sehuenca** (PDCKyLMT 1262, 2366, 5771).

## Candidatos sin ficha

Aparecen en las fuentes, pero sin un lugar puntual identificable o fuera de la cadena. Quedan para que el autor decida.

- Las 10 PTAR del PSLT en localidades de la cuenca Katari. La fuente sólo da municipios: Puerto Pérez, Batallas, Pucarani, Comanche, Calamarca, Laja, Tito Yupanqui, Desaguadero, San Pedro de Tiquina y San Pablo de Tiquina (Diagnóstico ALT 5279-5295). Batallas y Desaguadero ya tienen ficha por el PDCKyLMT.
- PTAR de Tacachira (Diagnóstico ALT 20826). La fuente no dice dónde está.
- Complejos de tratamiento de residuos sólidos en Pucarani y Collana, licitados y todavía sin operar (Diagnóstico ALT 5321-5324).
- «Construcción de tres rellenos sanitarios u obras equivalentes» y «Cierre de tres botaderos existentes». La fuente no los nombra (PDCKyLMT 18444-18448).
- Plantas piloto de fitorremediación en la Isla Suriqui, el río Katari y la Bahía de Cohana. Es una propuesta (PDCKyLMT 2363-2364).
- Mataderos clandestinos de El Alto, fuente dispersa (PDCKyLMT 2935-2937).
- Red de 41 estaciones limnológicas del Lago Menor (Diagnóstico ALT 16465-16468) y puntos del Protocolo Binacional de monitoreo (Diagnóstico ALT 10535-10537): el texto no los lista.
- Estación meteorológica Tiawanacu del SENAMHI. Es el único lugar con coordenada en el corpus, pero queda fuera de la cadena (ver arriba).

## Otras notas

- **Fuentes en el esquema.** El campo `fuentes` de `src/content.config.ts` admite `autor`, `año`, `titulo` y `url`. No tiene lugar para el archivo ni la línea. Mientras tanto, el archivo y las líneas van dentro de `titulo`, y el cuerpo de cada ficha cita la línea junto a cada afirmación. Propuesta: agregar campos opcionales `archivo` y `lineas` al esquema y a `scripts/obsidian/controles.mjs`. No se hizo en este encargo.
- **Diagnóstico ALT.** Es un producto de consultoría del autor. En las fichas se cita en tercera persona, como fuente institucional de la CT.
- **Nombres.** Van como figuran en la fuente: «lago Titicaca», «Lago Menor del Titicaca», «Bahía de Cohana» y también «Bahía Cohana» en el nombre del programa. Las fichas no están en la voz del autor, así que no llevan «Titikaka».
- **Cifras.** Van entre comillas con el formato de la fuente («216.836 Tn/año», «USD 31 628 192.76», «500.000 habitantes»).

## Comprobaciones

`npm test` (22 pasan), `npm run temas:contraste`, `npm run build` (ninguna ficha nueva en la salida), `npm run build:prueba` (las 14 fichas en el listado del mapa) y `npm run revisar` (573 enlaces internos sin roturas; 88 pruebas de Playwright y axe pasan). En este entorno, Playwright se corrió con `CHROMIUM_PATH=/opt/pw-browsers/chromium`.
