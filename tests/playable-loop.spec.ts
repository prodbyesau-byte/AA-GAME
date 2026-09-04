import { expect, test } from '@playwright/test';

const UPPER_WINDOW_X_POSITIONS = [531, 789, 1047];
const LOWER_WINDOW_X_POSITIONS = [531, 789, 1047];

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

async function playerY(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    const game = window.__AA_WINDOW_CLEANER_GAME__;
    const jobScene = game?.scene.getScene('JobScene') as Phaser.Scene & {
      player?: Phaser.GameObjects.Sprite;
    };
    return jobScene.player?.y ?? 0;
  });
}

async function ladderState(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() => {
    const game = window.__AA_WINDOW_CLEANER_GAME__;
    const jobScene = game?.scene.getScene('JobScene') as Phaser.Scene & {
      ladderState?: string;
    };
    return jobScene.ladderState ?? 'unknown';
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

async function climbToWindowHeight(page: import('@playwright/test').Page) {
  const deadline = Date.now() + 3500;
  await page.keyboard.down('ArrowUp');

  while (Date.now() < deadline) {
    if ((await playerY(page)) <= 445) {
      await page.keyboard.up('ArrowUp');
      return;
    }
    await page.waitForTimeout(90);
  }

  await page.keyboard.up('ArrowUp');
  expect(await playerY(page)).toBeLessThanOrEqual(445);
}

async function climbDown(page: import('@playwright/test').Page) {
  const deadline = Date.now() + 3500;
  await page.keyboard.down('ArrowDown');

  while (Date.now() < deadline) {
    if ((await playerY(page)) >= 650) {
      await page.keyboard.up('ArrowDown');
      return;
    }
    await page.waitForTimeout(90);
  }

  await page.keyboard.up('ArrowDown');
  expect(await playerY(page)).toBeGreaterThanOrEqual(650);
}

async function pressLadderKey(page: import('@playwright/test').Page) {
  await page.keyboard.down('F');
  await page.waitForTimeout(120);
  await page.keyboard.up('F');
  await page.waitForTimeout(120);
}

async function cleanCurrentWindow(page: import('@playwright/test').Page) {
  // Phase 1: Soap window
  await page.keyboard.down('E');
  await page.waitForTimeout(350);
  await page.keyboard.up('E');
  await page.waitForTimeout(150);

  // Phase 2: Squeegee soap off
  await page.keyboard.down('E');
  await page.waitForTimeout(350);
  await page.keyboard.up('E');
  await page.waitForTimeout(100);
}

test('complete all six Andersen Auto Service windows with ladder access', async ({ page }) => {
  test.setTimeout(360000);
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      const text = message.text();
      if (!text.includes('favicon')) {
        consoleErrors.push(text);
      }
    }
  });

  await page.goto('/?test=1');
  await expect(page.locator('canvas')).toBeVisible();
  await page.locator('canvas').click();
  await expect.poll(() => activeScenes(page)).toContain('MainMenuScene');

  await page.keyboard.press('Enter');
  await expect.poll(() => activeScenes(page)).toContain('JobScene');

  for (const [index, x] of LOWER_WINDOW_X_POSITIONS.entries()) {
    await walkTo(page, x);
    await cleanCurrentWindow(page);
    await expect.poll(() => completedWindows(page), { timeout: 3000 }).toBe(index + 1);
  }

  await walkTo(page, 410);
  await pressLadderKey(page);
  await expect.poll(() => ladderState(page)).toBe('carried');

  for (const [index, x] of UPPER_WINDOW_X_POSITIONS.entries()) {
    await walkTo(page, x);
    await pressLadderKey(page);
    await expect.poll(() => ladderState(page)).toBe('placed');
    await climbToWindowHeight(page);
    await cleanCurrentWindow(page);
    await expect.poll(() => completedWindows(page), { timeout: 3000 }).toBe(LOWER_WINDOW_X_POSITIONS.length + index + 1);

    if (index < UPPER_WINDOW_X_POSITIONS.length - 1) {
      await climbDown(page);
      await pressLadderKey(page);
      await expect.poll(() => ladderState(page)).toBe('carried');
    }
  }

  await expect.poll(() => activeScenes(page), { timeout: 5000 }).toContain('JobCompleteScene');
  expect(consoleErrors).toEqual([]);
});
