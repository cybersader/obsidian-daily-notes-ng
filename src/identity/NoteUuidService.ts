import { App, TFile } from 'obsidian';
import type { DailyNotesNGSettings } from '../settings/types';

/**
 * Provides stable UUIDs for notes that survive renames and moves.
 * UUIDs are stored in note frontmatter under a configurable property name.
 * Adapted from TaskNotes NoteUuidService pattern.
 */
export class NoteUuidService {
  constructor(
    private app: App,
    private settings: DailyNotesNGSettings
  ) {}

  /**
   * Get the UUID for a note (if it exists).
   */
  getUuid(file: TFile): string | undefined {
    const cache = this.app.metadataCache.getFileCache(file);
    const property = this.settings.identity.noteUuidProperty;
    return cache?.frontmatter?.[property];
  }

  /**
   * Get or create a UUID for a note.
   */
  async getOrCreateUuid(file: TFile): Promise<string> {
    const existing = this.getUuid(file);
    if (existing) return existing;

    const uuid = this.generateUuid();
    // TODO: Write UUID to frontmatter using processFrontMatter
    await this.app.fileManager.processFrontMatter(file, (fm) => {
      fm[this.settings.identity.noteUuidProperty] = uuid;
    });
    return uuid;
  }

  /**
   * Find a file by its UUID.
   */
  findFileByUuid(uuid: string): TFile | undefined {
    const property = this.settings.identity.noteUuidProperty;
    return this.app.vault.getMarkdownFiles().find(file => {
      const cache = this.app.metadataCache.getFileCache(file);
      return cache?.frontmatter?.[property] === uuid;
    });
  }

  /**
   * Generate a new UUID v4.
   */
  generateUuid(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
