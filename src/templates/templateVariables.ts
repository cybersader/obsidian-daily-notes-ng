import type { TemplateContext } from './TemplateEngine';

/**
 * Build the default template context for a periodic note.
 */
export function buildTemplateContext(
  title: string,
  date: moment.Moment,
  personName?: string
): TemplateContext {
  return {
    title,
    date: date.format('YYYY-MM-DD'),
    time: date.format('HH:mm'),
    person: personName ?? '',
  };
}
