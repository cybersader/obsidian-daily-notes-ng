import type { Periodicity } from '../periodic/periodicity';

export interface PeriodicConfig {
  enabled: boolean;
  folder: string;
  format: string;
  templatePath: string;
}

export interface DeviceUserMapping {
  deviceId: string;
  userNotePath: string;
  deviceName: string;
  lastSeen: number;
  userDisplayName?: string;
}

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
  periodicOverrides?: Partial<Record<Periodicity, Partial<PeriodicConfig>>>;
}

export interface DailyNotesNGSettings {
  periodic: Record<Periodicity, PeriodicConfig>;
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
  identity: {
    enabled: boolean;
    deviceUserMappings: DeviceUserMapping[];
    autoSetCreator: boolean;
    creatorFieldName: string;
    noteUuidProperty: string;
    noteUuidAutoGenerate: boolean;
    personPeriodicOverrides: PersonPeriodicOverride[];
    typeConfig: IdentityTypeConfig;
    personNotesFolder: string;
    groupNotesFolder: string;
  };
  debug: boolean;
}
