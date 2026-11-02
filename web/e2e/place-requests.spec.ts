import { API, expect, test } from './support/test';

// Una ficha pide su local a la API una sola vez. Antes, la función de carga se
// creaba de nuevo en cada pintado y la página repetía la petición sin parar.
const requestsFor = async (
  page: import('@playwright/test').Page,
  path: string,
  missing: boolean,
) => {
  let count = 0;
  await page.route(`${API}/restaurants/${path.split('/').pop()}`, (route) => {
    count++;
    if (missing) {
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify({
          error: { code: 'not_found', message: 'No existe', details: [] },
        }),
      });
    }
    return route.fallback();
  });
  await page.goto(path);
  await page.waitForTimeout(1500);
  return count;
};

test('una ficha que existe pide el local una sola vez', async ({ page }) => {
  expect(await requestsFor(page, '/es/place/demo-la-masa-madre', false)).toBe(
    1,
  );
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('una ficha que no existe avisa y pide el local una sola vez', async ({
  page,
}) => {
  expect(await requestsFor(page, '/es/place/no-existe', true)).toBe(1);
  await expect(
    page.getByRole('heading', { name: 'No encontramos este local' }),
  ).toBeVisible();
});
