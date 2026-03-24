import { App } from 'obsidian';
import type { DailyNotesNGSettings } from '../settings/types';
import type { DebugLog } from '../utils/debug';

/**
 * Carries incomplete todos from the previous periodic note to the current one.
 * Triggered on note creation when rollover is enabled.
 */
export class TodoRollover {
  constructor(
    private app: App,
    private settings: DailyNotesNGSettings,
    private debug: DebugLog
  ) {}

  /**
   * Perform todo rollover from previous daily note to the newly created one.
   */
  async rollover(_currentNotePath: string): Promise<void> {
    if (!this.settings.rollover.enabled) return;

    // TODO: Implement rollover logic
    // 1. Find previous daily note
    // 2. Extract incomplete todos
    // 3. Append to current note
    // 4. Optionally remove from previous note
    await this.debug.log('TodoRollover: rollover called');
  }
}
