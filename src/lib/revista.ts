// Datos de un ensayo publicado en una revista: volumen, número, páginas y DOI.
// Los usan el esquema (src/content.config.ts), la cita (src/lib/lectura.ts), la página
// del ensayo y los controles del puente con Obsidian (scripts/obsidian/controles.mjs).

// DOI: se acepta solo («10.1234/abc») o como dirección («https://doi.org/10.1234/abc»).
// Se guarda y se usa siempre sin la dirección delante.
const DOI = /^(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)?(10\.\d{4,9}\/\S+)$/i;

export function normalizarDoi(v: string): string | undefined {
  return v.trim().match(DOI)?.[1];
}

export const urlDoi = (doi: string) => `https://doi.org/${doi}`;

// Páginas: «45-67», «45–67» o «45 - 67» quedan con raya corta, como en APA; una sola página queda igual.
const PAGINAS = /^([A-Za-z]?\d+)(?:\s*[-–—]+\s*([A-Za-z]?\d+))?$/;

export function normalizarPaginas(v: string): string | undefined {
  const m = v.trim().match(PAGINAS);
  if (!m) return undefined;
  return m[2] ? `${m[1]}–${m[2]}` : m[1];
}

// «vol. 12, n.º 3, pp. 45–67»: para mostrar en la página del ensayo.
export function detalleRevista(d: { volumen?: string; numero?: string; paginas?: string }): string {
  const partes = [];
  if (d.volumen) partes.push(`vol. ${d.volumen}`);
  if (d.numero) partes.push(`n.º ${d.numero}`);
  if (d.paginas) partes.push(`${d.paginas.includes('–') ? 'pp.' : 'p.'} ${d.paginas}`);
  return partes.join(', ');
}
