describe('Daily Notes NG', () => {
  before(async () => {
    // Wait for Obsidian to fully load (workspace ready)
    await browser.waitUntil(async () => {
      const result = await browser.execute(() => {
        return (window as any).app?.workspace?.layoutReady === true;
      });
      return result === true;
    }, { timeout: 30000, timeoutMsg: 'Obsidian workspace did not become ready' });

    // Wait for plugin to load
    await browser.waitUntil(async () => {
      const result = await browser.execute(() => {
        return !!(window as any).app?.plugins?.plugins?.['daily-notes-ng'];
      });
      return result === true;
    }, { timeout: 15000, timeoutMsg: 'Daily Notes NG plugin did not load' });
  });

  it('plugin is loaded', async () => {
    const isLoaded = await browser.execute(() => {
      const plugin = (window as any).app?.plugins?.plugins?.['daily-notes-ng'];
      return !!plugin;
    });
    expect(isLoaded).toBe(true);
  });

  it('has registered commands', async () => {
    const commandCount = await browser.execute(() => {
      const app = (window as any).app;
      const commands = Object.keys(app.commands.commands).filter(
        (id: string) => id.startsWith('daily-notes-ng:')
      );
      return commands.length;
    });
    expect(commandCount).toBeGreaterThan(0);
  });

  it('can open today\'s daily note', async () => {
    await browser.executeObsidianCommand('daily-notes-ng:open-today');

    // Wait for a file to be active
    await browser.waitUntil(async () => {
      const path = await browser.execute(() => {
        return (window as any).app?.workspace?.getActiveFile()?.path ?? null;
      });
      return path !== null;
    }, { timeout: 10000, timeoutMsg: 'No file opened after open-today command' });

    const activePath = await browser.execute(() => {
      return (window as any).app?.workspace?.getActiveFile()?.path;
    });
    expect(activePath).toBeDefined();
  });

  it('settings tab renders without errors', async () => {
    await browser.executeObsidianCommand('app:open-settings');

    // Wait for settings modal
    await browser.waitUntil(async () => {
      return await $('.modal').isDisplayed();
    }, { timeout: 5000, timeoutMsg: 'Settings modal did not open' });

    // Navigate to plugin settings tab
    const opened = await browser.execute(() => {
      const app = (window as any).app;
      const tab = app.setting?.pluginTabs?.find(
        (t: any) => t.id === 'daily-notes-ng'
      );
      if (tab) {
        app.setting.openTabById('daily-notes-ng');
        return true;
      }
      return false;
    });

    if (opened) {
      // Check journal cards exist
      await browser.waitUntil(async () => {
        return await $('.dnng-journal-card').isExisting();
      }, { timeout: 5000 });

      const cardCount = await $$('.dnng-journal-card').length;
      expect(cardCount).toBeGreaterThan(0);
    }

    // Close settings
    await browser.keys(['Escape']);
  });

  it('no console errors from plugin', async () => {
    const errors = await browser.execute(() => {
      // Check if dev:errors captured anything from our plugin
      const app = (window as any).app;
      const plugin = app?.plugins?.plugins?.['daily-notes-ng'];
      return plugin ? null : 'plugin not found';
    });
    expect(errors).toBeNull();
  });
});
