import type { Periodicity } from '../periodic/periodicity';

/** @deprecated Use JournalDefinition instead. Kept for migration. */
export interface PeriodicConfig {
  enabled: boolean;
  folder: string;
  format: string;
  templatePath: string;
}

export type JournalScope = 'global' | 'person' | 'group';

/**
 * A named journal definition. Each journal has its own folder, template,
 * periodicity, and ownership scope. This replaces the old fixed
 * per-periodicity PeriodicConfig system.
 */
export interface JournalDefinition {
  id: string;
  name: string;
  periodicity: Periodicity;
  folder: string;
  format: string;
  templatePath: string;
  scope: JournalScope;
  ownerPath?: string;
  icon?: string;
  color?: string;
  enabled: boolean;

  // Per-journal overrides (undefined = use global setting)
  folderNoteMode?: boolean;
  autoGenerateBaseMoc?: boolean;
  useTemplater?: boolean;
  trackDates?: boolean;
  dateCreatedKey?: string;
  dateModifiedKey?: string;
  autoSetCreator?: boolean;
  creatorFieldName?: string;
  autoGenerateUuid?: boolean;
  uuidProperty?: string;
}

export interface DeviceUserMapping {
  deviceId: string;
  userNotePath: string;
  deviceName: string;
  lastSeen: number;
  userDisplayName?: string;
}

/** @deprecated Use JournalDefinition with scope='person' instead. Kept for migration. */
export interface PersonPeriodicOverride {
  personNotePath: string;
  personDisplayName: string;
  overrides: Partial<Record<Periodicity, Partial<PeriodicConfig>>>;
}

export interface IdentityTypeConfig {
  identityTypePropertyName: string;
  personTypeValue: string;
  groupTypeValue: string;
  membersPropertyName: string;
}

export interface DevicePreferencesData {
  deviceName?: string;
  journalOverrides?: Record<string, Partial<JournalDefinition>>;
}

export interface DailyNotesNGSettings {
  journals: JournalDefinition[];
  calendar: {
    openOnStartup: boolean;
    showWeekNumbers: boolean;
    weekStart: 0 | 1 | 6;
    dotIndicators: boolean;
  };
  templates: {
    useTemplater: boolean;
  };
  rollover: {
    enabled: boolean;
    deleteOnComplete: boolean;
    rolloverOnCreate: boolean;
    headingLevel: number;
    includeSubItems: boolean;
  };
  frontmatter: {
    trackDates: boolean;
    createdKey: string;
    modifiedKey: string;
    dateFormat: string;
    delayMs: number;
  };
  nlp: {
    enabled: boolean;
    triggerChar: string;
    dateFormat: string;
    insertAsLink: boolean;
  };
  navigation: {
    showBreadcrumbs: boolean;
    prevNextInHeader: boolean;
  };
  folderNotes: {
    enabled: boolean;
    autoGenerateBaseMoc: boolean;
    baseMocTemplate: string;
  };
  identity: {
    enabled: boolean;
    deviceUserMappings: DeviceUserMapping[];
    autoSetCreator: boolean;
    creatorFieldName: string;
    noteUuidProperty: string;
    noteUuidAutoGenerate: boolean;
    typeConfig: IdentityTypeConfig;
    personNotesFolder: string;
    groupNotesFolder: string;
  };
  debug: {
    enabled: boolean;
    consoleOutput: boolean;
    categories: Record<string, boolean>;
  };

  /** @deprecated Old format — migrated to journals[] on first load */
  periodic?: Record<Periodicity, PeriodicConfig>;
  /** @deprecated Old format — migrated to journals[] on first load */
  personPeriodicOverrides?: PersonPeriodicOverride[];
}
