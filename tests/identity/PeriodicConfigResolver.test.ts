import { PeriodicConfigResolver } from '../../src/identity/PeriodicConfigResolver';
import { DEFAULT_SETTINGS } from '../../src/constants';
import type { DailyNotesNGSettings, PeriodicConfig } from '../../src/settings/types';
import { TFile } from 'obsidian';

// Use global localStorage (available in Bun test environment)

import { DevicePreferences } from '../../src/identity/DevicePreferences';

// Minimal mocks
const mockApp = {
  vault: {
    getAbstractFileByPath: jest.fn().mockReturnValue(null),
  },
  metadataCache: {
    getFileCache: jest.fn().mockReturnValue(null),
  },
} as any;

const mockUserRegistry = {
  getCurrentUser: jest.fn().mockReturnValue(null),
} as any;

const mockPersonNoteService = {
  getPreferences: jest.fn().mockReturnValue({
    displayName: 'Test User',
    timezone: null,
    periodicOverrides: null,
  }),
} as any;

function makeSettings(overrides?: Partial<DailyNotesNGSettings>): DailyNotesNGSettings {
  return { ...DEFAULT_SETTINGS, ...overrides };
}

describe('PeriodicConfigResolver', () => {
  let devicePrefs: DevicePreferences;

  beforeEach(() => {
    localStorage.removeItem('daily-notes-ng-device-prefs');
    devicePrefs = new DevicePreferences();
    jest.clearAllMocks();
  });

  test('returns vault-wide config when identity disabled', () => {
    const settings = makeSettings();
    const resolver = new PeriodicConfigResolver(
      mockApp, settings, mockUserRegistry, mockPersonNoteService, devicePrefs
    );

    const config = resolver.resolve('daily');
    expect(config.folder).toBe('Journal/Daily');
    expect(config.format).toBe('YYYY-MM-DD');
  });

  test('returns vault-wide config when identity enabled but no user mapped', () => {
    const settings = makeSettings({ identity: { ...DEFAULT_SETTINGS.identity, enabled: true } });
    mockUserRegistry.getCurrentUser.mockReturnValue(null);

    const resolver = new PeriodicConfigResolver(
      mockApp, settings, mockUserRegistry, mockPersonNoteService, devicePrefs
    );

    const config = resolver.resolve('daily');
    expect(config.folder).toBe('Journal/Daily');
  });

  test('applies settings-based person overrides', () => {
    const settings = makeSettings({
      identity: {
        ...DEFAULT_SETTINGS.identity,
        enabled: true,
        personPeriodicOverrides: [{
          personNotePath: 'People/Alice.md',
          personDisplayName: 'Alice',
          overrides: {
            daily: { folder: 'Journal/Alice/Daily' },
          },
        }],
      },
    });
    mockUserRegistry.getCurrentUser.mockReturnValue('People/Alice.md');
    mockApp.vault.getAbstractFileByPath.mockReturnValue(null); // No file found for person note

    const resolver = new PeriodicConfigResolver(
      mockApp, settings, mockUserRegistry, mockPersonNoteService, devicePrefs
    );

    const config = resolver.resolve('daily');
    expect(config.folder).toBe('Journal/Alice/Daily');
    expect(config.format).toBe('YYYY-MM-DD'); // Not overridden, kept from vault-wide
  });

  test('person frontmatter overrides take precedence over settings overrides', () => {
    const settings = makeSettings({
      identity: {
        ...DEFAULT_SETTINGS.identity,
        enabled: true,
        personPeriodicOverrides: [{
          personNotePath: 'People/Alice.md',
          personDisplayName: 'Alice',
          overrides: {
            daily: { folder: 'Journal/Alice/Daily' },
          },
        }],
      },
    });
    mockUserRegistry.getCurrentUser.mockReturnValue('People/Alice.md');

    // Mock person note file exists (must be TFile instance for instanceof check)
    const mockFile = new TFile();
    Object.assign(mockFile, { path: 'People/Alice.md', basename: 'Alice', extension: 'md' });
    mockApp.vault.getAbstractFileByPath.mockReturnValue(mockFile);

    // Person note frontmatter has a different folder
    mockPersonNoteService.getPreferences.mockReturnValue({
      displayName: 'Alice',
      timezone: null,
      periodicOverrides: {
        daily: { folder: 'Alice-Journal/Daily' },
      },
    });

    const resolver = new PeriodicConfigResolver(
      mockApp, settings, mockUserRegistry, mockPersonNoteService, devicePrefs
    );

    const config = resolver.resolve('daily');
    expect(config.folder).toBe('Alice-Journal/Daily'); // Frontmatter wins over settings
  });

  test('device preferences take highest precedence', () => {
    const settings = makeSettings({
      identity: {
        ...DEFAULT_SETTINGS.identity,
        enabled: true,
        personPeriodicOverrides: [{
          personNotePath: 'People/Alice.md',
          personDisplayName: 'Alice',
          overrides: { daily: { folder: 'Journal/Alice/Daily' } },
        }],
      },
    });
    mockUserRegistry.getCurrentUser.mockReturnValue('People/Alice.md');
    mockApp.vault.getAbstractFileByPath.mockReturnValue(null);

    // Device preference overrides everything
    devicePrefs.setPeriodicOverride('daily', { folder: 'DeviceLocal/Daily' });

    const resolver = new PeriodicConfigResolver(
      mockApp, settings, mockUserRegistry, mockPersonNoteService, devicePrefs
    );

    const config = resolver.resolve('daily');
    expect(config.folder).toBe('DeviceLocal/Daily');
  });

  test('partial overrides preserve non-overridden fields', () => {
    const settings = makeSettings({
      identity: {
        ...DEFAULT_SETTINGS.identity,
        enabled: true,
        personPeriodicOverrides: [{
          personNotePath: 'People/Alice.md',
          personDisplayName: 'Alice',
          overrides: {
            daily: { folder: 'Journal/Alice/Daily' }, // Only folder overridden
          },
        }],
      },
    });
    mockUserRegistry.getCurrentUser.mockReturnValue('People/Alice.md');
    mockApp.vault.getAbstractFileByPath.mockReturnValue(null);

    const resolver = new PeriodicConfigResolver(
      mockApp, settings, mockUserRegistry, mockPersonNoteService, devicePrefs
    );

    const config = resolver.resolve('daily');
    expect(config.folder).toBe('Journal/Alice/Daily');
    expect(config.format).toBe('YYYY-MM-DD'); // Preserved from vault-wide
    expect(config.templatePath).toBe(''); // Preserved from vault-wide
    expect(config.enabled).toBe(true); // Preserved from vault-wide
  });

  test('resolveFolder interpolates {{person}} placeholder', () => {
    const settings = makeSettings({
      periodic: {
        ...DEFAULT_SETTINGS.periodic,
        daily: { enabled: true, folder: 'Journal/{{person}}/Daily', format: 'YYYY-MM-DD', templatePath: '' },
      },
      identity: { ...DEFAULT_SETTINGS.identity, enabled: true },
    });
    mockUserRegistry.getCurrentUser.mockReturnValue('People/Alice.md');

    const mockFile = new TFile();
    Object.assign(mockFile, { path: 'People/Alice.md', basename: 'Alice', extension: 'md' });
    mockApp.vault.getAbstractFileByPath.mockReturnValue(mockFile);
    mockPersonNoteService.getPreferences.mockReturnValue({
      displayName: 'Alice Smith',
      timezone: null,
      periodicOverrides: null,
    });

    const resolver = new PeriodicConfigResolver(
      mockApp, settings, mockUserRegistry, mockPersonNoteService, devicePrefs
    );

    const folder = resolver.resolveFolder('daily');
    expect(folder).toBe('Journal/Alice Smith/Daily');
  });

  test('resolveFolder strips unresolved {{person}} when no user mapped', () => {
    const settings = makeSettings({
      periodic: {
        ...DEFAULT_SETTINGS.periodic,
        daily: { enabled: true, folder: 'Journal/{{person}}/Daily', format: 'YYYY-MM-DD', templatePath: '' },
      },
      identity: { ...DEFAULT_SETTINGS.identity, enabled: true },
    });
    mockUserRegistry.getCurrentUser.mockReturnValue(null);

    const resolver = new PeriodicConfigResolver(
      mockApp, settings, mockUserRegistry, mockPersonNoteService, devicePrefs
    );

    const folder = resolver.resolveFolder('daily');
    expect(folder).toBe('Journal/Daily');
  });
});
