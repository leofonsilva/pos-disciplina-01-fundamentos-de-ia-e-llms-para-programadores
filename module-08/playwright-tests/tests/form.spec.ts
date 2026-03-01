import { test, expect } from '@playwright/test';

const PATH = '/vanilla-js-web-app-example/';

test.beforeEach(async ({ page }) => {
  await page.goto(PATH, { waitUntil: 'domcontentloaded' });
});

test('submitting the form adds an item to the list', async ({ page }) => {
  const list = page.locator('section#card-list article');
  const initialCount = await list.count();

  const title = 'Playwright Test Image';
  const url = 'https://via.placeholder.com/600x400.png?text=playwright';

  await page.getByRole('textbox', { name: 'Image Title' }).fill(title);
  await page.getByRole('textbox', { name: 'Image URL' }).fill(url);
  await page.getByRole('button', { name: 'Submit Form' }).click();

  await expect(list).toHaveCount(initialCount + 1);

  const last = list.nth(initialCount);
  await expect(last.locator('.card-title')).toHaveText(title);
  await expect(last.locator('img')).toHaveAttribute('src', url);
});

test('form validation prevents submit and focuses first invalid input', async ({ page }) => {
  const list = page.locator('section#card-list article');
  const initialCount = await list.count();

  // Ensure fields are empty
  await page.getByRole('textbox', { name: 'Image Title' }).fill('');
  await page.getByRole('textbox', { name: 'Image URL' }).fill('');

  await page.getByRole('button', { name: 'Submit Form' }).click();

  const form = page.locator('form.needs-validation');
  await expect(form).toHaveClass(/was-validated/);

  const activeId = await page.evaluate(() => document.activeElement?.id || '');
  expect(activeId).toBe('title');

  await expect(list).toHaveCount(initialCount);
});
