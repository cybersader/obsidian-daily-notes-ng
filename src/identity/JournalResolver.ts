import { App, TFile, normalizePath } from 'obsidian';
import type { DailyNotesNGSettings, JournalDefinition } from '../settings/types';
import type { Periodicity } from '../periodic/periodicity';
import type { UserRegistry } from './UserRegistry';
import type { PersonNoteService } from './PersonNoteService';
import type { GroupRegistry } from './GroupRegistry';

/**
 * Resolves which journals are available to the current device/user,
 * and handles {{person}} interpolation in folder paths.
 *
 * Replaces PeriodicConfigResolver with journal-aware logic.
 */
export class JournalResolver {
  constructor(
    private app: App,
    private settings: DailyNotesNGSettings,
    private userRegistry: UserRegistry,
    private personNoteService: PersonNoteService,
    private groupRegistry: GroupRegistry
  ) {}

  /**
   * Get all journals available to the current device/user.
   * Global journals are always available.
   * Person journals only for the registered person.
   * Group journals for group members.
   * When identity is disabled, only global journals are returned.
   */
  getAvailableJournals(): JournalDefinition[] {
    const currentUser = this.settings.identity.enabled
      ? this.userRegistry.getCurrentUser()
      : null;

    return this.settings.journals.filter(j => {
      if (!j.enabled) return false;
      if (j.scope === 'global') return true;

      if (!this.settings.identity.enabled || !currentUser) return false;

      if (j.scope === 'person') {
        return j.ownerPath === currentUser;
      }
      if (j.scope === 'group' && j.ownerPath) {
        const members = this.groupRegistry.resolveGroupToPersons(j.ownerPath);
        return members.includes(currentUser);
      }
      return false;
    });
  }

  /**
   * Get available journals filtered by periodicity.
   */
  getJournalsForPeriodicity(periodicity: Periodicity): JournalDefinition[] {
    return this.getAvailableJournals().filter(j => j.periodicity === periodicity);
  }

  /**
   * Resolve the folder path for a journal, interpolating {{person}}.
   */
  resolveFolder(journal: JournalDefinition): string {
    let folder = journal.folder;

    if (this.settings.identity.enabled) {
      const currentUserPath = this.userRegistry.getCurrentUser();
      if (currentUserPath) {
        const file = this.app.vault.getAbstractFileByPath(currentUserPath);
        if (file instanceof TFile) {
          const prefs = this.personNoteService.getPreferences(file);
          folder = folder.replace(/\{\{person\}\}/g, prefs.displayName);
        }
      }
    }

    // Strip unresolved placeholder
    folder = folder.replace(/\{\{person\}\}/g, '');
    folder = folder.replace(/\/\//g, '/');
    if (folder.endsWith('/')) folder = folder.slice(0, -1);

    return normalizePath(folder);
  }

  /**
   * Get the current person's display name, or null.
   */
  getCurrentPersonName(): string | null {
    if (!this.settings.identity.enabled) return null;

    const currentUserPath = this.userRegistry.getCurrentUser();
    if (!currentUserPath) return null;

    const file = this.app.vault.getAbstractFileByPath(currentUserPath);
    if (!(file instanceof TFile)) return null;

    return this.personNoteService.getPreferences(file).displayName;
  }

  /**
   * Find which journal a given file belongs to (by checking folder path).
   */
  identifyJournal(filePath: string): JournalDefinition | null {
    for (const journal of this.getAvailableJournals()) {
      const folder = this.resolveFolder(journal);
      if (filePath.startsWith(folder + '/')) {
        return journal;
      }
    }
    return null;
  }
}
