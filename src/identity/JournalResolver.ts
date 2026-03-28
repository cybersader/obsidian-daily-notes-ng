import { App, TFile, normalizePath } from 'obsidian';
import type { DailyNotesNGSettings, JournalDefinition } from '../settings/types';
import type { Periodicity } from '../periodic/periodicity';
import type { UserRegistry } from './UserRegistry';
import type { PersonNoteService } from './PersonNoteService';
import type { GroupRegistry } from './GroupRegistry';
import type { DebugLog } from '../utils/debug';

/**
 * Resolves which journals are available to the current device/user,
 * and handles {{person}} interpolation in folder paths.
 */
export class JournalResolver {
  constructor(
    private app: App,
    private settings: DailyNotesNGSettings,
    private userRegistry: UserRegistry,
    private personNoteService: PersonNoteService,
    private groupRegistry: GroupRegistry,
    private debug: DebugLog
  ) {}

  /**
   * Get all journals available to the current device/user.
   */
  getAvailableJournals(): JournalDefinition[] {
    const currentUser = this.settings.identity.enabled
      ? this.userRegistry.getCurrentUser()
      : null;

    const all = this.settings.journals;
    const available: JournalDefinition[] = [];
    const rejected: { name: string; reason: string }[] = [];

    for (const j of all) {
      if (!j.enabled) {
        rejected.push({ name: j.name, reason: 'disabled' });
        continue;
      }
      if (j.scope === 'global') {
        available.push(j);
        continue;
      }

      if (!this.settings.identity.enabled || !currentUser) {
        rejected.push({ name: j.name, reason: `identity off or no user (scope: ${j.scope})` });
        continue;
      }

      if (j.scope === 'person') {
        if (j.ownerPath === currentUser) {
          available.push(j);
        } else {
          rejected.push({ name: j.name, reason: `person mismatch: owner=${j.ownerPath}, currentUser=${currentUser}` });
        }
        continue;
      }

      if (j.scope === 'group' && j.ownerPath) {
        const members = this.groupRegistry.resolveGroupToPersons(j.ownerPath);
        if (members.includes(currentUser)) {
          available.push(j);
        } else {
          rejected.push({ name: j.name, reason: `not in group ${j.ownerPath}, members: [${members.join(', ')}]` });
        }
        continue;
      }

      rejected.push({ name: j.name, reason: 'unknown scope or missing owner' });
    }

    this.debug.log('JournalResolver', 'getAvailableJournals', {
      totalJournals: all.length,
      available: available.map(j => `${j.name} (${j.scope})`),
      rejected,
      currentUser,
      identityEnabled: this.settings.identity.enabled,
    });

    return available;
  }

  /**
   * Get available journals filtered by periodicity.
   */
  getJournalsForPeriodicity(periodicity: Periodicity): JournalDefinition[] {
    const journals = this.getAvailableJournals().filter(j => j.periodicity === periodicity);

    this.debug.log('JournalResolver', `getJournalsForPeriodicity(${periodicity})`, {
      count: journals.length,
      names: journals.map(j => j.name),
    });

    return journals;
  }

  /**
   * Resolve the folder path for a journal, interpolating {{person}}.
   */
  resolveFolder(journal: JournalDefinition): string {
    let folder = journal.folder;
    const originalFolder = folder;

    if (this.settings.identity.enabled) {
      const currentUserPath = this.userRegistry.getCurrentUser();
      if (currentUserPath) {
        const file = this.app.vault.getAbstractFileByPath(currentUserPath);
        if (file instanceof TFile) {
          const prefs = this.personNoteService.getPreferences(file);
          folder = folder.replace(/\{\{person\}\}/g, prefs.displayName);
        } else {
          this.debug.warn('JournalResolver', `Person note file not found: ${currentUserPath}`);
        }
      }
    }

    // Strip unresolved placeholder
    folder = folder.replace(/\{\{person\}\}/g, '');
    folder = folder.replace(/\/\//g, '/');
    if (folder.endsWith('/')) folder = folder.slice(0, -1);

    const resolved = normalizePath(folder);

    if (folder !== originalFolder) {
      this.debug.log('JournalResolver', 'resolveFolder interpolation', {
        journal: journal.name,
        original: originalFolder,
        resolved,
      });
    }

    return resolved;
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
        this.debug.log('JournalResolver', 'identifyJournal match', {
          filePath,
          journal: journal.name,
          folder,
        });
        return journal;
      }
    }

    this.debug.log('JournalResolver', 'identifyJournal: no match', { filePath });
    return null;
  }
}
