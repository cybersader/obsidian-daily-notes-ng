import { App, TFile, TFolder, normalizePath } from 'obsidian';
import type { DailyNotesNGSettings, JournalDefinition } from '../settings/types';
import type { JournalResolver } from '../identity/JournalResolver';
import type { UserRegistry } from '../identity/UserRegistry';
import type { NoteUuidService } from '../identity/NoteUuidService';
import type { TemplateEngine } from '../templates/TemplateEngine';
import type { TemplaterBridge } from '../templates/TemplaterBridge';
import { buildTemplateContext } from '../templates/templateVariables';
import { DEFAULT_BASE_MOC_TEMPLATE } from '../constants';
import type { DebugLog } from '../utils/debug';

/**
 * Core manager for creating, opening, and navigating periodic notes.
 * Now journal-aware: each operation targets a specific JournalDefinition.
 */
export class PeriodicNoteManager {
  constructor(
    private app: App,
    private settings: DailyNotesNGSettings,
    private journalResolver: JournalResolver,
    private userRegistry: UserRegistry,
    private noteUuidService: NoteUuidService,
    private templateEngine: TemplateEngine,
    private templaterBridge: TemplaterBridge,
    private debug: DebugLog
  ) {}

  /**
   * Open or create a periodic note for the given date and journal.
   */
  async openPeriodicNote(date: moment.Moment, journal: JournalDefinition): Promise<TFile | null> {
    if (!journal.enabled) return null;

    const folder = this.journalResolver.resolveFolder(journal);
    const filename = date.format(journal.format);
    const path = this.resolveNotePath(folder, filename);

    await this.debug.log('openPeriodicNote', { path, journal: journal.name, date: date.format() });

    // Check if note already exists (checks both flat and folder-note paths)
    const existing = this.findExistingNote(folder, filename);
    if (existing) {
      await this.ensureBaseMoc(folder, journal);
      await this.openFile(existing);
      return existing;
    }

    // Ensure the periodic folder and .base MOC exist
    await this.ensureFolderExists(folder);
    await this.ensureBaseMoc(folder, journal);

    // In folder-note mode, also create the note's subfolder
    if (this.settings.folderNotes.enabled) {
      await this.ensureFolderExists(normalizePath(`${folder}/${filename}`));
    }

    let content = '';

    // Apply template if configured
    if (journal.templatePath) {
      const personName = this.journalResolver.getCurrentPersonName();
      const context = buildTemplateContext(filename, date, personName ?? undefined);

      if (this.templaterBridge.isAvailable()) {
        const templateFile = this.app.vault.getAbstractFileByPath(journal.templatePath);
        if (templateFile instanceof TFile) {
          content = await this.app.vault.read(templateFile);
        }
      } else {
        content = await this.templateEngine.processTemplate(journal.templatePath, context);
      }
    }

    // Create the file
    const newFile = await this.app.vault.create(path, content);

    // Add frontmatter via processFrontMatter (Obsidian-native, correct property types)
    await this.app.fileManager.processFrontMatter(newFile, (fm) => {
      // Creator attribution (requires identity enabled + autoSetCreator)
      if (this.settings.identity.enabled && this.settings.identity.autoSetCreator) {
        const creatorValue = this.userRegistry.getCreatorValue();
        if (creatorValue) {
          fm[this.settings.identity.creatorFieldName] = [creatorValue];
        }
      }
      // Note UUID (works regardless of identity being enabled)
      if (this.settings.identity.noteUuidAutoGenerate && this.settings.identity.noteUuidProperty) {
        if (!fm[this.settings.identity.noteUuidProperty]) {
          fm[this.settings.identity.noteUuidProperty] = this.noteUuidService.generateUuid();
        }
      }
    });

    // Let Templater process the file after creation
    if (journal.templatePath && this.templaterBridge.isAvailable()) {
      await this.templaterBridge.processFile(newFile);
    }

    await this.openFile(newFile);
    return newFile;
  }

  /**
   * Check if a periodic note exists for the given date and journal.
   */
  getExistingNote(date: moment.Moment, journal: JournalDefinition): TFile | null {
    if (!journal.enabled) return null;
    const folder = this.journalResolver.resolveFolder(journal);
    const filename = date.format(journal.format);
    return this.findExistingNote(folder, filename);
  }

  /**
   * Get all existing notes for a given journal.
   */
  getAllNotes(journal: JournalDefinition): TFile[] {
    if (!journal.enabled) return [];

    const folder = this.journalResolver.resolveFolder(journal);
    const folderObj = this.app.vault.getAbstractFileByPath(folder);
    if (!(folderObj instanceof TFolder)) return [];

    const notes: TFile[] = [];

    if (this.settings.folderNotes.enabled) {
      for (const child of folderObj.children) {
        if (child instanceof TFolder) {
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

  private resolveNotePath(folder: string, filename: string): string {
    if (this.settings.folderNotes.enabled) {
      return normalizePath(`${folder}/${filename}/${filename}.md`);
    }
    return normalizePath(`${folder}/${filename}.md`);
  }

  private findExistingNote(folder: string, filename: string): TFile | null {
    const primaryPath = this.resolveNotePath(folder, filename);
    const primary = this.app.vault.getAbstractFileByPath(primaryPath);
    if (primary instanceof TFile) return primary;

    const fallbackPath = this.settings.folderNotes.enabled
      ? normalizePath(`${folder}/${filename}.md`)
      : normalizePath(`${folder}/${filename}/${filename}.md`);
    const fallback = this.app.vault.getAbstractFileByPath(fallbackPath);
    if (fallback instanceof TFile) return fallback;

    return null;
  }

  private async ensureBaseMoc(folder: string, _journal: JournalDefinition): Promise<void> {
    if (!this.settings.folderNotes.autoGenerateBaseMoc) return;

    const folderName = folder.split('/').pop() ?? 'Index';
    const basePath = normalizePath(`${folder}/${folderName}.base`);

    if (this.app.vault.getAbstractFileByPath(basePath)) return;

    const template = this.settings.folderNotes.baseMocTemplate || DEFAULT_BASE_MOC_TEMPLATE;
    await this.app.vault.create(basePath, template);

    await this.debug.log('Created .base MOC', { basePath });
  }

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

  private async openFile(file: TFile): Promise<void> {
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(file);
  }

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
