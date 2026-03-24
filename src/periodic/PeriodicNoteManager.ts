import { App, TFile, TFolder, normalizePath } from 'obsidian';
import type { DailyNotesNGSettings } from '../settings/types';
import type { Periodicity } from './periodicity';
import type { DebugLog } from '../utils/debug';

/**
 * Core manager for creating, opening, and navigating periodic notes.
 * Handles all periodicities: daily, weekly, monthly, quarterly, yearly.
 */
export class PeriodicNoteManager {
  constructor(
    private app: App,
    private settings: DailyNotesNGSettings,
    private debug: DebugLog
  ) {}

  /**
   * Open or create a periodic note for the given date and periodicity.
   */
  async openPeriodicNote(date: moment.Moment, periodicity: Periodicity): Promise<TFile | null> {
    // TODO: Implement note creation/opening logic
    await this.debug.log(`openPeriodicNote called`, { date: date.format(), periodicity });
    return null;
  }

  /**
   * Check if a periodic note exists for the given date.
   */
  getExistingNote(date: moment.Moment, periodicity: Periodicity): TFile | null {
    const config = this.settings.periodic[periodicity];
    if (!config.enabled) return null;

    const filename = date.format(config.format);
    const path = normalizePath(`${config.folder}/${filename}.md`);
    const file = this.app.vault.getAbstractFileByPath(path);
    return file instanceof TFile ? file : null;
  }

  /**
   * Get all existing periodic notes for a given periodicity.
   */
  getAllNotes(periodicity: Periodicity): TFile[] {
    const config = this.settings.periodic[periodicity];
    if (!config.enabled) return [];

    const folder = this.app.vault.getAbstractFileByPath(config.folder);
    if (!(folder instanceof TFolder)) return [];

    return folder.children.filter((f): f is TFile => f instanceof TFile && f.extension === 'md');
  }

  /**
   * Ensure the folder for a periodicity exists.
   */
  async ensureFolder(periodicity: Periodicity): Promise<void> {
    const config = this.settings.periodic[periodicity];
    const folderPath = normalizePath(config.folder);
    const existing = this.app.vault.getAbstractFileByPath(folderPath);
    if (!existing) {
      await this.app.vault.createFolder(folderPath);
    }
  }
}
