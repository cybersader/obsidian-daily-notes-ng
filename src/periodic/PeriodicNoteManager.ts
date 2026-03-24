import { App, TFile, TFolder, normalizePath } from 'obsidian';
import type { DailyNotesNGSettings } from '../settings/types';
import type { Periodicity } from './periodicity';
import type { PeriodicConfigResolver } from '../identity/PeriodicConfigResolver';
import type { UserRegistry } from '../identity/UserRegistry';
import type { NoteUuidService } from '../identity/NoteUuidService';
import type { TemplateEngine } from '../templates/TemplateEngine';
import type { TemplaterBridge } from '../templates/TemplaterBridge';
import { buildTemplateContext } from '../templates/templateVariables';
import { DEFAULT_BASE_MOC_TEMPLATE } from '../constants';
import type { DebugLog } from '../utils/debug';

/**
 * Core manager for creating, opening, and navigating periodic notes.
 * Supports two storage modes:
 *   Flat:        Journal/Daily/2026-03-24.md
 *   Folder-note: Journal/Daily/2026-03-24/2026-03-24.md
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
    const path = this.resolveNotePath(folder, filename);

    await this.debug.log('openPeriodicNote', { path, periodicity, date: date.format() });

    // Check if note already exists (checks both flat and folder-note paths)
    const existing = this.findExistingNote(folder, filename);
    if (existing) {
      await this.openFile(existing);
      return existing;
    }

    // Ensure the periodic folder and .base MOC exist
    await this.ensureFolderExists(folder);
    await this.ensureBaseMoc(folder, periodicity);

    // In folder-note mode, also create the note's subfolder
    if (this.settings.folderNotes.enabled) {
      await this.ensureFolderExists(normalizePath(`${folder}/${filename}`));
    }

    let content = '';

    // Apply template if configured
    if (config.templatePath) {
      const personName = this.resolver.getCurrentPersonName();
      const context = buildTemplateContext(filename, date, personName ?? undefined);

      if (this.templaterBridge.isAvailable()) {
        const templateFile = this.app.vault.getAbstractFileByPath(config.templatePath);
        if (templateFile instanceof TFile) {
          content = await this.app.vault.read(templateFile);
        }
      } else {
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
   * Checks both flat and folder-note paths for resilience when toggling modes.
   */
  getExistingNote(date: moment.Moment, periodicity: Periodicity): TFile | null {
    const config = this.resolver.resolve(periodicity);
    if (!config.enabled) return null;

    const folder = this.resolver.resolveFolder(periodicity);
    const filename = date.format(config.format);
    return this.findExistingNote(folder, filename);
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

    const notes: TFile[] = [];

    if (this.settings.folderNotes.enabled) {
      // In folder-note mode, notes are inside subfolders
      for (const child of folderObj.children) {
        if (child instanceof TFolder) {
          // Look for a .md file with the same name as the subfolder
          const noteFile = child.children.find(
            (f): f is TFile => f instanceof TFile && f.basename === child.name && f.extension === 'md'
          );
          if (noteFile) notes.push(noteFile);
        }
      }
    }

    // Also collect flat notes (handles mixed mode / migration)
    for (const child of folderObj.children) {
      if (child instanceof TFile && child.extension === 'md' && !notes.includes(child)) {
        notes.push(child);
      }
    }

    return notes;
  }

  /**
   * Resolve the note path based on folder-note mode.
   */
  private resolveNotePath(folder: string, filename: string): string {
    if (this.settings.folderNotes.enabled) {
      return normalizePath(`${folder}/${filename}/${filename}.md`);
    }
    return normalizePath(`${folder}/${filename}.md`);
  }

  /**
   * Find an existing note, checking both flat and folder-note paths.
   * This ensures notes created in one mode are found after toggling.
   */
  private findExistingNote(folder: string, filename: string): TFile | null {
    // Try the current mode's path first
    const primaryPath = this.resolveNotePath(folder, filename);
    const primary = this.app.vault.getAbstractFileByPath(primaryPath);
    if (primary instanceof TFile) return primary;

    // Fallback: try the other mode's path
    const fallbackPath = this.settings.folderNotes.enabled
      ? normalizePath(`${folder}/${filename}.md`)
      : normalizePath(`${folder}/${filename}/${filename}.md`);
    const fallback = this.app.vault.getAbstractFileByPath(fallbackPath);
    if (fallback instanceof TFile) return fallback;

    return null;
  }

  /**
   * Generate a .base MOC file for a periodic notes folder if it doesn't exist.
   */
  private async ensureBaseMoc(folder: string, _periodicity: Periodicity): Promise<void> {
    if (!this.settings.folderNotes.autoGenerateBaseMoc) return;

    const folderName = folder.split('/').pop() ?? 'Index';
    const basePath = normalizePath(`${folder}/${folderName}.base`);

    if (this.app.vault.getAbstractFileByPath(basePath)) return;

    const template = this.settings.folderNotes.baseMocTemplate || DEFAULT_BASE_MOC_TEMPLATE;
    await this.app.vault.create(basePath, template);

    await this.debug.log('Created .base MOC', { basePath });
  }

  /**
   * Ensure a folder path exists, creating intermediate folders as needed.
   */
  private async ensureFolderExists(folderPath: string): Promise<void> {
    const normalized = normalizePath(folderPath);
    if (this.app.vault.getAbstractFileByPath(normalized)) return;

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
      const fm = match[1];
      return content.replace(fmRegex, `---\n${fm}\n${key}: ${value}\n---`);
    }

    return `---\n${key}: ${value}\n---\n${content}`;
  }
}
