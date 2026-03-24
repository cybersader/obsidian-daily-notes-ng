import type { DeviceUserMapping, DailyNotesNGSettings } from '../settings/types';
import { DeviceIdentityManager } from './DeviceIdentityManager';

/**
 * Maps devices to person notes.
 * Allows auto-attribution of note creation to a specific person.
 * Adapted from TaskNotes UserRegistry pattern.
 */
export class UserRegistry {
  private deviceManager: DeviceIdentityManager;

  constructor(
    private settings: DailyNotesNGSettings,
    deviceManager: DeviceIdentityManager
  ) {
    this.deviceManager = deviceManager;
  }

  /**
   * Get the person note path for the current device.
   */
  getCurrentUser(): string | null {
    const deviceId = this.deviceManager.getOrCreateDeviceId();
    const mapping = this.findMappingByDeviceId(deviceId);
    return mapping?.userNotePath ?? null;
  }

  /**
   * Register the current device to a person note.
   */
  registerDevice(userNotePath: string, userDisplayName?: string): DeviceUserMapping {
    const deviceId = this.deviceManager.getOrCreateDeviceId();

    const mapping: DeviceUserMapping = {
      deviceId,
      userNotePath,
      deviceName: this.deviceManager.getDeviceName(),
      lastSeen: Date.now(),
      userDisplayName,
    };

    // Replace existing mapping for this device, or add new
    const existing = this.settings.identity.deviceUserMappings.findIndex(
      m => m.deviceId === deviceId
    );
    if (existing >= 0) {
      this.settings.identity.deviceUserMappings[existing] = mapping;
    } else {
      this.settings.identity.deviceUserMappings.push(mapping);
    }

    return mapping;
  }

  /**
   * Get creator value for new notes (wikilink to person note).
   */
  getCreatorValue(): string | null {
    if (!this.settings.identity.autoSetCreator) return null;
    const userPath = this.getCurrentUser();
    if (!userPath) return null;
    const basename = userPath.replace(/\.md$/, '').split('/').pop();
    return `[[${basename}]]`;
  }

  private findMappingByDeviceId(deviceId: string): DeviceUserMapping | undefined {
    return this.settings.identity.deviceUserMappings.find(m => m.deviceId === deviceId);
  }
}
