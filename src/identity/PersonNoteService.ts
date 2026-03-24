import { App, TFile } from 'obsidian';

/**
 * Reads person note preferences from frontmatter.
 * Person notes have `type: person` in their frontmatter.
 * Adapted from TaskNotes PersonNoteService pattern.
 */
export class PersonNoteService {
  constructor(private app: App) {}

  /**
   * Check if a file is a person note.
   */
  isPersonNote(file: TFile): boolean {
    const cache = this.app.metadataCache.getFileCache(file);
    return cache?.frontmatter?.type === 'person';
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
    };
  }
}

export interface PersonPreferences {
  displayName: string;
  timezone: string | null;
}
