import { App, TFile, TFolder, normalizePath } from 'obsidian';
import type { DailyNotesNGSettings } from '../settings/types';
import type { Periodicity } from './periodicity';
import type { PeriodicConfigResolver } from '../identity/PeriodicConfigResolver';
import type { UserRegistry } from '../identity/UserRegistry';
import type { NoteUuidService } from '../identity/NoteUuidService';
import type { TemplateEngine } from '../templates/TemplateEngine';
import type { TemplaterBridge } from '../templates/TemplaterBridge';
import { buildTemplateContext } from '../templates/templateVariables';
import type { DebugLog } from '../utils/debug';

/**
 * Core manager for creating, opening, and navigating periodic notes.
 * Uses PeriodicConfigResolver for multi-user folder/template resolution.
 */
export class PeriodicNoteManager {
  constructor(
    private app: App,
    private settings: DailyNotesNGSettings,
    private resolver: PeriodicConfigResolver,
    private userRegistry: UserRegistry,
    private noteUuidService: NoteUuidService,
    private templateEngine: TemplateEngine,
    private templaterBridge: TemplaterBridge,
    private debug: DebugLog
  ) {}

  /**
   * Open or create a periodic note for the given date and periodicity.
   */
  async openPeriodicNote(date: moment.Moment, periodicity: Periodicity): Promise<TFile | null> {
    const config = this.resolver.resolve(periodicity);
    if (!config.enabled) return null;

    const folder = this.resolver.resolveFolder(periodicity);
    const filename = date.format(config.format);
    const path = normalizePath(`${folder}/${filename}.md`);

    await this.debug.log('openPeriodicNote', { path, periodicity, date: date.format() });

    // Check if note already exists
    let file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await this.openFile(file);
      return file;
    }

    // Create the note
    await this.ensureFolderExists(folder);

    let content = '';

    // Apply template if configured
    if (config.templatePath) {
      const personName = this.resolver.getCurrentPersonName();
      const context = buildTemplateContext(filename, date, personName ?? undefined);

      if (this.templaterBridge.isAvailable()) {
        // Create with raw template content, let Templater process it
        const templateFile = this.app.vault.getAbstractFileByPath(config.templatePath);
        if (templateFile instanceof TFile) {
          content = await this.app.vault.read(templateFile);
        }
      } else {
        // Use built-in template engine
        content = await this.templateEngine.processTemplate(config.templatePath, context);
      }
    }

    // Add creator attribution to frontmatter
    if (this.settings.identity.enabled && this.settings.identity.autoSetCreator) {
      const creatorValue = this.userRegistry.getCreatorValue();
      if (creatorValue) {
        content = this.addFrontmatterField(
          content,
          this.settings.identity.creatorFieldName,
          creatorValue
        );
      }
    }

    // Create the file
    const newFile = await this.app.vault.create(path, content);

    // Add note UUID if configured
    if (this.settings.identity.enabled && this.settings.identity.noteUuidAutoGenerate) {
      await this.noteUuidService.getOrCreateUuid(newFile);
    }

    // Let Templater process the file after creation
    if (config.templatePath && this.templaterBridge.isAvailable()) {
      await this.templaterBridge.processFile(newFile);
    }

    await this.openFile(newFile);
    return newFile;
  }

  /**
   * Check if a periodic note exists for the given date.
   */
  getExistingNote(date: moment.Moment, periodicity: Periodicity): TFile | null {
    const config = this.resolver.resolve(periodicity);
    if (!config.enabled) return null;

    const folder = this.resolver.resolveFolder(periodicity);
    const filename = date.format(config.format);
    const path = normalizePath(`${folder}/${filename}.md`);
    const file = this.app.vault.getAbstractFileByPath(path);
    return file instanceof TFile ? file : null;
  }

  /**
   * Get all existing periodic notes for a given periodicity.
   */
  getAllNotes(periodicity: Periodicity): TFile[] {
    const config = this.resolver.resolve(periodicity);
    if (!config.enabled) return [];

    const folder = this.resolver.resolveFolder(periodicity);
    const folderObj = this.app.vault.getAbstractFileByPath(folder);
    if (!(folderObj instanceof TFolder)) return [];

    return folderObj.children.filter((f): f is TFile => f instanceof TFile && f.extension === 'md');
  }

  /**
   * Ensure a folder path exists, creating intermediate folders as needed.
   */
  private async ensureFolderExists(folderPath: string): Promise<void> {
    const normalized = normalizePath(folderPath);
    if (this.app.vault.getAbstractFileByPath(normalized)) return;

    // Create parent folders recursively
    const parts = normalized.split('/');
    let current = '';
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!this.app.vault.getAbstractFileByPath(current)) {
        await this.app.vault.createFolder(current);
      }
    }
  }

  /**
   * Open a file in the active editor leaf.
   */
  private async openFile(file: TFile): Promise<void> {
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(file);
  }

  /**
   * Add a field to frontmatter, creating the frontmatter block if needed.
   */
  private addFrontmatterField(content: string, key: string, value: string): string {
    const fmRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(fmRegex);

    if (match) {
      // Add to existing frontmatter
      const fm = match[1];
      return content.replace(fmRegex, `---\n${fm}\n${key}: ${value}\n---`);
    }

    // Create new frontmatter
    return `---\n${key}: ${value}\n---\n${content}`;
  }
}
