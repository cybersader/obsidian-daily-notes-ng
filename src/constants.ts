import type { DailyNotesNGSettings } from './settings/types';

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
