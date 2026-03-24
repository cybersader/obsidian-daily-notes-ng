import type DailyNotesNGPlugin from '../main';
import { ALL_PERIODICITIES, PERIODICITY_LABELS } from '../periodic/periodicity';

/**
 * Registers Command Palette commands for navigating periodic notes.
 * Commands: open today, navigate prev/next for each periodicity.
 */
export class NavigationCommands {
  constructor(private plugin: DailyNotesNGPlugin) {}

  registerCommands(): void {
    // Open today's daily note
    this.plugin.addCommand({
      id: 'open-today',
      name: 'Open today\'s daily note',
      callback: () => {
        // TODO: Open today's note
      },
    });

    // Prev/next for each periodicity
    for (const periodicity of ALL_PERIODICITIES) {
      const label = PERIODICITY_LABELS[periodicity].toLowerCase();

      this.plugin.addCommand({
        id: `open-prev-${periodicity}`,
        name: `Open previous ${label} note`,
        callback: () => {
          // TODO: Navigate to previous periodic note
        },
      });

      this.plugin.addCommand({
        id: `open-next-${periodicity}`,
        name: `Open next ${label} note`,
        callback: () => {
          // TODO: Navigate to next periodic note
        },
      });
    }
  }
}
