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
  };
  debug: boolean;
}
