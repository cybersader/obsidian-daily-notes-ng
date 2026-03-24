import type DailyNotesNGPlugin from '../main';

/**
 * Optional status bar item showing the current date.
 */
export class StatusBarDate {
  private statusBarEl: HTMLElement | null = null;

  constructor(private plugin: DailyNotesNGPlugin) {}

  register(): void {
    this.statusBarEl = this.plugin.addStatusBarItem();
    this.update();
  }

  update(): void {
    if (!this.statusBarEl) return;
    const today = (window as any).moment();
    this.statusBarEl.setText(today.format('ddd, MMM D'));
  }
}
