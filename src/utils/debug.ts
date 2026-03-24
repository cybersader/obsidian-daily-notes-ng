import { App, TFile } from 'obsidian';

export class DebugLog {
  private app: App;
  private enabled: boolean;
  private logPath = 'debug.log';

  constructor(app: App, enabled: boolean) {
    this.app = app;
    this.enabled = enabled;
  }

  async log(message: string, data?: unknown): Promise<void> {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString();
    let logLine = `[${timestamp}] ${message}`;
    if (data) logLine += '\n' + JSON.stringify(data, null, 2);
    logLine += '\n---\n';

    const file = this.app.vault.getAbstractFileByPath(this.logPath);
    if (file instanceof TFile) {
      const existing = await this.app.vault.read(file);
      await this.app.vault.modify(file, existing + logLine);
    } else {
      await this.app.vault.create(this.logPath, logLine);
    }
  }

  async clear(): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(this.logPath);
    if (file instanceof TFile) {
      await this.app.vault.modify(file, '# Debug Log\nCleared: ' + new Date().toISOString() + '\n\n');
    }
  }
}
