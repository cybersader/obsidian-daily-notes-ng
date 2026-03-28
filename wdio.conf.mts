import type { Options } from '@wdio/types';

export const config: Options.Testrunner = {
  specs: ['./test/e2e/**/*.spec.ts'],
  maxInstances: 1,

  capabilities: [{
    browserName: 'obsidian',
    'wdio:obsidianOptions': {
      // Uses manifest.json from project root automatically
    },
  }],

  services: ['obsidian'],
  reporters: ['obsidian'],
  framework: 'mocha',

  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },

  // Screenshot on failure
  afterTest: async function (_test, _context, { error }) {
    if (error) {
      await browser.saveScreenshot(`./test-results/screenshot-${Date.now()}.png`);
    }
  },
};
