import type { TemplateContext } from './TemplateEngine';

/**
 * Build the default template context for a periodic note.
 */
export function buildTemplateContext(
  title: string,
  date: moment.Moment
): TemplateContext {
  return {
    title,
    date: date.format('YYYY-MM-DD'),
    time: date.format('HH:mm'),
  };
}
