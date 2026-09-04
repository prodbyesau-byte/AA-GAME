import { expect, test } from '@playwright/test';

const WINDOW_X_POSITIONS = [450, 610, 770, 456, 636, 816];

async function activeScenes(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => {
    const game = window.__AA_WINDOW_CLEANER_GAME__;
    return game?.scene.getScenes(true).map((scene) => scene.scene.key) ?? [];
  });
}

async function playerX(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    const game = window.__AA_WINDOW_CLEANER_GAME__;
    const jobScene = game?.scene.getScene('JobScene') as Phaser.Scene & {
      player?: Phaser.GameObjects.Sprite;
    };
    return jobScene.player?.x ?? 0;
  });
}

async function completedWindows(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    const game = window.__AA_WINDOW_CLEANER_GAME__;
    const jobScene = game?.scene.getScene('JobScene') as Phaser.Scene & {
      completedWindows?: number;
    };
    return jobScene.completedWindows ?? 0;
  });
}

async function walkTo(page: import('@playwright/test').Page, targetX: number) {
  const deadline = Date.now() + 7000;

  while (Date.now() < deadline) {
    const currentX = await playerX(page);
    if (Math.abs(currentX - targetX) < 55) {
      return;
    }

    const key = currentX < targetX ? 'ArrowRight' : 'ArrowLeft';
    await page.keyboard.down(key);
    await page.waitForTimeout(90);
    await page.keyboard.up(key);
    await page.waitForTimeout(35);
  }

  expect(Math.abs((await playerX(page)) - targetX)).toBeLessThan(55);
}

async function cleanCurrentWindow(page: import('@playwright/test').Page) {
  await page.keyboard.down('E');
  await page.waitForTimeout(5400);
  await page.keyboard.up('E');
}

test('complete all six Andersen Auto Service windows', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await page.locator('canvas').click();
  await expect.poll(() => activeScenes(page)).toContain('MainMenuScene');

  await page.keyboard.press('Enter');
  await expect.poll(() => activeScenes(page)).toContain('JobScene');

  for (const [index, x] of WINDOW_X_POSITIONS.entries()) {
    await walkTo(page, x);
    await cleanCurrentWindow(page);
    await expect.poll(() => completedWindows(page), { timeout: 3000 }).toBe(index + 1);
  }

  await expect.poll(() => activeScenes(page), { timeout: 5000 }).toContain('JobCompleteScene');
  expect(consoleErrors).toEqual([]);
});
