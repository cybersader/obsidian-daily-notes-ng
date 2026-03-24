import { App, TFile, normalizePath } from 'obsidian';
import type { DailyNotesNGSettings, PeriodicConfig } from '../settings/types';
import type { Periodicity } from '../periodic/periodicity';
import type { UserRegistry } from './UserRegistry';
import type { PersonNoteService } from './PersonNoteService';
import type { DevicePreferences } from './DevicePreferences';

/**
 * Resolves the effective PeriodicConfig for the current device + user.
 *
 * Resolution chain (highest priority first):
 *   1. Device preferences (localStorage, NOT synced)
 *   2. Person note frontmatter overrides
 *   3. Settings-based person overrides (personPeriodicOverrides array)
 *   4. Vault-wide periodic config (settings.periodic[periodicity])
 *
 * Used universally — when identity is disabled, returns vault-wide config.
 */
export class PeriodicConfigResolver {
  constructor(
    private app: App,
    private settings: DailyNotesNGSettings,
    private userRegistry: UserRegistry,
    private personNoteService: PersonNoteService,
    private devicePreferences: DevicePreferences
  ) {}

  /**
   * Resolve effective config for the current device + user + periodicity.
   */
  resolve(periodicity: Periodicity): PeriodicConfig {
    // Start with vault-wide default
    let config = { ...this.settings.periodic[periodicity] };

    if (!this.settings.identity.enabled) return config;

    const currentUserPath = this.userRegistry.getCurrentUser();
    if (currentUserPath) {
      // Layer 3: settings-based person overrides
      const settingsOverride = this.settings.identity.personPeriodicOverrides
        .find(o => o.personNotePath === currentUserPath);
      if (settingsOverride?.overrides[periodicity]) {
        config = { ...config, ...this.stripUndefined(settingsOverride.overrides[periodicity]!) };
      }

      // Layer 2: person note frontmatter overrides
      const file = this.app.vault.getAbstractFileByPath(currentUserPath);
      if (file instanceof TFile) {
        const prefs = this.personNoteService.getPreferences(file);
        if (prefs.periodicOverrides?.[periodicity]) {
          config = { ...config, ...this.stripUndefined(prefs.periodicOverrides[periodicity]!) };
        }
      }
    }

    // Layer 1: device-local overrides (highest priority)
    const deviceOverride = this.devicePreferences.getPeriodicOverride(periodicity);
    if (deviceOverride) {
      config = { ...config, ...this.stripUndefined(deviceOverride) };
    }

    return config;
  }

  /**
   * Resolve the folder path with {{person}} interpolation.
   * e.g., "Journal/{{person}}/Daily" → "Journal/Alice Smith/Daily"
   */
  resolveFolder(periodicity: Periodicity): string {
    const config = this.resolve(periodicity);
    let folder = config.folder;

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

    // Strip unresolved placeholder (no person mapped)
    folder = folder.replace(/\{\{person\}\}/g, '');
    folder = folder.replace(/\/\//g, '/');
    if (folder.endsWith('/')) folder = folder.slice(0, -1);

    return normalizePath(folder);
  }

  /**
   * Get the current person's display name, or null if no user mapped.
   */
  getCurrentPersonName(): string | null {
    if (!this.settings.identity.enabled) return null;

    const currentUserPath = this.userRegistry.getCurrentUser();
    if (!currentUserPath) return null;

    const file = this.app.vault.getAbstractFileByPath(currentUserPath);
    if (!(file instanceof TFile)) return null;

    return this.personNoteService.getPreferences(file).displayName;
  }

  private stripUndefined<T extends Record<string, unknown>>(obj: T): T {
    const result = { ...obj };
    for (const key of Object.keys(result)) {
      if (result[key] === undefined) {
        delete result[key];
      }
    }
    return result;
  }
}
