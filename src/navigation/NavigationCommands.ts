import type DailyNotesNGPlugin from '../main';
import { ALL_PERIODICITIES, PERIODICITY_LABELS, type Periodicity } from '../periodic/periodicity';
import { navigatePeriod, today } from '../periodic/dateUtils';

/**
 * Registers Command Palette commands for navigating periodic notes.
 */
export class NavigationCommands {
  constructor(private plugin: DailyNotesNGPlugin) {}

  registerCommands(): void {
    // Open today's daily note
    this.plugin.addCommand({
      id: 'open-today',
      name: 'Open today\'s daily note',
      callback: () => {
        this.plugin.periodicManager.openPeriodicNote(today(), 'daily');
      },
    });

    // Prev/next for each periodicity
    for (const periodicity of ALL_PERIODICITIES) {
      const label = PERIODICITY_LABELS[periodicity].toLowerCase();

      this.plugin.addCommand({
        id: `open-prev-${periodicity}`,
        name: `Open previous ${label} note`,
        callback: () => {
          this.openRelative(periodicity, -1);
        },
      });

      this.plugin.addCommand({
        id: `open-next-${periodicity}`,
        name: `Open next ${label} note`,
        callback: () => {
          this.openRelative(periodicity, 1);
        },
      });
    }
  }

  private openRelative(periodicity: Periodicity, direction: 1 | -1): void {
    // Start from the current file's date if it's a periodic note, otherwise today
    const currentDate = this.getCurrentNoteDate(periodicity) ?? today();
    const targetDate = navigatePeriod(currentDate, periodicity, direction);
    this.plugin.periodicManager.openPeriodicNote(targetDate, periodicity);
  }

  private getCurrentNoteDate(periodicity: Periodicity): moment.Moment | null {
    const activeFile = this.plugin.app.workspace.getActiveFile();
    if (!activeFile) return null;

    const config = this.plugin.configResolver.resolve(periodicity);
    const parsed = (window as any).moment(activeFile.basename, config.format, true);
    return parsed.isValid() ? parsed : null;
  }
}
