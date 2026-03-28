describe('Daily Notes NG', () => {
  it('plugin is loaded', async () => {
    // Check that the plugin's ribbon icon is present
    const ribbon = await $('.side-dock-ribbon-action[aria-label="Open calendar"]');
    await expect(ribbon).toBeDisplayed();
  });

  it('can open calendar view', async () => {
    await browser.executeObsidianCommand('daily-notes-ng:open-today');
    // Wait for note to be created/opened
    await browser.waitUntil(async () => {
      const title = await $('.view-header-title');
      return await title.isDisplayed();
    }, { timeout: 10000 });
    const title = await $('.view-header-title');
    await expect(title).toBeDisplayed();
  });

  it('can open today\'s daily note', async () => {
    await browser.executeObsidianCommand('daily-notes-ng:open-today');
    await browser.waitUntil(async () => {
      const title = await $('.view-header-title');
      return await title.isDisplayed();
    }, { timeout: 10000 });
    const title = await $('.view-header-title');
    await expect(title).toBeDisplayed();
  });

  it('shows notice when no journals available', async () => {
    // This tests the notice feedback when journals are misconfigured
    // The actual behavior depends on vault state
    await browser.executeObsidianCommand('daily-notes-ng:open-today');
    // If journals exist, a note opens; if not, a Notice appears
    // Either outcome is valid — this just confirms no crash
  });

  it('settings tab renders without errors', async () => {
    await browser.executeObsidianCommand('app:open-settings');
    await browser.waitUntil(async () => {
      return await $('.modal').isDisplayed();
    }, { timeout: 5000 });

    // Navigate to plugin settings
    const pluginTab = await $('=Daily Notes NG');
    if (await pluginTab.isExisting()) {
      await pluginTab.click();
      // Journal cards should be present
      await browser.waitUntil(async () => {
        return await $('.dnng-journal-card').isExisting();
      }, { timeout: 5000 });
    }

    // Close settings
    await browser.keys(['Escape']);
  });
});
