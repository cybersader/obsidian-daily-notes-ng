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

/** Resolve per-journal override vs global setting. */
function resolve<T>(journalValue: T | undefined, globalValue: T): T {
  return journalValue !== undefined ? journalValue : globalValue;
}

/**
 * Core manager for creating, opening, and navigating periodic notes.
 * All behavior settings are resolved per-journal: journal override ?? global default.
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

  async openPeriodicNote(date: moment.Moment, journal: JournalDefinition): Promise<TFile | null> {
    if (!journal.enabled) return null;

    const folder = this.journalResolver.resolveFolder(journal);
    const filename = date.format(journal.format);
    const useFolderNotes = resolve(journal.folderNoteMode, this.settings.folderNotes.enabled);
    const path = this.resolveNotePath(folder, filename, useFolderNotes);

    await this.debug.log('openPeriodicNote', { path, journal: journal.name, date: date.format() });

    // Check if note already exists (checks both flat and folder-note paths)
    const existing = this.findExistingNote(folder, filename, useFolderNotes);
    if (existing) {
      await this.ensureBaseMoc(folder, journal);
      await this.openFile(existing);
      return existing;
    }

    // Ensure the periodic folder and .base MOC exist
    await this.ensureFolderExists(folder);
    await this.ensureBaseMoc(folder, journal);

    // In folder-note mode, also create the note's subfolder
    if (useFolderNotes) {
      await this.ensureFolderExists(normalizePath(`${folder}/${filename}`));
    }

    let content = '';

    // Apply template if configured
    if (journal.templatePath) {
      const personName = this.journalResolver.getCurrentPersonName();
      const context = buildTemplateContext(filename, date, personName ?? undefined);
      const useTemplater = resolve(journal.useTemplater, this.settings.templates.useTemplater);

      if (useTemplater && this.templaterBridge.isAvailable()) {
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

    // Add frontmatter via processFrontMatter
    const autoCreator = resolve(journal.autoSetCreator, this.settings.identity.autoSetCreator);
    const creatorField = resolve(journal.creatorFieldName, this.settings.identity.creatorFieldName);
    const autoUuid = resolve(journal.autoGenerateUuid, this.settings.identity.noteUuidAutoGenerate);
    const uuidProp = resolve(journal.uuidProperty, this.settings.identity.noteUuidProperty);

    const needsFrontmatter = (this.settings.identity.enabled && autoCreator) || (autoUuid && uuidProp);
    if (needsFrontmatter) {
      await this.app.fileManager.processFrontMatter(newFile, (fm) => {
        if (this.settings.identity.enabled && autoCreator) {
          const creatorValue = this.userRegistry.getCreatorValue();
          if (creatorValue) {
            fm[creatorField] = [creatorValue];
          }
        }
        if (autoUuid && uuidProp) {
          if (!fm[uuidProp]) {
            fm[uuidProp] = this.noteUuidService.generateUuid();
          }
        }
      });
    }

    // Let Templater process the file after creation
    const useTemplater = resolve(journal.useTemplater, this.settings.templates.useTemplater);
    if (journal.templatePath && useTemplater && this.templaterBridge.isAvailable()) {
      await this.templaterBridge.processFile(newFile);
    }

    await this.openFile(newFile);
    return newFile;
  }

  getExistingNote(date: moment.Moment, journal: JournalDefinition): TFile | null {
    if (!journal.enabled) return null;
    const folder = this.journalResolver.resolveFolder(journal);
    const filename = date.format(journal.format);
    const useFolderNotes = resolve(journal.folderNoteMode, this.settings.folderNotes.enabled);
    return this.findExistingNote(folder, filename, useFolderNotes);
  }

  getAllNotes(journal: JournalDefinition): TFile[] {
    if (!journal.enabled) return [];

    const folder = this.journalResolver.resolveFolder(journal);
    const folderObj = this.app.vault.getAbstractFileByPath(folder);
    if (!(folderObj instanceof TFolder)) return [];

    const useFolderNotes = resolve(journal.folderNoteMode, this.settings.folderNotes.enabled);
    const notes: TFile[] = [];

    if (useFolderNotes) {
      for (const child of folderObj.children) {
        if (child instanceof TFolder) {
          const noteFile = child.children.find(
            (f): f is TFile => f instanceof TFile && f.basename === child.name && f.extension === 'md'
          );
          if (noteFile) notes.push(noteFile);
        }
      }
    }

    for (const child of folderObj.children) {
      if (child instanceof TFile && child.extension === 'md' && !notes.includes(child)) {
        notes.push(child);
      }
    }

    return notes;
  }

  /**
   * Resolve whether this journal uses folder-note mode.
   * Exported so settings UI can use it for the file tree preview.
   */
  isFolderNoteMode(journal: JournalDefinition): boolean {
    return resolve(journal.folderNoteMode, this.settings.folderNotes.enabled);
  }

  isBaseMocEnabled(journal: JournalDefinition): boolean {
    return resolve(journal.autoGenerateBaseMoc, this.settings.folderNotes.autoGenerateBaseMoc);
  }

  private resolveNotePath(folder: string, filename: string, useFolderNotes: boolean): string {
    if (useFolderNotes) {
      return normalizePath(`${folder}/${filename}/${filename}.md`);
    }
    return normalizePath(`${folder}/${filename}.md`);
  }

  private findExistingNote(folder: string, filename: string, useFolderNotes: boolean): TFile | null {
    const primaryPath = this.resolveNotePath(folder, filename, useFolderNotes);
    const primary = this.app.vault.getAbstractFileByPath(primaryPath);
    if (primary instanceof TFile) return primary;

    const fallbackPath = useFolderNotes
      ? normalizePath(`${folder}/${filename}.md`)
      : normalizePath(`${folder}/${filename}/${filename}.md`);
    const fallback = this.app.vault.getAbstractFileByPath(fallbackPath);
    if (fallback instanceof TFile) return fallback;

    return null;
  }

  private async ensureBaseMoc(folder: string, journal: JournalDefinition): Promise<void> {
    const autoMoc = resolve(journal.autoGenerateBaseMoc, this.settings.folderNotes.autoGenerateBaseMoc);
    if (!autoMoc) return;

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
}
