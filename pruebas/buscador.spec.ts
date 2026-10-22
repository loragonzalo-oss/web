// El buscador encuentra páginas publicadas y la 404 respeta `base`.
import { test, expect } from '@playwright/test';
import { BASE } from '../sitio.config.mjs';

const base = BASE.replace(/\/?$/, '/');

test('el buscador responde desde la cabecera', async ({ page, isMobile }) => {
  await page.goto('');
  // En celular, «Buscar» está dentro del menú compacto: primero se abre el menú.
  if (isMobile) await page.locator('.menu-compacto summary').click();
  await page.getByRole('link', { name: 'Buscar' }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/buscar\/$/);
  const campo = page.getByRole('searchbox').or(page.getByPlaceholder('Buscar en el sitio')).first();
  await campo.fill('Titikaka');
  await expect(page.locator('.pagefind-ui__result').first()).toBeVisible();
});

test('la 404 enlaza a portada, blog y mapa con la base del sitio', async ({ page }) => {
  const respuesta = await page.goto('una/direccion/que/no/existe/');
  expect(respuesta?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Esta página no existe');
  for (const [texto, destino] of [['portada', ''], ['blog', 'blog/'], ['mapa', 'mapa/']]) {
    await expect(page.getByRole('link', { name: new RegExp(texto, 'i') }).first()).toHaveAttribute('href', `${base}${destino}`);
  }
});
