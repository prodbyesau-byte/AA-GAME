import { expect, test } from '@playwright/test';

test('level editor loads Tiled objects and validates required rules', async ({ page }) => {
  await page.goto('/level-editor.html');

  await expect(page.getByRole('heading', { name: 'Leveldata' })).toBeVisible();
  await expect(page.locator('#level-canvas')).toBeVisible();
  await expect(page.locator('#object-list .object-item')).toHaveCount(14);
  await expect(page.locator('#validation')).toContainText('Alt ser klar ud.');
  await expect(page.locator('#export-json')).toHaveValue(/"name": "windows"/);
  await expect(page.locator('#export-json')).toHaveValue(/"name": "ladder-wall"/);
});
