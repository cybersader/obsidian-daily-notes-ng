import { moment } from 'obsidian';
import type { Periodicity } from './periodicity';

/**
 * Get the current date as a Moment object.
 */
export function today(): moment.Moment {
  return (window as any).moment();
}

/**
 * Format a date using the configured format string for a periodicity.
 */
export function formatDate(date: moment.Moment, format: string): string {
  return date.format(format);
}

/**
 * Parse a filename back to a date using a format string.
 */
export function parseDate(filename: string, format: string): moment.Moment | null {
  const parsed = (window as any).moment(filename, format, true);
  return parsed.isValid() ? parsed : null;
}

/**
 * Navigate to the next/previous period from a given date.
 */
export function navigatePeriod(
  date: moment.Moment,
  periodicity: Periodicity,
  direction: 1 | -1
): moment.Moment {
  const unit = periodicityToMomentUnit(periodicity);
  return date.clone().add(direction, unit);
}

/**
 * Map periodicity to moment.js duration unit.
 */
export function periodicityToMomentUnit(
  periodicity: Periodicity
): moment.unitOfTime.DurationConstructor {
  switch (periodicity) {
    case 'daily': return 'day';
    case 'weekly': return 'week';
    case 'monthly': return 'month';
    case 'quarterly': return 'quarter';
    case 'yearly': return 'year';
  }
}
