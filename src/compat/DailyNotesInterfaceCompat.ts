import type { DailyNotesNGSettings } from '../settings/types';

/**
 * Exposes settings in the format expected by obsidian-daily-notes-interface.
 * This allows other plugins (Dataview, Templater, etc.) to detect our settings
 * when they look for periodic notes configuration.
 */
export class DailyNotesInterfaceCompat {
  constructor(private settings: DailyNotesNGSettings) {}

  /**
   * Get daily notes configuration in the interface format.
   */
  getDailyNoteSettings() {
    const config = this.settings.periodic.daily;
    return {
      folder: config.folder,
      format: config.format,
      template: config.templatePath,
    };
  }

  /**
   * Get weekly notes configuration in the interface format.
   */
  getWeeklyNoteSettings() {
    const config = this.settings.periodic.weekly;
    return {
      folder: config.folder,
      format: config.format,
      template: config.templatePath,
    };
  }
}
