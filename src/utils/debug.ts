import { App, TFile } from 'obsidian';

/**
 * Log categories organized by subsystem.
 * Used in settings UI for per-category filtering.
 */
export const LOG_CATEGORY_GROUPS: Record<string, string[]> = {
  'Core': ['Plugin', 'PeriodicNoteManager', 'NavigationCommands'],
  'Identity': ['JournalResolver', 'UserRegistry', 'DeviceIdentity', 'PersonNoteService', 'GroupRegistry'],
  'Templates': ['TemplateEngine', 'TemplaterBridge'],
  'Other': ['FrontmatterTracker', 'TodoRollover', 'DateSuggest', 'CalendarView'],
};

/**
 * Debug logging system for Daily Notes NG.
 * Adapted from TaskNotes: dual file/console output, category filtering, queued writes.
 *
 * - File output: writes to debug.log in vault root
 * - Console output: browser DevTools (Ctrl+Shift+I)
 * - Category filtering: per-tag enable/disable
 * - Write queue: serialized writes to prevent file corruption
 */
export class DebugLog {
  private app: App;
  private enabled: boolean;
  private logPath = 'debug.log';
  private consoleOutput = true;
  private categories: Record<string, boolean> = {};
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(app: App, enabled: boolean) {
    this.app = app;
    this.enabled = enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setConsoleOutput(enabled: boolean): void {
    this.consoleOutput = enabled;
  }

  setCategories(categories: Record<string, boolean>): void {
    this.categories = categories;
  }

  private isCategoryEnabled(tag: string): boolean {
    // Empty categories object = all enabled (default)
    if (Object.keys(this.categories).length === 0) return true;
    // Explicitly set to false = disabled
    if (this.categories[tag] === false) return false;
    return true;
  }

  /**
   * Log a message with an optional tag and structured data.
   * Supports both old API (message, data) and new API (tag, message, data).
   */
  async log(tagOrMessage: string, messageOrData?: string | unknown, data?: unknown): Promise<void> {
    let tag: string;
    let message: string;
    let logData: unknown | undefined;

    if (typeof messageOrData === 'string') {
      // New API: log(tag, message, data?)
      tag = tagOrMessage;
      message = messageOrData;
      logData = data;
    } else {
      // Old API: log(message, data?)
      tag = 'Plugin';
      message = tagOrMessage;
      logData = messageOrData;
    }

    if (!this.enabled) return;
    if (!this.isCategoryEnabled(tag)) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${tag}]`;

    // Console output
    if (this.consoleOutput) {
      if (logData) {
        console.log(`${prefix} ${message}`, logData);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }

    // File output
    let logLine = `${prefix} ${message}`;
    if (logData) logLine += '\n' + JSON.stringify(logData, null, 2);
    logLine += '\n---\n';

    this.enqueueWrite(logLine);
  }

  async warn(tag: string, message: string, data?: unknown): Promise<void> {
    return this.log(tag, `⚠️ WARN: ${message}`, data);
  }

  async error(tag: string, message: string, error?: unknown): Promise<void> {
    // Errors ALWAYS go to console regardless of settings
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${tag}]`;
    console.error(`${prefix} ❌ ERROR: ${message}`, error);

    if (!this.enabled) return;

    let logLine = `${prefix} ❌ ERROR: ${message}`;
    if (error) {
      if (error instanceof Error) {
        logLine += `\n${error.message}\n${error.stack}`;
      } else {
        logLine += '\n' + JSON.stringify(error, null, 2);
      }
    }
    logLine += '\n---\n';

    this.enqueueWrite(logLine);
  }

  async clear(): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(this.logPath);
    if (file instanceof TFile) {
      await this.app.vault.modify(file, '# Daily Notes NG Debug Log\nCleared: ' + new Date().toISOString() + '\n\n');
    }
  }

  async delete(): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(this.logPath);
    if (file instanceof TFile) {
      await this.app.vault.delete(file);
    }
  }

  /**
   * Serialize file writes to prevent corruption from concurrent writes.
   */
  private enqueueWrite(content: string): void {
    this.writeQueue = this.writeQueue.then(async () => {
      try {
        const file = this.app.vault.getAbstractFileByPath(this.logPath);
        if (file instanceof TFile) {
          const existing = await this.app.vault.read(file);
          await this.app.vault.modify(file, existing + content);
        } else {
          await this.app.vault.create(
            this.logPath,
            '# Daily Notes NG Debug Log\nCreated: ' + new Date().toISOString() + '\n\n' + content
          );
        }
      } catch (e) {
        // Logging failure should never break the plugin
        console.warn('Daily Notes NG: Failed to write debug log', e);
      }
    });
  }
}
