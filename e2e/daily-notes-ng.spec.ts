import { test, expect } from '@playwright/test';
import { launchObsidian, runCommand, waitForNotice, ObsidianApp } from './obsidian';

let app: ObsidianApp;

test.beforeAll(async () => {
  app = await launchObsidian();
});

test.afterAll(async () => {
  if (app.browser) {
    await app.browser.close();
  }
  if (app.process && !app.isExistingInstance) {
    app.process.kill();
  }
});

test.describe('Daily Notes NG', () => {
  test('plugin is loaded', async () => {
    const { page } = app;
    // Check that the plugin's ribbon icon is present
    const ribbon = page.locator('.side-dock-ribbon-action[aria-label="Open calendar"]');
    await expect(ribbon).toBeVisible({ timeout: 10000 });
  });

  test('can open calendar view', async () => {
    const { page } = app;
    await runCommand(page, 'Daily Notes NG: Open calendar');
    // Calendar sidebar should appear
    const calendar = page.locator('.dnng-calendar-container');
    await expect(calendar).toBeVisible({ timeout: 5000 });
  });

  test('can open today\'s daily note', async () => {
    const { page } = app;
    await runCommand(page, 'Daily Notes NG: Open today');
    // Wait for note to be created/opened
    await page.waitForTimeout(1000);
    // The active leaf should contain today's date
    const title = page.locator('.view-header-title');
    await expect(title).toBeVisible({ timeout: 5000 });
  });
});
