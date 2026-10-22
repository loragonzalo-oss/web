# Revisión: capa Gobiernos municipales (piloto)

Encargo 8, 22-10-2026. Una ficha por cada uno de los 49 municipios de la tabla del registro de fuentes del autor (consulta del 21-10-2026): 19 de Bolivia y 30 del Perú. Están en `src/content/lugares/` (`bo-*.md` y `pe-*.md`), todas con `draft: true`. No se publica ninguna.

## Qué quedó hecho y qué no

**Hecho.** Las 49 fichas, con nombre, país, departamento, provincia y tipo (gobierno autónomo municipal, municipalidad provincial o municipalidad distrital). Las dudas del registro (ribereño dudoso, límite sobre el lago, varias direcciones posibles) están escritas en la ficha y en la tabla de abajo.

**No hecho: coordenadas, identificadores de Wikidata y enlaces.** La sesión donde se armó este piloto no tenía salida a internet: la política de red bloqueó `www.wikidata.org`, `query.wikidata.org`, todas las webs municipales y `tile.openstreetmap.org`. Siguiendo el encargo («si no podés abrir una dirección, no la pongas»), ninguna ficha lleva coordenada, identificador Q ni enlace. Por eso:

- las 49 fichas están con `precision: oculta` y marcador `[VERIFICAR]`;
- ninguna tiene punto en el mapa: las capturas no muestran los 49 puntos y no se pudo comprobar a la vista si caen en tierra firme junto al lago;
- los enlaces que el registro da como «verificado 2026-10-21» tampoco se cargaron: los verificó el autor, pero en esta sesión no se pudieron reabrir.

Para completar: repetir los pasos 1, 2 y 5 del encargo en una sesión con acceso a `wikidata.org`, a las webs municipales y a `tile.openstreetmap.org`. En cada ficha, agregar `lat` y `lon`, pasar a `precision: exacta`, agregar en `fuentes` el identificador de Wikidata y en `enlaces` las direcciones que carguen, con su fecha de verificación.

## Nombres oficiales

Los nombres se armaron con la forma de cada país: «Gobierno Autónomo Municipal de…» en Bolivia y «Municipalidad Provincial de…» o «Municipalidad Distrital de…» en el Perú. Ninguno se contrastó todavía con una fuente oficial: cada ficha lo dice con `[VERIFICAR]`. Casos a mirar:

- **Carabuco.** El registro dice «Carabuco (Puerto Mayor de Carabuco)». La ficha usa «Puerto Mayor de Carabuco» (archivo `bo-puerto-mayor-de-carabuco.md`).
- **Tiahuanacu.** Se usa la grafía del registro y de su dominio (`tiahuanacu.gob.bo`).
- **Chucuito.** Hay dos fichas: la Municipalidad Provincial de Chucuito, con sede en Juli (`pe-mp-chucuito.md`), y la Municipalidad Distrital de Chucuito (`pe-md-chucuito.md`).
- **Nombres repetidos en los dos países.** Desaguadero y Taraco existen en Bolivia y en el Perú; los archivos se distinguen por el prefijo `bo-` o `pe-`.

## Capturas

En `docs/capturas/municipios/`, construcción de prueba (con borradores), modo claro:

- `mapa-escritorio.png`, `mapa-celular.png`: el mapa con las capas. La capa Gobiernos municipales cuenta 50 fichas (las 49 más la ficha de ejemplo), pero sólo se ve el punto de ejemplo, porque las 49 están ocultas. Las teselas de OpenStreetMap salen en blanco: el entorno las bloquea.
- `listado-escritorio.png`, `listado-celular.png`: el listado bajo el mapa con la ficha de Achacachi abierta.

Hay que rehacerlas cuando las fichas tengan coordenadas.

## Tabla

Columnas: municipio, país, coordenada, fuente de la coordenada, enlaces verificados, marcador, observaciones. En observaciones van el estado y las direcciones tal como figuran en el registro del autor; ninguna se abrió en esta sesión.

| Municipio | País | Coordenada | Fuente de la coordenada | Enlaces verificados | Marcador | Observaciones |
|---|---|---|---|---|---|---|
| Gobierno Autónomo Municipal de Puerto Acosta | Bolivia | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: sin web |
| Gobierno Autónomo Municipal de Escoma | Bolivia | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: sin web |
| Gobierno Autónomo Municipal de Puerto Mayor de Carabuco | Bolivia | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. El registro lo nombra «Carabuco (Puerto Mayor de Carabuco)»: falta confirmar cuál es la forma oficial. · Registro: sin web |
| Gobierno Autónomo Municipal de Achacachi | Bolivia | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: verificado 2026-10-21. Registro: web https://www.achacachi.gob.bo/ · Facebook https://www.facebook.com/MunicipioDeAchacachi |
| Gobierno Autónomo Municipal de Ancoraimes | Bolivia | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: dudoso como ribereño [VERIFICAR]. Dudoso como ribereño según el registro: falta confirmar que el municipio tiene orilla sobre el lago. · Registro: sin web |
| Gobierno Autónomo Municipal de Santiago de Huata | Bolivia | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: sin web |
| Gobierno Autónomo Municipal de Huarina | Bolivia | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: sin web |
| Gobierno Autónomo Municipal de Huatajata | Bolivia | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: sin web |
| Gobierno Autónomo Municipal de Chua Cocani | Bolivia | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: sin web |
| Gobierno Autónomo Municipal de Copacabana | Bolivia | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: sin web |
| Gobierno Autónomo Municipal de San Pedro de Tiquina | Bolivia | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: sin web |
| Gobierno Autónomo Municipal de Tito Yupanqui | Bolivia | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: sin web |
| Gobierno Autónomo Municipal de Puerto Pérez | Bolivia | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: ribereño verificado 2026-10-21 (Ley 758/2015). Registro: sin web |
| Gobierno Autónomo Municipal de Batallas | Bolivia | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: sin web |
| Gobierno Autónomo Municipal de Pucarani | Bolivia | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: web pucarani.gob.bo (no cargó) |
| Gobierno Autónomo Municipal de Tiahuanacu | Bolivia | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: web verificada 2026-10-21. Registro: web https://tiahuanacu.gob.bo/ (sólo «PRONTO DISPONIBLE») |
| Gobierno Autónomo Municipal de Taraco | Bolivia | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: sin web |
| Gobierno Autónomo Municipal de Guaqui | Bolivia | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR] límite municipal sobre el lago. El registro anota una duda sobre el límite municipal sobre el lago. · Registro: sin web |
| Gobierno Autónomo Municipal de Desaguadero | Bolivia | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: dudoso como ribereño [VERIFICAR]. Dudoso como ribereño según el registro: falta confirmar que el municipio tiene orilla sobre el lago. · Registro: web desaguadero.gob.bo (no cargó) |
| Municipalidad Provincial de Puno | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: verificado 2026-10-21. Registro: web https://portal.munipuno.gob.pe/ · Facebook https://www.facebook.com/municipalidadpuno |
| Municipalidad Distrital de Paucarcolla | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR] cuál está activa. El registro tiene tres direcciones posibles en gob.pe: falta saber cuál está activa. · Registro: web gob.pe: /munipaucarcolla, /municipalidad-distrital-de-paucarcolla o /munidepaucarcolla |
| Municipalidad Distrital de Huata | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: web https://www.gob.pe/munihuata |
| Municipalidad Distrital de Coata | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: web https://www.gob.pe/munidistrital-coata |
| Municipalidad Distrital de Capachica | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: verificado 2026-10-21. Registro: web https://municapachica.org.pe/ · Facebook https://www.facebook.com/profile.php?id=100089250506649 |
| Municipalidad Distrital de Amantaní | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: web https://www.gob.pe/muniamantani |
| Municipalidad Distrital de Chucuito | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: web https://www.gob.pe/munichucuito |
| Municipalidad Distrital de Platería | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: dudoso como ribereño [VERIFICAR]. Dudoso como ribereño según el registro: falta confirmar que el distrito tiene orilla sobre el lago. · Registro: web https://muniplateria.gob.pe/ |
| Municipalidad Distrital de Acora | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: verificado 2026-10-21. Registro: web https://muniacora.gob.pe/ · Facebook https://www.facebook.com/profile.php?id=61564903435423 |
| Municipalidad Provincial de Chucuito | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: verificado 2026-10-21. Registro: web https://munijuli.gob.pe/ |
| Municipalidad Distrital de Pomata | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: verificado 2026-10-21. Registro: web https://portal.munipomata.gob.pe/ · Facebook https://www.facebook.com/PumaUta2023 |
| Municipalidad Distrital de Zepita | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: web https://www.munizepita.gob.pe/ |
| Municipalidad Distrital de Desaguadero | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: web https://portal.munidesaguadero.gob.pe/ |
| Municipalidad Provincial de El Collao | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: verificado 2026-10-21; Ilave dudoso como ribereño. Según el registro, Ilave es dudoso como ribereño: falta confirmar si la sede o el distrito tienen orilla sobre el lago. · Registro: web https://municollao.gob.pe/ · Facebook https://www.facebook.com/profile.php?id=100089093534248 |
| Municipalidad Distrital de Pilcuyo | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: verificado 2026-10-21. Registro: web https://munipilcuyo.gob.pe/ · Facebook https://www.facebook.com/MunicipalidadDistritalPilcuyo |
| Municipalidad Provincial de Yunguyo | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: verificado 2026-10-21. Registro: web https://muniyunguyo.gob.pe/ · Facebook https://www.facebook.com/MuncipalidadProvincialYunguyo |
| Municipalidad Distrital de Anapia | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: web https://www.gob.pe/munianapia |
| Municipalidad Distrital de Copani | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: web https://www.gob.pe/municopani |
| Municipalidad Distrital de Cuturapi | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: web https://www.gob.pe/municuturapi |
| Municipalidad Distrital de Ollaraya | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: web https://www.gob.pe/muniollaraya |
| Municipalidad Distrital de Tinicachi | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: web https://www.gob.pe/munitinicachi |
| Municipalidad Distrital de Unicachi | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: web https://www.gob.pe/muniunicachi |
| Municipalidad Provincial de Huancané | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: verificado 2026-10-21 (subpágina). Registro: web http://www.munihuancane.gob.pe/ |
| Municipalidad Distrital de Vilque Chico | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: web https://www.gob.pe/munivilquechico |
| Municipalidad Distrital de Taraco | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: web https://www.gob.pe/munitaraco |
| Municipalidad Distrital de Pusi | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: web https://www.gob.pe/municipalidad-distrital-de-pusi |
| Municipalidad Provincial de Moho | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: verificado 2026-10-21. Registro: web https://munimoho.gob.pe/ · Facebook https://www.facebook.com/profile.php?id=100084343180463 |
| Municipalidad Distrital de Conima | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: web https://www.gob.pe/municipalidad-distrital-de-conima-mdc |
| Municipalidad Distrital de Tilali | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: [VERIFICAR]. Registro: web https://www.gob.pe/municipalidad-distrital-de-tilali |
| Municipalidad Distrital de Samán | Perú | — (oculta) | [VERIFICAR] sin consultar | ninguno | [VERIFICAR] | Estado en el registro: web verificada; ribereño dudoso [VERIFICAR]. Dudoso como ribereño según el registro: falta confirmar que el distrito tiene orilla sobre el lago. · Registro: web https://munisaman.gob.pe/ · Facebook https://www.facebook.com/profile.php?id=100089221302651 |
