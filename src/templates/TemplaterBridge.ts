import { App, TFile } from 'obsidian';

/**
 * Bridge to the Templater plugin.
 * Detects if Templater is installed and can actively process templates.
 */
export class TemplaterBridge {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Check if Templater is installed and enabled.
   */
  isInstalled(): boolean {
    return !!(this.app as any).plugins?.getPlugin?.('templater-obsidian');
  }

  /**
   * Check if Templater will actively process files on creation.
   * Returns true only if Templater is installed AND trigger_on_file_creation is enabled.
   * If false, we should use our built-in template engine instead.
   */
  isAvailable(): boolean {
    const templater = this.getTemplater();
    if (!templater) return false;
    return templater.settings?.trigger_on_file_creation === true;
  }

  /**
   * Get the Templater plugin instance.
   */
  private getTemplater(): any {
    return (this.app as any).plugins?.getPlugin?.('templater-obsidian');
  }

  /**
   * Process a file through Templater's template engine.
   * Only call this when isAvailable() returns true.
   */
  async processFile(file: TFile): Promise<void> {
    const templater = this.getTemplater();
    if (!templater) return;

    try {
      // Templater exposes its processing via the templater.templater object
      const tp = templater.templater;
      if (tp?.overwrite_file_commands) {
        await tp.overwrite_file_commands(file);
      }
    } catch (e) {
      // Templater processing failed — the file still has raw template content
      // but at least it was created. User can manually trigger Templater.
      console.warn('Daily Notes NG: Templater processing failed', e);
    }
  }
}
