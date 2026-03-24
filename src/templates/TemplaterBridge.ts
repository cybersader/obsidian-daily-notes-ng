import { App, TFile } from 'obsidian';

/**
 * Bridge to the Templater plugin.
 * Detects if Templater is installed and delegates template processing.
 */
export class TemplaterBridge {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Check if Templater plugin is installed and enabled.
   */
  isAvailable(): boolean {
    return !!(this.app as any).plugins?.getPlugin?.('templater-obsidian');
  }

  /**
   * Get the Templater plugin instance.
   */
  private getTemplater(): any {
    return (this.app as any).plugins?.getPlugin?.('templater-obsidian');
  }

  /**
   * Process a file through Templater's template engine.
   */
  async processFile(file: TFile): Promise<void> {
    const templater = this.getTemplater();
    if (!templater) return;

    // TODO: Call Templater's API to process the file
    // templater.templater.overwrite_file_commands(file);
  }
}
