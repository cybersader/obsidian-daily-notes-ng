import type { DailyNotesNGSettings, JournalDefinition, PeriodicConfig } from './settings/types';
import type { Periodicity } from './periodic/periodicity';

/**
 * Default .base MOC template for periodic note folders.
 * Uses file.inFolder(this.file.folder) so it's portable — works in any folder.
 */
export const DEFAULT_BASE_MOC_TEMPLATE = `filters:
  and:
    - file.inFolder(this.file.folder)
    - 'file.ext == "md"'

formulas:
  day_of_week: 'date(file.basename).format("dddd")'
  word_estimate: '(file.size / 5).round(0)'
  created_fmt: 'file.ctime.format("MMM D, YYYY")'

properties:
  formula.day_of_week:
    displayName: "Day"
  formula.word_estimate:
    displayName: "~Words"
  formula.created_fmt:
    displayName: "Created"

views:
  - type: table
    name: "Recent"
    limit: 30
    order:
      - file.name
      - formula.day_of_week
      - formula.word_estimate
      - tags
      - formula.created_fmt

  - type: cards
    name: "Cards"
    limit: 30
    order:
      - file.name
      - formula.day_of_week
      - tags
`;

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Default journal definitions matching the old per-periodicity structure.
 */
export const DEFAULT_JOURNALS: JournalDefinition[] = [
  { id: generateId(), name: 'Daily', periodicity: 'daily', folder: 'Journal/Daily', format: 'YYYY-MM-DD', templatePath: '', scope: 'global', enabled: true },
  { id: generateId(), name: 'Weekly', periodicity: 'weekly', folder: 'Journal/Weekly', format: 'gggg-[W]WW', templatePath: '', scope: 'global', enabled: false },
  { id: generateId(), name: 'Monthly', periodicity: 'monthly', folder: 'Journal/Monthly', format: 'YYYY-MM', templatePath: '', scope: 'global', enabled: false },
  { id: generateId(), name: 'Quarterly', periodicity: 'quarterly', folder: 'Journal/Quarterly', format: 'YYYY-[Q]Q', templatePath: '', scope: 'global', enabled: false },
  { id: generateId(), name: 'Yearly', periodicity: 'yearly', folder: 'Journal/Yearly', format: 'YYYY', templatePath: '', scope: 'global', enabled: false },
];

export const DEFAULT_SETTINGS: DailyNotesNGSettings = {
  journals: DEFAULT_JOURNALS,
  calendar: {
    openOnStartup: false,
    showWeekNumbers: true,
    weekStart: 1,
    dotIndicators: true,
  },
  templates: {
    useTemplater: true,
  },
  rollover: {
    enabled: false,
    deleteOnComplete: false,
    rolloverOnCreate: true,
    headingLevel: 0,
    includeSubItems: true,
  },
  frontmatter: {
    trackDates: true,
    createdKey: 'date created',
    modifiedKey: 'date modified',
    dateFormat: 'YYYY-MM-DDTHH:mm:ssZ',
    delayMs: 10000,
  },
  nlp: {
    enabled: true,
    triggerChar: '@',
    dateFormat: 'YYYY-MM-DD',
    insertAsLink: true,
  },
  navigation: {
    showBreadcrumbs: true,
    prevNextInHeader: true,
  },
  folderNotes: {
    enabled: false,
    autoGenerateBaseMoc: true,
    baseMocTemplate: '',
  },
  identity: {
    enabled: false,
    deviceUserMappings: [],
    autoSetCreator: false,
    creatorFieldName: 'creator',
    noteUuidProperty: 'dnngId',
    noteUuidAutoGenerate: true,
    typeConfig: {
      identityTypePropertyName: 'type',
      personTypeValue: 'person',
      groupTypeValue: 'group',
      membersPropertyName: 'members',
    },
    personNotesFolder: '',
    groupNotesFolder: '',
  },
  debug: {
    enabled: false,
    consoleOutput: true,
    categories: {},
  },
};

/**
 * Migrate old periodic settings to journal definitions.
 * Called during loadSettings when old format is detected.
 */
export function migratePeriodicToJournals(
  periodic: Record<Periodicity, PeriodicConfig>,
  personOverrides?: { personNotePath: string; personDisplayName: string; overrides: Partial<Record<Periodicity, Partial<PeriodicConfig>>> }[]
): JournalDefinition[] {
  const journals: JournalDefinition[] = [];

  // Convert each periodicity to a global journal
  for (const [periodicity, config] of Object.entries(periodic) as [Periodicity, PeriodicConfig][]) {
    journals.push({
      id: generateId(),
      name: periodicity.charAt(0).toUpperCase() + periodicity.slice(1),
      periodicity,
      folder: config.folder,
      format: config.format,
      templatePath: config.templatePath,
      scope: 'global',
      enabled: config.enabled,
    });
  }

  // Convert person overrides to person-scoped journals
  if (personOverrides) {
    for (const po of personOverrides) {
      for (const [periodicity, override] of Object.entries(po.overrides) as [Periodicity, Partial<PeriodicConfig>][]) {
        if (!override) continue;
        const base = periodic[periodicity];
        journals.push({
          id: generateId(),
          name: `${po.personDisplayName} ${periodicity}`,
          periodicity,
          folder: override.folder ?? base.folder,
          format: override.format ?? base.format,
          templatePath: override.templatePath ?? base.templatePath,
          scope: 'person',
          ownerPath: po.personNotePath,
          enabled: override.enabled ?? base.enabled,
        });
      }
    }
  }

  return journals;
}
