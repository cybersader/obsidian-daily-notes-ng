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
   * Get creator value for new notes.
   * Returns the wikilink format that Obsidian stores in frontmatter.
   */
  getCreatorValue(): string | null {
    if (!this.settings.identity.autoSetCreator) return null;
    const userPath = this.getCurrentUser();
    if (!userPath) return null;
    const basename = userPath.replace(/\.md$/, '').split('/').pop();
    return `[[${basename}]]`;
  }

  /**
   * Get creator display name (without wikilink brackets).
   */
  getCreatorDisplayName(): string | null {
    if (!this.settings.identity.autoSetCreator) return null;
    const userPath = this.getCurrentUser();
    if (!userPath) return null;
    return userPath.replace(/\.md$/, '').split('/').pop() ?? null;
  }

  /**
   * Remove a device mapping by device ID.
   */
  removeDevice(deviceId: string): void {
    const idx = this.settings.identity.deviceUserMappings.findIndex(m => m.deviceId === deviceId);
    if (idx >= 0) {
      this.settings.identity.deviceUserMappings.splice(idx, 1);
    }
  }

  /**
   * Update lastSeen timestamp for the current device.
   */
  updateLastSeen(): void {
    const deviceId = this.deviceManager.getOrCreateDeviceId();
    const mapping = this.findMappingByDeviceId(deviceId);
    if (mapping) {
      mapping.lastSeen = Date.now();
    }
  }

  /**
   * Get all registered device mappings.
   */
  getAllMappings(): DeviceUserMapping[] {
    return this.settings.identity.deviceUserMappings;
  }

  /**
   * Get the current device's ID.
   */
  getCurrentDeviceId(): string {
    return this.deviceManager.getOrCreateDeviceId();
  }

  /**
   * Get the current device's name.
   */
  getCurrentDeviceName(): string {
    return this.deviceManager.getDeviceName();
  }

  private findMappingByDeviceId(deviceId: string): DeviceUserMapping | undefined {
    return this.settings.identity.deviceUserMappings.find(m => m.deviceId === deviceId);
  }
}
