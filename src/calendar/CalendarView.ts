import { ItemView, WorkspaceLeaf } from 'obsidian';
import type DailyNotesNGPlugin from '../main';

export const CALENDAR_VIEW_TYPE = 'daily-notes-ng-calendar';

/**
 * Sidebar calendar view showing a month grid with dot indicators
 * for days that have existing periodic notes.
 */
export class CalendarView extends ItemView {
  private plugin: DailyNotesNGPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: DailyNotesNGPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return CALENDAR_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'Calendar';
  }

  getIcon(): string {
    return 'calendar';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass('dnng-calendar-container');
    // TODO: Render CalendarWidget
    container.createEl('p', { text: 'Calendar view - coming soon' });
  }

  async onClose(): Promise<void> {
    // Cleanup
  }
}
