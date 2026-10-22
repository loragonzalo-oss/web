// Revisión de las páginas principales en escritorio (1280 px) y celular (390 px),
// sobre la construcción de prueba (npm run build:prueba, que incluye los borradores de ejemplo):
// sin desborde horizontal, sin errores de consola y sin errores de accesibilidad serios o críticos.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { abrir } from './ayudas';

const PAGINAS = [
  { nombre: 'portada', ruta: '' },
  { nombre: 'blog', ruta: 'blog/' },
  { nombre: 'ensayos', ruta: 'ensayos/' },
  { nombre: 'sobre-mi', ruta: 'sobre-mi/' },
  { nombre: 'contacto', ruta: 'contacto/' },
  { nombre: 'mapa', ruta: 'mapa/' },
  { nombre: 'buscar', ruta: 'buscar/' },
  { nombre: '404', ruta: 'esta-pagina-no-existe/' },
  // Contenido de ejemplo (borradores): existen sólo en la construcción de prueba (npm run build:prueba).
  { nombre: 'entrada-larga', ruta: 'blog/ejemplo-entrada-larga/' },
  { nombre: 'serie', ruta: 'series/serie-de-ejemplo/' },
  { nombre: 'archivo', ruta: 'blog/archivo/' },
  { nombre: 'ensayo-revista', ruta: 'ensayos/ejemplo-ensayo-revista/' },
];

for (const { nombre, ruta } of PAGINAS) {
  test.describe(nombre, () => {
    test('sin desborde horizontal ni errores de consola', async ({ page }) => {
      const errores = await abrir(page, ruta);
      // La 404 responde con código 404 a propósito; el navegador lo anota en la consola.
      const reales = nombre === '404' ? errores.filter((e) => !/status of 404/.test(e)) : errores;
      expect(reales, 'errores en la consola').toEqual([]);

      const { ancho, visible, culpables } = await page.evaluate(() => {
        const visible = document.documentElement.clientWidth;
        const culpables = [...document.querySelectorAll('body *')]
          .filter((el) => el.getBoundingClientRect().right > visible + 1)
          .filter((el) => !el.closest('.leaflet-container')) // el mapa recorta su propio contenido
          .slice(0, 5)
          .map((el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''}`);
        return { ancho: document.documentElement.scrollWidth, visible, culpables };
      });
      expect(ancho, `la página es más ancha que la pantalla (${culpables.join(', ')})`).toBeLessThanOrEqual(visible);
    });

    // Se revisa en modo claro y en modo oscuro: el contraste cambia con la paleta.
    for (const modo of ['light', 'dark'] as const) {
      test(`accesibilidad (axe, modo ${modo === 'light' ? 'claro' : 'oscuro'}): sin errores serios ni críticos`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: modo });
        await abrir(page, ruta);
        const resultado = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
          .analyze();
        const graves = [];
        for (const v of resultado.violations) {
          if (v.impact !== 'serious' && v.impact !== 'critical') continue;
          if (v.id === 'target-size') {
            // Excepción «Equivalente» de WCAG 2.5.8: cada punto del mapa tiene el mismo destino
            // en el listado de abajo («Ver en el mapa»). Sólo se perdona dentro de los marcadores.
            const enMarcadores = await Promise.all(
              v.nodes.map((n) => page.locator(String(n.target[0])).first().evaluate((el) => !!el.closest('.leaflet-marker-pane'))),
            );
            v.nodes = v.nodes.filter((_, i) => !enMarcadores[i]);
            if (v.nodes.length === 0) continue;
          }
          graves.push(v);
        }
        const informe = graves.map((v) => `[${v.impact}] ${v.id}: ${v.help}\n    ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join('\n    ')}`);
        expect(informe, 'problemas de accesibilidad').toEqual([]);
      });
    }
  });
}
