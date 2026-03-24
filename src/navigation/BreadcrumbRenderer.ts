import { MarkdownPostProcessorContext } from 'obsidian';
import type DailyNotesNGPlugin from '../main';

/**
 * Renders breadcrumb navigation (Year > Quarter > Month > Week > Day)
 * at the top of periodic notes.
 */
export class BreadcrumbRenderer {
  constructor(private plugin: DailyNotesNGPlugin) {}

  /**
   * Register the markdown post processor for breadcrumb rendering.
   */
  register(): void {
    // TODO: Register post processor
  }

  /**
   * Build breadcrumb trail for a given date.
   */
  buildBreadcrumbs(_date: moment.Moment): BreadcrumbItem[] {
    // TODO: Build hierarchy Year > Quarter > Month > Week > Day
    return [];
  }
}

export interface BreadcrumbItem {
  label: string;
  path: string | null;
}
