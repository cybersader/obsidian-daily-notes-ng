/**
 * Calculate the grid of days for a given month, including
 * leading/trailing days from adjacent months to fill the grid.
 */
export function getMonthGrid(
  month: moment.Moment,
  weekStart: 0 | 1 | 6
): moment.Moment[][] {
  // TODO: Implement month grid calculation
  // Returns a 2D array of weeks, each containing 7 days
  return [];
}

/**
 * Format a date as a lookup key for the note-days set.
 */
export function dateKey(date: moment.Moment): string {
  return date.format('YYYY-MM-DD');
}
