import type { JournalDefinition, DevicePreferencesData } from '../settings/types';

const STORAGE_KEY = 'daily-notes-ng-device-prefs';

/**
 * Per-device settings stored in localStorage (NOT synced).
 * These override vault-wide and per-person settings.
 */
export class DevicePreferences {
  private cache: DevicePreferencesData | null = null;

  get(): DevicePreferencesData {
    if (this.cache) return this.cache;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.cache = raw ? JSON.parse(raw) : {};
    } catch {
      this.cache = {};
    }
    return this.cache!;
  }

  set(data: Partial<DevicePreferencesData>): void {
    const current = this.get();
    const merged = { ...current, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    this.cache = merged;
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.cache = null;
  }

  getJournalOverride(journalId: string): Partial<JournalDefinition> | undefined {
    return this.get().journalOverrides?.[journalId];
  }

  setJournalOverride(journalId: string, override: Partial<JournalDefinition>): void {
    const current = this.get();
    const overrides = { ...current.journalOverrides, [journalId]: override };
    this.set({ journalOverrides: overrides });
  }
}
