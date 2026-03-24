import type { DailyNotesNGSettings } from './settings/types';

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

export const DEFAULT_SETTINGS: DailyNotesNGSettings = {
  periodic: {
    daily: {
      enabled: true,
      folder: 'Journal/Daily',
      format: 'YYYY-MM-DD',
      templatePath: '',
    },
    weekly: {
      enabled: false,
      folder: 'Journal/Weekly',
      format: 'gggg-[W]WW',
      templatePath: '',
    },
    monthly: {
      enabled: false,
      folder: 'Journal/Monthly',
      format: 'YYYY-MM',
      templatePath: '',
    },
    quarterly: {
      enabled: false,
      folder: 'Journal/Quarterly',
      format: 'YYYY-[Q]Q',
      templatePath: '',
    },
    yearly: {
      enabled: false,
      folder: 'Journal/Yearly',
      format: 'YYYY',
      templatePath: '',
    },
  },
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
    personPeriodicOverrides: [],
    typeConfig: {
      identityTypePropertyName: 'type',
      personTypeValue: 'person',
      groupTypeValue: 'group',
      membersPropertyName: 'members',
    },
    personNotesFolder: '',
    groupNotesFolder: '',
  },
  debug: false,
};
