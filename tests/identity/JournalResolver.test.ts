import { JournalResolver } from '../../src/identity/JournalResolver';
import { DEFAULT_SETTINGS } from '../../src/constants';
import type { DailyNotesNGSettings, JournalDefinition } from '../../src/settings/types';
import { TFile } from 'obsidian';

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

const mockGroupRegistry = {
  resolveGroupToPersons: jest.fn().mockReturnValue([]),
} as any;

function makeSettings(overrides?: Partial<DailyNotesNGSettings>): DailyNotesNGSettings {
  return { ...DEFAULT_SETTINGS, ...overrides };
}

describe('JournalResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns all global journals when identity disabled', () => {
    const settings = makeSettings();
    const resolver = new JournalResolver(
      mockApp, settings, mockUserRegistry, mockPersonNoteService, mockGroupRegistry
    );

    const available = resolver.getAvailableJournals();
    // Only the default "Daily" journal is enabled
    expect(available.length).toBe(1);
    expect(available[0].name).toBe('Daily');
    expect(available[0].scope).toBe('global');
  });

  test('returns global + person journals when identity enabled and user registered', () => {
    const settings = makeSettings({
      identity: { ...DEFAULT_SETTINGS.identity, enabled: true },
      journals: [
        ...DEFAULT_SETTINGS.journals,
        { id: 'personal', name: 'Personal', periodicity: 'daily', folder: 'Journal/Alice', format: 'YYYY-MM-DD', templatePath: '', scope: 'person', ownerPath: 'People/Alice.md', enabled: true },
        { id: 'bob-journal', name: 'Bob journal', periodicity: 'daily', folder: 'Journal/Bob', format: 'YYYY-MM-DD', templatePath: '', scope: 'person', ownerPath: 'People/Bob.md', enabled: true },
      ],
    });
    mockUserRegistry.getCurrentUser.mockReturnValue('People/Alice.md');

    const resolver = new JournalResolver(
      mockApp, settings, mockUserRegistry, mockPersonNoteService, mockGroupRegistry
    );

    const available = resolver.getAvailableJournals();
    const names = available.map(j => j.name);

    expect(names).toContain('Daily');       // global
    expect(names).toContain('Personal');    // Alice's
    expect(names).not.toContain('Bob journal'); // Bob's — not visible to Alice
  });

  test('returns group journals for group members', () => {
    const settings = makeSettings({
      identity: { ...DEFAULT_SETTINGS.identity, enabled: true },
      journals: [
        ...DEFAULT_SETTINGS.journals,
        { id: 'team-retro', name: 'Team retro', periodicity: 'weekly', folder: 'Teams/Retro', format: 'gggg-[W]WW', templatePath: '', scope: 'group', ownerPath: 'People/Dev Team.md', enabled: true },
      ],
    });
    mockUserRegistry.getCurrentUser.mockReturnValue('People/Alice.md');
    mockGroupRegistry.resolveGroupToPersons.mockReturnValue(['People/Alice.md', 'People/Bob.md']);

    const resolver = new JournalResolver(
      mockApp, settings, mockUserRegistry, mockPersonNoteService, mockGroupRegistry
    );

    const available = resolver.getAvailableJournals();
    expect(available.map(j => j.name)).toContain('Team retro');
  });

  test('group journals hidden from non-members', () => {
    const settings = makeSettings({
      identity: { ...DEFAULT_SETTINGS.identity, enabled: true },
      journals: [
        ...DEFAULT_SETTINGS.journals,
        { id: 'team-retro', name: 'Team retro', periodicity: 'weekly', folder: 'Teams/Retro', format: 'gggg-[W]WW', templatePath: '', scope: 'group', ownerPath: 'People/Dev Team.md', enabled: true },
      ],
    });
    mockUserRegistry.getCurrentUser.mockReturnValue('People/Carol.md');
    mockGroupRegistry.resolveGroupToPersons.mockReturnValue(['People/Alice.md', 'People/Bob.md']);

    const resolver = new JournalResolver(
      mockApp, settings, mockUserRegistry, mockPersonNoteService, mockGroupRegistry
    );

    const available = resolver.getAvailableJournals();
    expect(available.map(j => j.name)).not.toContain('Team retro');
  });

  test('getJournalsForPeriodicity filters by periodicity', () => {
    const settings = makeSettings({
      journals: [
        { id: '1', name: 'Daily A', periodicity: 'daily', folder: 'A', format: 'YYYY-MM-DD', templatePath: '', scope: 'global', enabled: true },
        { id: '2', name: 'Weekly A', periodicity: 'weekly', folder: 'B', format: 'gggg-[W]WW', templatePath: '', scope: 'global', enabled: true },
        { id: '3', name: 'Daily B', periodicity: 'daily', folder: 'C', format: 'YYYY-MM-DD', templatePath: '', scope: 'global', enabled: true },
      ],
    });

    const resolver = new JournalResolver(
      mockApp, settings, mockUserRegistry, mockPersonNoteService, mockGroupRegistry
    );

    const dailies = resolver.getJournalsForPeriodicity('daily');
    expect(dailies.length).toBe(2);
    expect(dailies.map(j => j.name)).toEqual(['Daily A', 'Daily B']);
  });

  test('resolveFolder interpolates person placeholder', () => {
    const settings = makeSettings({
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

    const resolver = new JournalResolver(
      mockApp, settings, mockUserRegistry, mockPersonNoteService, mockGroupRegistry
    );

    const journal: JournalDefinition = {
      id: 'test', name: 'Test', periodicity: 'daily',
      folder: 'Journal/{{person}}/Daily', format: 'YYYY-MM-DD',
      templatePath: '', scope: 'global', enabled: true,
    };

    expect(resolver.resolveFolder(journal)).toBe('Journal/Alice Smith/Daily');
  });

  test('resolveFolder strips unresolved placeholder when no user', () => {
    const settings = makeSettings({
      identity: { ...DEFAULT_SETTINGS.identity, enabled: true },
    });
    mockUserRegistry.getCurrentUser.mockReturnValue(null);

    const resolver = new JournalResolver(
      mockApp, settings, mockUserRegistry, mockPersonNoteService, mockGroupRegistry
    );

    const journal: JournalDefinition = {
      id: 'test', name: 'Test', periodicity: 'daily',
      folder: 'Journal/{{person}}/Daily', format: 'YYYY-MM-DD',
      templatePath: '', scope: 'global', enabled: true,
    };

    expect(resolver.resolveFolder(journal)).toBe('Journal/Daily');
  });

  test('disabled journals are excluded', () => {
    const settings = makeSettings({
      journals: [
        { id: '1', name: 'Active', periodicity: 'daily', folder: 'A', format: 'YYYY-MM-DD', templatePath: '', scope: 'global', enabled: true },
        { id: '2', name: 'Disabled', periodicity: 'daily', folder: 'B', format: 'YYYY-MM-DD', templatePath: '', scope: 'global', enabled: false },
      ],
    });

    const resolver = new JournalResolver(
      mockApp, settings, mockUserRegistry, mockPersonNoteService, mockGroupRegistry
    );

    const available = resolver.getAvailableJournals();
    expect(available.length).toBe(1);
    expect(available[0].name).toBe('Active');
  });
});
