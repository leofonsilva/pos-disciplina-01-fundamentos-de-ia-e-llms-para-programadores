const { test, expect } = require('@playwright/test');

const PATH = '/vanilla-js-web-app-example/';

test('homepage returns 200', async ({ page }) => {
  const response = await page.goto(PATH, { waitUntil: 'domcontentloaded' });
  expect(response).toBeTruthy();
  expect(response.status()).toBe(200);
});

test('homepage has meaningful content', async ({ page }) => {
  await page.goto(PATH, { waitUntil: 'domcontentloaded' });
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.replace(/\s+/g, ' ').trim().length).toBeGreaterThan(20);

  // If an H1 exists, ensure it's visible (non-fatal if absent)
  const h1Count = await page.locator('h1').count();
  if (h1Count > 0) {
    await expect(page.locator('h1')).toBeVisible();
  }
});
