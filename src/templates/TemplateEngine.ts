import { App, TFile } from 'obsidian';
import type { DailyNotesNGSettings } from '../settings/types';

/**
 * Simple template variable resolution engine.
 * Handles built-in variables like {{date}}, {{title}}, {{time}}.
 * Falls back to this when Templater is not installed.
 */
export class TemplateEngine {
  constructor(
    private app: App,
    private settings: DailyNotesNGSettings
  ) {}

  /**
   * Read a template file and resolve variables.
   */
  async processTemplate(templatePath: string, context: TemplateContext): Promise<string> {
    const file = this.app.vault.getAbstractFileByPath(templatePath);
    if (!(file instanceof TFile)) return '';

    const content = await this.app.vault.read(file);
    return this.resolveVariables(content, context);
  }

  /**
   * Replace {{variable}} placeholders with values.
   */
  resolveVariables(content: string, context: TemplateContext): string {
    return content.replace(/\{\{([^}]+)\}\}/g, (match, key: string) => {
      const trimmed = key.trim();
      if (trimmed in context) {
        return context[trimmed] ?? match;
      }
      return match;
    });
  }
}

export interface TemplateContext {
  [key: string]: string | undefined;
  title?: string;
  date?: string;
  time?: string;
}
