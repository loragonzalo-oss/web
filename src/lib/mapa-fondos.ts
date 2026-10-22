// Fondos del mapa (/mapa). Es el ÚNICO archivo donde se definen: dirección de las teselas,
// licencia, enlace a la licencia y atribución que se muestra en el mapa.
// El lector elige el fondo con el control «Fondo» debajo del mapa; FONDO_PREDETERMINADO
// es el que aparece al abrir la página. Ver COMO-PUBLICAR.md, «Cambiar el fondo del mapa».
//
// Sólo fuentes que el autor ya verificó en su registro de fuentes, y ninguna que pida clave
// o cuenta (Google, Esri, MapTiler…). Una fuente nueva la agrega primero el autor a su registro.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type IdFondo = 'mapa' | 'satelite' | 'relieve';

export interface Fondo {
  id: IdFondo;
  nombre: string;
  // Teselas raster ('raster') o alturas codificadas en color para el sombreado ('raster-dem').
  tipo: 'raster' | 'raster-dem';
  // Dirección de las teselas, con {z}, {x} e {y}. Si empieza con «/», es del propio sitio.
  teselas: string;
  tamTesela: number;
  zoomMax: number;
  licencia: string;
  urlLicencia: string;
  // Atribución que se muestra en la esquina del mapa (HTML).
  atribucion: string;
  // Ajuste del fondo en modo oscuro (propiedades raster de MapLibre). Sin ajuste: igual que en claro.
  oscuro?: { brilloMin?: number; brilloMax?: number; saturacion?: number; contraste?: number; tono?: number };
  // Un fondo sin teselas todavía aparece en el control, desactivado, con el motivo.
  disponible: boolean;
  motivo?: string;
}

// Relieve: teselas de alturas generadas con scripts/mapa/relieve.mjs a partir del Copernicus DEM
// GLO-30. Se guardan en public/mapa/relieve/ junto con relieve.json (zoom, recorte, codificación).
// Mientras no estén, el control de relieve aparece desactivado.
export const CARPETA_RELIEVE = 'public/mapa/relieve';
const manifiestoRelieve = join(process.cwd(), CARPETA_RELIEVE, 'relieve.json');
const relieve = existsSync(manifiestoRelieve) ? JSON.parse(readFileSync(manifiestoRelieve, 'utf8')) : null;

export const FONDOS: Fondo[] = [
  {
    id: 'mapa',
    nombre: 'Mapa',
    tipo: 'raster',
    // Uso permitido: navegación normal. Prohibido descargar teselas en masa, precargarlas o
    // usarlas sin conexión (política de uso de las teselas de OpenStreetMap).
    teselas: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    tamTesela: 256,
    zoomMax: 19,
    licencia: 'ODbL',
    urlLicencia: 'https://www.openstreetmap.org/copyright',
    atribucion: '© <a href="https://www.openstreetmap.org/copyright">colaboradores de OpenStreetMap</a>',
    // Mismo efecto que el filtro oscuro que tenía el mapa anterior: colores invertidos y apagados.
    oscuro: { brilloMin: 0.85, brilloMax: 0.08, saturacion: -0.4, contraste: -0.1, tono: 180 },
    disponible: true,
  },
  {
    id: 'satelite',
    nombre: 'Satélite',
    tipo: 'raster',
    // Sentinel-2 cloudless 2016 (capa «s2cloudless_3857»). Las versiones 2018-2022 son
    // CC BY-NC-SA: no se usan. [VERIFICAR] la dirección y el zoom máximo con las teselas a la vista.
    teselas: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg',
    tamTesela: 256,
    zoomMax: 15,
    licencia: 'CC BY 4.0',
    urlLicencia: 'https://creativecommons.org/licenses/by/4.0/',
    atribucion: '<a href="https://s2maps.eu">Sentinel-2 cloudless - https://s2maps.eu</a> by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016)',
    oscuro: { brilloMax: 0.85 },
    disponible: true,
  },
  {
    id: 'relieve',
    nombre: 'Relieve',
    tipo: 'raster-dem',
    teselas: '/mapa/relieve/{z}/{x}/{y}.png',
    tamTesela: relieve?.tamTesela ?? 256,
    zoomMax: relieve?.zoomMax ?? 12,
    licencia: 'Licencia Copernicus DEM (redistribución y adaptación permitidas)',
    // [VERIFICAR] la dirección de la licencia y el texto exacto del aviso: desde el entorno
    // donde se escribió esto no se llega a los sitios de Copernicus.
    urlLicencia: 'https://spacedata.copernicus.eu/collections/copernicus-digital-elevation-model',
    atribucion: '© DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved',
    disponible: relieve !== null,
    motivo: 'Todavía no hay teselas de relieve: hay que generarlas a partir del Copernicus DEM (COMO-PUBLICAR.md, «Relieve: generar las teselas»).',
  },
];

export const FONDO_PREDETERMINADO: IdFondo = 'mapa';

// Codificación de las alturas en las teselas de relieve (la escribe el script en relieve.json).
export const CODIFICACION_RELIEVE: 'terrarium' | 'mapbox' = relieve?.codificacion ?? 'terrarium';

// Fondo del lago (batimetría). Es una capa que se suma al fondo elegido, no un fondo.
// Vacía hasta que llegue la batimetría de la ALT 2016-2021 con licencia confirmada.
// En desarrollo y en la construcción de prueba (nunca en `npm run build`) se puede ver un
// relleno sintético, rotulado como tal y sin ninguna cifra de profundidad.
export const LAGO = {
  id: 'lago',
  nombre: 'Fondo del lago (batimetría)',
  disponible: false,
  motivo: 'Todavía no hay batimetría con licencia confirmada (levantamientos de la ALT 2016-2021).',
  rotuloSintetico: 'sintético, no es el fondo real',
};
