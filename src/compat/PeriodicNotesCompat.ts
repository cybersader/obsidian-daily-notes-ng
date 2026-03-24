import { App } from 'obsidian';
import type { DailyNotesNGSettings, PeriodicConfig } from '../settings/types';

/**
 * Compatibility layer for importing settings from the abandoned Periodic Notes plugin.
 * Reads Periodic Notes' configuration to allow easy migration.
 */
export class PeriodicNotesCompat {
  constructor(private app: App) {}

  /**
   * Check if the old Periodic Notes plugin is installed.
   */
  isPeriodicNotesInstalled(): boolean {
    return !!(this.app as any).plugins?.getPlugin?.('periodic-notes');
  }

  /**
   * Import settings from Periodic Notes plugin.
   */
  importSettings(): Partial<Record<string, PeriodicConfig>> | null {
    const plugin = (this.app as any).plugins?.getPlugin?.('periodic-notes');
    if (!plugin) return null;

    // TODO: Read and transform Periodic Notes settings
    // The settings are stored in plugin.settings
    return null;
  }
}
