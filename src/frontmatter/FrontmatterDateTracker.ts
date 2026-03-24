import { App, TFile, Plugin } from 'obsidian';
import type { DailyNotesNGSettings } from '../settings/types';
import type { DebugLog } from '../utils/debug';

/**
 * Automatically populates 'date created' and 'date modified' frontmatter.
 * Uses a debounce (default 10s) to avoid excessive writes during editing.
 * Only reacts to active editor changes (not syncs or passive opens).
 */
export class FrontmatterDateTracker {
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private app: App,
    private settings: DailyNotesNGSettings,
    private debug: DebugLog
  ) {}

  /**
   * Register vault event listeners on the plugin.
   */
  register(plugin: Plugin): void {
    if (!this.settings.frontmatter.trackDates) return;

    plugin.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file instanceof TFile && file.extension === 'md') {
          this.scheduleUpdate(file);
        }
      })
    );

    // TODO: Set created date on file creation
    plugin.registerEvent(
      this.app.vault.on('create', (file) => {
        if (file instanceof TFile && file.extension === 'md') {
          this.setCreatedDate(file);
        }
      })
    );
  }

  private scheduleUpdate(file: TFile): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.updateModifiedDate(file);
    }, this.settings.frontmatter.delayMs);
  }

  private async setCreatedDate(_file: TFile): Promise<void> {
    // TODO: Implement created date setting
    await this.debug.log('FrontmatterDateTracker: setCreatedDate called');
  }

  private async updateModifiedDate(_file: TFile): Promise<void> {
    // TODO: Implement modified date update
    await this.debug.log('FrontmatterDateTracker: updateModifiedDate called');
  }
}
