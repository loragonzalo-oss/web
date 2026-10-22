// Prototipo «scroll es profundidad» (construcción de prueba): las condiciones de
// «Piezas inmersivas» de CLAUDE.md que se pueden comprobar con el navegador.
import { test, expect } from '@playwright/test';
import { abrir } from './ayudas';

const INMERSIVA = 'prototipos/profundidad/';
const LIVIANA = 'prototipos/profundidad/liviana/';

test('rotula la forma como ilustrativa y no muestra cifras de profundidad', async ({ page }) => {
  await abrir(page, INMERSIVA);
  await expect(page.locator('.escena-rotulo')).toHaveText('Forma ilustrativa, no es el fondo del lago');
  await expect(page.locator('.escena-rotulo')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Riel de profundidad' }).getByText('[PENDIENTE: profundidad con fuente]')).toBeVisible();
  // Sin metros en el texto (la batimetría entra cuando el autor confirme la licencia).
  expect(await page.locator('.pieza').innerText()).not.toMatch(/\d\s?(m|metros)\b/i);
});

test('el riel lleva a cada tramo y marca el tramo actual al bajar', async ({ page }) => {
  await abrir(page, INMERSIVA);
  const riel = page.getByRole('navigation', { name: 'Riel de profundidad' });
  await expect(riel.getByRole('link')).toHaveCount(4);
  await riel.getByRole('link', { name: 'Fondo' }).click();
  await expect(page).toHaveURL(/#tramo-fondo$/);
  await expect(riel.getByRole('link', { name: 'Fondo' })).toHaveAttribute('aria-current', 'location');
});

test('sin sonido: la pieza no tiene audio ni video', async ({ page }) => {
  await abrir(page, INMERSIVA);
  await expect(page.locator('audio, video')).toHaveCount(0);
});

test('con movimiento: dibuja la escena en el canvas', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await abrir(page, INMERSIVA);
  await expect(page.locator('.pieza')).toHaveAttribute('data-escena', 'lienzo');
});

test('con prefers-reduced-motion: no anima, queda el corte fijo', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await abrir(page, INMERSIVA);
  await expect(page.locator('.pieza')).not.toHaveAttribute('data-escena', 'lienzo');
  await expect(page.locator('.escena-corte')).toBeVisible();
});

test('la versión liviana tiene el mismo texto y no carga JavaScript', async ({ page }) => {
  await abrir(page, INMERSIVA);
  const textoInmersiva = await page.locator('.tramo').allInnerTexts();
  await abrir(page, LIVIANA);
  expect(await page.locator('.tramo').allInnerTexts()).toEqual(textoInmersiva);
  await expect(page.locator('script[src], script[type="module"]')).toHaveCount(0);
  await expect(page.getByRole('img', { name: /forma sintética/ })).toBeVisible();
});
