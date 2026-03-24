/**
 * Pure DOM calendar widget that renders a month grid.
 * Uses Obsidian's createEl API for DOM construction.
 * No framework dependency - keeps bundle small.
 */
export class CalendarWidget {
  private containerEl: HTMLElement;
  private currentMonth: moment.Moment;
  private onDayClick: (date: moment.Moment) => void;

  constructor(
    containerEl: HTMLElement,
    initialMonth: moment.Moment,
    onDayClick: (date: moment.Moment) => void
  ) {
    this.containerEl = containerEl;
    this.currentMonth = initialMonth.clone().startOf('month');
    this.onDayClick = onDayClick;
  }

  /**
   * Render the full calendar widget.
   */
  render(): void {
    // TODO: Implement month grid rendering
    this.containerEl.empty();
  }

  /**
   * Navigate to next/previous month.
   */
  navigate(direction: 1 | -1): void {
    this.currentMonth.add(direction, 'month');
    this.render();
  }

  /**
   * Set which days have existing notes (for dot indicators).
   */
  setNoteDays(_days: Set<string>): void {
    // TODO: Update dot indicators
  }
}
