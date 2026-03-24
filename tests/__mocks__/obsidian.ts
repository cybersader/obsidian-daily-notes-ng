// Minimal mock of the Obsidian API for unit testing

export class Plugin {
  app: any = {};
  manifest: any = {};
  loadData = jest.fn().mockResolvedValue({});
  saveData = jest.fn().mockResolvedValue(undefined);
  addCommand = jest.fn();
  addSettingTab = jest.fn();
  addRibbonIcon = jest.fn();
  addStatusBarItem = jest.fn().mockReturnValue({ setText: jest.fn() });
  registerView = jest.fn();
  registerEditorSuggest = jest.fn();
  registerEvent = jest.fn();
}

export class TFile {
  path: string;
  basename: string;
  extension: string;
  constructor(path: string = 'test.md') {
    this.path = path;
    this.basename = path.split('/').pop()?.replace(/\.md$/, '') ?? '';
    this.extension = 'md';
  }
}

export class TFolder {
  path: string;
  children: any[] = [];
  constructor(path: string = '') {
    this.path = path;
  }
}

export class Notice {
  constructor(_message: string) {}
}

export class Setting {
  constructor(_containerEl: HTMLElement) {}
  setName = jest.fn().mockReturnThis();
  setDesc = jest.fn().mockReturnThis();
  setHeading = jest.fn().mockReturnThis();
  addText = jest.fn().mockReturnThis();
  addToggle = jest.fn().mockReturnThis();
  addDropdown = jest.fn().mockReturnThis();
  addButton = jest.fn().mockReturnThis();
}

export class PluginSettingTab {
  app: any;
  plugin: any;
  containerEl: any = { empty: jest.fn(), createEl: jest.fn() };
  constructor(app: any, plugin: any) {
    this.app = app;
    this.plugin = plugin;
  }
  display() {}
}

export class ItemView {
  leaf: any;
  containerEl: any = { children: [null, { empty: jest.fn(), createEl: jest.fn(), addClass: jest.fn() }] };
  constructor(leaf: any) { this.leaf = leaf; }
  getViewType() { return ''; }
  getDisplayText() { return ''; }
  getIcon() { return ''; }
}

export class WorkspaceLeaf {}

export class EditorSuggest {
  app: any;
  context: any = null;
  constructor(app: any) { this.app = app; }
}

export class MarkdownPostProcessorContext {}

export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/+/g, '/');
}

export const moment = (() => {
  try {
    return require('moment');
  } catch {
    return (globalThis as any).moment;
  }
})();
