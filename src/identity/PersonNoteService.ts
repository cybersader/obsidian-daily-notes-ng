import { App, TFile, TFolder } from 'obsidian';
import type { DailyNotesNGSettings, PeriodicConfig } from '../settings/types';
import type { Periodicity } from '../periodic/periodicity';

/**
 * Reads person note preferences from frontmatter.
 * Uses configurable type properties for enterprise compatibility.
 * Adapted from TaskNotes PersonNoteService pattern.
 */
export class PersonNoteService {
  constructor(
    private app: App,
    private settings: DailyNotesNGSettings
  ) {}

  /**
   * Check if a file is a person note using configurable type properties.
   */
  isPersonNote(file: TFile): boolean {
    const cache = this.app.metadataCache.getFileCache(file);
    const typeKey = this.settings.identity.typeConfig.identityTypePropertyName;
    const personVal = this.settings.identity.typeConfig.personTypeValue;
    return cache?.frontmatter?.[typeKey] === personVal;
  }

  /**
   * Get preferences from a person note's frontmatter.
   */
  getPreferences(file: TFile): PersonPreferences {
    const cache = this.app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter ?? {};

    return {
      displayName: fm.title ?? file.basename,
      timezone: fm.timezone ?? null,
      periodicOverrides: this.parsePeriodicOverrides(fm.periodic),
    };
  }

  /**
   * Discover all person notes in the vault (or configured folder).
   */
  discoverPersons(): PersonNoteInfo[] {
    const folder = this.settings.identity.personNotesFolder;
    const files = folder
      ? this.getFilesInFolder(folder)
      : this.app.vault.getMarkdownFiles();

    return files
      .filter(f => this.isPersonNote(f))
      .map(f => {
        const prefs = this.getPreferences(f);
        return {
          path: f.path,
          displayName: prefs.displayName,
        };
      });
  }

  /**
   * Parse the `periodic` frontmatter block into typed overrides.
   */
  private parsePeriodicOverrides(
    periodic: unknown
  ): Partial<Record<Periodicity, Partial<PeriodicConfig>>> | null {
    if (!periodic || typeof periodic !== 'object') return null;

    const result: Partial<Record<Periodicity, Partial<PeriodicConfig>>> = {};
    const validKeys: Periodicity[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

    for (const key of validKeys) {
      const val = (periodic as Record<string, unknown>)[key];
      if (val && typeof val === 'object') {
        const override: Partial<PeriodicConfig> = {};
        const v = val as Record<string, unknown>;
        if (typeof v.folder === 'string') override.folder = v.folder;
        if (typeof v.format === 'string') override.format = v.format;
        if (typeof v.templatePath === 'string') override.templatePath = v.templatePath;
        if (typeof v.enabled === 'boolean') override.enabled = v.enabled;
        if (Object.keys(override).length > 0) {
          result[key] = override;
        }
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  }

  private getFilesInFolder(folderPath: string): TFile[] {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!(folder instanceof TFolder)) return [];
    return folder.children.filter((f): f is TFile => f instanceof TFile && f.extension === 'md');
  }
}

export interface PersonPreferences {
  displayName: string;
  timezone: string | null;
  periodicOverrides: Partial<Record<Periodicity, Partial<PeriodicConfig>>> | null;
}

export interface PersonNoteInfo {
  path: string;
  displayName: string;
}
