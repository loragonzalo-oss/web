// Datos que mapa.astro escribe en <script id="datos-mapa"> (ver LugarMapa en src/lib/lugares.ts
// y Fondo en src/lib/mapa-fondos.ts). Sólo tipos: no agrega código al navegador.
import type { Geometria } from '../../lib/geometria';

export interface LugarMapa {
  id: string;
  titulo: string;
  capa: string;
  pais: string;
  tipo: 'punto' | 'linea' | 'poligono';
  aproximado: boolean;
  punto: [number, number];
  caja?: [number, number, number, number];
  forma?: Geometria;
}

export interface FondoMapa {
  id: string;
  nombre: string;
  tipo: 'raster' | 'raster-dem';
  teselas: string;
  tamTesela: number;
  zoomMax: number;
  atribucion: string;
  oscuro?: { brilloMin?: number; brilloMax?: number; saturacion?: number; contraste?: number; tono?: number };
  disponible: boolean;
}

export interface Datos {
  lugares: LugarMapa[];
  vista: [[number, number], [number, number]]; // [[lat, lon], [lat, lon]]
  recorte: { latMin: number; latMax: number; lonMin: number; lonMax: number };
  radio: number;
  nombresCapas: Record<string, string>;
  fondos: FondoMapa[];
  predeterminado: string;
  codificacionRelieve: 'terrarium' | 'mapbox';
  lagoSintetico: GeoJSON.FeatureCollection | null;
}
