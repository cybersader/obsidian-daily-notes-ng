import type { Periodicity } from '../periodic/periodicity';
import type { PeriodicConfig, DevicePreferencesData } from '../settings/types';

const STORAGE_KEY = 'daily-notes-ng-device-prefs';

/**
 * Per-device settings stored in localStorage (NOT synced).
 * These override vault-wide and per-person settings.
 * Follows TaskNotes DevicePreferences pattern.
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

  getPeriodicOverride(periodicity: Periodicity): Partial<PeriodicConfig> | undefined {
    return this.get().periodicOverrides?.[periodicity];
  }

  setPeriodicOverride(periodicity: Periodicity, override: Partial<PeriodicConfig>): void {
    const current = this.get();
    const overrides = { ...current.periodicOverrides, [periodicity]: override };
    this.set({ periodicOverrides: overrides });
  }
}
