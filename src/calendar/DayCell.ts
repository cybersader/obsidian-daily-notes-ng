/**
 * Renders a single day cell in the calendar grid.
 */
export class DayCell {
  private el: HTMLElement;

  constructor(
    parent: HTMLElement,
    date: moment.Moment,
    isToday: boolean,
    hasNote: boolean,
    onClick: () => void
  ) {
    this.el = parent.createEl('div', {
      cls: [
        'dnng-calendar-day',
        ...(isToday ? ['dnng-today'] : []),
        ...(hasNote ? ['dnng-has-note'] : []),
      ].join(' '),
      text: date.format('D'),
    });
    this.el.addEventListener('click', onClick);
  }

  destroy(): void {
    this.el.remove();
  }
}
