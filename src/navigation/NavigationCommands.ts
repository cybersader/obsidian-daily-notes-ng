import { FuzzySuggestModal } from 'obsidian';
import type DailyNotesNGPlugin from '../main';
import { ALL_PERIODICITIES, PERIODICITY_LABELS, type Periodicity } from '../periodic/periodicity';
import { navigatePeriod, today } from '../periodic/dateUtils';
import type { JournalDefinition } from '../settings/types';

/**
 * Registers Command Palette commands for navigating periodic notes.
 * Journal-aware: when multiple journals share a periodicity, shows a picker.
 */
export class NavigationCommands {
  constructor(private plugin: DailyNotesNGPlugin) {}

  registerCommands(): void {
    // Open today's daily note
    this.plugin.addCommand({
      id: 'open-today',
      name: 'Open today\'s daily note',
      callback: () => {
        this.openForDate(today(), 'daily');
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

  /**
   * Open a note for a specific date and periodicity.
   * If multiple journals match, shows a picker.
   */
  private async openForDate(date: moment.Moment, periodicity: Periodicity): Promise<void> {
    const journals = this.plugin.journalResolver.getJournalsForPeriodicity(periodicity);

    if (journals.length === 0) return;

    if (journals.length === 1) {
      await this.plugin.periodicManager.openPeriodicNote(date, journals[0]);
      return;
    }

    // Multiple journals — show picker
    this.showJournalPicker(journals, async (journal) => {
      await this.plugin.periodicManager.openPeriodicNote(date, journal);
    });
  }

  private openRelative(periodicity: Periodicity, direction: 1 | -1): void {
    // Try to identify the current note's journal
    const activeFile = this.plugin.app.workspace.getActiveFile();
    let journal: JournalDefinition | null = null;

    if (activeFile) {
      journal = this.plugin.journalResolver.identifyJournal(activeFile.path);
    }

    if (journal && journal.periodicity === periodicity) {
      // Navigate within the same journal
      const currentDate = this.parseDate(activeFile!.basename, journal.format);
      const targetDate = currentDate
        ? navigatePeriod(currentDate, periodicity, direction)
        : navigatePeriod(today(), periodicity, direction);
      this.plugin.periodicManager.openPeriodicNote(targetDate, journal);
    } else {
      // No journal context — pick from available journals for this periodicity
      const targetDate = navigatePeriod(today(), periodicity, direction);
      this.openForDate(targetDate, periodicity);
    }
  }

  private parseDate(filename: string, format: string): moment.Moment | null {
    const parsed = (window as any).moment(filename, format, true);
    return parsed.isValid() ? parsed : null;
  }

  /**
   * Show a fuzzy picker for choosing a journal.
   */
  private showJournalPicker(
    journals: JournalDefinition[],
    onSelect: (journal: JournalDefinition) => void
  ): void {
    const modal = new JournalPickerModal(this.plugin.app, journals, onSelect);
    modal.open();
  }
}

class JournalPickerModal extends FuzzySuggestModal<JournalDefinition> {
  private journals: JournalDefinition[];
  private onSelectJournal: (journal: JournalDefinition) => void;

  constructor(
    app: any,
    journals: JournalDefinition[],
    onSelect: (journal: JournalDefinition) => void
  ) {
    super(app);
    this.journals = journals;
    this.onSelectJournal = onSelect;
    this.setPlaceholder('Pick a journal...');
  }

  getItems(): JournalDefinition[] {
    return this.journals;
  }

  getItemText(journal: JournalDefinition): string {
    const scope = journal.scope === 'global' ? '' : ` (${journal.scope})`;
    return `${journal.name}${scope}`;
  }

  onChooseItem(journal: JournalDefinition): void {
    this.onSelectJournal(journal);
  }
}
