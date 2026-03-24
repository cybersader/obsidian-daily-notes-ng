import { plugin } from 'bun';

// Polyfill localStorage for test environment
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}

// Mock the obsidian module (types-only package, no runtime)
plugin({
  name: 'obsidian-mock',
  setup(build) {
    build.module('obsidian', () => ({
      exports: {
        Plugin: class {},
        TFile: class { path = ''; basename = ''; extension = 'md'; },
        TFolder: class { path = ''; children = []; },
        App: class {},
        Notice: class { constructor(_msg: string) {} },
        Setting: class {},
        PluginSettingTab: class {},
        ItemView: class {},
        WorkspaceLeaf: class {},
        EditorSuggest: class {},
        MarkdownPostProcessorContext: class {},
        normalizePath: (p: string) => p.replace(/\\/g, '/').replace(/\/+/g, '/'),
        moment: () => ({}),
      },
      loader: 'object',
    }));
  },
});
