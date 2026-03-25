import type { DailyNotesNGSettings } from '../settings/types';

/**
 * Exposes settings in the format expected by obsidian-daily-notes-interface.
 * Finds the first global journal matching each periodicity.
 */
export class DailyNotesInterfaceCompat {
  constructor(private settings: DailyNotesNGSettings) {}

  getDailyNoteSettings() {
    return this.getSettingsForPeriodicity('daily');
  }

  getWeeklyNoteSettings() {
    return this.getSettingsForPeriodicity('weekly');
  }

  private getSettingsForPeriodicity(periodicity: string) {
    const journal = this.settings.journals.find(
      j => j.periodicity === periodicity && j.scope === 'global' && j.enabled
    );
    return {
      folder: journal?.folder ?? '',
      format: journal?.format ?? '',
      template: journal?.templatePath ?? '',
    };
  }
}
